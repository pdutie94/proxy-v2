# Proxy Server Setup Guide V5.0 (UID Routing & High-Scale Automation)

Bản hướng dẫn này tối ưu cho **Ubuntu 24.04** và các dòng server như **Hetzner CPX11**, đảm bảo outbound ra IPv6 ngẫu nhiên cho từng port bằng cơ chế **UID Marking**.

---

## 1. Cấu hình Hệ thống & Chặn IPv6 Rác (SLAAC)

Mục đích: Ngăn server tự sinh các địa chỉ IPv6 không mong muốn và tối ưu giới hạn kết nối.

```bash
# 1.1 Chặn SLAAC qua systemd-networkd
mkdir -p /etc/systemd/network
cat > /etc/systemd/network/10-eth0.network << 'EOF'
[Match]
Name=eth0
[Network]
DHCP=ipv4
IPv6AcceptRA=yes
IPv6PrivacyExtensions=no
[IPv6AcceptRA]
UseAutonomousPrefix=no
UseOnLinkPrefix=yes
EOF
systemctl restart systemd-networkd

# 1.2 Cài đặt Dependencies
apt update && apt install -y iptables-persistent curl xxd dos2unix lsof wget iproute2

# 1.3 Tối ưu Kernel (sysctl)
cat >> /etc/sysctl.conf << 'EOF'
net.ipv6.conf.all.autoconf=0
net.ipv6.conf.default.autoconf=0
net.ipv6.conf.eth0.autoconf=0
net.ipv6.conf.all.use_tempaddr=0
net.ipv6.conf.default.use_tempaddr=0
net.ipv6.conf.eth0.use_tempaddr=0
fs.file-max=1000000
net.core.somaxconn=1024
EOF
sysctl -p

# 1.4 Tăng giới hạn File Descriptor (ulimit)
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 1000000
* hard nofile 1000000
root soft nofile 1000000
root hard nofile 1000000
EOF
```

---

## 2. Cài đặt Gost v3.2.6

```bash
cd /tmp
wget https://github.com/go-gost/gost/releases/download/v3.2.6/gost_3.2.6_linux_amd64.tar.gz
tar xzf gost_3.2.6_linux_amd64.tar.gz
mv gost /usr/bin/gost
chmod +x /usr/bin/gost

# Khởi tạo thư mục state
mkdir -p /root/proxy-state
touch /root/proxy-ipv6.txt /root/proxies.txt
```

---

## 3. Bộ Scripts Điều Khiển (UID Routing Core)

### 3.1. Tạo Proxy (`proxy-create`)
Sử dụng UID của User Linux để đánh dấu gói tin IPv6.

```bash
cat > /usr/local/bin/proxy-create << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b" # Thay bằng Prefix của bạn
SERVER_IP=$(curl -s -4 icanhazip.com)
PORT=$1
USER=$2
PASS=$3
MARK=$((PORT + 1000))
IPV6="${PREFIX}:$(printf '%x:%x:%x:%x' $RANDOM $RANDOM $RANDOM $RANDOM)"

LINUX_USER="gost$PORT"
id "$LINUX_USER" &>/dev/null || useradd -r -M -s /bin/false "$LINUX_USER"
LINUX_UID=$(id -u "$LINUX_USER")

ip -6 addr add $IPV6/64 dev eth0 nodad
ip6tables -t mangle -A OUTPUT -m owner --uid-owner "$LINUX_UID" -j MARK --set-mark "$MARK"
ip6tables -t nat -A POSTROUTING -m mark --mark "$MARK" -j SNAT --to-source "$IPV6"

pkill -f "gost.*:$PORT"
runuser -u "$LINUX_USER" -- gost -L "socks5://$USER:$PASS@:$PORT" -F "direct://?prefer=ipv6" >> /var/log/gost.log 2>&1 &

echo "$PORT|$IPV6|$MARK" >> /root/proxy-ipv6.txt
echo "$SERVER_IP:$PORT:$USER:$PASS" >> /root/proxies.txt
ip6tables-save > /etc/iptables/rules.v6
EOF
chmod +x /usr/local/bin/proxy-create
```

