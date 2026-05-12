# Proxy Server Setup Guide
## Server: Hetzner CPX11 - ubuntu-2gb-hil-1
- **IPv4:** 5.78.188.26
- **IPv6 Subnet:** 2a01:4ff:1f0:513b::/64
- **OS:** Ubuntu 24.04

---

## 1. Cài đặt Dependencies

```bash
apt update && apt install -y git make gcc lsof
```

---

## 2. Cài đặt GOST

```bash
cd /tmp && wget https://github.com/ginuerzh/gost/releases/download/v2.11.5/gost-linux-amd64-2.11.5.gz
gunzip gost-linux-amd64-2.11.5.gz
mv gost-linux-amd64-2.11.5 /usr/bin/gost
chmod +x /usr/bin/gost
```

---

## 3. Cấu hình IPv6 Routing

```bash
# Thêm default route IPv6
ip -6 route add default via fe80::1 dev eth0

# Persistent qua reboot (netplan)
cat > /etc/netplan/60-ipv6-route.yaml << 'EOF'
network:
  version: 2
  ethernets:
    eth0:
      routes:
        - to: "::/0"
          via: "fe80::1"
EOF
netplan apply
```

---

## 4. Tạo Script Tạo Proxy

File: `/usr/local/bin/create-proxies.sh`

```bash
cat > /usr/local/bin/create-proxies.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b"
OUTPUT_FILE="/root/proxies.txt"

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
    USER=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 6)
    PASS=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 8)
    NEW_IPV6=$(printf "${PREFIX}:%04x:%04x:%04x:%04x" $((RANDOM%65536)) $((RANDOM%65536)) $((RANDOM%65536)) $((RANDOM%65536)))
    ip -6 addr add "${NEW_IPV6}/64" dev eth0 2>/dev/null
    gost -L="socks5://${USER}:${PASS}@:${PORT}?maxConns=1" >> /var/log/gost.log 2>&1 &
    echo "5.78.188.26:${PORT}:${USER}:${PASS}" >> $OUTPUT_FILE
done

echo "Tạo xong $COUNT proxy!"
echo "Tổng cộng: $(wc -l < $OUTPUT_FILE) proxy"
EOF
chmod +x /usr/local/bin/create-proxies.sh
```

---

## 5. Tạo Script Reset Proxy

File: `/usr/local/bin/reset-proxies.sh`

```bash
cat > /usr/local/bin/reset-proxies.sh << 'EOF'
#!/bin/bash
pkill gost
sleep 1
> /root/proxies.txt
ip -6 addr flush dev eth0
ip -6 route add default via fe80::1 dev eth0
> /var/log/gost.log
echo "Reset xong!"
EOF
chmod +x /usr/local/bin/reset-proxies.sh
```

---

## 6. Tạo Script Rotate IPv6 (mỗi 10 phút)

File: `/usr/local/bin/rotate-proxies.sh`

```bash
cat > /usr/local/bin/rotate-proxies.sh << 'EOF'
#!/bin/bash
PREFIX="2a01:4ff:1f0:513b"
OUTPUT_FILE="/root/proxies.txt"
INTERVAL=600  # 10 phút

generate_ipv6() {
    printf "${PREFIX}:%04x:%04x:%04x:%04x" \
        $((RANDOM%65536)) $((RANDOM%65536)) \
        $((RANDOM%65536)) $((RANDOM%65536))
}

while true; do
    sleep $INTERVAL
    echo "[$(date)] Rotating IPv6..."

    while IFS=: read -r IP PORT USER PASS; do
        NEW_IPV6=$(generate_ipv6)
        ip -6 addr add "${NEW_IPV6}/64" dev eth0 2>/dev/null

        PID=$(lsof -ti :${PORT})
        if [ -n "$PID" ]; then
            kill $PID 2>/dev/null
            sleep 0.2
        fi

        gost -L="socks5://${USER}:${PASS}@:${PORT}?maxConns=1" >> /var/log/gost.log 2>&1 &
        echo "Port $PORT -> $NEW_IPV6"
    done < "$OUTPUT_FILE"

    echo "[$(date)] Rotate xong!"
done
EOF
chmod +x /usr/local/bin/rotate-proxies.sh
```

---

## 7. Tạo Systemd Service cho Rotate

```bash
cat > /etc/systemd/system/rotate-proxies.service << 'EOF'
[Unit]
Description=Rotate IPv6 Proxies
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/rotate-proxies.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable --now rotate-proxies
```

---

## 8. Tạo Systemd Service cho Gost (auto start khi reboot)

```bash
cat > /etc/systemd/system/gost-proxies.service << 'EOF'
[Unit]
Description=Gost Proxies
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/create-proxies.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
systemctl enable gost-proxies
```

---

## 9. Lần đầu chạy

```bash
bash /usr/local/bin/reset-proxies.sh && bash /usr/local/bin/create-proxies.sh
```

---

## 10. Các lệnh quản lý thường dùng

```bash
# Xem danh sách proxy
cat /root/proxies.txt

# Xem tổng số proxy
wc -l /root/proxies.txt

# Xem gost đang chạy
ps aux | grep gost | grep -v grep

# Xem số port đang listen
ss -tlnp | grep gost | wc -l

# Xem log gost
tail -50 /var/log/gost.log

# Xem log rotate
journalctl -u rotate-proxies -f

# Test 1 proxy
curl -s --socks5 USER:PASS@5.78.188.26:PORT http://api64.ipify.org

# Test 5 proxy đầu
for i in 1 2 3 4 5; do
  LINE=$(sed -n "${i}p" /root/proxies.txt)
  PORT=$(echo $LINE | cut -d: -f2)
  USER=$(echo $LINE | cut -d: -f3)
  PASS=$(echo $LINE | cut -d: -f4)
  echo -n "Port $PORT -> "
  curl -s --socks5 ${USER}:${PASS}@5.78.188.26:${PORT} http://api64.ipify.org
  echo
done

# Reset toàn bộ
bash /usr/local/bin/reset-proxies.sh

# Tạo thêm proxy
bash /usr/local/bin/create-proxies.sh

# Xem trạng thái rotate service
systemctl status rotate-proxies
```

---

## 11. API Endpoints gợi ý cho Dashboard

| Chức năng | Lệnh shell tương ứng |
|-----------|----------------------|
| Lấy danh sách proxy | `cat /root/proxies.txt` |
| Tổng số proxy | `wc -l /root/proxies.txt` |
| Tạo thêm proxy | `bash /usr/local/bin/create-proxies.sh` |
| Reset tất cả | `bash /usr/local/bin/reset-proxies.sh` |
| Xóa 1 proxy | `sed -i "/:{PORT}:/d" /root/proxies.txt && kill $(lsof -ti:{PORT})` |
| Trạng thái rotate | `systemctl is-active rotate-proxies` |
| Test proxy | `curl --socks5 USER:PASS@IP:PORT http://api64.ipify.org` |
| Log gost | `tail -n 100 /var/log/gost.log` |

---

## 12. Mô hình hoạt động

```
Client (Chrome/Tool)
        ↓
  IPv4: 5.78.188.26:PORT (SOCKS5)
        ↓
      GOST
        ↓
  IPv6 ngẫu nhiên: 2a01:4ff:1f0:513b:xxxx:xxxx:xxxx:xxxx
        ↓
     Internet (Google Veo 3, etc.)
```

**Đặc điểm:**
- Mỗi port = 1 proxy riêng biệt
- Mỗi proxy giới hạn 1 kết nối (maxConns=1)
- IPv6 tự động rotate mỗi 10 phút
- Port range: 10000 - 19999 (firewall Hetzner cho phép)
