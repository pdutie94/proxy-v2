# Hướng dẫn Triển khai Hệ thống Proxy Manager (Master Node)

Tài liệu này hướng dẫn cài đặt hệ thống điều khiển Proxy lên một VPS Ubuntu mới tinh.

## 1. Cập nhật hệ thống & Cài đặt cơ bản
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git wget build-essential
```

## 2. Cài đặt Node.js (v20+)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 3. Cài đặt Redis (Dùng cho BullMQ)
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## 4. Cài đặt & Cấu hình MySQL
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```
Đăng nhập vào MySQL để tạo database:
```sql
CREATE DATABASE proxy_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'proxy_user'@'localhost' IDENTIFIED BY 'MatKhauCuaBan@123';
GRANT ALL PRIVILEGES ON proxy_v2.* TO 'proxy_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 5. Triển khai Mã nguồn
```bash
cd /var/www
# git clone <URL_CỦA_BẠN> proxy-v2
cd proxy-v2
npm install
```

## 6. Cấu hình Biến môi trường (.env)
Tạo file `.env` và điền thông số:
```env
DATABASE_URL="mysql://proxy_user:MatKhauCuaBan@123@localhost:3306/proxy_v2"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="tao_mot_chuoi_ngau_nhien_o_day"
NEXTAUTH_URL="http://ip_vps_cua_ban:3000"
```

## 7. Khởi tạo Database & Build
```bash
npx prisma generate
npx prisma db push
npm run build
```

## 8. Quản lý tiến trình với PM2
```bash
sudo npm install -g pm2

# Chạy Web App (Next.js)
pm2 start npm --name "proxy-web" -- start

# Chạy Worker (Xử lý Job)
pm2 start "npx tsx src/worker/index.ts" --name "proxy-worker"

# Tự động chạy lại khi VPS khởi động lại
pm2 save
pm2 startup
```

## 9. (Tùy chọn) Cài đặt Nginx & SSL
Nếu bạn muốn dùng tên miền (domain.com):
```bash
sudo apt install -y nginx
```
Cấu hình Nginx trỏ về cổng 3000 và dùng Certbot để cài SSL miễn phí.

---
**Lưu ý:** Cửa sổ `proxy-worker` rất quan trọng, nó là nơi thực hiện các lệnh SSH tới các server proxy khác. Hãy đảm bảo nó luôn ở trạng thái `online` trong PM2.
