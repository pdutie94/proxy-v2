# Proxy Server Setup Guide V2.1 (UID Routing & Zero Downtime)

## Server: Hetzner CPX11

- **OS:** Ubuntu 24.04

---

## 1. Cài đặt Dependencies & Tắt IPv6 Autoconfig (Quan trọng)

Mặc định Ubuntu tự sinh địa chỉ IPv6 (Privacy Extensions), làm nhiễu luồng routing. Ta phải chặn triệt để và cài tool xử lý ký tự rác.

```bash
apt update && apt install -y git make gcc lsof iptables-persistent dos2unix

# Tắt SLAAC/Privacy Extensions để tránh server tự sinh IPv6 rác
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

# Lưu vào sysctl để đảm bảo tuyệt đối không sinh IPv6 ngẫu nhiên
cat >> /etc/sysctl.conf << 'EOF'
net.ipv6.conf.all.autoconf=0
net.ipv6.conf.default.autoconf=0
net.ipv6.conf.eth0.autoconf=0
net.ipv6.conf.all.use_tempaddr=0
net.ipv6.conf.default.use_tempaddr=0
net.ipv6.conf.eth0.use_tempaddr=0
EOF
sysctl -p
```

---

## 2. Cài đặt GOST v3 (Bản mới nhất)

```bash
cd /tmp
wget https://github.com/go-gost/gost/releases/download/v3.2.6/gost_3.2.6_linux_amd64.tar.gz
tar xzf gost_3.2.6_linux_amd64.tar.gz
mv gost /usr/bin/gost
chmod +x /usr/bin/gost
```

---

## 3. Script Tạo Proxy

**File:** `/usr/local/bin/create-proxies.sh`

```bash
cat > /usr/local/bin/create-proxies.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b" # <<-- THAY BẰNG PREFIX CỦA SERVER
OUTPUT_FILE="/root/proxies.txt"
IPV6_MAP="/root/proxy-ipv6.txt"

read -p "Số lượng proxy cần tạo: " COUNT

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    LAST_PORT=$(awk -F: '{print $2}' $OUTPUT_FILE | sort -n | tail -1)
    START_PORT=$((LAST_PORT + 1))
else
    START_PORT=10000
fi

echo "Bắt đầu từ port $START_PORT"

for i in $(seq 0 $((COUNT - 1))); do
    PORT=$((START_PORT + i))
    MARK=$((PORT - 9999))
    USER_PROXY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 6)
    PASS=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 8)

    O1=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    O2=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    O3=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    O4=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    NEW_IPV6="${PREFIX}:${O1}:${O2}:${O3}:${O4}"

    LINUX_USER="gost${PORT}"
    id "$LINUX_USER" &>/dev/null || useradd -r -M -s /bin/false "$LINUX_USER"
    LINUX_UID=$(id -u "$LINUX_USER")

    ip -6 addr add "${NEW_IPV6}/64" dev eth0 nodad 2>/dev/null
    ip6tables -t mangle -A OUTPUT -m owner --uid-owner "$LINUX_UID" -j MARK --set-mark "$MARK"
    ip6tables -t nat -A POSTROUTING -m mark --mark "$MARK" -j SNAT --to-source "$NEW_IPV6"

    runuser -u "$LINUX_USER" -- gost -L "socks5://${USER_PROXY}:${PASS}@:${PORT}" >> /var/log/gost.log 2>&1 &
    echo $! > "/var/run/gost-${PORT}.pid"

    echo "${PORT}|${NEW_IPV6}|${MARK}" >> "$IPV6_MAP"
    IPV4=$(curl -s -4 api64.ipify.org)
    echo "${IPV4}:${PORT}:${USER_PROXY}:${PASS}" >> "$OUTPUT_FILE"
done

ip6tables-save > /etc/iptables/rules.v6
dos2unix /root/proxies.txt /root/proxy-ipv6.txt 2>/dev/null
echo "Tạo xong $COUNT proxy!"
EOF
chmod +x /usr/local/bin/create-proxies.sh
```

