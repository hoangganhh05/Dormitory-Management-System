# BÁO CÁO NGHIỆM THU TÁC VỤ KTX-021

## TÊN TÁC VỤ: Quản lý hồ sơ người lưu trú
- **Mã công việc:** `KTX-021`
- **Thuộc Epic:** `EPIC C — Chức năng quản lý KTX`
- **Nhánh thực hiện:** `task/KTX-021-resident-profiles`
- **Tiêu chuẩn thiết kế:** Global Skill `spartan-ui-expert` (Angular + Spartan UI primitives + Tailwind CSS Enterprise B2B SaaS, triệt để tuân thủ Anti-AI Slop).

---

## 1. Mục tiêu & Tiêu chí nghiệm thu (Acceptance Criteria)
Theo tài liệu phân rã dự án:
> **Tiêu chí:** *"Admin tạo/xem/cập nhật hồ sơ theo trường dữ liệu đã duyệt; client chỉ xem dữ liệu được phép"*.

### Phạm vi triển khai:
1. **Phía Quản trị viên (Admin Portal):**
   - Xem toàn bộ danh sách hồ sơ sinh viên lưu trú trong hệ thống.
   - Thống kê nhanh: Tổng số sinh viên, số sinh viên đã bố trí phòng (`HOUSED`), số sinh viên chưa xếp phòng (`UNASSIGNED`).
   - Lọc đa chiều: Lọc theo tình trạng lưu trú, lọc theo giới tính, tìm kiếm tức thời theo Tên / Mã sinh viên / Email / Số điện thoại.
   - Tạo mới hồ sơ sinh viên lưu trú kèm tự động hash mật khẩu an toàn (`bcrypt`).
   - Xem chi tiết hồ sơ: Dữ liệu cá nhân, vị trí giường lưu trú hiện tại, lịch sử 5 đơn đăng ký gần nhất và 5 yêu cầu báo hỏng gần nhất.
   - Chỉnh sửa thông tin hồ sơ sinh viên (Họ tên, Mã sinh viên, Email, Số điện thoại, Giới tính).
2. **Phía Sinh viên (Client Portal):**
   - Chỉ xem dữ liệu cá nhân được phép (Personal Privacy Protection): Thông tin định danh chính chủ, tình trạng lưu trú, thẻ KTX điện tử (Tòa nhà, Tầng, Số phòng, Vị trí giường).
   - Tự cập nhật số điện thoại liên lạc cá nhân phục vụ công tác liên lạc khẩn cấp từ Ban Quản lý KTX.
   - Lịch sử đăng ký lưu trú cá nhân và trạng thái xét duyệt của từng đơn.

---

## 2. Chi tiết kỹ thuật & Kiến trúc mã nguồn

### 2.1. Backend API (Express + Prisma ORM + MySQL)
- Controller: `backend/src/controllers/student.controller.ts`
- Routes: `backend/src/routes/student.routes.ts` mounted tại `/api/students`
- Endpoints:
  - `GET /api/students`: Lấy danh sách hồ sơ sinh viên (hỗ trợ query `search`, `gender`, `status`).
  - `GET /api/students/:id`: Lấy chi tiết hồ sơ sinh viên theo ID (kèm giường lưu trú, lịch sử đăng ký, báo hỏng).
  - `POST /api/students`: Tạo mới hồ sơ sinh viên lưu trú.
  - `PUT /api/students/:id`: Admin cập nhật hồ sơ sinh viên.
  - `GET /api/students/me/profile`: Client lấy hồ sơ của chính mình thông qua JWT Bearer token đã giải mã (`decoded.id`).
  - `PUT /api/students/me/profile`: Client cập nhật số điện thoại cá nhân.

### 2.2. Frontend (Angular 19 Standalone + Spartan UI + Tailwind CSS)
- **Model:** `frontend/src/app/core/models/student.model.ts`
- **Service:** `frontend/src/app/core/services/student.service.ts`
- **Màn hình Admin:** `frontend/src/app/features/admin/admin-students/`
  - Bảng dữ liệu mật độ cao chuẩn Enterprise B2B SaaS.
  - Header actions: Nút "+ Tạo hồ sơ mới", thanh tìm kiếm đa năng, bộ lọc Dropdown theo giới tính và tình trạng xếp phòng.
  - Modal tạo mới hồ sơ sinh viên với form validation đầy đủ.
  - Modal xem chi tiết và Modal cập nhật thông tin sắc nét.
- **Màn hình Client:** `frontend/src/app/features/client/client-profile/`
  - Thẻ định danh sinh viên (Digital Identity Card) hiển thị Mã SV, Email, Giới tính, SĐT.
  - Thẻ Lưu trú Ký túc xá (Accommodation Card) trực quan hiển thị thông tin Phòng, Tầng, Tòa nhà, Giường và Chi phí lưu trú.
  - Form chỉnh sửa nhanh số điện thoại cá nhân (Inline edit with validation).
  - Bảng lịch sử đăng ký lưu trú gần nhất kèm các Badge trạng thái (`PENDING`, `APPROVED`, `REJECTED`).
- **Tuân thủ quy tắc Anti-AI Slop:**
  - Không sử dụng gradient màu tím hồng neon.
  - Không hiệu ứng bóng đổ lòe loẹt (`glow halo`).
  - Bo góc tối giản và đồng nhất (`rounded-md`, `rounded-lg`).
  - Đường viền phân cách sắc nét `border-slate-200`.
  - Icon SVG chuẩn đồ họa kỹ thuật thay vì lạm dụng emoji.

---

## 3. Kết quả Kiểm thử & Biên dịch

### 3.1. Biên dịch Backend (TypeScript)
```bash
npm run build
# Kết quả: 0 lỗi biên dịch (Exit code 0)
```

### 3.2. Biên dịch Frontend (Angular AOT)
```bash
npx ng build
# Kết quả:
√ Building...
Initial chunk files | Names         |  Raw size | Estimated transfer size
main-IVV7YCF3.js    | main          | 518.99 kB |               117.46 kB
styles-7A2YJ6EE.css | styles        | 971 bytes |               971 bytes
Application bundle generation complete. - 0 errors!
```

### 3.3. Kiểm thử API thực tế với cơ sở dữ liệu MySQL
1. `GET /api/students`: Trả về danh sách sinh viên cùng thông tin phòng/giường thành công.
2. `POST /api/auth/login`: Xác thực tài khoản sinh viên `DTC235200050` trả về JWT token hợp lệ.
3. `GET /api/students/me/profile`: Sinh viên truy xuất thông tin cá nhân chính xác theo token; không truy cập được dữ liệu của sinh viên khác.
4. `PUT /api/students/me/profile`: Cập nhật số điện thoại `0967862569` thành công.

---

## 4. Kết luận
Tác vụ `KTX-021` đã hoàn thành 100% các tiêu chí chấp nhận đã duyệt, bảo đảm tiêu chuẩn phân quyền chặt chẽ giữa Admin và Client, ứng dụng triệt để Global Skill `spartan-ui-expert` chuẩn Enterprise B2B SaaS. Sẵn sàng tạo Pull Request để merge vào nhánh `develop`.
