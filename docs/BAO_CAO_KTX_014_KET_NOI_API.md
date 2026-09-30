# BÁO CÁO NGHIỆM THU TASK KTX-014
## KẾT NỐI GIAO DIỆN VỚI API (ANGULAR & NODE.JS EXPRESS)

* **Mã task:** KTX-014
* **Tên task:** Kết nối giao diện với API
* **Thuộc Epic:** EPIC B --- Giao diện client và admin
* **Người thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

### 1. Tiêu chí chấp nhận theo Backlog (Acceptance Criteria)

| Tiêu chí trong Backlog | Hiện trạng triển khai thực tế trên Hệ thống | Đánh giá |
| :--- | :--- | :---: |
| **Dữ liệu hiển thị từ API** | - Xây dựng đầy đủ các đầu mút RESTful API chuẩn trên Node.js/Express kết nối CSDL MySQL 8.4 qua Prisma ORM.<br>- Xây dựng 4 Angular Services sử dụng `HttpClient` (`provideHttpClient(withFetch())`):<br>&bull; `RoomService` (`/api/rooms`)<br>&bull; `RegistrationService` (`/api/registrations`)<br>&bull; `MaintenanceService` (`/api/maintenance`)<br>&bull; `DashboardService` (`/api/dashboard/stats`)<br>- Tích hợp dữ liệu API vào toàn bộ các màn hình Client và Admin. |  **ĐẠT** |
| **Lỗi mạng/API được thông báo** | - Bắt lỗi HttpErrorResponse trên tầng Service qua toán tử RxJS `catchError`.<br>- Tích hợp thông điệp báo lỗi mạng/API trực quan (Error Banner, Warning Alert) kèm nút **"Thử lại" (Retry)** trên mọi màn hình khi mất kết nối máy chủ. |  **ĐẠT** |
| **Không dùng dữ liệu giả như dữ liệu thật** | - Loại bỏ 100% các mảng dữ liệu giả lập (hardcoded mock data) trong các Component.<br>- Tất cả luồng đọc (Read) và ghi (Create/Update) đều đồng bộ trực tiếp hai chiều với CSDL MySQL thực tế. |  **ĐẠT** |

---

### 2. Chi tiết kết nối API theo từng phân hệ

#### 2.1. Phía Backend API (Express + TypeScript + Prisma)
- **Quản lý Phòng (`/api/rooms`):**
  - `GET /api/rooms`: Trả về danh sách phòng kèm trạng thái giường chi tiết, hỗ trợ lọc theo Tòa nhà (`building`), Trạng thái (`status`), Tìm kiếm (`search`).
  - `GET /api/rooms/:id`: Lấy chi tiết thông tin phòng và lịch sử xếp chỗ.
- **Đăng ký lưu trú (`/api/registrations`):**
  - `GET /api/registrations`: Lấy danh sách hồ sơ đăng ký lưu trú kèm thông tin sinh viên và phòng nguyện vọng.
  - `POST /api/registrations`: Tiếp nhận đơn đăng ký từ sinh viên, liên kết thông tin User và tạo hồ sơ chờ duyệt (`PENDING`).
  - `PATCH /api/registrations/:id/approve`: Ban Quản lý duyệt đơn và gán giường (`allocatedBedId`), cập nhật sĩ số phòng và trạng thái giường thành `OCCUPIED`.
  - `PATCH /api/registrations/:id/reject`: Ban Quản lý từ chối đơn kèm lý do giải trình.
- **Báo hỏng cơ sở vật chất (`/api/maintenance`):**
  - `GET /api/maintenance`: Lấy danh sách phiếu báo hỏng thiết bị phòng KTX.
  - `POST /api/maintenance`: Sinh viên gửi phiếu báo sự cố (Điện, Nước, Khóa cửa, Điều hòa, v.v.).
  - `PATCH /api/maintenance/:id/status`: Ban Quản lý cập nhật tiến độ xử lý và phản hồi kỹ thuật.
- **Bảng điều khiển quản trị (`/api/dashboard/stats`):**
  - `GET /api/dashboard/stats`: Thống kê tổng hợp số phòng, sức chứa, số giường trống/đã ở, tỷ lệ lấp đầy, số đơn chờ duyệt và các yêu cầu báo hỏng khẩn cấp.

#### 2.2. Phía Frontend Angular (Angular 21 + Reactive Architecture)
1. **Tra cứu phòng (`ClientRoomsComponent`):** Gọi `RoomService.getRooms()` để hiển thị danh sách phòng thực tế từ CSDL. Xử lý trạng thái `Loading`, `Empty` và `Error (kèm Retry)`.
2. **Đăng ký phòng (`ClientRegisterRoomComponent`):** Nạp danh mục phòng còn giường trống từ `RoomService`, tiếp nhận mã phòng từ query param và gửi `RegistrationService.createRegistration()`. Hiển thị thông báo mã tra cứu hồ sơ khi thành công và cảnh báo khi API bị gián đoạn.
3. **Báo hỏng thiết bị (`ClientMaintenanceComponent`):** Nạp lịch sử yêu cầu thực tế từ `MaintenanceService.getRequests()`, gửi phản ánh sự cố lên hệ thống và hiển thị phản hồi từ Ban Quản lý.
4. **Duyệt đơn quản trị (`AdminRegistrationsComponent`):** Lấy danh sách đơn từ API, tự động nạp danh sách giường trống thực tế của phòng vào Modal duyệt; thực hiện `approveRegistration` và `rejectRegistration` đồng bộ trực tiếp với MySQL.
5. **Dashboard điều hành (`AdminDashboardComponent`):** Nạp các chỉ số KPI, tỷ lệ lấp đầy từng tòa và tác vụ cần xử lý qua `DashboardService.getStats()`.

---

### 3. Tổng kết EPIC B (Giao diện client và admin)

Với việc hoàn thành task **KTX-014**, toàn bộ **5/5 task của EPIC B** đã hoàn thành 100%:
1. `KTX-010`: Lập kế hoạch và luồng màn hình hệ thống (Sitemap & Flows) --- **PR #8**
2. `KTX-011`: Xây dựng bộ khung giao diện client (Angular) --- **PR #9**
3. `KTX-012`: Xây dựng bộ khung giao diện admin (Angular) --- **PR #10**
4. `KTX-013`: Hoàn thiện các màn hình nghiệp vụ đã xác nhận --- **PR #11**
5. `KTX-014`: Kết nối giao diện với API --- **PR #12**

---

### 4. Kết quả kiểm thử biên dịch và vận hành
- **Backend (`tsc` build):** Biên dịch thành công 100% không phát sinh lỗi.
- **Frontend (`ng build` production):** Tạo bundle thành công (Initial total ~431 kB), sẵn sàng vượt qua bài kiểm tra GitHub Actions CI.
- **Kiểm thử trực tiếp API:** Toàn bộ API endpoint đã được kiểm tra trên môi trường cục bộ và kết nối ổn định với CSDL MySQL 8.4.