---

## 4. Script Rotate IPv6 (Zero Downtime)

**File:** `/usr/local/bin/rotate-proxies.sh`

```bash
cat > /usr/local/bin/rotate-proxies.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b" # <<-- THAY BẰNG PREFIX CỦA SERVER
IPV6_MAP="/root/proxy-ipv6.txt"
INTERVAL=600 # Xoay mỗi 10 phút

generate_ipv6() {
    O1=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    O2=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    O3=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    O4=$(printf "%04x" "0x$(head -c2 /dev/urandom | xxd -p)")
    echo "${PREFIX}:${O1}:${O2}:${O3}:${O4}"
}

while true; do
    echo "[$(date)] Rotating IPv6..."
    [ ! -f "$IPV6_MAP" ] && { sleep 10; continue; }

    TEMP_MAP=""
    while IFS='|' read -r PORT OLD_IPV6 MARK; do
        NEW_IPV6=$(generate_ipv6)
        ip -6 addr add "${NEW_IPV6}/64" dev eth0 nodad 2>/dev/null
        RULE_LINE=$(ip6tables -t nat -nvL POSTROUTING --line-numbers | awk "/ mark match 0x$(printf '%x' $MARK) /{print \$1}" | head -1)
        if [ -n "$RULE_LINE" ]; then
            ip6tables -t nat -R POSTROUTING "$RULE_LINE" -m mark --mark "$MARK" -j SNAT --to-source "$NEW_IPV6"
        fi
        ip -6 addr del "${OLD_IPV6}/64" dev eth0 2>/dev/null
        TEMP_MAP="${TEMP_MAP}${PORT}|${NEW_IPV6}|${MARK}\n"
    done < "$IPV6_MAP"

    printf "$TEMP_MAP" > "$IPV6_MAP"
    ip6tables-save > /etc/iptables/rules.v6
    echo "[$(date)] Rotate xong! Bắt đầu đếm ngược 10 phút..."
    sleep $INTERVAL
done
EOF
chmod +x /usr/local/bin/rotate-proxies.sh
```

---

## 5. Script Reset Toàn Bộ Hệ Thống

**File:** `/usr/local/bin/reset-proxies.sh`

```bash
cat > /usr/local/bin/reset-proxies.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b"

# Tắt các service và tiến trình cũ để tránh xung đột
systemctl stop 3proxy-rotate gost-rotate 2>/dev/null
pkill -f 3proxy-rotate.sh 2>/dev/null
pkill -f gost-rotate.sh 2>/dev/null
pkill gost 2>/dev/null
sleep 1

if [ -f /root/proxy-ipv6.txt ]; then
    while IFS='|' read -r PORT IPV6 MARK; do
        LINUX_USER="gost${PORT}"
        userdel "$LINUX_USER" 2>/dev/null
    done < /root/proxy-ipv6.txt
fi

ip6tables -t mangle -F OUTPUT
ip6tables -t nat -F POSTROUTING
ip6tables-save > /etc/iptables/rules.v6

ip -6 addr show dev eth0 | grep "${PREFIX}" | awk '{print $2}' | while read ADDR; do
    ip -6 addr del "$ADDR" dev eth0 2>/dev/null
done
ip -6 route add default via fe80::1 dev eth0 2>/dev/null

> /root/proxies.txt
> /root/proxy-ipv6.txt
> /var/log/gost.log
echo "Reset xong hoàn toàn!"
EOF
chmod +x /usr/local/bin/reset-proxies.sh
```

---

## 6. Cài đặt Persistence (Tự khởi động khi Reboot)

