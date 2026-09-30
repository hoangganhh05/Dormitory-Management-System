# BÁO CÁO NGHIỆM THU TÁC VỤ KTX-026

## TÊN TÁC VỤ: Quản lý Yêu cầu sửa chữa thiết bị & Báo hỏng cơ sở vật chất
- **Mã công việc:** `KTX-026`
- **Thuộc Epic:** `EPIC C — Chức năng quản lý KTX` (Nhiệm vụ cuối cùng của Epic C)
- **Nhánh thực hiện:** `task/KTX-026-maintenance-management`
- **Tiêu chuẩn thiết kế:** Global Skill `spartan-ui-expert` (Angular 19 Standalone + Spartan UI primitives + Tailwind CSS Enterprise B2B SaaS, triệt để tuân thủ Anti-AI Slop).

---

## 1. Mục tiêu & Tiêu chí nghiệm thu (Acceptance Criteria)
Theo tài liệu phân rã dự án:
> **Tiêu chí:** *"Xác nhận rõ yêu cầu và dữ liệu cần quản lý; tiếp nhận, phân loại mức độ khẩn cấp, điều phối kỹ thuật và phản hồi tiến độ khắc phục sự cố minh bạch đến sinh viên"*.

### Phạm vi luồng nghiệp vụ triển khai:
1. **Phía Sinh viên (Client Portal):**
   - Biểu mẫu báo hỏng trang thiết bị trực tuyến:
     - Tự động điền số phòng nội trú của sinh viên đang đăng nhập.
     - Lựa chọn danh mục sự cố (Điện & Quạt, Cấp thoát nước, Khóa & Cửa sổ, Điều hòa nhiệt độ, Giường tủ nội thất).
     - Phân loại mức độ khẩn cấp: Thấp (`LOW`), Bình thường (`MEDIUM`), Khẩn cấp (`HIGH`).
     - Nhập tiêu đề và mô tả chi tiết hiện trạng hỏng hóc.
   - Bảng theo dõi tiến độ khắc phục cá nhân:
     - Xem lịch sử các phiếu báo hỏng của chính mình hoặc của phòng mình (`getMyRequests`).
     - Theo dõi trạng thái thời gian thực: `Chờ tiếp nhận`, `Đang sửa chữa`, `Đã khắc phục`, `Đã từ chối`.
     - Nhận phản hồi kỹ thuật và ghi chú nghiệm thu trực tiếp từ Ban Quản lý KTX.

2. **Phía Ban Quản lý KTX (Admin Portal):**
   - Bảng điều khiển quản lý và điều phối sửa chữa toàn diện:
     - Thống kê 4 chỉ số KPIs: Tổng số sự cố, Chờ tiếp nhận (`PENDING`), Đang sửa chữa (`PROCESSING`), Đã khắc phục hoàn tất (`RESOLVED`).
     - Thanh Tabs lọc nhanh theo trạng thái (`Tất cả`, `Chờ tiếp nhận`, `Đang sửa chữa`, `Đã khắc phục`, `Đã từ chối`, `Khẩn cấp`).
     - Bộ lọc đa chiều theo mức độ khẩn cấp (`LOW`, `MEDIUM`, `HIGH`), Tòa nhà (`Tòa A`, `Tòa B`), và ô tìm kiếm toàn văn (theo Tên SV, Mã SV, Số phòng, Nội dung).
   - Quy trình Tiếp nhận & Cập nhật tiến độ:
     - Modal xử lý nghiệp vụ chuẩn B2B SaaS: Tiếp nhận phiếu, chuyển trạng thái sang `PROCESSING`, phân công thợ kỹ thuật, nhập phản hồi tiến độ.
     - Nghiệm thu hoàn tất: Chuyển trạng thái sang `RESOLVED`, ghi nhận vật tư đã thay thế (bóng đèn, công tắc, vòi nước...) và thông báo đến sinh viên.
     - Chức năng xóa phiếu rác/báo nhầm bảo vệ cơ sở dữ liệu.

---

## 2. Chi tiết kỹ thuật & Kiến trúc mã nguồn

### 2.1. CSDL & Prisma ORM (`MySQL 8.4 + Prisma 6.19`)
- **Enums:**
  - `UrgencyLevel`: `LOW`, `MEDIUM`, `HIGH`.
  - `MaintenanceStatus`: `PENDING`, `PROCESSING`, `RESOLVED`, `REJECTED`.
- **Model `MaintenanceRequest`:**
  - Liên kết quan hệ chặt chẽ: `room` $\leftrightarrow$ `Room`, `user` $\leftrightarrow$ `User`.
  - Lưu trữ: `id`, `title`, `description`, `urgency`, `status`, `adminFeedback`, `createdAt`, `updatedAt`.

