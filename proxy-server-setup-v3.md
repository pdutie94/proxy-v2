# Proxy Server Setup Guide V3.1 (Professional Architecture - Final Version)

## Server: Hetzner CPX11 (Ubuntu 24.04)

---

## 1. Tối ưu Hệ thống & Chặn IPv6 Rác (Bắt buộc)

```bash
apt update && apt install -y git make gcc lsof iptables-persistent dos2unix xxd curl

# 1.1 Chặn SLAAC & Privacy Extensions (Tránh lỗi nhảy IP)
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

# 1.2 Tối ưu giới hạn kết nối cho 10.000+ Connection
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 100000
* hard nofile 100000
root soft nofile 100000
root hard nofile 100000
EOF

cat >> /etc/sysctl.conf << 'EOF'
net.ipv6.conf.all.autoconf=0
net.ipv6.conf.default.autoconf=0
net.ipv6.conf.eth0.autoconf=0
net.ipv6.conf.all.use_tempaddr=0
net.ipv6.conf.default.use_tempaddr=0
net.ipv6.conf.eth0.use_tempaddr=0
fs.file-max = 1000000
EOF
sysctl -p
```

---

## 2. NHÓM 1: Cài đặt & Khởi tạo Hàng loạt (Setup lần đầu)

```bash
# 2.1 Cài GOST v3
cd /tmp && wget https://github.com/go-gost/gost/releases/download/v3.2.6/gost_3.2.6_linux_amd64.tar.gz
tar xzf gost_3.2.6_linux_amd64.tar.gz && mv gost /usr/bin/gost && chmod +x /usr/bin/gost

# 2.2 Script Tạo Hàng loạt (create-proxies.sh)
cat > /usr/local/bin/create-proxies.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b" # <<-- THAY PREFIX CỦA BẠN
IPV6_MAP="/root/proxy-ipv6.txt"
OUTPUT_FILE="/root/proxies.txt"
read -p "Số lượng proxy: " COUNT
START_PORT=10000
[ -s "$OUTPUT_FILE" ] && START_PORT=$(($(awk -F: '{print $2}' $OUTPUT_FILE | sort -n | tail -1) + 1))
for i in $(seq 0 $((COUNT - 1))); do
    PORT=$((START_PORT + i))
    MARK=$((PORT - 9999))
    USER_P=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c6)
    PASS_P=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c8)
    NEW_IPV6="${PREFIX}:$(printf '%x:%x:%x:%x' $((RANDOM%65535)) $((RANDOM%65535)) $((RANDOM%65535)) $((RANDOM%65535)))"
    LINUX_USER="gost${PORT}"
    useradd -r -M -s /bin/false "$LINUX_USER" 2>/dev/null
    ip -6 addr add "${NEW_IPV6}/64" dev eth0 nodad 2>/dev/null
    ip6tables -t mangle -A OUTPUT -m owner --uid-owner "$LINUX_USER" -j MARK --set-mark "$MARK"
    ip6tables -t nat -A POSTROUTING -m mark --mark "$MARK" -j SNAT --to-source "$NEW_IPV6"
    runuser -u "$LINUX_USER" -- gost -L "socks5://${USER_P}:${PASS_P}@:${PORT}" >> /var/log/gost.log 2>&1 &
    echo "${PORT}|${NEW_IPV6}|${MARK}" >> "$IPV6_MAP"
    echo "$(curl -s -4 api64.ipify.org):${PORT}:${USER_P}:${PASS_P}" >> "$OUTPUT_FILE"
done
ip6tables-save > /etc/iptables/rules.v6
dos2unix /root/*.txt 2>/dev/null
EOF

# 2.3 Script Reset Toàn Bộ (reset-proxies.sh)
cat > /usr/local/bin/reset-proxies.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b"
systemctl stop rotate-proxies 2>/dev/null
pkill gost 2>/dev/null
[ -f /root/proxy-ipv6.txt ] && awk -F'|' '{print $1}' /root/proxy-ipv6.txt | xargs -I{} userdel gost{} 2>/dev/null
ip6tables -t mangle -F OUTPUT
ip6tables -t nat -F POSTROUTING
ip6tables-save > /etc/iptables/rules.v6
ip -6 addr show dev eth0 | grep "${PREFIX}" | awk '{print $2}' | xargs -I{} ip -6 addr del {} dev eth0 2>/dev/null
ip -6 route add default via fe80::1 dev eth0 2>/dev/null
> /root/proxies.txt && > /root/proxy-ipv6.txt && rm -f /root/suspended-ports.txt
echo "Hệ thống đã sạch bóng!"
EOF
chmod +x /usr/local/bin/*.sh
```

