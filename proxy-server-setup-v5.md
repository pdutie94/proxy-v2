# Proxy Server Setup Guide V6.0 (Production Hardened & Vultr Optimized)

Bản hướng dẫn này là tiêu chuẩn cao nhất cho hệ thống Proxy IPv6, được tối ưu đặc biệt cho **Vultr, Hetzner** và các nhà cung cấp có cấu hình mạng khắt khe. Hệ thống sử dụng cơ chế **Manual Prefix** và **Local Route Anchoring** để đảm bảo độ ổn định 100%.

---

## 0. Giai đoạn: Dọn dẹp hệ thống (Deep Clean)
Nếu bạn cài đặt lại trên server cũ, hãy chạy bộ lệnh này để xóa sạch mọi xung đột:

```bash
pkill -9 gost || true
ip6tables -t nat -F || true
ip6tables -t mangle -F || true
ip6tables -F || true
cut -d: -f1 /etc/passwd | grep '^gost' | xargs -r -n1 userdel -r || true
rm -rf /root/proxy-state /root/proxy-ipv6.txt /root/proxies.txt || true
```

---

## 1. Cấu hình Mạng & Hardening (Vultr Fixed)

Mục đích: Cố định thông số mạng, chặn SLAAC rác và kích hoạt định tuyến cho dải IP ngẫu nhiên.

```bash
# 1.1 Khai báo thông số (Thay thế bằng thông tin thực tế của bạn)
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
PREFIX="2001:19f0:4401:903" # Thay bằng 4 cụm đầu IPv6 của bạn
PRIMARY_IP="2001:19f0:4401:903:5400:6ff:fe26:c1f1/64" # IP gốc của server
GATEWAY="fe80::fc00:6ff:fe26:c1f1" # Gateway IPv6 (thường là link-local)

# 1.2 Cấu hình Mạng Tĩnh (Smart-Static)
mkdir -p /etc/systemd/network
cat > /etc/systemd/network/10-${IFACE}.network << EOF
[Match]
Name=${IFACE}
[Network]
DHCP=ipv4
Address=${PRIMARY_IP}
Gateway=${GATEWAY}
DNS=8.8.8.8
DNS=1.1.1.1
IPv6AcceptRA=yes
IPv6PrivacyExtensions=no
[IPv6AcceptRA]
UseAutonomousPrefix=no
UseOnLinkPrefix=yes
EOF
systemctl restart systemd-networkd

# 1.3 Bản vá "Local Route" (QUAN TRỌNG NHẤT CHO VULTR)
# Lệnh này giúp kernel nhận diện toàn bộ dải IP ngẫu nhiên là local
ip -6 route add local ${PREFIX}::/64 dev lo 2>/dev/null || true
ip -6 route add default via ${GATEWAY} dev ${IFACE} 2>/dev/null || true

# 1.4 Tối ưu Kernel & Chặn Autoconf
cat >> /etc/sysctl.conf << EOF
net.ipv6.conf.all.forwarding=1
net.ipv6.conf.all.proxy_ndp=1
net.ipv6.conf.all.autoconf=0
net.ipv6.conf.default.autoconf=0
net.ipv6.conf.${IFACE}.autoconf=0
net.ipv6.conf.all.use_tempaddr=0
net.ipv6.conf.default.use_tempaddr=0
fs.file-max=1000000
net.core.somaxconn=1024
EOF
sysctl -p

# 1.5 Cài đặt Dependencies (Bypass Y/N)
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y iptables-persistent curl xxd dos2unix lsof wget iproute2
```

---

## 2. Cài đặt Gost v3.2.6

```bash
wget -q https://github.com/go-gost/gost/releases/download/v3.2.6/gost_3.2.6_linux_amd64.tar.gz -O /tmp/gost.tar.gz
tar xzf /tmp/gost.tar.gz -C /usr/bin/ gost && chmod +x /usr/bin/gost
mkdir -p /root/proxy-state
touch /root/proxy-ipv6.txt /root/proxies.txt
```

