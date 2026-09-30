# BÁO CÁO NGHIỆM THU TÁC VỤ KTX-025

## TÊN TÁC VỤ: Tra cứu thông tin và thông báo
- **Mã công việc:** `KTX-025`
- **Thuộc Epic:** `EPIC C — Chức năng quản lý KTX`
- **Nhánh thực hiện:** `task/KTX-025-announcements-notifications`
- **Tiêu chuẩn thiết kế:** Global Skill `spartan-ui-expert` (Angular 19 Standalone + Spartan UI primitives + Tailwind CSS Enterprise B2B SaaS, triệt để tuân thủ Anti-AI Slop).

---

## 1. Mục tiêu & Tiêu chí nghiệm thu (Acceptance Criteria)
Theo tài liệu phân rã dự án:
> **Tiêu chí:** *"Nội dung, đối tượng nhận và quyền xem được thống nhất; người dùng chỉ thấy nội dung phù hợp"*.

### Phạm vi luồng nghiệp vụ triển khai:
1. **Phân loại & Định danh thông báo toàn diện:**
   - **Chuyên mục (Category):** `GENERAL` (Tin tức chung / Hoạt động), `URGENT` (Khẩn cấp: PCCC, thời tiết, sự cố điện nước), `REGULATION` (Nội quy KTX / Quy định sinh hoạt), `FINANCE` (Tài chính: Tiền phòng, điện nước, lệ phí), `MAINTENANCE` (Lịch bảo trì thiết bị, cơ sở hạ tầng), `EVENT` (Phong trào, sự kiện).
   - **Mức độ ưu tiên (Priority):** `NORMAL` (Bình thường), `IMPORTANT` (Quan trọng), `URGENT` (Khẩn cấp).
   - **Trạng thái xuất bản (Status):** `PUBLISHED` (Đã phát hành), `DRAFT` (Bản nháp), `ARCHIVED` (Lưu trữ cũ).
   - **Ghim nổi bật (Pinned):** Cờ `isPinned` đưa thông báo lên vị trí đầu tiên của bảng tin.

2. **Cơ chế Phân luồng Đối tượng nhận & Bảo vệ Quyền xem (Audience Segmentation & Visibility Guard):**
   - **Khách vãng lai / Người dùng chưa đăng nhập:**
     - Chỉ được xem các thông báo công khai có `targetRole = 'ALL'`, `status = 'PUBLISHED'` và không giới hạn tòa (`targetBuilding = null`).
   - **Sinh viên nội trú (`Role: STUDENT`):**
     - Xem được thông báo có `targetRole IN ['ALL', 'STUDENT']` và `status = 'PUBLISHED'`.
     - Phân quyền theo Tòa nhà: Sinh viên chỉ xem được thông báo áp dụng chung cho mọi tòa HOẶC thông báo riêng gửi tới Tòa nhà mà sinh viên đang lưu trú (`User.occupiedBed.room.building`).
     - **Tuyệt đối không xem được** thông báo nội bộ của Ban Quản lý (`targetRole = 'ADMIN'`).
     - Ngăn chặn triệt để hành vi truy cập trái phép bằng cách gõ trực tiếp ID trên URL (API trả về `403 Forbidden`).
   - **Ban Quản lý KTX (`Role: ADMIN`):**
     - Toàn quyền xem, tìm kiếm, lọc tất cả thông báo thuộc mọi đối tượng, trạng thái (kể cả bản nháp `DRAFT` và lưu trữ `ARCHIVED`).
     - Toàn quyền soạn thảo, chỉnh sửa, ghim/bỏ ghim, và xóa thông báo.

3. **Tra cứu thông tin & Tương tác người dùng (Search & User Engagement):**
   - Tìm kiếm toàn văn theo tiêu đề, tóm tắt và nội dung.
   - Bộ lọc đa chiều theo Chuyên mục, Mức độ ưu tiên, Trạng thái, Đối tượng, Tòa nhà.
   - Tự động theo dõi số lượt xem (`viewCount`) và lượt đã đọc (`NotificationRead`).
   - Huy hiệu `● Mới` trực quan cho sinh viên khi có thông báo chưa đọc.
   - Thao tác "Đánh dấu tất cả đã đọc" một chạm.