### 2.2. Backend API (Express + Prisma)
- **Controller:** [`backend/src/controllers/maintenance.controller.ts`](file:///e:/Dormitory-Management-System/backend/src/controllers/maintenance.controller.ts)
- **Routes:** [`backend/src/routes/maintenance.routes.ts`](file:///e:/Dormitory-Management-System/backend/src/routes/maintenance.routes.ts) mounted tại `/api/maintenance`
- **Endpoints:**
  - `GET /api/maintenance/stats`: Thống kê KPIs bảo trì cho Admin Dashboard.
  - `GET /api/maintenance/my`: Lấy danh sách phiếu báo hỏng của sinh viên đang đăng nhập.
  - `GET /api/maintenance`: Lấy danh sách toàn bộ phiếu báo hỏng có phân trang, tìm kiếm và lọc.
  - `GET /api/maintenance/:id`: Xem chi tiết một phiếu báo hỏng.
  - `POST /api/maintenance`: Tạo mới phiếu báo hỏng (Client).
  - `PATCH /api/maintenance/:id/status`: Cập nhật trạng thái và phản hồi kỹ thuật (Admin).
  - `DELETE /api/maintenance/:id`: Xóa phiếu báo hỏng (Admin).

### 2.3. Frontend UI (`Spartan UI + Tailwind CSS Anti-AI Slop`)
- **Admin Portal:** [`frontend/src/app/features/admin/admin-maintenance/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/admin/admin-maintenance/)
  - **4 KPI Metrics Cards:** Tổng sự cố, Chờ tiếp nhận, Đang sửa chữa, Đã khắc phục.
  - **Filter Toolbar:** Tabs trạng thái, ô tìm kiếm thời gian thực, bộ lọc mức độ và tòa nhà.
  - **Data Table:** Cột mã số, phòng & tòa nhà, sinh viên, chi tiết sự cố, mức độ khẩn cấp, trạng thái, phản hồi kỹ thuật, ngày báo, cụm nút thao tác.
  - **Modal Tiếp nhận & Xử lý:** Cập nhật trạng thái xử lý và gửi phản hồi kỹ thuật trực tiếp đến sinh viên.
- **Client Portal:** [`frontend/src/app/features/client/client-maintenance/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/client/client-maintenance/)
  - Biểu mẫu nộp đơn báo hỏng nhanh, validation rõ ràng.
  - Lịch sử báo hỏng của sinh viên tải đúng dữ liệu cá nhân qua `getMyRequests`.
  - Hiển thị phản hồi từ Ban Quản trị minh bạch (`feedback-box`).

---

## 3. Kết quả Kiểm thử & Biên dịch

### 3.1. Frontend Build Verification
- Thực thi: `npm run build` tại thư mục `frontend/`.
- Kết quả: **Khởi tạo và biên dịch thành công (Exit Code: 0)**, không có bất kỳ lỗi template hay type error nào.
  ```text
  Initial chunk files | Names   | Raw size  | Estimated transfer size
  main-NXM3ETLZ.js    | main    | 734.99 kB | 143.41 kB
  styles-7A2YJ6EE.css | styles  | 971 bytes | 971 bytes
  Application bundle generation complete. [26.757 seconds]
  ```

### 3.2. Backend Integration Test Suite
Thực thi kịch bản kiểm thử API tích hợp độc lập:
1. **Sinh viên gửi yêu cầu báo hỏng:** Trạng thái `HTTP 201 Created` $\rightarrow$ Khởi tạo yêu cầu #2 (Hỏng bóng đèn tuýp LED) tại Phòng B101.
2. **Sinh viên xem danh sách cá nhân:** Trạng thái `HTTP 200 OK` $\rightarrow$ Tải chính xác danh sách yêu cầu của sinh viên.
3. **Admin xem thống kê KPIs:** Trạng thái `HTTP 200 OK` $\rightarrow$ Số liệu tính toán chính xác (`pending: 2`, `highUrgency: 2`).
4. **Admin tiếp nhận xử lý:** Chuyển trạng thái sang `PROCESSING` kèm phản hồi kỹ thuật $\rightarrow$ `HTTP 200 OK`.
5. **Admin hoàn tất khắc phục:** Chuyển trạng thái sang `RESOLVED` kèm ghi chú nghiệm thu $\rightarrow$ `HTTP 200 OK`.
6. **Sinh viên nhận phản hồi:** Hiển thị trực tiếp phản hồi kỹ thuật từ BQL trên tài khoản sinh viên.

---

## 4. Kết luận & Kế hoạch tiếp theo
- Tác vụ **`KTX-026: Quản lý Yêu cầu sửa chữa thiết bị & Báo hỏng cơ sở vật chất`** đã hoàn thành 100% các tiêu chí nghiệm thu đề ra.
- Toàn bộ **EPIC C — Chức năng quản lý KTX** (`KTX-020` đến `KTX-026`) đã chính thức hoàn tất toàn diện!
- Sẵn sàng bàn giao và tạo Pull Request vào nhánh `develop`.
- **Chặng tiếp theo:** Bắt đầu bước sang **EPIC D — Nghiên cứu và tích hợp AI Gemini** (`KTX-030: Tìm hiểu khả năng và cách tích hợp Gemini`).
