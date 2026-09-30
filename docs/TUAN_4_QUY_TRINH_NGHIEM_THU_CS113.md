# BÁO CÁO THỰC TẬP - TUẦN 4
## TÌM HIỂU QUY TRÌNH NGHIỆM THU DỰ ÁN THỰC TẾ: HỆ THỐNG TIẾP NHẬN THÔNG TIN VÀ GIÁM SÁT CUỘC GỌI CỦA LỰC LƯỢNG CẢNH SÁT 113 - CÔNG AN TỈNH HẢI PHÒNG

---

* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh
* **Mã sinh viên:** DTC235200050 — Lớp: CNTT K22H
* **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)
* **Cơ sở thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy (TFL Technology JSC)
* **Giảng viên quản lý:** ThS. Trương Thị Hằng Nga (Khoa CNTT - ICTU)
* **Thời gian thực hiện:** Tuần 4 (Theo Kế hoạch Đề cương Thực tập tốt nghiệp)

---

### 1. Mục tiêu và Ý nghĩa của Hoạt động Tuần 4
Theo kế hoạch thực tập tốt nghiệp được phê duyệt giữa Nhà trường và Công ty Cổ phần Công nghệ TFL, trong Tuần 4, sinh viên được trực tiếp tham gia học hỏi, nghiên cứu **quy trình kiểm thử, triển khai và nghiệm thu dự án thực tế cấp doanh nghiệp / cơ quan nhà nước**:
* **Tên dự án thực tế học tập:** *"Hệ thống tiếp nhận thông tin và giám sát cuộc gọi của lực lượng Cảnh sát 113 — Công an tỉnh Hải Phòng"*.
* **Ý nghĩa:** Tiếp cận quy trình nghiệm thu phần mềm chuẩn mực (Software Acceptance Testing & Handover Process), hiểu rõ các tiêu chuẩn khắt khe về độ ổn định (High Availability), bảo mật dữ liệu cấp độ an ninh, quy trình ký kết biên bản bàn giao kỹ thuật giữa đơn vị cung cấp giải pháp (TFL) và chủ đầu tư (Công an tỉnh Hải Phòng).
* **Bài học áp dụng cho Đề tài KTX:** Vận dụng trực tiếp các phương pháp lập biên bản kiểm thử, ma trận phân quyền, kịch bản bàn giao và nghiệm thu vào dự án Quản lý Ký túc xá tích hợp AI.

---

### 2. Tổng quan về Dự án Cảnh sát 113 Hải Phòng
- **Chủ đầu tư / Đơn vị thụ hưởng:** Phòng Cảnh sát Quản lý hành chính về trật tự xã hội — Công an thành phố Hải Phòng.
- **Đơn vị phát triển & chuyển giao:** Công ty Cổ phần Công nghệ TFL.
- **Mục tiêu hệ thống:** 
  - Tiếp nhận tự động các cuộc gọi khẩn cấp từ người dân tới đầu số 113.
  - Tích hợp tổng đài VoIP / SIP Trunking, ghi âm cuộc gọi thời gian thực và tự động định vị thuê bao báo tin.
  - Phân luồng điều động các đội tuần tra phản ứng nhanh tới hiện trường vụ việc.
  - Báo cáo thống kê, giám sát chất lượng đàm thoại và phân tích địa bàn trọng điểm về an ninh trật tự.

---

### 3. Quy trình Nghiệm thu Phần mềm Thực tế tại Doanh nghiệp
Qua hướng dẫn của Cán bộ **Lê Anh Duy**, quy trình nghiệm thu dự án gồm 5 giai đoạn chuẩn mực:

