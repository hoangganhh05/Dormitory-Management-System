# BÁO CÁO NGHIỆM THU NHIỆM VỤ KTX-043
## CHUẨN BỊ BẢN DEMO, BỘ DỮ LIỆU AN TOÀN VÀ KỊCH BẢN THUYẾT TRÌNH NGHIỆM THU

---

### 📌 THÔNG TIN CHUNG
* **Đề tài:** Xây dựng hệ thống quản lý ký túc xá tích hợp AI (Dormitory Management System)
* **Mã nhiệm vụ:** `KTX-043` (Thuộc **EPIC E — Kiểm thử, nghiệm thu và báo cáo**)
* **Nhánh thực hiện:** `task/KTX-043-demo-preparation-and-presentation-script`
* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh
* **Mã sinh viên:** DTC235200050 — Lớp: CNTT K22H
* **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn doanh nghiệp:** Lê Anh Duy (TFL Technology JSC)
* **Giảng viên hướng dẫn học viện:** ThS. Trương Thị Hằng Nga (Khoa CNTT - ICTU)

---

## 1. Mục tiêu và Ý nghĩa của Nhiệm vụ KTX-043

Nhiệm vụ **KTX-043** là bước then chốt chuẩn bị cho buổi bảo vệ kết quả thực tập tốt nghiệp trước Hội đồng chấm thi Khoa Công nghệ Thông tin - Trường Đại học CNTT & TT (ICTU) và Lãnh đạo Công ty Cổ phần Công nghệ TFL:

