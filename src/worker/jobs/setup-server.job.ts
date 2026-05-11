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

    await addLog(`Bắt đầu thiết lập Super-V4.2.1 (V2 Logic Restored): ${server.host}`);

    // 1. Kết nối SSH
    await ssh.connect(server);
    await addLog('Kết nối SSH thành công.');

    // 2. Chặn SLAAC & Tuning (Best of V2)
    await addLog('Đang cấu hình hệ thống & Chặn IPv6 rác...');
    const setupCmds = [
      "mkdir -p /etc/systemd/network",
      `cat > /etc/systemd/network/10-eth0.network << 'EOF'
[Match]
Name=eth0
[Network]
DHCP=ipv4
IPv6AcceptRA=yes
IPv6PrivacyExtensions=no
[IPv6AcceptRA]
UseAutonomousPrefix=no
UseOnLinkPrefix=yes
EOF`,
      "systemctl restart systemd-networkd",
      "apt update && apt install -y iptables-persistent curl xxd dos2unix lsof wget iproute2",
      "ip -6 route add default via fe80::1 dev eth0 2>/dev/null", // Ensure IPv6 Route
      `cat >> /etc/sysctl.conf << 'EOF'
net.ipv6.conf.all.autoconf=0
net.ipv6.conf.default.autoconf=0
net.ipv6.conf.eth0.autoconf=0
net.ipv6.conf.all.use_tempaddr=0
net.ipv6.conf.default.use_tempaddr=0
net.ipv6.conf.eth0.use_tempaddr=0
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

    // 3. Cài đặt Gost v3.2.6
    await addLog('Đang cài đặt Gost v3.2.6...');
    await ssh.execute('wget -q https://github.com/go-gost/gost/releases/download/v3.2.6/gost_3.2.6_linux_amd64.tar.gz -O /tmp/gost.tar.gz');
    await ssh.execute('tar xzf /tmp/gost.tar.gz -C /usr/bin/ gost && chmod +x /usr/bin/gost');

    // 4. Khởi tạo cấu trúc dữ liệu
    await ssh.execute('mkdir -p /root/proxy-state');
    await ssh.execute('touch /root/proxy-ipv6.txt /root/proxies.txt');

    // Tự động tìm IPv6 Prefix
    const findPrefix = await ssh.execute("ip -6 addr show dev eth0 | grep global | awk '{print $2}' | head -n1 | cut -d: -f1-4");
    const prefix = findPrefix.stdout.trim() || "2a01:4ff:1f0:513b";
    await addLog(`Phát hiện IPv6 Prefix: ${prefix}`);

    // 5. Triển khai các Scripts (UID Routing - V2 Logic)
    
    // Script: proxy-create <port> <user> <pass> [type: ipv4|ipv6]
    const proxyCreateScript = `cat > /usr/local/bin/proxy-create << 'EOF'
#!/bin/bash
PREFIX="${prefix}"
SERVER_IP="${server.host}"
PORT=\$1
USER=\$2
PASS=\$3
TYPE=\${4:-ipv6}
MARK=\$((PORT + 1000))

# Lấy UID thay vì dùng Username trong iptables (V2 Logic)
LINUX_USER="gost\$PORT"
id "\$LINUX_USER" &>/dev/null || useradd -r -M -s /bin/false "\$LINUX_USER"
LINUX_UID=\$(id -u "\$LINUX_USER")

pkill -f "gost.*:\$PORT"

if [ "\$TYPE" == "ipv4" ]; then
    # Chế độ IPv4: Không thêm IPv6, không dùng ip6tables
    runuser -u "\$LINUX_USER" -- gost -L "socks5://\$USER:\$PASS@:\$PORT" -F "direct://?prefer=ipv4" >> /var/log/gost.log 2>&1 &
    echo "\$PORT|ipv4|\$MARK" >> /root/proxy-ipv6.txt
else
    # Chế độ IPv6: Mặc định
    IPV6="\${PREFIX}:\$(printf '%x:%x:%x:%x' \$RANDOM \$RANDOM \$RANDOM \$RANDOM)"
    ip -6 addr add \$IPV6/64 dev eth0 nodad
    ip6tables -t mangle -A OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK"
    ip6tables -t nat -A POSTROUTING -m mark --mark "\$MARK" -j SNAT --to-source "\$IPV6"
    runuser -u "\$LINUX_USER" -- gost -L "socks5://\$USER:\$PASS@:\$PORT" -F "direct://?prefer=ipv6" >> /var/log/gost.log 2>&1 &
    echo "\$PORT|\$IPV6|\$MARK" >> /root/proxy-ipv6.txt
fi

echo "\$SERVER_IP:\$PORT:\$USER:\$PASS" >> /root/proxies.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    // Script: proxy-rotate-one <port>
    const proxyRotateScript = `cat > /usr/local/bin/proxy-rotate-one << 'EOF'
#!/bin/bash
PREFIX="${prefix}"
PORT=\$1
MARK=\$((PORT + 1000))
OLD_DATA=\$(grep "^\$PORT|" /root/proxy-ipv6.txt)
OLD_IP=\$(echo \$OLD_DATA | cut -d'|' -f2)
NEW_IP="\${PREFIX}:\$(printf '%x:%x:%x:%x' \$RANDOM \$RANDOM \$RANDOM \$RANDOM)"
ip -6 addr add \$NEW_IP/64 dev eth0 nodad
ip6tables -t nat -D POSTROUTING -m mark --mark \$MARK -j SNAT --to-source \$OLD_IP 2>/dev/null
ip6tables -t nat -A POSTROUTING -m mark --mark \$MARK -j SNAT --to-source \$NEW_IP
ip -6 addr del \$OLD_IP/64 dev eth0 2>/dev/null
sed -i "s|^\$PORT|\$OLD_IP|\$MARK|\$PORT|\$NEW_IP|\$MARK|" /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    const proxyDeleteScript = `cat > /usr/local/bin/proxy-delete << 'EOF'
#!/bin/bash
PORT=\$1
MARK=\$((PORT + 1000))
LINUX_USER="gost\$PORT"
LINUX_UID=\$(id -u "\$LINUX_USER" 2>/dev/null)
OLD_DATA=\$(grep "^\$PORT|" /root/proxy-ipv6.txt)
OLD_IP=\$(echo \$OLD_DATA | cut -d'|' -f2)

pkill -f "gost.*:\$PORT"
ip6tables -t mangle -D OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK" 2>/dev/null
ip6tables -t nat -D POSTROUTING -m mark --mark \$MARK -j SNAT --to-source \$OLD_IP 2>/dev/null
ip -6 addr del \$OLD_IP/64 dev eth0 2>/dev/null
userdel -r "\$LINUX_USER" 2>/dev/null
sed -i "/^\$PORT|/d" /root/proxy-ipv6.txt
sed -i "/:\$PORT:/d" /root/proxies.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    const proxyResetScript = `cat > /usr/local/bin/proxy-reset << 'EOF'
#!/bin/bash
PREFIX="${prefix}"
pkill -9 gost 2>/dev/null
[ -f /root/proxy-ipv6.txt ] && while IFS='|' read -r PORT IP MARK; do
  userdel -r gost\$PORT 2>/dev/null
done < /root/proxy-ipv6.txt
ip6tables -t mangle -F OUTPUT
ip6tables -t nat -F POSTROUTING
ip -6 addr show dev eth0 | grep "\${PREFIX}" | awk '{print \$2}' | while read ADDR; do
  ip -6 addr del "\$ADDR" dev eth0 2>/dev/null
done
> /root/proxies.txt
> /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF`;

    const proxyRestoreScript = `cat > /usr/local/bin/proxy-restore << 'EOF'
#!/bin/bash
sleep 5
ip -6 route add default via fe80::1 dev eth0 2>/dev/null
while IFS='|' read -r PORT IP MARK; do
  ip -6 addr add \$IP/64 dev eth0 nodad 2>/dev/null
  LINUX_USER="gost\$PORT"
  LINUX_UID=\$(id -u "\$LINUX_USER")
  # Restore rules if missing
  ip6tables -t mangle -A OUTPUT -m owner --uid-owner "\$LINUX_UID" -j MARK --set-mark "\$MARK" 2>/dev/null
  ip6tables -t nat -A POSTROUTING -m mark --mark "\$MARK" -j SNAT --to-source "\$IP" 2>/dev/null
  
  if ! pgrep -f "gost.*:\$PORT" >/dev/null; then
    CRE=\$(grep ":\$PORT:" /root/proxies.txt | head -n1)
    U=\$(echo \$CRE | cut -d: -f3)
    P=\$(echo \$CRE | cut -d: -f4)
    [ -z "\$U" ] && continue
    runuser -u "\$LINUX_USER" -- gost -L "socks5://\$U:\$P@:\$PORT" -F "direct://?prefer=ipv6" >> /var/log/gost.log 2>&1 &
  fi
done < /root/proxy-ipv6.txt
EOF`;

    await addLog('Đang nạp bộ script điều khiển Super-V4.2.1...');
    await ssh.execute(proxyCreateScript);
    await ssh.execute(proxyRotateScript);
    await ssh.execute(proxyDeleteScript);
    await ssh.execute(proxyResetScript);
    await ssh.execute(proxyRestoreScript);
    await ssh.execute('chmod +x /usr/local/bin/proxy-*');

    // 6. Thiết lập Systemd
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
      data: { status: 'ONLINE', ipv6: prefix }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog('Hệ thống Super-V4.2.1 (V2 Restored) đã sẵn sàng.');
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
