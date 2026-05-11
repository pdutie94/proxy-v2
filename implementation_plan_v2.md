# Kế hoạch nâng cấp Giao diện & Phân quyền Moderator

Tài liệu này mô tả các thay đổi để làm cho hệ thống trông chuyên nghiệp hơn và thêm vai trò Moderator với quyền hạn hạn chế.

## 1. Nâng cấp Giao diện (Aesthetics)
- **Màu sắc**: Chuyển từ tông Slate đơn điệu sang Indigo/Blue hiện đại.
- **Buttons**: Thêm hiệu ứng gradient nhẹ, bo góc mềm mại hơn.
- **Sidebar**: Sử dụng nền tối (Dark) hoặc Indigo đậm để phân tách rõ ràng với nội dung.
- **Trạng thái**: Làm cho các Badge (Active, Error) có màu sắc rực rỡ và dễ nhận diện hơn.

## 2. Vai trò Moderator
- **Role**: Thêm `MODERATOR` vào hệ thống.
- **Quyền hạn**:
    - Quản lý Proxy: Thêm, Sửa, Rotate, Check Google (OK).
    - Xóa Proxy: **BỊ CHẶN**.
    - Quản lý Server/User/Settings: **BỊ CHẶN** (Không thấy menu).
- **Kỹ thuật**:
    - Cập nhật Prisma Schema.
    - Cập nhật Middleware bảo vệ route.
    - Cập nhật API xử lý xóa proxy.

## 3. Các bước thực hiện
1. Cập nhật `schema.prisma` và chạy `npx prisma db push`.
2. Cập nhật `globals.css` để thay đổi phong cách tổng thể.
3. Cập nhật Layout Sidebar để ẩn/hiện menu theo quyền.
4. Cập nhật Logic trong Proxy List để ẩn nút Xóa.
5. Cập nhật API Route để chặn xóa từ phía server.

---
**Bạn hãy phản hồi "OK" hoặc "Duyệt" để tôi bắt đầu thực hiện nhé!**
