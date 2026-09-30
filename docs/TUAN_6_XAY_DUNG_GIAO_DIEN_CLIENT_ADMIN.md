# BÁO CÁO THỰC TẬP - TUẦN 6
## XÂY DỰNG BỘ KHUNG VÀ GIAO DIỆN CLIENT VÀ ADMIN
### (Angular 17 Standalone, Spartan UI, Tailwind CSS - Anti-AI Slop)

---

* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh
* **Mã sinh viên:** DTC235200050 — Lớp: CNTT K22H
* **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)
* **Cơ sở thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy (TFL Technology JSC)
* **Giảng viên quản lý:** ThS. Trương Thị Hằng Nga (Khoa CNTT - ICTU)
* **Thời gian thực hiện:** Tuần 6 (Theo Kế hoạch Đề cương Thực tập tốt nghiệp)

---

### 1. Mục tiêu và Định hướng Thiết kế Tuần 6
Trong Tuần 6, mục tiêu trọng tâm là hiện thực hóa bản vẽ luồng màn hình (Sitemap) thành giao diện thực tế bằng công nghệ **Angular 17** kết hợp **Tailwind CSS** và **Spartan UI**:
- **Phong cách thiết kế:** Chuẩn mực **Enterprise B2B SaaS**, độ tương phản cao, mật độ thông tin tối ưu, typography rõ ràng, phân cấp thị giác rành mạch.
- **Triệt để tuân thủ nguyên tắc Anti-AI Slop:** Tuyệt đối không sử dụng các dải màu gradient tím/hồng neon lòe loẹt, không sử dụng hiệu ứng phát sáng phản cảm (glow), bo góc vừa phải (rounded-md/lg), tập trung vào sự thanh lịch, chuyên nghiệp của môi trường quản trị công.
- **Kiến trúc Standalone Components:** Không sử dụng `NgModule` cồng kềnh; tải trang linh hoạt theo cơ chế Lazy Loading giúp tối ưu dung lượng gói tải ban đầu.

---

### 2. Xây dựng Phân hệ Cổng Thông tin Sinh viên (Client Portal)
Bao gồm các màn hình chính tại thư mục [`frontend/src/app/features/client/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/client):
1. **Client Layout & Navbar (`client-layout`):** Thanh điều hướng trên cùng hiển thị logo KTX ICTU, liên kết điều hướng nhanh (Trang chủ, Tra cứu phòng, Báo hỏng, Hồ sơ cá nhân), nút Đăng nhập / Đăng xuất linh hoạt.
2. **Trang chủ KTX (`client-home`):** Giới thiệu quang cảnh ký túc xá, bảng tin thông báo mới nhất có ghim ưu tiên và các thẻ chỉ dẫn tiện ích cho tân sinh viên.
3. **Tra cứu & Khảo sát Phòng ở (`client-rooms`):** Hiển thị danh sách phòng dạng thẻ (Card Grid), bộ lọc theo Tòa nhà (Nam/Nữ), tầng và loại phòng, hiển thị số chỗ trống còn lại trực quan.
4. **Nộp đơn Đăng ký Lưu trú (`client-register-room`):** Biểu mẫu đăng ký trực tuyến với đầy đủ xác thực dữ liệu đầu vào (Họ tên, mã sinh viên, thời hạn thuê, phòng mong muốn).
5. **Báo hỏng & Sửa chữa thiết bị (`client-maintenance`):** Giao diện gửi phiếu báo hỏng thiết bị và bảng lịch sử theo dõi tiến độ xử lý của ban quản lý.
6. **Hồ sơ Cá nhân Sinh viên (`client-profile`):** Hiển thị chi tiết thông tin phòng đang ở, số giường, giá thuê, hợp đồng và danh sách bạn cùng phòng.

---

### 3. Xây dựng Phân hệ Bảng Điều khiển Quản trị (Admin Portal)
Bao gồm các màn hình quản trị chuyên sâu tại thư mục [`frontend/src/app/features/admin/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/admin):
1. **Admin Layout & Sidebar (`admin-layout`):** Thanh menu dọc chuyên nghiệp với các icon trực quan, phân tách rõ ràng khu vực quản trị dữ liệu.
2. **Dashboard Tổng quan (`admin-dashboard`):** 4 thẻ chỉ số KPIs trọng yếu, biểu đồ phân bổ phòng ở, tỷ lệ lấp đầy giường và danh sách công việc cần xử lý trong ngày.
3. **Quản lý Danh mục Phòng (`admin-rooms`):** Bảng dữ liệu quản lý các tòa, tầng, phòng, danh sách giường và trạng thái (Đang ở, Trống, Bảo trì).
4. **Xét duyệt Đơn Đăng ký (`admin-registrations`):** Bảng danh sách đơn đăng ký, nút thao tác một chạm: "Phê duyệt" (tự động gán phòng) hoặc "Từ chối" (yêu cầu nhập lý do).
5. **Quản lý Hồ sơ Sinh viên (`admin-students`):** Tra cứu, thêm mới, sửa đổi hồ sơ sinh viên lưu trú.
6. **Xử lý Sự cố Báo hỏng (`admin-maintenance`):** Tiếp nhận sự cố kỹ thuật, cập nhật phản hồi và chuyển trạng thái từ `PENDING` sang `PROCESSING` hoặc `DONE`.
7. **Quản lý Bảng tin Thông báo (`admin-notifications`):** Biên tập, đăng tải thông báo mới và ghim ưu tiên lên đầu trang.
8. **Giám sát Trợ lý AI (`admin-ai-logs`):** Bảng kiểm toán nhật ký các phiên hỏi đáp của sinh viên và biểu đồ KPIs phân tích hành vi người dùng.

---

### 4. Đánh giá Chất lượng Giao diện
- **Tính đáp ứng (Responsive Design):** Hoạt động hoàn hảo trên mọi kích thước màn hình từ điện thoại di động (375px), máy tính bảng (768px) đến màn hình desktop lớn (1920px).
- **Trạng thái giao diện đầy đủ:** Mỗi màn hình đều được thiết kế đầy đủ 4 trạng thái: Đang tải dữ liệu (Loading Skeleton/Spinner), Trạng thái rỗng (Empty State), Trạng thái có dữ liệu (Data State) và Trạng thái thông báo lỗi (Error State).

---

### 5. Kết luận Tuần 6
Hoàn thành trọn vẹn bộ khung giao diện của cả 2 phân hệ Client và Admin. Toàn bộ mã nguồn giao diện sạch sẽ, tuân thủ nguyên tắc Spartan B2B SaaS Anti-AI Slop, tạo tiền đề vững chắc để kết nối API và hoàn thiện chức năng ở Tuần 7.
