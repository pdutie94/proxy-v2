import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';
import { JobStatus, ServerStatus } from '@prisma/client';

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
      await ssh.execute(cmd);
    }

    // 3. Dò tìm Interface chính
    const findIface = await ssh.execute("ip route | grep default | awk '{print $5}' | head -n1");
    const iface = findIface.stdout.trim() || "eth0";
    await addLog(`Phát hiện Interface chính: ${iface}`);

    // 3.1. Xác định Prefix và Network State
    const prefix = server.ipv6?.trim() || "";
    if (!prefix) {
      throw new Error('IPv6 Prefix không được để trống. Vui lòng cập nhật thông tin máy chủ trước khi Setup.');
    }
    await addLog(`Sử dụng IPv6 Prefix từ Database: ${prefix}`);

    // Xóa IP rác theo Prefix
    await ssh.execute(`ip -6 addr show dev ${iface} | grep "${prefix}" | awk '{print $2}' | xargs -r -n1 ip -6 addr del dev ${iface} || true`);

    const findPrimaryIP = await ssh.execute(`ip -6 addr show dev ${iface} | grep -v "fe80" | grep "inet6 " | awk '{print $2}' | head -n1`);
    let primaryIP = findPrimaryIP.stdout.trim();
    
    if (!primaryIP) {
      primaryIP = `${prefix}:5400:6ff:fe26:c1f1/64`;
      await addLog(`CẢNH BÁO: Không tìm thấy IPv6 gốc, sẽ gán IP định danh: ${primaryIP}`);
    }

    const findGW = await ssh.execute(`ip -6 route show default | sed -n 's/.*via \\([^ ]*\\).*/\\1/p' | head -n1`);
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
      await ssh.execute(cmd);
    }

    // 5. Cài đặt Gost v3.2.6
    await addLog('Đang cài đặt Gost v3.2.6...');
    await ssh.execute('wget -q https://github.com/go-gost/gost/releases/download/v3.2.6/gost_3.2.6_linux_amd64.tar.gz -O /tmp/gost.tar.gz');
    await ssh.execute('tar xzf /tmp/gost.tar.gz -C /usr/bin/ gost && chmod +x /usr/bin/gost');

    // 6. Khởi tạo cấu trúc dữ liệu
    await ssh.execute('mkdir -p /root/proxy-state');
    await ssh.execute('touch /root/proxy-ipv6.txt /root/proxies.txt');

    // 7. Triển khai các Scripts
    
    const proxyCreateScript = `cat > /usr/local/bin/proxy-create << 'EOF'
#!/bin/bash
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
PREFIX="${prefix}"
SERVER_IP="${server.host}"
PORT=\$1
USER=\$2
PASS=\$3
TYPE=\${4:-ipv6}
MARK=\$((PORT + 1000))

LINUX_USER="gost\$PORT"
id "\$LINUX_USER" &>/dev/null || useradd -r -M -s /bin/false "\$LINUX_USER"
LINUX_UID=\$(id -u "\$LINUX_USER")

pkill -f "gost.*:\$PORT"

if [ "\$TYPE" == "ipv4" ]; then
    runuser -u "\$LINUX_USER" -- gost -L "socks5://\$USER:\$PASS@:\$PORT?udp=true" -F "direct://?prefer=ipv4" >> /var/log/gost.log 2>&1 &
    echo "\$PORT|ipv4|\$MARK" >> /root/proxy-ipv6.txt
else
    IPV6="\${PREFIX}:\$(printf '%x:%x:%x:%x' \$RANDOM \$RANDOM \$RANDOM \$RANDOM)"
    ip -6 addr add \$IPV6/64 dev \$IFACE nodad
    ip6tables -t mangle -A OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK"
    ip6tables -t nat -A POSTROUTING -m mark --mark "\$MARK" -j SNAT --to-source "\$IPV6"
    runuser -u "\$LINUX_USER" -- gost -L "socks5://\$USER:\$PASS@:\$PORT?udp=true" -F "direct://?prefer=ipv6&strategy=ipv6_first" >> /var/log/gost.log 2>&1 &
    echo "\$PORT|\$IPV6|\$MARK" >> /root/proxy-ipv6.txt
fi

echo "\$SERVER_IP:\$PORT:\$USER:\$PASS" >> /root/proxies.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    const proxyRotateScript = `cat > /usr/local/bin/proxy-rotate-one << 'EOF'
#!/bin/bash
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
PREFIX="${prefix}"
PORT=\$1
MARK=\$((PORT + 1000))
OLD_DATA=\$(grep "^\$PORT|" /root/proxy-ipv6.txt)
OLD_IP=\$(echo \$OLD_DATA | cut -d'|' -f2)
NEW_IP="\${PREFIX}:\$(printf '%x:%x:%x:%x' \$RANDOM \$RANDOM \$RANDOM \$RANDOM)"
ip -6 addr add \$NEW_IP/64 dev \$IFACE nodad
ip6tables -t nat -D POSTROUTING -m mark --mark \$MARK -j SNAT --to-source \$OLD_IP 2>/dev/null
ip6tables -t nat -A POSTROUTING -m mark --mark \$MARK -j SNAT --to-source \$NEW_IP
ip -6 addr del \$OLD_IP/64 dev \$IFACE 2>/dev/null
sed -i "s|^\$PORT|\$OLD_IP|\$MARK|\$PORT|\$NEW_IP|\$MARK|" /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    const proxyDeleteScript = `cat > /usr/local/bin/proxy-delete << 'EOF'
#!/bin/bash
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
PORT=\$1
MARK=\$((PORT + 1000))
LINUX_USER="gost\$PORT"
LINUX_UID=\$(id -u "\$LINUX_USER" 2>/dev/null)
OLD_DATA=\$(grep "^\$PORT|" /root/proxy-ipv6.txt)
OLD_IP=\$(echo \$OLD_DATA | cut -d'|' -f2)

pkill -f "gost.*:\$PORT"
ip6tables -t mangle -D OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK" 2>/dev/null
ip6tables -t nat -D POSTROUTING -m mark --mark \$MARK -j SNAT --to-source \$OLD_IP 2>/dev/null
ip -6 addr del \$OLD_IP/64 dev \$IFACE 2>/dev/null
userdel -r "\$LINUX_USER" 2>/dev/null
sed -i "/^\$PORT|/d" /root/proxy-ipv6.txt
sed -i "/:\$PORT:/d" /root/proxies.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    const proxyResetScript = `cat > /usr/local/bin/proxy-reset << 'EOF'
#!/bin/bash
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
PREFIX="${prefix}"
pkill -9 gost 2>/dev/null
[ -f /root/proxy-ipv6.txt ] && while IFS='|' read -r PORT IP MARK; do
  userdel -r gost\$PORT 2>/dev/null
