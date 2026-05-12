# Hướng dẫn Triển khai Hệ thống Proxy Manager (Master Node)

Tài liệu này hướng dẫn chi tiết các bước cài đặt hệ thống điều khiển Proxy lên một VPS Ubuntu (22.04 hoặc 24.04) mới.

## 1. Chuẩn bị hệ thống
Cập nhật các gói phần mềm và cài đặt các công cụ cơ bản.
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git wget build-essential
```

## 2. Cài đặt Node.js (v22+)
Sử dụng NodeSource để cài đặt phiên bản Node.js v22.
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

## 3. Cài đặt Redis (Yêu cầu cho BullMQ)
Hệ thống sử dụng Redis để quản lý hàng đợi tác vụ (SSH execution, Proxy provisioning).
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## 4. Cài đặt & Cấu hình MySQL
Hệ thống yêu cầu MySQL 8.0+.
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```
Đăng nhập vào MySQL để khởi tạo cơ sở dữ liệu và phân quyền:
```sql
-- Đăng nhập bằng sudo mysql
CREATE DATABASE proxy_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'proxy_user'@'localhost' IDENTIFIED BY 'MatKhauCuaBan@123';
GRANT ALL PRIVILEGES ON proxy_v2.* TO 'proxy_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 5. Tải mã nguồn & Cài đặt thư viện
```bash
cd /var/www
# Thay thế URL bằng repository của bạn
git clone https://github.com/your-repo/proxy-v2.git
cd proxy-v2
npm install --legacy-peer-deps
```

## 6. Cấu hình Biến môi trường (.env)
Tạo file `.env` tại thư mục gốc của dự án:
```bash
nano .env
```
Điền các thông số cấu hình (Lưu ý thay đổi mật khẩu và IP):
```env
# Database & Redis
DATABASE_URL="mysql://proxy_user:MatKhauCuaBan@123@localhost:3306/proxy_v2"
REDIS_URL="redis://localhost:6379"

# Authentication (Auth.js v5)
# Tạo chuỗi bí mật bằng lệnh: openssl rand -base64 32
AUTH_SECRET="chuoi_bi_mat_cua_ban_o_day"
AUTH_URL="http://ip_vps_cua_ban:3000"

# (Tùy chọn) Cấu hình pino logging nếu cần
```

## 7. Khởi tạo Database & Admin User
Đồng bộ schema lên database và tạo tài khoản Admin đầu tiên để có thể đăng nhập.
```bash
# 1. Đồng bộ cấu hình database
npx prisma db push

# 2. Khởi tạo Prisma Client
npx prisma generate

# 3. Chạy script tạo tài khoản Admin mặc định
# Tài khoản: admin@proxy.com / adminpassword123
npx tsx src/lib/seed.ts
```
*Lưu ý: Sau khi đăng nhập thành công, hãy đổi mật khẩu admin ngay lập tức.*

## 8. Xây dựng ứng dụng (Build)
```bash
npm run build
```

## 9. Quản lý tiến trình với PM2
Sử dụng PM2 để đảm bảo ứng dụng luôn chạy ngầm và tự khởi động lại khi gặp lỗi hoặc VPS reboot.
```bash
sudo npm install -g pm2

# 1. Chạy Web App (Next.js)
pm2 start npm --name "proxy-web" -- start

# 2. Chạy Worker (Xử lý Job SSH/Proxy)
# Sử dụng script worker đã định nghĩa trong package.json
pm2 start "npm run worker" --name "proxy-worker"

# 3. Lưu cấu hình PM2
pm2 save
pm2 startup
```

## 10. (Khuyên dùng) Cấu hình Nginx làm Reverse Proxy
Cài đặt Nginx để chạy ứng dụng qua cổng 80/443 thay vì 3000.
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/proxy-v2
```
Nội dung file cấu hình Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com; # Thay bằng IP hoặc Domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Kích hoạt cấu hình và khởi động lại Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/proxy-v2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 11. Giám sát & Khắc phục sự cố
Để kiểm tra xem hệ thống đang chạy như thế nào:
```bash
# Xem trạng thái các dịch vụ
pm2 list

# Xem logs của Worker (Rất quan trọng khi setup server/proxy thất bại)
pm2 logs proxy-worker

# Xem logs của Web
pm2 logs proxy-web
```

---
**Yêu cầu đối với Remote Servers (Nodes):**
- Ubuntu 22.04 LTS hoặc 24.04 LTS.
- Quyền Root SSH.
- Cổng SSH (mặc định 22) phải mở.
- Hệ thống Master sẽ tự động cài đặt `gost` và cấu hình IPv6 khi thêm Server từ Dashboard.

---

## 9. Hướng dẫn Cập nhật (Update Code)
Mỗi khi bạn có thay đổi mới từ Git và muốn cập nhật lên Server, hãy thực hiện theo các bước sau:

### Bước 1: Kéo code mới
```bash
cd /var/www/proxy-v2
git pull
```

### Bước 2: Cài đặt thư viện & Cập nhật Database
```bash
# Cài đặt thư viện mới (nếu có)
npm install --legacy-peer-deps

# Cập nhật Prisma Client & Database
npx prisma generate
npx prisma db push
```

### Bước 3: Build & Restart
```bash
# Build lại ứng dụng
npm run build

# Khởi động lại dịch vụ qua PM2
pm2 restart all
```

> [!TIP]
> Nếu bạn thay đổi cấu trúc file trạng thái trên các Proxy Node (như file `/root/proxy-ipv6.txt`), hãy nhớ cập nhật lại các Script điều khiển trên các Node đó theo hướng dẫn trong `proxy-server-setup-v5.md`.
