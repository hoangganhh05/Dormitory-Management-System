# BÁO CÁO THỰC TẬP - TUẦN 3
## TÌM HIỂU VỀ TÍCH HỢP AI CHATBOT (GEMINI) TRONG DỰ ÁN

---

* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh
* **Mã sinh viên:** DTC235200050 — Lớp: CNTT K22H
* **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)
* **Cơ sở thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy (TFL Technology JSC)
* **Giảng viên quản lý:** ThS. Trương Thị Hằng Nga (Khoa CNTT - ICTU)
* **Thời gian thực hiện:** Tuần 3 (Theo Kế hoạch Đề cương Thực tập tốt nghiệp)

---

### 1. Mục tiêu và Nội dung công việc Tuần 3
- Nghiên cứu khả năng ứng dụng của mô hình Trí tuệ Nhân tạo tạo sinh (**Generative AI**) vào bài toán quản trị và hỗ trợ sinh viên tại Ký túc xá.
- Tìm hiểu SDK chính thức của Google: `@google/generative-ai` và mô hình **Google Gemini 1.5 Flash**.
- Phân tích và thiết kế mô hình kiến trúc tích hợp AI an toàn qua **Server-side Proxy Pattern**, bảo vệ bí mật API Key và ngăn chặn chi phí vượt định mức.
- Xây dựng giải pháp dự phòng (**Fallback Knowledge Base Engine**) đảm bảo hệ thống luôn sẵn sàng 24/7 kể cả khi mất kết nối Internet quốc tế hoặc hết hạn ngạch API.

---

### 2. Nghiên cứu Mô hình Google Gemini 1.5 Flash
Trong khuôn khổ dự án KTX, mô hình **Gemini 1.5 Flash** được lựa chọn nhờ các đặc tính kỹ thuật tối ưu:
1. **Tốc độ phản hồi cực nhanh (Low Latency):** Phù hợp với trải nghiệm chat tức thì trên giao diện Web Client.
2. **Cửa sổ ngữ cảnh khổng lồ (Long Context Window):** Hỗ trợ nạp toàn bộ bộ quy chế nội quy ký túc xá và lịch sử hội thoại nhiều lượt (Multi-turn Chat) mà không bị mất ngữ cảnh.
3. **Chi phí vận hành tối ưu (Cost-effective):** Tiết kiệm tài nguyên điện toán, phù hợp với quy mô triển khai trường đại học và cơ quan quản lý.
4. **Hỗ trợ xử lý tiếng Việt xuất sắc:** Nhận diện và phản hồi ngữ nghĩa tiếng Việt chuẩn xác, thân thiện và tự nhiên.

---

### 3. Thiết kế Kiến trúc Tích hợp AI An toàn (Server Proxy Pattern)

```text
[ Sinh viên / Client Portal ]
          |  (1) Gửi câu hỏi kèm JWT Token
          v
[ Backend API Proxy (Express Controller) ]
          |
          +---> (2) Xác thực Token & Giải mã danh tính sinh viên
          |
          +---> (3) Kiểm tra Gemini API Key & Kết nối mạng
          |         |
          |         +--[ Có API Key & Online ]--> Gọi Google Gemini 1.5 Flash API
          |         |
          |         +--[ Mất mạng / Hết Quota ]-> Gọi Fallback Rule Engine (10 điều nội quy)
          |
          +---> (4) Ghi nhật ký vào CSDL (Bảng `chat_logs`) phục vụ kiểm toán
          |
          v  (5) Trả kết quả JSON về cho Chat Widget
[ Frontend Chat Widget (Angular Signals) ]
```

**Nguyên tắc bảo mật cốt lõi:**
- **Không bao giờ lộ API Key ra Client:** Khóa `GEMINI_API_KEY` chỉ được lưu trữ trong biến môi trường `.env` trên máy chủ backend.
- **Privacy Guard:** Thông tin cá nhân nhạy cảm của sinh viên (số phòng, bạn cùng phòng) chỉ được AI truy xuất khi sinh viên đã đăng nhập thành công.

---

### 4. Xây dựng Động cơ Dự phòng Nội quy KTX (Fallback Rule Engine)
Để giải quyết bài toán phụ thuộc vào dịch vụ bên ngoài, dự án đã xây dựng bộ từ điển tri thức nội quy KTX ICTU gồm 10 điều cốt lõi:
- **Điều 1:** Giờ mở cửa (05:30) và giờ giới nghiêm đóng cửa (23:00 hàng ngày).
- **Điều 2:** Quy định về an ninh trật tự, cấm cờ bạc, rượu bia, chất kích thích.
- **Điều 3:** Quy chế an toàn phòng cháy chữa cháy, nghiêm cấm đun nấu trong phòng ngủ.
- **Điều 4:** Tiếp khách và người ngoài tại phòng tiếp dân, không lưu trú qua đêm.
- **Điều 5:** Giữ gìn vệ sinh chung và đổ rác đúng nơi quy định.
- **Điều 6:** Báo hỏng và sửa chữa trang thiết bị qua ứng dụng quản lý.
- **Điều 7:** Thời hạn đóng phí lưu trú và tiền điện nước theo tháng/kỳ.
- **Điều 8:** Quy trình trả phòng và bàn giao tài sản khi kết thúc hợp đồng.
- **Điều 9:** Tiêu chuẩn tiết kiệm điện nước và bảo vệ môi trường.
- **Điều 10:** Khen thưởng và xử lý kỷ luật đối với sinh viên vi phạm quy chế.

---

### 5. Kết luận Tuần 3
- Đã nắm vững quy trình gọi API và tích hợp Gemini AI SDK với môi trường Node.js / TypeScript.
- Hoàn thành thiết kế kiến trúc Server Proxy và cơ chế Fallback Engine.
- Sẵn sàng chuyển tiếp sang tuần tiếp theo theo đúng đề cương thực tập.