```bash
# Script Restore
cat > /usr/local/bin/restore-proxies.sh << 'EOF'
#!/bin/bash
sleep 5
ip -6 route add default via fe80::1 dev eth0 2>/dev/null
if [ -f /root/proxy-ipv6.txt ]; then
    while IFS='|' read -r PORT IPV6 MARK; do
        ip -6 addr add "${IPV6}/64" dev eth0 nodad 2>/dev/null
        LINUX_USER="gost${PORT}"
        USER_PROXY=$(grep ":${PORT}:" /root/proxies.txt | cut -d: -f3)
        PASS=$(grep ":${PORT}:" /root/proxies.txt | cut -d: -f4)
        runuser -u "$LINUX_USER" -- gost -L "socks5://${USER_PROXY}:${PASS}@:${PORT}" >> /var/log/gost.log 2>&1 &
    done < /root/proxy-ipv6.txt
fi
EOF
chmod +x /usr/local/bin/restore-proxies.sh

# Tạo Services
cat > /etc/systemd/system/restore-proxies.service << 'EOF'
[Unit]
Description=Restore Proxy IPv6 Interfaces
After=network-online.target netfilter-persistent.service
[Service]
Type=oneshot
ExecStart=/usr/local/bin/restore-proxies.sh
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/rotate-proxies.service << 'EOF'
[Unit]
Description=Rotate IPv6 Proxies
After=network.target restore-proxies.service
[Service]
Type=simple
ExecStart=/usr/local/bin/rotate-proxies.sh
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable restore-proxies
systemctl enable --now rotate-proxies
dos2unix /usr/local/bin/*.sh
```

---

## 7. Lệnh Quản Lý

- **Xoay IP thủ công ngay lập tức:** `systemctl restart rotate-proxies`
- **Xóa sạch để tạo lại:** `bash /usr/local/bin/reset-proxies.sh && bash /usr/local/bin/create-proxies.sh`
- **Xem trạng thái IPv6 thực tế:** `ip6tables -t nat -nvL POSTROUTING`

---

## 8. Gợi ý API Endpoints cho Dashboard

| Chức năng                           | Lệnh shell tương ứng                                                   | Giải thích                                     |
| ----------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| **Lấy danh sách Proxy**             | `cat /root/proxies.txt`                                                | Trả về list `IP:PORT:USER:PASS`                |
| **Xoay IP toàn bộ (Manual Rotate)** | `systemctl restart rotate-proxies`                                     | Ép hệ thống đổi IPv6 ngay lập tức              |
| **Reset/Xóa sạch tất cả**           | `bash /usr/local/bin/reset-proxies.sh`                                 | Xóa sạch user, rules và file config            |
| **Tạo thêm Proxy**                  | `bash /usr/local/bin/create-proxies.sh`                                | Tự động điền số lượng (VD: 5) vào lệnh tạo     |
| **Xem Log hoạt động**               | `tail -n 100 /var/log/gost.log`                                        | Xem nhật ký kết nối của GOST                   |
| **Xem Log xoay IP**                 | `journalctl -u rotate-proxies -n 50 --no-pager`                        | Xem lịch sử các lần đổi IPv6 thành công        |
| **Kiểm tra trạng thái Service**     | `systemctl is-active rotate-proxies`                                   | Trả về `active` nếu hệ thống xoay IP đang chạy |
| **Xóa 1 Proxy cụ thể**              | `sed -i "/:${PORT}:/d" /root/proxies.txt && pkill -f "gost.*:${PORT}"` | Xóa dòng trong file và kill tiến trình port đó |

---

## 9. Mô hình hoạt động (Final Architecture)

```text
Client (Chrome/Tool)
        ↓
  IPv4: 5.78.188.26:PORT (SOCKS5 Auth)
        ↓
  GOST (Chạy dưới quyền User Linux: gost1000x)
        ↓
  Kernel (Mangle Table: Mark packet dựa trên UID)
        ↓
  Kernel (NAT Table: SNAT packet đã mark ra IPv6 đích)
        ↓
  IPv6 duy nhất: 2a01:4ff:1f0:513b:xxxx:xxxx:xxxx:xxxx (Đã gán vào eth0)
```
