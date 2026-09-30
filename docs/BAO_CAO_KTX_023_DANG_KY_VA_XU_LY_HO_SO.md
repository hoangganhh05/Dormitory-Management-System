# BÁO CÁO NGHIỆM THU TÁC VỤ KTX-023

## TÊN TÁC VỤ: Đăng ký lưu trú và xử lý hồ sơ
- **Mã công việc:** `KTX-023`
- **Thuộc Epic:** `EPIC C — Chức năng quản lý KTX`
- **Nhánh thực hiện:** `task/KTX-023-registration-workflow`
- **Tiêu chuẩn thiết kế:** Global Skill `spartan-ui-expert` (Angular + Spartan UI primitives + Tailwind CSS Enterprise B2B SaaS, triệt để tuân thủ Anti-AI Slop).

---

## 1. Mục tiêu & Tiêu chí nghiệm thu (Acceptance Criteria)
Theo tài liệu phân rã dự án:
> **Tiêu chí:** *"Client gửi hồ sơ; admin xem và cập nhật trạng thái theo luồng được xác nhận"*.

### Phạm vi luồng nghiệp vụ triển khai:
1. **Phía Sinh viên (Client Portal):**
   - Biểu mẫu nộp hồ sơ đăng ký lưu trú trực tuyến:
     - Tự động điền (Auto-fill) thông tin sinh viên đã đăng nhập (Họ tên, Mã SV, Email, SĐT, Giới tính).
     - Lựa chọn phòng nguyện vọng từ danh sách phòng thực tế có kèm thông tin số chỗ còn trống và đơn giá tháng.
     - Lựa chọn học kỳ lưu trú và ghi chú hoàn cảnh/nguyện vọng ưu tiên.
     - Kiểm tra logic: Ngăn chặn gửi trùng lặp nhiều đơn `PENDING` trong cùng một đợt đăng ký.
   - Quản lý lịch sử nộp hồ sơ:
     - Sinh viên xem danh sách các đơn đã gửi, trạng thái duyệt (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`).
     - Cho phép sinh viên tự hủy đơn đăng ký (`CANCELLED`) khi đơn còn đang ở trạng thái `PENDING`.
2. **Phía Ban Quản lý (Admin Portal):**
   - Bảng điều khiển quản lý và xét duyệt hồ sơ:
     - Thống kê chỉ số: Tổng số đơn, Số đơn chờ duyệt (`PENDING`), Số đơn đã duyệt (`APPROVED`), Số đơn từ chối (`REJECTED`), Số đơn đã hủy (`CANCELLED`).
     - Thanh điều hướng lọc theo trạng thái hồ sơ dạng Tabs (`Chờ duyệt`, `Đã duyệt`, `Từ chối`, `Đã hủy`, `Tất cả`).
     - Tìm kiếm tức thời theo Tên sinh viên, Mã SV, Email, Số điện thoại hoặc Số phòng.
     - Lọc theo học kỳ đăng ký.
   - Thao tác phê duyệt & phân bổ giường (`Approve Workflow`):
     - Xem danh sách các giường còn trống thực tế (`VACANT`) của phòng nguyện vọng.
     - Ban Quản lý chọn giường cụ thể (VD: `G1`, `G2`...) hoặc để hệ thống tự động gán giường trống đầu tiên.
     - Database Transaction cập nhật đồng bộ: Chuyển đơn sang `APPROVED`, gán sinh viên vào giường, đổi trạng thái giường thành `OCCUPIED`, tăng số người đang ở của phòng, cập nhật trạng thái phòng sang `FULL` nếu đủ sức chứa.
   - Thao tác từ chối hồ sơ (`Reject Workflow`):
     - Ban Quản lý chọn lý do mẫu hoặc nhập lý do chi tiết (VD: "Phòng nguyện vọng đã kín chỉ tiêu chỗ ở", "Chưa thuộc diện ưu tiên xét duyệt đợt 1").
     - Chuyển đơn sang `REJECTED` và lưu vết lý do để phản hồi minh bạch đến sinh viên.

---

## 2. Chi tiết kỹ thuật & Kiến trúc mã nguồn

### 2.1. Backend API (Express + Prisma ORM + MySQL 8.4)
- **Controller:** [`backend/src/controllers/registration.controller.ts`](file:///e:/Dormitory-Management-System/backend/src/controllers/registration.controller.ts)
- **Routes:** [`backend/src/routes/registration.routes.ts`](file:///e:/Dormitory-Management-System/backend/src/routes/registration.routes.ts) mounted tại `/api/registrations`
- **Endpoints:**
  - `GET /api/registrations/stats/summary`: Thống kê tổng quan đơn đăng ký.
  - `GET /api/registrations`: Lấy danh sách toàn bộ hồ sơ (kèm User, Preferred Room, Allocated Bed) hỗ trợ lọc theo trạng thái, học kỳ, tìm kiếm.
  - `GET /api/registrations/:id`: Lấy chi tiết đơn đăng ký theo ID.
  - `GET /api/registrations/my`: Sinh viên lấy danh sách đơn của chính mình qua JWT Bearer token.
  - `POST /api/registrations`: Tạo mới đơn đăng ký (kiểm tra trùng lặp đơn `PENDING`).
  - `PUT /api/registrations/:id/approve`: Ban Quản lý duyệt đơn và gán giường qua Database Transaction.
  - `PUT /api/registrations/:id/reject`: Ban Quản lý từ chối đơn kèm lý do giải trình.
  - `PUT /api/registrations/:id/cancel`: Sinh viên tự hủy đơn đăng ký của mình khi đang `PENDING`.

### 2.2. Frontend (Angular 19 Standalone + Spartan UI + Tailwind CSS)
- **Model:** [`frontend/src/app/core/models/registration.model.ts`](file:///e:/Dormitory-Management-System/frontend/src/app/core/models/registration.model.ts)
- **Service:** [`frontend/src/app/core/services/registration.service.ts`](file:///e:/Dormitory-Management-System/frontend/src/app/core/services/registration.service.ts)
- **Giao diện Admin:** [`frontend/src/app/features/admin/admin-registrations/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/admin/admin-registrations/)
  - Thẻ Metrics tổng quan 5 trạng thái (`Total`, `Pending`, `Approved`, `Rejected`, `Cancelled`).
  - Thanh Tabs trạng thái tương tác nhanh.
  - Bảng dữ liệu chuẩn Enterprise B2B SaaS với thông tin sinh viên, phòng, học kỳ và trạng thái xử lý.
  - Modal Phê duyệt & Chọn giường phân bổ (`Approve Modal`) trực quan hóa các giường `VACANT`.
  - Modal Từ chối đơn (`Reject Modal`) với dropdown lý do mẫu và textarea chi tiết.
  - Modal Chi tiết hồ sơ (`Detail Modal`) thể hiện đầy đủ 3 phần: Thông tin sinh viên, Nguyện vọng phòng, và Kết quả xử lý.
