# BÁO CÁO NGHIỆM THU TASK KTX-011
## XÂY DỰNG BỘ KHUNG GIAO DIỆN CLIENT (ANGULAR)

* **Mã task:** KTX-011
* **Tên task:** Xây dựng bộ khung giao diện client
* **Thuộc Epic:** EPIC B --- Giao diện client và admin
* **Người thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

### 1. Tiêu chí chấp nhận theo Backlog (Acceptance Criteria)

| Tiêu chí trong Backlog | Hiện trạng triển khai thực tế trên Angular | Đánh giá |
| :--- | :--- | :---: |
| **Có điều hướng (Navigation)** | - Xây dựng Navbar cố định (`ClientLayoutComponent`) với logo KTX, tên trường ICTU, avatar sinh viên.<br>- Tích hợp đầy đủ các liên kết điều hướng: `/client/dashboard`, `/client/rooms`, `/client/register-room`, `/client/maintenance`.<br>- Tích hợp thuộc tính `routerLinkActive="active"` đánh dấu trực quan trang đang truy cập.<br>- Tích hợp Mobile Hamburger Drawer cho màn hình điện thoại/máy tính bảng. |  **ĐẠT** |
| **Bố cục nhất quán (Consistent Layout)** | - Cấu trúc Layout chuẩn hóa 4 phần: Sticky Navbar $\rightarrow$ Hero Section / Dashboard $\rightarrow$ Main `<router-outlet>` $\rightarrow$ Footer liên hệ khẩn cấp 24/7.<br>- Tích hợp nút bong bóng nổi Trợ lý AI Gemini (`floating-ai-widget`) góc phải màn hình.<br>- Thống nhất hệ thống màu sắc chủ đạo qua CSS Custom Properties: Xanh dương công nghệ (`#2563eb`), bề mặt thẻ trắng (`#ffffff`), nền xám dịu (`#f8fafc`). |  **ĐẠT** |
| **Hiển thị phù hợp trên màn hình phổ biến (Responsive)** | - Sử dụng CSS Flexbox & CSS Grid linh hoạt với breakpoint `@media (max-width: 900px)` và `@media (max-width: 768px)`.<br>- Tự động co giãn bố cục dạng lưới 4 cột (Desktop) $\rightarrow$ 2 cột (Tablet) $\rightarrow$ 1 cột (Mobile).<br>- Tự động ẩn thanh menu ngang và kích hoạt Drawer trượt trên màn hình nhỏ. |  **ĐẠT** |

---

### 2. Các thành phần mã nguồn đã hoàn thiện

```text
frontend/src/app/
├── features/client/
│   ├── client-layout/                 # Component vỏ bọc bố cục Client
│   │   ├── client-layout.component.ts
│   │   ├── client-layout.component.html
│   │   └── client-layout.component.css
│   ├── client-home/                   # Dashboard trang chủ sinh viên
│   │   ├── client-home.component.ts
│   │   ├── client-home.component.html
│   │   └── client-home.component.css
│   ├── client-rooms/                  # Tra cứu phòng (Placeholder)
│   ├── client-register-room/          # Đăng ký lưu trú (Placeholder)
│   └── client-maintenance/            # Báo hỏng thiết bị (Placeholder)
├── app.routes.ts                      # Cấu hình định tuyến Angular
└── styles.css                         # Bộ biến màu & reset CSS toàn cục
```

---

### 3. Kết quả kiểm thử biên dịch
- Đã chạy lệnh `npm run build` (Angular Production Build): **Biên dịch thành công 100% không phát sinh bất kỳ lỗi cú pháp hoặc TypeScript nào**, đảm bảo vượt qua bài kiểm tra GitHub Actions CI.
