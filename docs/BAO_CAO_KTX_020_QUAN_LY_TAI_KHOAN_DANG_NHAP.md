# BÁO CÁO NGHIỆM THU TASK KTX-020
## QUẢN LÝ TÀI KHOẢN VÀ ĐĂNG NHẬP (ÁP DỤNG SPARTAN UI & ANTI-AI SLOP)

* **Mã task:** KTX-020
* **Tên task:** Quản lý tài khoản và đăng nhập
* **Thuộc Epic:** EPIC C --- Chức năng quản lý KTX (cần xác nhận nghiệp vụ)
* **Người thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy
* **Tiêu chuẩn thiết kế:** Áp dụng Global Skill **`spartan-ui-expert`** (Angular + Spartan UI + Tailwind CSS chuẩn Enterprise B2B SaaS, tuân thủ nghiêm ngặt nguyên tắc **Anti-AI Slop: Tuyệt đối không dùng gradient tím hồng neon, không phát sáng lòe loẹt, không bo tròn bong bóng**).

---

### 1. Tiêu chí chấp nhận theo Backlog (Acceptance Criteria)

| Tiêu chí trong Backlog | Hiện trạng triển khai thực tế trên Hệ thống | Đánh giá |
| :--- | :--- | :---: |
| **Quy trình đăng nhập (Login)** | - Hỗ trợ đăng nhập linh hoạt bằng cả **Email** hoặc **Mã sinh viên (MSSV)**.<br>- Phân luồng vai trò: Sinh viên (`STUDENT`) và Ban Quản trị (`ADMIN`).<br>- Backend xác thực mật khẩu băm chuẩn `bcrypt` và ký `JWT Token` (hạn 7 ngày).<br>- Tự động điều hướng theo quyền: Admin vào `/admin/dashboard`, Sinh viên vào `/client/dashboard`.<br>- Tích hợp các nút **"Tài khoản trải nghiệm mẫu"** (Quick Demo Fill) hỗ trợ kiểm thử nhanh. |  **ĐẠT** |
| **Quy trình đăng xuất (Logout)** | - Xóa sạch JWT Token và User profile khỏi `localStorage`.<br>- Đặt lại trạng thái Signals trong `AuthService` (`currentUser.set(null)`).<br>- Tự động điều hướng người dùng về trang đăng nhập `/login`.<br>- Tích hợp nút Đăng xuất trên cả Topbar Cổng Sinh viên và Topbar Ban Quản trị. |  **ĐẠT** |
| **Khôi phục / Đổi mật khẩu** | - Chức năng **Quên mật khẩu** (`POST /api/auth/forgot-password`): Kiểm tra thông tin định danh và cấp mật khẩu tạm thời an toàn (`ktx123456`).<br>- Chức năng **Đổi mật khẩu** (`POST /api/auth/change-password`): Yêu cầu mật khẩu cũ, kiểm tra độ an toàn tối thiểu 6 ký tự và cập nhật mật khẩu mới băm bằng bcrypt vào MySQL. |  **ĐẠT** |
| **Bảo vệ tuyến đường & Xác thực (Security)** | - Xây dựng `adminGuard` ngăn chặn sinh viên hoặc người chưa đăng nhập truy cập trái phép khu vực Quản trị.<br>- Xây dựng `authInterceptor` tự động đính kèm tiêu đề HTTP `Authorization: Bearer <token>` vào tất cả các yêu cầu API. |  **ĐẠT** |

---

### 2. Thiết kế Giao diện theo Chuẩn Spartan UI & Anti-AI Slop

Tuân thủ nghiêm ngặt các quy định trong Global Skill `spartan-ui-expert`:
1. **Loại bỏ hoàn toàn AI Slop:** Không có background gradient tím/hồng neon, không có viền phát sáng (glowing shadows), không dùng emoji thay thế icon hệ thống.
2. **Bảng màu trung tính Enterprise:** Nền Slate (`#f8fafc`), bề mặt thẻ Card màu trắng sắc nét, viền 1px tinh tế (`border: 1px solid #e2e8f0`), shadow vật lý siêu nhẹ (`shadow-sm`).
3. **Mật độ thông tin & Nhãn chuẩn B2B:** Thẻ nhãn in hoa nhỏ gọn (`font-size: 11px`, `letter-spacing: 0.05em`), ô nhập liệu có phản hồi Focus Ring đen than (`#0f172a`), icon ẩn/hiện mật khẩu dạng SVG vector chuyên nghiệp.
4. **Kiến trúc mã nguồn chuẩn:** Tạo tiện ích `hlm()` (`frontend/src/app/shared/utils/hlm.ts`) kết hợp `clsx` và `tailwind-merge`.

---

### 3. Cấu trúc mã nguồn hoàn thiện

```text
backend/src/
├── controllers/
│   └── auth.controller.ts              # API Login, GetMe, ChangePassword, ForgotPassword
└── routes/
    └── auth.routes.ts                  # /api/auth/* endpoints

frontend/src/app/
├── core/
│   ├── models/
│   │   └── auth.model.ts               # AuthUser, LoginResponse, ChangePasswordDto
│   ├── services/
│   │   └── auth.service.ts             # Quản lý state đăng nhập, JWT, signals
│   ├── guards/
│   │   └── auth.guard.ts               # adminGuard, authGuard
│   └── interceptors/
│       └── auth.interceptor.ts         # Bearer token HTTP Interceptor
├── shared/
│   └── utils/
│       └── hlm.ts                      # Spartan UI Class Utility
└── features/
    └── auth/
        └── login/
            ├── login.component.ts      # Component đăng nhập phân quyền
            ├── login.component.html    # Giao diện B2B tối giản, sắc nét
            └── login.component.css     # CSS chuẩn Spartan UI (Anti-AI Slop)
```

---

### 4. Kết quả kiểm thử biên dịch và vận hành
- **Backend API:** Biên dịch TypeScript (`tsc`) thành công 100%. Các kịch bản đăng nhập tài khoản Sinh viên (`DTC235200050`) và Ban Quản lý (`admin@dormitory.com`) đã được kiểm thử trực tiếp bằng HTTP request thành công.
- **Frontend Angular:** Biên dịch Production (`ng build`) thành công 100%, bảo toàn các tiêu chuẩn và tương thích với CI GitHub Actions.