```text
+-------------------------------------------------------------------------+
| GIAI ĐOẠN 1: KIỂM THỬ NỘI BỘ VÀ XÁC MINH CHẤT LƯỢNG (INTERNAL QA/QC)     |
| - Kiểm thử chức năng (Functional Testing) theo hồ sơ thầu / hợp đồng    |
| - Kiểm thử hiệu năng chịu tải (Stress Testing / Load Testing VoIP)      |
| - Kiểm thử an toàn thông tin và lỗ hổng mạng (Security Vulnerability)   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| GIAI ĐOẠN 2: CHẠY THỬ NGHIỆM TẠI HIỆN TRƯỜNG (PILOT / USER ACCEPTANCE)  |
| - Cài đặt máy chủ tại Trung tâm chỉ huy Công an TP Hải Phòng            |
| - Vận hành song song hệ thống cũ và mới trong vòng 14 - 30 ngày         |
| - Ghi nhận nhật ký sự cố, độ trễ cuộc gọi và tỷ lệ rớt gói âm thanh     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| GIAI ĐOẠN 3: ĐÀO TẠO VÀ CHUYỂN GIAO CÔNG NGHỆ (TRAINING & WORKSHOPS)     |
| - Biên soạn Sổ tay hướng dẫn sử dụng cho Trực ban tác chiến 113         |
| - Hướng dẫn quản trị viên mạng sao lưu (Backup) và phục hồi thảm họa    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| GIAI ĐOẠN 4: HỘI ĐỒNG NGHIỆM THU ĐÁNH GIÁ (OFFICIAL ACCEPTANCE REVIEW)   |
| - Kiểm tra đối chiếu 100% tính năng theo Hợp đồng và Đặc tả kỹ thuật   |
| - Đánh giá chỉ số sẵn sàng 99.99% và thời gian phản hồi cuộc gọi        |
| - Ký kết Biên bản Nghiệm thu kỹ thuật (Technical Acceptance Sign-off)   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| GIAI ĐOẠN 5: BÀN GIAO CHÍNH THỨC & BẢO HÀNH BẢO TRÌ (OPERATION & SLA)   |
| - Ký Biên bản bàn giao tài sản và phần mềm đưa vào khai thác sử dụng     |
| - Kích hoạt cam kết bảo hành và hỗ trợ kỹ thuật 24/7 (SLA)              |
+-------------------------------------------------------------------------+
```

---

### 4. Hồ sơ Tài liệu Nghiệm thu Tiêu chuẩn
Trong tuần thực tập này, sinh viên đã được tiếp cận và nghiên cứu cấu trúc của bộ hồ sơ nghiệm thu dự án chuyên nghiệp:
1. **Biên bản kiểm thử chấp nhận người dùng (User Acceptance Test Report - UAT):** Bảng kiểm kê chi tiết từng ca kiểm thử, kết quả đo lường và chữ ký xác nhận của cán bộ giám sát.
2. **Biên bản kiểm tra an toàn dữ liệu và mã nguồn:** Báo cáo rà soát không để lọt cửa sau (Backdoor), không lộ mật khẩu thô và tuân thủ mã hóa SSL/TLS.
3. **Bộ tài liệu bàn giao kỹ thuật:**
   - Sơ đồ kiến trúc hạ tầng mạng máy chủ (Topology Diagram).
   - Thiết kế cơ sở dữ liệu quan hệ (Entity Relationship Diagram).
   - Hướng dẫn cài đặt, cấu hình biến môi trường và quy trình khôi phục sự cố.
4. **Biên bản nghiệm thu và thanh lý hợp đồng:** Văn bản có giá trị pháp lý cao nhất ghi nhận sự hoàn tất của đơn vị phát triển.

---

### 5. Bài học Kinh nghiệm Áp dụng vào Đề tài Ký túc xá KTX
Việc trực tiếp tìm hiểu quy trình nghiệm thu dự án Cảnh sát 113 đã mang lại những bài học vô cùng quý giá cho quá trình phát triển hệ thống KTX:
- **Tư duy nghiêm cẩn trong kiểm thử:** Không chỉ kiểm tra các trường hợp chạy đúng (Happy Path) mà phải kiểm thử triệt để các trường hợp biên, lỗi mạng, mất kết nối CSDL và xử lý lỗi người dùng.
- **Tiêu chuẩn tài liệu hóa:** Mọi chức năng xây dựng đều phải đi kèm với báo cáo kiểm thử và mã nguồn sạch, có comment rõ ràng.
- **Bảo mật phân quyền (RBAC):** Dự án thực tế yêu cầu phân định rạch ròi vai trò (Trực ban, Chỉ huy, Quản trị viên). Điều này đã được sinh viên kế thừa trực tiếp vào phân hệ phân quyền giữa Sinh viên và Quản trị viên KTX.

---

### 6. Kết luận Tuần 4
Hoàn thành xuất sắc nội dung tìm hiểu quy trình nghiệm thu dự án thực tế tại doanh nghiệp TFL theo đúng tiến độ đề cương thực tập. Những kiến thức thực tế này là nền tảng để bắt đầu bước sang giai đoạn lập kế hoạch chi tiết và xây dựng hoàn thiện hệ thống KTX trong các tuần kế tiếp.