---

## 3. NHÓM 2: Quản lý Đơn lẻ (Dashboard API)

Tất cả các lệnh này được thiết kế để Dashboard gọi qua SSH mà không ảnh hưởng khách khác.

```bash
# 3.1 Xoay IP 1 Port (rotate-single.sh)
cat > /usr/local/bin/rotate-single.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b"
PORT=$1
LINE=$(grep "^${PORT}|" /root/proxy-ipv6.txt)
OLD_IPV6=$(echo $LINE | cut -d'|' -f2)
MARK=$(echo $LINE | cut -d'|' -f3)
NEW_IPV6="${PREFIX}:$(printf '%x:%x:%x:%x' $((RANDOM%65535)) $((RANDOM%65535)) $((RANDOM%65535)) $((RANDOM%65535)))"
ip -6 addr add "${NEW_IPV6}/64" dev eth0 nodad
RLINE=$(ip6tables -t nat -nvL POSTROUTING --line-numbers | awk "/ mark match 0x$(printf '%x' $MARK) /{print \$1}" | head -1)
ip6tables -t nat -R POSTROUTING "$RLINE" -m mark --mark "$MARK" -j SNAT --to-source "$NEW_IPV6"
ip -6 addr del "${OLD_IPV6}/64" dev eth0 2>/dev/null
sed -i "s|^${PORT}|${OLD_IPV6}|${MARK}|${PORT}|${NEW_IPV6}|${MARK}|" /root/proxy-ipv6.txt
ip6tables-save > /etc/iptables/rules.v6
EOF

# 3.2 Khóa/Mở Proxy (suspend/resume-proxy.sh)
cat > /usr/local/bin/suspend-proxy.sh << 'EOF'
#!/bin/bash
iptables -I INPUT -p tcp --dport $1 -j REJECT && ip6tables -I INPUT -p tcp --dport $1 -j REJECT
echo "$1" >> /root/suspended-ports.txt
EOF
cat > /usr/local/bin/resume-proxy.sh << 'EOF'
#!/bin/bash
iptables -D INPUT -p tcp --dport $1 -j REJECT 2>/dev/null && ip6tables -D INPUT -p tcp --dport $1 -j REJECT 2>/dev/null
sed -i "/^$1$/d" /root/suspended-ports.txt
EOF
chmod +x /usr/local/bin/*.sh
```

---

## 4. NHÓM 3: Monitor & Persistence

```bash
# 4.1 Check Google Blacklist (check-google.sh)
cat > /usr/local/bin/check-google.sh << 'EOF'
#!/bin/bash
while IFS=: read -r IP PORT USER PASS; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --proxy "socks5://${USER}:${PASS}@${IP}:${PORT}" "https://www.google.com/search?q=test" --connect-timeout 5)
    echo "Port $PORT: $STATUS"
done < /root/proxies.txt
EOF

# 4.2 Script Tự phục hồi khi Reboot (restore-proxies.sh)
cat > /usr/local/bin/restore-proxies.sh << 'EOF'
#!/bin/bash
sleep 5 && ip -6 route add default via fe80::1 dev eth0 2>/dev/null
while IFS='|' read -r PORT IPV6 MARK; do
    ip -6 addr add "${IPV6}/64" dev eth0 nodad
    CRED=$(grep ":${PORT}:" /root/proxies.txt | cut -d: -f3,4)
    runuser -u "gost${PORT}" -- gost -L "socks5://${CRED/:/@}@:${PORT}" >> /var/log/gost.log 2>&1 &
done < /root/proxy-ipv6.txt
[ -f /root/suspended-ports.txt ] && while read P; do iptables -I INPUT -p tcp --dport $P -j REJECT; ip6tables -I INPUT -p tcp --dport $P -j REJECT; done < /root/suspended-ports.txt
EOF
chmod +x /usr/local/bin/*.sh
```

---

## 5. Tích hợp Dashboard API (Bản tóm tắt)

| Chức năng            | Lệnh Shell thực thi            |
| :------------------- | :----------------------------- |
| **Setup Server**     | `bash create-proxies.sh`       |
| **Tạo 1 Proxy**      | `bash create-single.sh [PORT]` |
| **Xoay IP (Manual)** | `bash rotate-single.sh [PORT]` |
| **Khóa (Hết hạn)**   | `bash suspend-proxy.sh [PORT]` |
| **Mở (Gia hạn)**     | `bash resume-proxy.sh [PORT]`  |
| **Xóa Proxy**        | `bash delete-single.sh [PORT]` |
| **Check Google**     | `bash check-google.sh`         |

```

```