1. **Chuẩn bị bộ dữ liệu Demo an toàn (Safe Demo Data Seed):** Khởi tạo cơ sở dữ liệu mẫu chân thực, bao gồm đầy đủ dữ liệu sinh viên mẫu (Phạm Thị Ngọc Ánh), bạn cùng phòng, phòng tiêu chuẩn/VIP, đơn đăng ký chờ duyệt, phiếu báo hỏng thiết bị và nhật ký tương tác AI. Đảm bảo tính **tái lập 100% (Idempotent)** có thể reset về trạng thái ban đầu bất cứ lúc nào.
2. **Kịch bản thuyết trình trực quan 5 màn (Live Demo Presentation Script):** Xây dựng kịch bản trình chiếu từng bước, có câu thoại, hành động bấm chuột và các câu hỏi AI tiêu biểu để tạo ấn tượng thuyết phục trước Hội đồng.
3. **Bộ công cụ khởi động 1 chạm (One-Click Launchers):** Cung cấp script [`start-demo.bat`](file:///e:/Dormitory-Management-System/start-demo.bat) và [`start-demo.ps1`](file:///e:/Dormitory-Management-System/start-demo.ps1) giúp khởi động toàn bộ hệ thống (Database seed + Backend API + Frontend Portal) chỉ với một thao tác.
4. **Hướng dẫn vận hành chuẩn hóa (Operating & Running Guide):** Bổ sung hướng dẫn chạy chi tiết và danh mục tài khoản demo.

---

## 2. Danh mục Tài khoản & Dữ liệu Demo An toàn

| Vai trò | Tài khoản Đăng nhập | Mật khẩu | Ngữ cảnh dữ liệu trong hệ thống |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (Admin)** | `admin@dormitory.com` | `123456` | Cán bộ Ban Quản lý KTX ICTU; toàn quyền duyệt đơn, phân giường, điều chuyển, xử lý bảo trì và giám sát AI. |
| **Sinh viên chính (Demo)** | `DTC235200050` *(hoặc `ngocanh.cntt@ictu.edu.vn`)* | `123456` | **Phạm Thị Ngọc Ánh** — Đang lưu trú tại **Phòng A101 (Giường G1)**; có bạn cùng phòng Nguyễn Văn An; có 1 phiếu báo hỏng bình nóng lạnh đang xử lý. |
| **Sinh viên bạn cùng phòng** | `DTC235200088` *(hoặc `vanan.cntt@ictu.edu.vn`)* | `123456` | **Nguyễn Văn An** — Đang lưu trú tại **Phòng A101 (Giường G2)**; bạn cùng phòng với Ngọc Ánh. |
| **Sinh viên chờ duyệt đơn** | `DTC235200099` *(hoặc `thihuong.cntt@ictu.edu.vn`)* | `123456` | **Trần Thị Hương** — Sinh viên mới nộp đơn đăng ký lưu trú vào phòng A101, trạng thái **PENDING** phục vụ demo duyệt đơn. |

---

## 3. Kịch bản Thuyết trình Nghiệm thu 5 Màn (Live Demo Script)

### 🎬 **MÀN 1: Giới thiệu Kiến trúc & Đăng nhập Phân quyền RBAC (Thời lượng: ~2 phút)**
* **Hành động:** 
  1. Mở trình duyệt tại địa chỉ `http://localhost:4200/`.
  2. Giới thiệu tổng quan kiến trúc 4 tầng chuẩn Enterprise B2B SaaS: Angular 17 Standalone, Tailwind CSS, Spartan UI (Anti-AI Slop), Express, Prisma ORM và MySQL.
  3. Trình diễn trang Đăng nhập linh hoạt: hỗ trợ đăng nhập bằng cả **Mã sinh viên** (`DTC235200050`) lẫn **Email trường** (`ngocanh.cntt@ictu.edu.vn`).
* **Lời thoại minh họa:**
  > *"Kính thưa Thầy/Cô Hội đồng và Cán bộ hướng dẫn, em xin phép bắt đầu phần trình diễn hệ thống. Giao diện được thiết kế theo chuẩn B2B SaaS với độ tương phản cao, thông tin mật độ cao, tuân thủ nguyên tắc Anti-AI Slop không sử dụng hiệu ứng màu mè. Hệ thống hỗ trợ xác thực JWT đa phương thức..."*

---

### 🎬 **MÀN 2: Hành trình Trải nghiệm Sinh viên - Client Portal (Thời lượng: ~3 phút)**
* **Hành động:**
  1. Đăng nhập bằng tài khoản sinh viên Phạm Thị Ngọc Ánh (`DTC235200050` / `123456`).
  2. Truy cập **"Hồ sơ của tôi"** (`/profile`): Xem thông tin cá nhân, mã sinh viên, phòng đang ở (`A101`), số giường (`G1`), và bảng thông tin hợp đồng lưu trú.
  3. Truy cập **"Danh mục Phòng ở"** (`/rooms`): Xem danh sách phòng, lọc theo Tòa A/B, kiểm tra tình trạng số chỗ trống theo thời gian thực.
  4. Truy cập **"Báo hỏng & Sửa chữa"** (`/maintenance`): Xem phiếu báo hỏng bình nóng lạnh đang ở trạng thái `Đang xử lý (PROCESSING)`; bấm gửi thêm một yêu cầu sửa bóng đèn với mức độ khẩn cấp `HIGH`.
* **Lời thoại minh họa:**
  > *"Tại phân hệ Client Portal, sinh viên có thể chủ động kiểm tra toàn bộ thông tin lưu trú của mình mà không cần đến trực tiếp văn phòng KTX. Mọi yêu cầu phản ánh cơ sở vật chất đều được chuyển trực tiếp tới cán bộ kỹ thuật..."*

---

### 🎬 **MÀN 3: Hành trình Quản trị viên KTX - Admin Portal (Thời lượng: ~3 phút)**
* **Hành động:**
  1. Mở cửa sổ ẩn danh hoặc đăng xuất, đăng nhập tài khoản Admin (`admin@dormitory.com` / `123456`).
  2. Truy cập **"Dashboard Tổng quan"** (`/admin/dashboard`): Giới thiệu 4 thẻ chỉ số KPIs (Tổng số sinh viên, phòng trống, đơn chờ duyệt, sự cố kỹ thuật).
  3. Truy cập **"Duyệt đơn đăng ký"** (`/admin/registrations`): Thấy đơn đăng ký chờ duyệt của sinh viên Trần Thị Hương (`DTC235200099`). Bấm nút **"Phê duyệt"** $\rightarrow$ Hệ thống tự động gán phòng A101 và tăng số lượng lưu trú thực tế của phòng.
  4. Truy cập **"Báo hỏng cơ sở vật chất"** (`/admin/maintenance`): Tiếp nhận phiếu báo hỏng bình nóng lạnh, cập nhật phản hồi kỹ thuật: *"Đã hoàn thành sửa chữa"* và chuyển trạng thái sang `HOÀN THÀNH (DONE)`.
* **Lời thoại minh họa:**
  > *"Tại phân hệ Quản trị Admin, mọi quy trình nghiệp vụ xét duyệt và phân bổ đều được số hóa khép kín. Khi một đơn đăng ký được duyệt, CSDL tự động tính toán lại sức chứa phòng mà không sợ bị trùng lặp..."*

---

### 🎬 **MÀN 4: Điểm nhấn Đột phá - Trợ lý AI Gemini Cá nhân hóa (Thời lượng: ~4 phút)**
* **Hành động:**
  1. Chuyển sang trình duyệt của sinh viên Phạm Thị Ngọc Ánh, mở Widget Chat Floating ở góc phải dưới màn hình.
  2. **Test 1: Hỏi đáp nội quy KTX (Rule Engine / Gemini):**
     - Đặt câu hỏi: *"Mấy giờ thì ký túc xá đóng cửa và có được nấu ăn trong phòng không?"*
     - AI phản hồi chính xác dựa trên Điều 1 và Điều 3 Nội quy KTX ICTU.
  3. **Test 2: Trình diễn Cá nhân hóa theo ngữ cảnh sinh viên (User Context Grounding):**
     - Đặt câu hỏi: *"Tôi đang ở phòng nào và ai ở cùng phòng với tôi?"*
     - AI nhận diện danh tính sinh viên Phạm Thị Ngọc Ánh, trích xuất dữ liệu CSDL thời gian thực: trả lời rõ phòng **A101**, giường **G1**, bạn cùng phòng là bạn **Nguyễn Văn An** (MSV: DTC235200088 - Giường G2).
  4. **Test 3: Trắc nghiệm an toàn bảo mật (Privacy Guard):**
     - Mở tab ẩn danh (chưa đăng nhập), hỏi: *"Tôi đang ở phòng nào?"*
     - AI từ chối khéo léo và yêu cầu người dùng đăng nhập tài khoản để bảo vệ thông tin riêng tư.
* **Lời thoại minh họa:**
  > *"Điểm cốt lõi và sáng tạo nhất của đề tài là Trợ lý AI KTX tích hợp công nghệ User Context Grounding. AI không chỉ trả lời văn bản quy chế chung chung mà thực sự 'hiểu' sinh viên đang nói chuyện là ai, đang ở phòng nào, có sự cố gì, mang lại trải nghiệm hỗ trợ 24/7 chân thực..."*

---

### 🎬 **MÀN 5: Phân hệ Giám sát Quản trị Trợ lý AI - Admin AI Logs (Thời lượng: ~2 phút)**
* **Hành động:**
  1. Trở lại màn hình Admin, truy cập đường dẫn `/admin/ai-logs`.
  2. Trình diễn 4 thẻ KPIs giám sát AI (Tổng lượt hỏi, số câu hỏi trong ngày, tỷ lệ phản hồi Gemini Live vs Fallback, tỷ lệ sinh viên đăng nhập vs khách).
  3. Trình diễn bảng Nhật ký hỏi đáp: tìm kiếm theo mã sinh viên `DTC235200050`, xem chi tiết câu hỏi vừa đặt ở Màn 4.
* **Lời thoại minh họa:**
  > *"Để đảm bảo tính minh bạch và an toàn thông tin, Ban Quản lý được trang bị Dashboard Giám sát Trợ lý AI. Cán bộ có thể kiểm toán tức thì nội dung sinh viên thắc mắc và đánh giá chất lượng câu trả lời của mô hình..."*

---

## 4. Hướng dẫn Khởi chạy Demo Siêu tốc 1 Chạm

Người dùng có thể khởi chạy toàn bộ hệ thống bằng 1 trong các cách sau:

### Cách 1: Sử dụng File Script có sẵn (Khuyên dùng trên Windows)
- Bấm đúp chuột vào file [`start-demo.bat`](file:///e:/Dormitory-Management-System/start-demo.bat) hoặc click chuột phải chọn **Run with PowerShell** file [`start-demo.ps1`](file:///e:/Dormitory-Management-System/start-demo.ps1).
- Script sẽ tự động đồng bộ CSDL, nạp dữ liệu mẫu an toàn và bật cả 2 server Backend & Frontend.

### Cách 2: Sử dụng dòng lệnh qua Terminal
```powershell
# 1. Nạp bộ dữ liệu demo an toàn
npm run seed

# 2. Khởi chạy Backend API (Cổng 5000)
npm run start:backend

# 3. Khởi chạy Frontend Angular (Cổng 4200)
npm run start:frontend
```

---

## 5. Kết luận Nghiệm thu KTX-043

Tác vụ **`KTX-043: Chuẩn bị bản demo và hướng dẫn chạy`** đã được hoàn thành 100% tiêu chí chấp nhận:
- Bộ dữ liệu demo an toàn, phong phú và hoàn toàn tái lập.
- Kịch bản thuyết trình nghiệm thu 5 màn chuyên nghiệp, bám sát các tiêu chuẩn của Hội đồng chấm tốt nghiệp ICTU và TFL Technology.
- Bộ công cụ launcher 1 chạm hoạt động trơn tru.

Sẵn sàng tạo Pull Request để hợp nhất vào nhánh `develop`.
