# BÁO CÁO THỰC TẬP - TUẦN 7
## XÂY DỰNG CHỨC NĂNG CHO GIAO DIỆN CLIENT VÀ TRANG ADMIN
### KẾT NỐI TOÀN DIỆN FULLSTACK API VÀ TÍCH HỢP TRỢ LÝ AI GEMINI

---

* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh
* **Mã sinh viên:** DTC235200050 — Lớp: CNTT K22H
* **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)
* **Cơ sở thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy (TFL Technology JSC)
* **Giảng viên quản lý:** ThS. Trương Thị Hằng Nga (Khoa CNTT - ICTU)
* **Thời gian thực hiện:** Tuần 7 (Theo Kế hoạch Đề cương Thực tập tốt nghiệp)

---

### 1. Mục tiêu và Nội dung công việc Tuần 7
Tuần 7 là tuần cao điểm lập trình chức năng cốt lõi (Core Business Implementation) và kết nối đầu - cuối giữa Frontend Angular và Backend REST API:
- Triển khai toàn bộ các dịch vụ Angular Services sử dụng `HttpClient` và cơ chế Reactive State với **Angular Signals**.
- Hiện thực hóa quy trình nghiệp vụ xét duyệt và tự động phân giường lưu trú theo thời gian thực.
- Xây dựng phân hệ chat trực tiếp với Trợ lý AI Gemini, hỗ trợ đàm thoại đa lượt (Multi-turn Context) và cá nhân hóa theo thông tin sinh viên đăng nhập (**User Context Grounding**).
- Triển khai phân hệ kiểm toán, giám sát nhật ký AI cho Ban Quản lý.

---

### 2. Các Phân hệ Chức năng Đã Triển khai Hoàn chỉnh

#### a. Phân hệ Xác thực & Phân quyền (Auth & RBAC)
- Đăng nhập linh hoạt bằng Mã sinh viên hoặc Email nhà trường kết hợp kiểm tra mật khẩu mã hóa Bcrypt.
- Cơ chế phát hành và xác thực JSON Web Token (JWT) có thời hạn 7 ngày.
- Bộ định tuyến bảo vệ: `AuthGuard` ngăn chặn truy cập trái phép, điều hướng thông minh dựa trên vai trò `STUDENT` hoặc `ADMIN`.

#### b. Phân hệ Đăng ký Lưu trú & Tự động Phân giường
- Sinh viên gửi đơn đăng ký chọn phòng mong muốn; hệ thống kiểm tra ràng buộc ngăn chặn việc nộp trùng lặp khi đã có đơn đang chờ.
- Quản trị viên xét duyệt đơn với 1 thao tác: khi bấm "Duyệt", CSDL tự động tìm giường trống (`VACANT`), chuyển sang trạng thái đang ở (`OCCUPIED`), gán `occupiedById` cho sinh viên và tăng `currentOccupancy` của phòng tương ứng.
- Ghi nhận đầy đủ lịch sử phân bổ và điều chuyển vào bảng `bed_allocation_histories`.

#### c. Phân hệ Báo hỏng Cơ sở Vật chất
- Sinh viên gửi phiếu báo hỏng thiết bị (điện, nước, điều hòa, bóng đèn...) kèm mô tả chi tiết và mức độ khẩn cấp (`LOW`, `MEDIUM`, `HIGH`).
- Cán bộ kỹ thuật tiếp nhận, cập nhật phản hồi xử lý và chuyển trạng thái từ `PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `DONE`.

#### d. Phân hệ Trợ lý AI Thông minh & Cá nhân hóa
- **Widget Chat Nổi (Floating Chat Widget):** Thiết kế thanh lịch góc dưới màn hình, hỗ trợ thu gọn/mở rộng, tự động cuộn đến tin nhắn mới nhất, định dạng tin nhắn đẹp mắt.
- **Lưu trữ Lịch sử Hội thoại:** Tích hợp `localStorage` (`ktx_ai_chat_history`), nút "Làm mới (↺)" để bắt đầu phiên trò chuyện mới.
- **User Context Grounding:** Khi sinh viên đăng nhập đặt câu hỏi liên quan đến phòng ở, AI tự động tra cứu CSDL để trả lời chính xác: số phòng đang ở, số giường, đơn giá thuê và danh sách bạn cùng phòng.
- **Privacy Guard:** Nếu người dùng là khách vãng lai hỏi thông tin phòng ở cá nhân, AI sẽ lịch sự từ chối và yêu cầu đăng nhập.

#### e. Phân hệ Giám sát Quản trị AI (Admin AI Logs)
- Tự động ghi nhận mọi truy vấn và câu trả lời vào bảng `chat_logs` kèm nguồn phản hồi (`GEMINI_LIVE` hoặc `KNOWLEDGE_BASE_FALLBACK`).
- Giao diện Admin hiển thị bảng kiểm toán có phân trang, bộ lọc nguồn, thanh tìm kiếm và 4 thẻ thống kê KPIs thời gian thực.

---

### 3. Kết luận Tuần 7
Toàn bộ các chức năng của cả 2 phân hệ Client và Admin đã được phát triển hoàn thiện 100%, kết nối thành công với REST API backend và cơ sở dữ liệu MySQL. Hệ thống vận hành ổn định, sẵn sàng bước vào tuần kiểm thử toàn diện, nghiệm thu và lập báo cáo tổng kết.