### 3.2. Xoay IP 1 Port (`proxy-rotate-one`)
Đổi IPv6 cho một port cụ thể mà không làm rớt kết nối proxy.

```bash
cat > /usr/local/bin/proxy-rotate-one << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b"
PORT=$1
MARK=$((PORT + 1000))
OLD_DATA=$(grep "^$PORT|" /root/proxy-ipv6.txt)
OLD_IP=$(echo $OLD_DATA | cut -d'|' -f2)
NEW_IP="${PREFIX}:$(printf '%x:%x:%x:%x' $RANDOM $RANDOM $RANDOM $RANDOM)"

ip -6 addr add $NEW_IP/64 dev eth0 nodad
ip6tables -t nat -D POSTROUTING -m mark --mark $MARK -j SNAT --to-source $OLD_IP 2>/dev/null
ip6tables -t nat -A POSTROUTING -m mark --mark $MARK -j SNAT --to-source $NEW_IP
ip -6 addr del $OLD_IP/64 dev eth0 2>/dev/null

sed -i "s|^$PORT|$OLD_IP|$MARK|$PORT|$NEW_IP|$MARK|" /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF
chmod +x /usr/local/bin/proxy-rotate-one
```

### 3.3. Xóa Sạch Proxy (`proxy-reset`)
Dọn dẹp hoàn toàn server để làm lại từ đầu.

```bash
cat > /usr/local/bin/proxy-reset << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b"
pkill -9 gost 2>/dev/null
[ -f /root/proxy-ipv6.txt ] && while IFS='|' read -r PORT IP MARK; do
  userdel -r gost$PORT 2>/dev/null
done < /root/proxy-ipv6.txt
ip6tables -t mangle -F OUTPUT
ip6tables -t nat -F POSTROUTING
ip -6 addr show dev eth0 | grep "${PREFIX}" | awk '{print $2}' | while read ADDR; do
  ip -6 addr del "$ADDR" dev eth0 2>/dev/null
done
> /root/proxies.txt
> /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF
chmod +x /usr/local/bin/proxy-reset
```

---

## 4. Tự Phục Hồi Khi Reboot (Persistence)

```bash
# Script Restore
cat > /usr/local/bin/proxy-restore << 'EOF'
#!/bin/bash
sleep 5
ip -6 route add default via fe80::1 dev eth0 2>/dev/null
while IFS='|' read -r PORT IP MARK; do
  ip -6 addr add $IP/64 dev eth0 nodad 2>/dev/null
  LINUX_USER="gost$PORT"
  LINUX_UID=$(id -u "$LINUX_USER")
  ip6tables -t mangle -A OUTPUT -m owner --uid-owner "$LINUX_UID" -j MARK --set-mark "$MARK" 2>/dev/null
  ip6tables -t nat -A POSTROUTING -m mark --mark "$MARK" -j SNAT --to-source "$IP" 2>/dev/null
  
  if ! pgrep -f "gost.*:$PORT" >/dev/null; then
    CRE=$(grep ":$PORT:" /root/proxies.txt | head -n1)
    U=$(echo $CRE | cut -d: -f3)
    P=$(echo $CRE | cut -d: -f4)
    [ -z "$U" ] && continue
    runuser -u "$LINUX_USER" -- gost -L "socks5://$U:$P@:$PORT" -F "direct://?prefer=ipv6" >> /var/log/gost.log 2>&1 &
  fi
done < /root/proxy-ipv6.txt
EOF
chmod +x /usr/local/bin/proxy-restore

# Service Systemd
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
systemctl daemon-reload && systemctl enable proxy.service
```

---

## 5. Lưu ý quan trọng
- Luôn đảm bảo **Gateway IPv6** (`fe80::1`) thông suốt.
- Kiểm tra outbound bằng lệnh: `curl -x socks5h://user:pass@127.0.0.1:port https://api64.ipify.org`
- Mọi thay đổi về cấu hình Firewall cần được lưu bằng `ip6tables-save`.