---

## 3. Bộ Scripts Điều Khiển (Manual Prefix Edition)

### 3.1. Tạo Proxy (`proxy-create`)
```bash
cat > /usr/local/bin/proxy-create << 'EOF'
#!/bin/bash
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
PREFIX="2001:19f0:4401:903" # HARDCODE PREFIX TẠI ĐÂY
PORT=$1
USER=$2
PASS=$3
MARK=$((PORT + 1000))
LINUX_USER="gost$PORT"
id "$LINUX_USER" &>/dev/null || useradd -r -M -s /bin/false "$LINUX_USER"
LINUX_UID=$(id -u "$LINUX_USER")

pkill -f "gost.*:$PORT"
IPV6="${PREFIX}:$(printf '%x:%x:%x:%x' $RANDOM $RANDOM $RANDOM $RANDOM)"
ip -6 addr add $IPV6/64 dev $IFACE nodad
ip6tables -t mangle -A OUTPUT -m owner --uid-owner "$LINUX_UID" -j MARK --set-mark "$MARK"
ip6tables -t nat -A POSTROUTING -m mark --mark "$MARK" -j SNAT --to-source "$IPV6"
runuser -u "$LINUX_USER" -- gost -L "socks5://$USER:$PASS@:$PORT?udp=true" -F "direct://?prefer=ipv6&strategy=ipv6_first" >> /var/log/gost.log 2>&1 &
echo "$PORT|$IPV6|$MARK" >> /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF
chmod +x /usr/local/bin/proxy-create
```

---

## 4. Tự Phục Hồi (Persistence)

```bash
cat > /usr/local/bin/proxy-restore << 'EOF'
#!/bin/bash
sleep 5
PREFIX="2001:19f0:4401:903"
IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
GW=$(ip -6 route show default | sed -n 's/.*via \([^ ]*\).*/\1/p' | head -n1)
[ -z "$GW" ] && GW=$(ip -6 neighbor show | grep router | awk '{print $1}' | head -n1)

ip -6 route add default via $GW dev $IFACE 2>/dev/null
ip -6 route add local ${PREFIX}::/64 dev lo 2>/dev/null

while IFS='|' read -r PORT IP MARK; do
  ip -6 addr add $IP/64 dev $IFACE nodad 2>/dev/null
  LINUX_USER="gost$PORT"
  LINUX_UID=$(id -u "$LINUX_USER")
  ip6tables -t mangle -A OUTPUT -m owner --uid-owner "$LINUX_UID" -j MARK --set-mark "$MARK" 2>/dev/null
  ip6tables -t nat -A POSTROUTING -m mark --mark "$MARK" -j SNAT --to-source "$IP" 2>/dev/null
  CRE=$(grep ":$PORT:" /root/proxies.txt | head -n1)
  U=$(echo $CRE | cut -d: -f3); P=$(echo $CRE | cut -d: -f4)
  runuser -u "$LINUX_USER" -- gost -L "socks5://$U:$P@:$PORT?udp=true" -F "direct://?prefer=ipv6&strategy=ipv6_first" >> /var/log/gost.log 2>&1 &
done < /root/proxy-ipv6.txt
EOF
chmod +x /usr/local/bin/proxy-restore

# Systemd
cat > /etc/systemd/system/proxy.service << 'EOF'
[Unit]
Description=Gost IPv6 Proxy Manager
After=network-online.target netfilter-persistent.service
[Service]
Type=oneshot
ExecStart=/usr/local/bin/proxy-restore
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
EOF
systemctl enable proxy.service
```

---

## 5. Kiểm tra kết quả
- Ping từ IP proxy: `ping6 -c 3 -I <IP_PROXY> google.com`
- Test SOCKS5: `curl -6 -s --socks5 user:pass@127.0.0.1:port http://api64.ipify.org`