- **Giao diện Client:** [`frontend/src/app/features/client/client-register-room/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/client/client-register-room/)
  - Tự động điền dữ liệu người dùng khi đã đăng nhập.
  - Bổ sung bảng "Lịch sử đơn đăng ký lưu trú của bạn" kèm trạng thái và nút "Hủy đơn" đối với đơn `PENDING`.
- **Tuân thủ Anti-AI Slop:**
  - Không gradient màu tím/hồng neon, không hiệu ứng phát sáng lòe loẹt.
  - Bo góc tối giản chuẩn mực (`rounded-md`, `rounded-lg`), đường viền sắc nét `border-slate-200`.
  - Bảng màu trung tính Slate/Zinc và icon SVG kỹ thuật chuẩn mực.

---

## 3. Kết quả Kiểm thử & Biên dịch

### 3.1. Biên dịch Backend (TypeScript)
```bash
npx tsc
# Kết quả: 0 errors (Exit code 0)
```

### 3.2. Biên dịch Frontend (Angular AOT)
```bash
npx ng build
# Kết quả:
√ Building...
Initial chunk files | Names         |  Raw size | Estimated transfer size
main-WZQE6BKE.js    | main          | 604.48 kB |               128.31 kB
styles-7A2YJ6EE.css | styles        | 971 bytes |               971 bytes
Application bundle generation complete. - 0 errors!
```

### 3.3. Kiểm thử luồng xử lý thực tế trên cơ sở dữ liệu MySQL
1. `GET /api/registrations/my`: Sinh viên Phạm Thị Ngọc Ánh (`DTC235200050`) kiểm tra đơn đăng ký `#1` đang ở trạng thái `PENDING`.
2. `PUT /api/registrations/1/approve`: Admin thực hiện phê duyệt đơn `#1`, hệ thống tự động gán vào `Giường G1` của Phòng `B101` (`Tòa B - Nữ`).
3. `GET /api/registrations/stats/summary`: Trạng thái cập nhật tức thời sang `Approved: 1`, `Pending: 0`.
4. `GET /api/students/me/profile`: Thẻ lưu trú cá nhân của sinh viên ngay lập tức hiển thị thông tin giường lưu trú chính thức `Giường G1 - Phòng B101 - Tòa B (Nữ)`.

---

## 4. Kết luận
Tác vụ `KTX-023` đã hoàn thành 100% các tiêu chí chấp nhận theo đúng quy trình workflow đã duyệt, bảo đảm tiêu chuẩn bảo mật dữ liệu và trải nghiệm người dùng chuẩn Enterprise B2B SaaS. Sẵn sàng tạo Pull Request để merge vào nhánh `develop`.