done < /root/proxy-ipv6.txt
ip6tables -t mangle -F OUTPUT
ip6tables -t nat -F POSTROUTING
ip -6 addr show dev \$IFACE | grep "\${PREFIX}" | awk '{print \$2}' | while read ADDR; do
  ip -6 addr del "\$ADDR" dev \$IFACE 2>/dev/null
done
> /root/proxies.txt
> /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    const proxyRestoreScript = `cat > /usr/local/bin/proxy-restore << 'EOF'
#!/bin/bash
sleep 5
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
PREFIX="${prefix}"
GW=\$(ip -6 route show default | sed -n 's/.*via \\([^ ]*\\).*/\\1/p' | head -n1)
[ -z "\$GW" ] && GW=\$(ip -6 neighbor show | grep router | awk '{print \$1}' | head -n1)
[ -n "\$GW" ] && ip -6 route add default via \$GW dev \$IFACE 2>/dev/null
ip -6 route add local \${PREFIX}::/64 dev lo 2>/dev/null

while IFS='|' read -r PORT IP MARK; do
  [ "\$IP" == "ipv4" ] && continue
  ip -6 addr add \$IP/64 dev \$IFACE nodad 2>/dev/null
  LINUX_USER="gost\$PORT"
  LINUX_UID=\$(id -u "\$LINUX_USER")
  ip6tables -t mangle -A OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK" 2>/dev/null
  ip6tables -t nat -A POSTROUTING -m mark --mark "\$MARK" -j SNAT --to-source "\$IP" 2>/dev/null
  
  if ! pgrep -f "gost.*:\$PORT" >/dev/null; then
    CRE=\$(grep ":\$PORT:" /root/proxies.txt | head -n1)
    U=\$(echo \$CRE | cut -d: -f3)
    P=\$(echo \$CRE | cut -d: -f4)
    [ -z "\$U" ] && continue
    runuser -u "\$LINUX_USER" -- gost -L "socks5://\$U:\$P@:\$PORT?udp=true" -F "direct://?prefer=ipv6&strategy=ipv6_first" >> /var/log/gost.log 2>&1 &
  fi
done < /root/proxy-ipv6.txt
EOF`;

    await addLog('Đang nạp bộ script điều khiển Super-V5.0.0...');
    await ssh.execute(proxyCreateScript);
    await ssh.execute(proxyRotateScript);
    await ssh.execute(proxyDeleteScript);
    await ssh.execute(proxyResetScript);
    await ssh.execute(proxyRestoreScript);
    await ssh.execute('chmod +x /usr/local/bin/proxy-*');

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
    
    await ssh.execute(systemdService);
    await ssh.execute('systemctl daemon-reload && systemctl enable proxy.service');

    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'ONLINE' }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog('Hệ thống Super-V5.0.0 (Deep Clean) đã sẵn sàng.');
  } catch (error: any) {
    await addLog(`LỖI: ${error.message}`);
    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'ERROR' }
    });
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });
    throw error;
  } finally {
    await ssh.disconnect();
  }
}
