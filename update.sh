#!/bin/bash

# Màu sắc hiển thị cho đẹp
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Bắt đầu quá trình cập nhật hệ thống...${NC}"

# 1. Cài đặt thư viện
echo -e "${YELLOW}1/4: Đang cài đặt thư viện mới...${NC}"
npm install --legacy-peer-deps

# 2. Cập nhật Prisma
echo -e "${YELLOW}2/4: Đang cập nhật Prisma Client & Database...${NC}"
npx prisma generate
npx prisma db push

# 3. Build ứng dụng
echo -e "${YELLOW}3/4: Đang build lại ứng dụng...${NC}"
npm run build

# 4. Restart PM2
echo -e "${YELLOW}4/4: Đang khởi động lại dịch vụ...${NC}"
pm2 restart all

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   CẬP NHẬT HOÀN TẤT THÀNH CÔNG!${NC}"
echo -e "${GREEN}========================================${NC}"