---

## 2. Chi tiết kỹ thuật & Kiến trúc mã nguồn

### 2.1. CSDL & Prisma ORM (`MySQL 8.4 + Prisma 6.19`)
- **Enums mới:** `NotificationCategory`, `NotificationPriority`, `NotificationStatus`, `TargetRole`.
- **Cập nhật model `Notification`:**
  - Bổ sung `summary`, `category`, `priority`, `targetBuilding`, `status`, `viewCount`, `authorId`.
  - Thiết lập Index phục vụ truy vấn tối ưu: `targetRole`, `status`, `category`, `isPinned`.
- **Model mới `NotificationRead`:**
  - Lưu vết biên lai đã đọc (`readAt`) của từng người dùng trên từng thông báo với khóa duy nhất `@@unique([notificationId, userId])`.

### 2.2. Backend API (Express + Prisma)
- **Controller:** [`backend/src/controllers/notification.controller.ts`](file:///e:/Dormitory-Management-System/backend/src/controllers/notification.controller.ts)
- **Routes:** [`backend/src/routes/notification.routes.ts`](file:///e:/Dormitory-Management-System/backend/src/routes/notification.routes.ts) mounted tại `/api/notifications`
- **Endpoints:**
  - `GET /api/notifications/stats`: Thống kê tổng bài, công khai, nháp, khẩn cấp, ghim, và số lượng theo từng chuyên mục.
  - `GET /api/notifications`: Tra cứu danh sách thông báo đã qua bộ lọc quyền xem tự động dựa trên JWT token.
  - `GET /api/notifications/:id`: Lấy chi tiết thông báo, kiểm tra quyền xem theo đối tượng/tòa nhà, tăng `viewCount` và ghi nhận `NotificationRead`.
  - `POST /api/notifications`: [Admin] Đăng bài thông báo mới.
  - `PUT /api/notifications/:id`: [Admin] Cập nhật thông báo.
  - `PATCH /api/notifications/:id/pin`: [Admin] Bật/tắt ghim bài thông báo.
  - `DELETE /api/notifications/:id`: [Admin] Xóa thông báo vĩnh viễn.
  - `POST /api/notifications/:id/read`: Đánh dấu đã đọc một bài.
  - `POST /api/notifications/mark-all-read`: Đánh dấu đã đọc tất cả bài thuộc quyền xem.

### 2.3. Frontend UI (`Spartan UI + Tailwind CSS Anti-AI Slop`)
- **Admin Portal:** [`frontend/src/app/features/admin/admin-notifications/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/admin/admin-notifications/)
  - **4 KPI Metrics Cards:** Tổng số bài, Đang công khai, Khẩn cấp / Đang ghim, Bản nháp / Lưu trữ.
  - **Filter Toolbar:** Tabs trạng thái (`Tất cả`, `Đang phát hành`, `Khẩn cấp`, `Bản nháp`, `Lưu trữ cũ`), ô tìm kiếm thời gian thực, 3 bộ chọn lọc (Chuyên mục, Đối tượng, Tòa nhà).
  - **Data Table:** Danh sách thông báo với icon ghim toggle, badges chuyên mục, mức ưu tiên, phạm vi tòa, số lượt xem, ngày đăng, cụm nút thao tác (Xem chi tiết, Sửa, Xóa).
  - **Modal Soạn thảo / Chỉnh sửa:** Form chuẩn B2B SaaS với focus ring sắc gọn, validation chặt chẽ.
  - **Modal Xem trước & Modal Xác nhận xóa bảo vệ dữ liệu.**
- **Client Portal:**
  - **Trang Bảng tin chuyên biệt:** [`frontend/src/app/features/client/client-notifications/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/client/client-notifications/)
    - Điều hướng tại menu Navbar chính và Drawer Mobile (`/client/notifications`).
    - Bộ lọc nhanh Pills chuyên mục (`Khẩn cấp`, `Nội quy`, `Tài chính`, `Bảo trì`, `Sự kiện`).
    - Nút "Đánh dấu tất cả đã đọc".
    - Modal đọc toàn văn bài viết với thông tin người gửi, mốc thời gian và số lượt xem.
  - **Trang chủ Sinh viên (`ClientHomeComponent`):**
    - Kết nối API `NotificationService` tải các thông báo thực tế mới nhất thay vì dữ liệu mock tĩnh.
    - Hỗ trợ click vào bài để mở modal xem nhanh và liên kết "Xem tất cả thông báo →".

---

## 3. Kết quả Kiểm thử & Biên dịch

### 3.1. Frontend Build Verification
- Thực thi: `npm run build` tại thư mục `frontend/`.
- Kết quả: **Khởi tạo và biên dịch thành công (Exit Code: 0)**, không có bất kỳ lỗi template hay type error nào.
  ```text
  Initial chunk files | Names   | Raw size  | Estimated transfer size
  main-POBIFY3X.js    | main    | 705.23 kB | 141.01 kB
  styles-7A2YJ6EE.css | styles  | 971 bytes | 971 bytes
  Application bundle generation complete. [22.200 seconds]
  ```

### 3.2. Backend Integration Test Suite
Thực thi bộ kịch bản kiểm thử API tích hợp tự động độc lập:
1. **Đăng nhập & Cấp quyền:** Cấp token Admin và token Sinh viên thành công.
2. **Admin tạo thông báo Nội bộ BQL (`targetRole: ADMIN`):** Thành công $\rightarrow$ `HTTP 201 Created`.
3. **Admin tạo thông báo Khẩn cấp Toàn KTX (`targetRole: ALL`, `isPinned: true`):** Thành công $\rightarrow$ `HTTP 201 Created`.
4. **Admin tạo thông báo riêng Tòa B (Nữ) (`targetRole: STUDENT`, `targetBuilding: 'Tòa B (Nữ)'`):** Thành công $\rightarrow$ `HTTP 201 Created`.
5. **Kiểm tra Phân quyền xem của Sinh viên:**
   - Sinh viên thấy thông báo Khẩn cấp Toàn KTX và thông báo riêng Tòa B.
   - **Tuyệt đối KHÔNG thấy thông báo nội bộ BQL** trong danh sách tra cứu.
6. **Kiểm tra Chặn truy cập trái quyền (Direct ID Access):**
   - Sinh viên cố tình gọi `GET /api/notifications/:adminNotifId` $\rightarrow$ Bị chặn chính xác với **`HTTP 403 Forbidden`** (*"Thông báo này chỉ dành riêng cho Ban Quản trị"*).
7. **Khách vãng lai chưa đăng nhập:**
   - Chỉ xem được các bài thông báo công khai toàn KTX, không xem được thông báo nội bộ hay thông báo theo tòa.
8. **Đánh dấu đã đọc & Lượt xem:**
   - Tự động ghi nhận `NotificationRead`, tăng `viewCount` và trả về `isRead: true`.
9. **Thao tác Ghim bài:** Bật/tắt ghim tức thời $\rightarrow$ `HTTP 200 OK`.
10. **Thống kê Bảng tin:** Số liệu thống kê chính xác theo phân loại và trạng thái.

---

## 4. Kết luận & Kế hoạch tiếp theo
- Tác vụ **`KTX-025: Tra cứu thông tin và thông báo`** đã hoàn thành 100% các tiêu chí nghiệm thu đề ra.
- Mã nguồn tuân thủ nghiêm ngặt chuẩn **Spartan UI & Tailwind CSS Enterprise B2B SaaS (Anti-AI Slop)**.
- Sẵn sàng bàn giao và tạo Pull Request vào nhánh `develop`.
- Tác vụ kế tiếp sau khi hợp nhất: **`KTX-026: Các nghiệp vụ khác (phí, hợp đồng, yêu cầu sửa chữa, báo cáo)`** (hoặc chuyển tiếp sang **EPIC D: Nghiên cứu và tích hợp AI Gemini**).
