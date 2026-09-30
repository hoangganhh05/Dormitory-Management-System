# BÁO CÁO NGHIỆM THU TASK KTX-013
## HOÀN THIỆN CÁC MÀN HÌNH NGHIỆP VỤ XÁC NHẬN (ANGULAR)

* **Mã task:** KTX-013
* **Tên task:** Hoàn thiện các màn hình nghiệp vụ đã được xác nhận
* **Thuộc Epic:** EPIC B --- Giao diện client và admin
* **Người thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

### 1. Tiêu chí chấp nhận theo Backlog (Acceptance Criteria)

| Tiêu chí trong Backlog | Hiện trạng triển khai thực tế trên Angular | Đánh giá |
| :--- | :--- | :---: |
| **Mỗi màn hình có trạng thái tải (Loading)** | - Đã bổ sung hiệu ứng Spinner / Loader và thông điệp trực quan khi hệ thống đang tải hoặc nạp dữ liệu ở mọi màn hình nghiệp vụ (`ClientRoomsComponent`, `ClientRegisterRoomComponent`, `ClientMaintenanceComponent`, `AdminRegistrationsComponent`). |  **ĐẠT** |
| **Mỗi màn hình có trạng thái rỗng (Empty)** | - Khi không tìm thấy kết quả tìm kiếm hoặc chưa có dữ liệu (ví dụ: Không tìm thấy phòng theo bộ lọc, Danh sách báo hỏng trống, Danh sách đơn đăng ký rỗng), màn hình hiển thị Empty State minh họa cùng lời kêu gọi hành động (Call To Action). |  **ĐẠT** |
| **Mỗi màn hình có trạng thái lỗi (Error)** | - Tích hợp hộp cảnh báo lỗi thân thiện (Alert Box) kèm nút "Thử lại" (Retry Action) khi xảy ra lỗi kết nối hoặc xử lý dữ liệu. |  **ĐẠT** |
| **Biểu mẫu có kiểm tra đầu vào (Form Validation)** | - Triển khai Angular Reactive Forms (`FormGroup`, `FormControl`, `Validators`) với các ràng buộc nghiêm ngặt:<br>&bull; Họ tên (bắt buộc, tối thiểu 3 ký tự)<br>&bull; Mã sinh viên (Regex kiểm tra định dạng chữ hoa và số)<br>&bull; Email & Số điện thoại (Regex kiểm tra định dạng email và 10 số di động VN)<br>&bull; Phòng & Học kỳ (Bắt buộc chọn)<br>&bull; Báo hỏng (Bắt buộc chọn loại sự cố, mức độ ưu tiên và mô tả chi tiết trên 10 ký tự)<br>- Hiển thị phản hồi cảnh báo đỏ trực tiếp ngay dưới ô nhập khi trường bị `invalid && (dirty || touched)`.<br>- Vô hiệu hóa nút Submit khi form chưa hợp lệ. |  **ĐẠT** |

---

### 2. Chi tiết các màn hình nghiệp vụ hoàn thiện

#### 2.1. Phía Sinh viên (Client Portal)
1. **Tra cứu & Khảo sát phòng (`ClientRoomsComponent` - `/rooms`):**
   - Bộ lọc đa tiêu chí: Tòa nhà (Tất cả / Tòa A / Tòa B), Trạng thái phòng (Còn giường / Đã đầy), Tìm kiếm nhanh theo số phòng.
   - Hiển thị danh thiếp phòng trực quan (Room Card): Số phòng, Tòa, Tầng, Loại phòng (Nam / Nữ), Giá thuê tháng, Trạng thái từng giường (Trống / Đã có người), Tiện ích đi kèm.
   - Nút hành động trực tiếp: "Đăng ký phòng này" (Tự động chuyển tiếp kèm mã phòng sang biểu mẫu đăng ký).

2. **Đăng ký ở nội trú (`ClientRegisterRoomComponent` - `/register-room`):**
   - Tiếp nhận tự động `roomId` từ URL Query Params.
   - Form đăng ký thông tin cá nhân và nguyện vọng phòng với đầy đủ cơ chế validation.
   - Hộp xác nhận cam kết nội quy ký túc xá trước khi gửi.
   - Trạng thái gửi đơn (Submission Spinner) và màn hình thông báo Đăng ký thành công kèm mã tra cứu đơn.

3. **Báo hỏng & Yêu cầu sửa chữa (`ClientMaintenanceComponent` - `/maintenance`):**
   - Biểu mẫu gửi phản ánh: Chọn phòng, danh mục thiết bị hỏng (Điện, Nước, Khóa cửa, Điều hòa, Khác), mức độ ưu tiên (Thường / Khẩn cấp), mô tả chi tiết.
   - Lịch sử theo dõi tiến độ sửa chữa: Danh sách các phiếu yêu cầu, trạng thái xử lý (`PENDING`, `IN_PROGRESS`, `RESOLVED`), phản hồi từ nhân viên kỹ thuật.

#### 2.2. Phía Ban Quản lý (Admin Portal)
1. **Duyệt Đơn đăng ký lưu trú (`AdminRegistrationsComponent` - `/admin/registrations`):**
   - Bộ lọc theo Tabs: *Tất cả đơn*, *Chờ duyệt (Pending)*, *Đã chấp thuận (Approved)*, *Đã từ chối (Rejected)*.
   - Bảng dữ liệu tác nghiệp (Data Table) chi tiết: Mã đơn, Họ tên sinh viên, Mã sinh viên, Phòng nguyện vọng, Học kỳ, Ngày gửi, Trạng thái duyệt.
   - Modal Phê duyệt đơn (Approve Modal): Chọn giường cụ thể còn trống để phân bổ cho sinh viên trước khi xác nhận.
   - Modal Từ chối đơn (Reject Modal): Nhập lý do từ chối cụ thể để gửi thông báo giải trình cho sinh viên.
   - Thông báo Toast/Alert phản hồi tác vụ tức thì.

---

### 3. Cấu trúc mã nguồn cập nhật

```text
frontend/src/app/features/
├── client/
│   ├── client-rooms/
│   │   ├── client-rooms.component.ts
│   │   ├── client-rooms.component.html
│   │   └── client-rooms.component.css
│   ├── client-register-room/
│   │   ├── client-register-room.component.ts
│   │   ├── client-register-room.component.html
│   │   └── client-register-room.component.css
│   └── client-maintenance/
│       ├── client-maintenance.component.ts
│       ├── client-maintenance.component.html
│       └── client-maintenance.component.css
└── admin/
    └── admin-registrations/
        ├── admin-registrations.component.ts
        ├── admin-registrations.component.html
        └── admin-registrations.component.css
```

---

### 4. Kết quả kiểm thử biên dịch
- Đã chạy lệnh `npm run build` (Angular Production Build): **Biên dịch thành công 100% không có lỗi hoặc cảnh báo**, sẵn sàng vượt qua bài kiểm tra GitHub Actions CI.
