# KHẢO SÁT YÊU CẦU HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ TÍCH HỢP AI (KTX-002)

* **Dự án:** Hệ thống Quản lý Ký túc xá (Dormitory Management System)
* **Người thực hiện:** Phạm Thị Ngọc Ánh
* **Người hướng dẫn phê duyệt:** Lê Anh Duy

---

## 1. Mục tiêu hệ thống
- Tin học hóa công tác đăng ký, xét duyệt và xếp phòng lưu trú cho sinh viên.
- Hỗ trợ ban quản lý ký túc xá theo dõi trực quan hiện trạng từng tòa nhà, từng phòng, sức chứa, số giường trống.
- Cung cấp kênh tương tác tiện ích cho sinh viên: gửi yêu cầu báo hỏng/sửa chữa cơ sở vật chất, nhận thông báo nội bộ.
- Tích hợp trợ lý ảo AI (Google Gemini) để giải đáp tức thời 24/7 các thắc mắc về nội quy KTX, mức phí, thủ tục hồ sơ, thời gian biểu ra vào.

---

## 2. Đối tượng sử dụng và Phân quyền (Roles)

| Vai trò | Mô tả | Quyền hạn chính |
| :--- | :--- | :--- |
| **Admin (Ban Quản lý KTX)** | Cán bộ quản lý KTX tại trường | - Quản lý danh mục tòa nhà, phòng, loại phòng, số lượng giường.<br>- Quản lý danh sách hồ sơ sinh viên.<br>- Duyệt/từ chối đơn đăng ký lưu trú của sinh viên.<br>- Tiếp nhận và cập nhật tiến độ xử lý báo hỏng cơ sở vật chất.<br>- Đăng tải thông báo chung lên bảng tin hệ thống. |
| **Client (Sinh viên lưu trú)** | Sinh viên đang theo học có nhu cầu ở KTX | - Đăng ký tài khoản, quản lý thông tin cá nhân.<br>- Xem danh sách phòng còn chỗ trống và nộp hồ sơ xin lưu trú.<br>- Xem thông tin phòng đang ở, giường được xếp, danh sách bạn cùng phòng.<br>- Gửi phiếu yêu cầu sửa chữa cơ sở vật chất.<br>- Chat với Trợ lý AI để tra cứu nội quy KTX. |

---

## 3. Các luồng nghiệp vụ cốt lõi (User Flows)

### Luồng 1: Đăng ký & Xét duyệt lưu trú
1. Sinh viên đăng nhập vào hệ thống -> Xem danh sách phòng trống/khu vực phù hợp.
2. Sinh viên điền đơn đăng ký lưu trú (chọn phòng mong muốn, niên khóa, thông tin liên lạc, tải tài liệu chứng minh).
3. Đơn đăng ký ở trạng thái `PENDING` (Chờ duyệt).
4. Ban quản lý (Admin) vào dashboard duyệt đơn:
   - Nếu duyệt: Cập nhật trạng thái `APPROVED`, hệ thống tự động giữ chỗ/gán giường và trừ số chỗ trống của phòng.
   - Nếu từ chối: Cập nhật trạng thái `REJECTED` kèm lý do gửi tới sinh viên.

### Luồng 2: Báo hỏng thiết bị & Xử lý sự cố
1. Sinh viên phát hiện hỏng hóc trong phòng (quạt trần hỏng, bóng đèn cháy, vòi nước rỉ,...).
2. Tạo yêu cầu báo hỏng (chọn loại sự cố, nhập mô tả chi tiết, vị trí phòng).
3. Admin tiếp nhận yêu cầu, chuyển trạng thái sang `PROCESSING` (Đang xử lý) và phân công kỹ thuật.
4. Sau khi sửa chữa xong, Admin đổi trạng thái sang `RESOLVED` (Đã hoàn thành).

### Luồng 3: Hỗ trợ sinh viên bằng AI Chatbot (Gemini)
1. Sinh viên mở cửa sổ chat trên trang cá nhân.
2. Sinh viên gửi thắc mắc (ví dụ: *"Mấy giờ đóng cửa KTX?", "Phí điện nước tính thế nào?", "Hồ sơ đăng ký tạm trú gồm những gì?"*).
3. Backend tiếp nhận câu hỏi, gắn kèm bộ quy chế/nội quy KTX vào ngữ cảnh (System Instruction) và gửi đến Google Gemini API.
4. Phản hồi chuẩn xác, lịch sự được trả về cho sinh viên trong vòng vài giây.

---

## 4. Phạm vi dự án (Scope)

* **Trong phạm vi phát triển (In-scope - P0 & P1):**
  - Xác thực người dùng (Đăng ký, Đăng nhập JWT, Phân quyền Admin/Student).
  - Quản lý phòng (CRUD phòng, loại phòng, trạng thái phòng).
  - Quản lý đơn đăng ký lưu trú và phân phòng.
  - Quản lý phiếu yêu cầu báo hỏng.
  - Tích hợp trợ lý ảo AI Gemini tư vấn nội quy KTX.
* **Ngoài phạm vi / Dự kiến mở rộng nếu còn thời gian (Out-of-scope):**
  - Tích hợp cổng thanh toán trực tuyến tiền điện/nước/phòng (VietQR/Momo).
  - Điểm danh sinh viên bằng nhận diện khuôn mặt AI.

---

## 5. Các câu hỏi mở cần xin ý kiến cán bộ hướng dẫn (Open Questions)
1. Cơ sở KTX áp dụng mô hình phòng nam/nữ riêng theo tầng hay theo tòa?
2. Có cần cấp tài khoản sinh viên hàng loạt từ file Excel hay sinh viên tự đăng ký trên hệ thống?
3. Bộ quy chế nội quy KTX của trường cụ thể gồm những điều khoản nào để nạp dữ liệu tri thức vào AI Gemini?
