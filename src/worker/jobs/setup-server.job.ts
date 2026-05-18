import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';
import { publishJobEvent } from '../utils/notifier';

export async function processSetupServer(job: Job) {
  const { serverId, jobId } = job.data;
  const ssh = new SSHService();
  let logs = '';

  const addLog = async (message: string) => {
    logs += `[${new Date().toISOString()}] ${message}\n`;
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { logs }
    });
    console.log(`[ServerJob:${jobId}] ${message}`);
  };

  try {
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('Không tìm thấy máy chủ trong cơ sở dữ liệu');

    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'SETTING_UP' }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });

    if (job.attemptsMade > 0) {
      await addLog(`[RETRY] Đang thử lại lần thứ ${job.attemptsMade}...`);
    }

    await addLog(`Bắt đầu thiết lập Super-V5.0.0 (Deep Clean Mode): ${server.host}`);

    // 1. Kết nối SSH
    await ssh.connect(server);
    await addLog('Kết nối SSH thành công.');

    // 2. GIAI ĐOẠN 0: DỌN DẸP HỆ THỐNG (DEEP CLEAN)
    await addLog('Đang thực hiện Deep Clean để loại bỏ xung đột...');
    const cleanupCmds = [
      "pkill -9 gost || true",
      "ip6tables -t nat -F || true",
      "ip6tables -t mangle -F || true",
      "ip6tables -F || true",
      "systemctl stop proxy.service || true",
      "rm -f /etc/systemd/system/proxy.service || true",
      "systemctl daemon-reload",
      // Xóa toàn bộ user gost cũ
      "cut -d: -f1 /etc/passwd | grep '^gost' | xargs -r -n1 userdel -r || true",
      // Dọn dẹp file cấu hình cũ
      "rm -rf /root/proxy-state /root/proxy-ipv6.txt /root/proxies.txt || true"
    ];
    for (const cmd of cleanupCmds) {
      await ssh.execute(server, cmd);
    }

    // 3. Dò tìm Interface chính
    const findIface = await ssh.execute(server, "ip route | grep default | awk '{print $5}' | head -n1");
    const iface = findIface.stdout.trim() || "eth0";
    await addLog(`Phát hiện Interface chính: ${iface}`);

    // 3.1. Xác định Prefix và Network State
    const prefix = server.ipv6?.trim() || "";
    if (!prefix) {
      throw new Error('IPv6 Prefix không được để trống. Vui lòng cập nhật thông tin máy chủ trước khi Setup.');
    }
    await addLog(`Sử dụng IPv6 Prefix từ Database: ${prefix}`);

    // Xóa IP rác theo Prefix
    await ssh.execute(server, `ip -6 addr show dev ${iface} | grep "${prefix}" | awk '{print $2}' | xargs -r -n1 ip -6 addr del dev ${iface} || true`);

    const findPrimaryIP = await ssh.execute(server, `ip -6 addr show dev ${iface} | grep -v "fe80" | grep "inet6 " | awk '{print $2}' | head -n1`);
    let primaryIP = findPrimaryIP.stdout.trim();
    
    if (!primaryIP) {
      primaryIP = `${prefix}:5400:6ff:fe26:c1f1/64`;
      await addLog(`CẢNH BÁO: Không tìm thấy IPv6 gốc, sẽ gán IP định danh: ${primaryIP}`);
    }

    const findGW = await ssh.execute(server, `ip -6 route show default | sed -n 's/.*via \\([^ ]*\\).*/\\1/p' | head -n1`);
    let gateway = findGW.stdout.trim();
    if (!gateway) {
        gateway = "fe80::fc00:6ff:fe26:c1f1"; // Fallback cho Vultr
        await addLog(`CẢNH BÁO: Không tìm thấy Gateway, sử dụng fallback: ${gateway}`);
    }
    await addLog(`Thông số mạng: IP=${primaryIP}, GW=${gateway}`);

    // 4. Cấu hình hệ thống & Cập nhật Package (Bypass Y/N)
    await addLog('Đang cập nhật hệ thống & Cài đặt dependencies (Non-interactive)...');
    const setupCmds = [
      "export DEBIAN_FRONTEND=noninteractive",
      "echo 'iptables-persistent iptables-persistent/autosave_v4 boolean true' | debconf-set-selections",
      "echo 'iptables-persistent iptables-persistent/autosave_v6 boolean true' | debconf-set-selections",
      "apt-get update",
      "apt-get install -y -o Dpkg::Options::='--force-confdef' -o Dpkg::Options::='--force-confold' iptables-persistent curl xxd dos2unix lsof wget iproute2",
      "mkdir -p /etc/systemd/network",
      `cat > /etc/systemd/network/10-${iface}.network << 'EOF'
[Match]
Name=${iface}
[Network]
DHCP=ipv4
Address=${primaryIP}
Gateway=${gateway}
DNS=8.8.8.8
DNS=1.1.1.1
IPv6AcceptRA=yes
IPv6PrivacyExtensions=no
[IPv6AcceptRA]
UseAutonomousPrefix=no
UseOnLinkPrefix=yes
EOF`,
      "systemctl restart systemd-networkd",
      `ip -6 route add local ${prefix}::/64 dev lo 2>/dev/null || true`,
      `ip -6 route add default via ${gateway} dev ${iface} 2>/dev/null || true`, 
      `cat >> /etc/sysctl.conf << 'EOF'
net.ipv6.conf.all.forwarding=1
net.ipv6.conf.all.proxy_ndp=1
net.ipv6.conf.all.autoconf=0
net.ipv6.conf.default.autoconf=0
net.ipv6.conf.${iface.replace(/\./g, '/')}.autoconf=0
net.ipv6.conf.all.use_tempaddr=0
net.ipv6.conf.default.use_tempaddr=0
net.ipv6.conf.${iface.replace(/\./g, '/')}.use_tempaddr=0
fs.file-max=1000000
net.core.somaxconn=1024
EOF`,
      `cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 1000000
* hard nofile 1000000
root soft nofile 1000000
root hard nofile 1000000
EOF`,
      'sysctl -p'
    ];
    for (const cmd of setupCmds) {
      await ssh.execute(server, cmd);
    }

    // 5. Cài đặt Gost v3.2.6
    await addLog('Đang cài đặt Gost v3.2.6...');
    await ssh.execute(server, 'wget -q https://github.com/go-gost/gost/releases/download/v3.2.6/gost_3.2.6_linux_amd64.tar.gz -O /tmp/gost.tar.gz');
    await ssh.execute(server, 'tar xzf /tmp/gost.tar.gz -C /usr/bin/ gost && chmod +x /usr/bin/gost');

    // 6. Khởi tạo cấu trúc dữ liệu
    await ssh.execute(server, 'mkdir -p /root/proxy-state /etc/gost');
    await ssh.execute(server, 'touch /root/proxy-ipv6.txt /root/proxies.txt');

    // 7. Triển khai các Scripts
    
    const proxyCreateScript = `cat > /usr/local/bin/proxy-create << 'EOF'
#!/bin/bash
SERVER_IP="${server.host}"
PORT=\$1
USER=\$2
PASS=\$3
PREFIX=\$4
TYPE=\$5
PROTOCOL=\$6

IFACE=\$(ip route | grep default | awk '{print \$5}' | head -n1)
MARK=\$((PORT + 1000))
LINUX_USER="gost\$PORT"

# Đảm bảo User tồn tại
id "\$LINUX_USER" &>/dev/null || useradd -r -M -s /bin/false "\$LINUX_USER"
LINUX_UID=\$(id -u "\$LINUX_USER")

# Dọn rác cũ triệt để
pkill -u \$LINUX_UID gost 2>/dev/null
while ip6tables -t nat -D POSTROUTING -m mark --mark "\$MARK" -j SNAT 2>/dev/null; do :; done
while ip6tables -t mangle -D OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK" 2>/dev/null; do :; done
OLD_IP=\$(grep "^\$PORT|" /root/proxy-ipv6.txt | cut -d'|' -f2)
[ ! -z "\$OLD_IP" ] && ip -6 addr del \$OLD_IP/64 dev \$IFACE 2>/dev/null
# Xóa sạch dấu vết cũ trong cả 2 file state
grep -v "^\$PORT|" /root/proxy-ipv6.txt > /root/proxy-ipv6.tmp && mv /root/proxy-ipv6.tmp /root/proxy-ipv6.txt
grep -v ":\$PORT:" /root/proxies.txt > /root/proxies.tmp && mv /root/proxies.tmp /root/proxies.txt

OUTBOUND="direct://?prefer=ipv6&strategy=ipv6_first"

if [ "\$TYPE" == "ipv6" ]; then
    IPV6="\${PREFIX}:\$(printf '%x:%x:%x:%x' \$RANDOM \$RANDOM \$RANDOM \$RANDOM)"
    ip -6 addr add \$IPV6/64 dev \$IFACE nodad
    ip6tables -t mangle -A OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK"
    ip6tables -t nat -I POSTROUTING 1 -m mark --mark "\$MARK" -j SNAT --to-source "\$IPV6"
    echo "\$PORT|\$IPV6|\$MARK|\$PROTOCOL" >> /root/proxy-ipv6.txt
fi

runuser -u \$LINUX_USER -- gost -L \${PROTOCOL}://\${USER}:\${PASS}@:\${PORT}?udp=true -F \$OUTBOUND >> /var/log/gost.log 2>&1 &
echo "\$SERVER_IP:\$PORT:\$USER:\$PASS" >> /root/proxies.txt
EOF`;

    const proxyRotateScript = `cat > /usr/local/bin/proxy-rotate-one << 'EOF'
#!/bin/bash
PORT=\$1
PREFIX=\$2
IFACE=\$(ip route | grep default | awk '{print \$5}' | head -n1)
MARK=\$((PORT + 1000))
LINUX_USER="gost\$PORT"
LINUX_UID=\$(id -u "\$LINUX_USER")

OLD_LINE=\$(grep "^\$PORT|" /root/proxy-ipv6.txt | tail -n 1)
OLD_IP=\$(echo \$OLD_LINE | cut -d'|' -f2)
PROTO=\$(echo \$OLD_LINE | cut -d'|' -f4)
[ -z "\$PROTO" ] && PROTO="socks5"

[ ! -z "\$OLD_IP" ] && ip -6 addr del \$OLD_IP/64 dev \$IFACE 2>/dev/null
while ip6tables -t nat -D POSTROUTING -m mark --mark "\$MARK" -j SNAT 2>/dev/null; do :; done
while ip6tables -t mangle -D OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK" 2>/dev/null; do :; done

NEW_IP="\${PREFIX}:\$(printf '%x:%x:%x:%x' \$RANDOM \$RANDOM \$RANDOM \$RANDOM)"
ip -6 addr add \$NEW_IP/64 dev \$IFACE nodad
ip6tables -t mangle -A OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK"
ip6tables -t nat -I POSTROUTING 1 -m mark --mark "\$MARK" -j SNAT --to-source "\$NEW_IP"

sed -i "/^\$PORT|/d" /root/proxy-ipv6.txt
echo "\$PORT|\$NEW_IP|\$MARK|\$PROTO" >> /root/proxy-ipv6.txt

pkill -u \$LINUX_USER gost 2>/dev/null
sleep 0.5
CRE=\$(grep ":\$PORT:" /root/proxies.txt | head -n1)
U=\$(echo \$CRE | cut -d: -f3); P=\$(echo \$CRE | cut -d: -f4)
runuser -u "\$LINUX_USER" -- gost -L "\${PROTO}://\$U:\$P@:\$PORT?udp=true" -F "direct://?prefer=ipv6&strategy=ipv6_first" >> /var/log/gost.log 2>&1 &
EOF`;

    const proxyDeleteScript = `cat > /usr/local/bin/proxy-delete << 'EOF'
#!/bin/bash
PORT=\$1
IFACE=\$(ip route | grep default | awk '{print \$5}' | head -n1)
MARK=\$((PORT + 1000))
LINUX_USER="gost\$PORT"

# 1. Dừng tiến trình
pkill -u \$LINUX_USER gost 2>/dev/null

# 2. Lấy IP để xóa
OLD_IP=\$(grep "^\$PORT|" /root/proxy-ipv6.txt | cut -d'|' -f2)
[ ! -z "\$OLD_IP" ] && ip -6 addr del \$OLD_IP/64 dev \$IFACE 2>/dev/null

# 3. Dọn sạch iptables
while ip6tables -t nat -D POSTROUTING -m mark --mark "\$MARK" -j SNAT 2>/dev/null; do :; done
while ip6tables -t mangle -D OUTPUT -m owner --uid-owner "\$LINUX_USER" -j MARK --set-mark "\$MARK" 2>/dev/null; do :; done

# 4. Xóa khỏi file state (Sử dụng grep -v để an toàn hơn)
grep -v "^\$PORT|" /root/proxy-ipv6.txt > /root/proxy-ipv6.tmp && mv /root/proxy-ipv6.tmp /root/proxy-ipv6.txt
grep -v ":\$PORT:" /root/proxies.txt > /root/proxies.tmp && mv /root/proxies.tmp /root/proxies.txt

# Đảm bảo dữ liệu được ghi xuống đĩa
sync
EOF`;

    const proxyResetScript = `cat > /usr/local/bin/proxy-reset << 'EOF'
#!/bin/bash
IFACE=\$(ip route | grep default | awk '{print \$5}' | head -n1)
PREFIX="${prefix}"
pkill -9 gost 2>/dev/null
# Xóa sạch IP theo Prefix
ip -6 addr show dev \$IFACE | grep "\${PREFIX}" | awk '{print \$2}' | while read ADDR; do
  ip -6 addr del "\$ADDR" dev \$IFACE 2>/dev/null
done
# Xóa sạch iptables
ip6tables -t mangle -F OUTPUT
ip6tables -t nat -F POSTROUTING
# Xóa trắng file
> /root/proxies.txt
> /root/proxy-ipv6.txt
EOF`;

    const proxyRestoreScript = `cat > /usr/local/bin/proxy-restore << 'EOF'
#!/bin/bash
sleep 5
IFACE=\$(ip route | grep default | awk '{print \$5}' | head -n1)
FIRST_IP=\$(head -n1 /root/proxy-ipv6.txt | cut -d'|' -f2)
PREFIX=\$(echo \$FIRST_IP | cut -d: -f1-4)

ip6tables -t nat -F POSTROUTING
ip6tables -t mangle -F OUTPUT
if [ ! -z "\$PREFIX" ]; then
    ip -6 route add local \${PREFIX}::/64 dev lo 2>/dev/null
fi

while IFS='|' read -r PORT IP MARK PROTO; do
  [ -z "\$PROTO" ] && PROTO="socks5"
  ip -6 addr add \$IP/64 dev \$IFACE nodad 2>/dev/null
  LINUX_USER="gost\$PORT"
  id "\$LINUX_USER" &>/dev/null || useradd -r -M -s /bin/false "\$LINUX_USER"
  LINUX_UID=\$(id -u "\$LINUX_USER")
  
  ip6tables -t mangle -A OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK"
  ip6tables -t nat -I POSTROUTING 1 -m mark --mark "\$MARK" -j SNAT --to-source "\$IP"
  
  CRE=\$(grep ":\$PORT:" /root/proxies.txt | head -n1)
  U=\$(echo \$CRE | cut -d: -f3); P=\$(echo \$CRE | cut -d: -f4)
  runuser -u "\$LINUX_USER" -- gost -L "\${PROTO}://\$U:\$P@:\$PORT?udp=true" -F "direct://?prefer=ipv6&strategy=ipv6_first" >> /var/log/gost.log 2>&1 &
done < /root/proxy-ipv6.txt
EOF`;

    await addLog('Đang nạp bộ script điều khiển Super-V5.0.0...');
    await ssh.execute(server, proxyCreateScript);
    await ssh.execute(server, proxyRotateScript);
    await ssh.execute(server, proxyDeleteScript);
    await ssh.execute(server, proxyResetScript);
    await ssh.execute(server, proxyRestoreScript);
    await ssh.execute(server, 'chmod +x /usr/local/bin/proxy-*');

    // 8. Thiết lập Systemd
    const systemdService = `cat > /etc/systemd/system/proxy.service << 'EOF'
[Unit]
Description=Gost IPv6 Proxy Manager
After=network-online.target netfilter-persistent.service
Wants=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/bin/proxy-restore
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
EOF`;
    
    await ssh.execute(server, systemdService);
    await ssh.execute(server, 'systemctl daemon-reload && systemctl enable proxy.service');

    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'ONLINE' }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await publishJobEvent({
      userId: null,
      jobType: 'SETUP_SERVER',
      status: 'COMPLETED',
      message: `Cài đặt máy chủ thành công: ${server.host}`,
    });

    await addLog('Hoàn tất toàn bộ quá trình cài đặt Server.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await addLog(`LỖI: ${message}`);
    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'ERROR' }
    });
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });

    await publishJobEvent({
      userId: null,
      jobType: 'SETUP_SERVER',
      status: 'FAILED',
      message: `Cài đặt máy chủ thất bại: ${message}`,
    });

    throw error;
  } finally {
    await ssh.disconnect(serverId);
  }
}
