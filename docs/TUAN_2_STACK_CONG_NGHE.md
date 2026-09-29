# BÁO CÁO THỰC TẬP - TUẦN 2
## TÌM HIỂU CÔNG NGHỆ NỀN TẢNG SỬ DỤNG TRONG DỰ ÁN (KTX-003)
### (Node.js, Express, TypeScript, Prisma ORM, MySQL)

* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (Lớp CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

### 1. Tổng quan vai trò của từng công nghệ trong kiến trúc hệ thống

```text
[Client Web App (Angular)]           [Admin Dashboard (Angular)]
            \                                   /
             \------- [ HTTP REST / JSON ] ----/
                               |
                               v
+--------------------------------------------------------------+
|                     EXPRESS WEB SERVER (TS)                  |
|  - Router & Dispatcher                                       |
|  - Middleware Pipeline (CORS, JWT Guard, Input Validation)   |
|  - Error Handling Middleware                                 |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                     BUSINESS SERVICE LAYER                   |
|  - AuthService, RoomService, RegistrationService             |
|  - GeminiAIService (Google Generative AI SDK)                |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                      PRISMA ORM CLIENT                       |
|  - Type-safe Query Builder                                   |
|  - Connection Pooling                                        |
+--------------------------------------------------------------+
                               |
                               v
                    [ MySQL 8.4 DATABASE ]
```

---

### 2. Phân tích chi tiết các thành phần công nghệ

#### a. Node.js & Express.js
- **Node.js:** Môi trường thực thi JavaScript phía server xây dựng trên nền V8 Engine của Google Chrome. Node.js sử dụng mô hình I/O bất đồng bộ, hướng sự kiện (Non-blocking I/O, Event Loop), rất phù hợp với các ứng dụng web quản lý có tần suất truy vấn I/O cao (đọc/ghi CSDL) mà không làm tiêu tốn nhiều bộ nhớ RAM như mô hình đa luồng truyền thống.
- **Express.js:** Framework tối giản hàng đầu cho Node.js, cung cấp hệ thống Routing linh hoạt và kiến trúc **Middleware Pipeline**. Mỗi HTTP Request đi qua một chuỗi các middleware (xác thực token, kiểm tra vai trò admin, parse JSON body, validate dữ liệu) trước khi tới Controller.

#### b. TypeScript (Static Strict Typing)
- **Lý do lựa chọn:** Giúp phát hiện lỗi cú pháp và kiểu dữ liệu ngay trong quá trình biên dịch (Compile-time), tránh lỗi sập server lúc runtime.
- **Tính năng áp dụng trong dự án:**
  - Định nghĩa tường minh các kiểu dữ liệu cho Request Body, Response DTO, Token Payload.
  - Tự động gợi ý code (IntelliSense) giúp tăng tốc độ phát triển và giảm thiểu sai sót tên trường dữ liệu.

#### c. Prisma ORM (Thế hệ mới)
So sánh với các ORM truyền thống (như Sequelize hoặc TypeORM):
- **Ưu điểm vượt trội của Prisma:**
  1. **Tệp cấu hình tập trung (`schema.prisma`):** Khai báo schema dạng Declarative trực quan, tự động sinh mã SQL DDL.
  2. **Type-safe hoàn toàn:** Prisma Client được sinh tự động từ schema, mọi trường trong database đều được map 1:1 sang interface TypeScript. Khi gõ sai tên cột hoặc sai kiểu dữ liệu, TypeScript sẽ báo đỏ ngay lập tức.
  3. **Prisma Studio:** Công cụ GUI trực quan mở qua trình duyệt (`npx prisma studio`), giúp cán bộ hướng dẫn và lập trình viên dễ dàng duyệt, chỉnh sửa dữ liệu test trong MySQL.
  4. **Prisma Migrate / DB Push:** Quản lý phiên bản cấu trúc bảng và đẩy schema vào MySQL nhanh chóng.

#### d. MySQL 8.4
- Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở hàng đầu thế giới, đảm bảo chuẩn ACID:
  - **Atomicity (Nguyên tử):** Đảm bảo thao tác duyệt đơn đăng ký và trừ chỗ trống của phòng phải diễn ra đồng thời trong một Transaction.
  - **Consistency (Nhất quán):** Ràng buộc khóa ngoại (Foreign Keys) giữa `User`, `Room`, `Bed`, `Registration` không bị mâu thuẫn dữ liệu mồ côi.

---

### 3. Mô hình phân tầng kiến trúc Backend (Layered Architecture)

Dự án tuân thủ mô hình 4 tầng chuẩn:
1. **Routing & Middleware Layer (`src/routes/`, `src/middlewares/`):**
   - Tiếp nhận HTTP Request, kiểm tra JWT Token, chặn các request trái phép (401/403).
2. **Controller Layer (`src/controllers/`):**
   - Trích xuất dữ liệu từ `req.body`, `req.params`, `req.query`, gọi Service tương ứng và trả về JSON chuẩn hóa `{ success: boolean, data?: any, message?: string }`.
3. **Service Layer (`src/services/`):**
   - Chứa nghiệp vụ thực tế (Business Logic): mã hóa mật khẩu, kiểm tra sức chứa phòng, tự động gán giường trống đầu tiên, kết nối AI.
4. **Data Access Layer (`prisma/`):**
   - Thực thi các câu lệnh truy vấn qua `prisma.user`, `prisma.room`, `prisma.registration`.

---

### 4. Quy trình khởi chạy và các tập lệnh (npm scripts) của dự án mẫu

| Lệnh | Ý nghĩa | Môi trường |
| :--- | :--- | :---: |
| `npm run dev` | Khởi chạy server ở chế độ phát triển với `ts-node-dev` (tự động reload khi code thay đổi) | Development |
| `npm run build` | Biên dịch toàn bộ mã nguồn TypeScript sang JavaScript thuần trong thư mục `dist/` | Production |
| `npm start` | Chạy ứng dụng đã build từ `dist/server.js` | Production |
| `npx prisma generate` | Tự động sinh Prisma Client Type-safe dựa trên file `schema.prisma` | Dev & CI/CD |
| `npx prisma db push` | Đồng bộ cấu trúc bảng từ schema trực tiếp vào MySQL database | Development |
| `npx prisma studio` | Khởi động giao diện quản lý dữ liệu CSDL trực quan trên cổng `localhost:5555` | Debug & Test |

---

### 5. Kết luận đánh giá Tuần 2
- Đã nắm vững lý thuyết và vai trò của từng công nghệ trong bộ stack.
- Đã dựng thành công mã nguồn mẫu (Proof-of-Concept) chạy ổn định trên cổng `5000` với endpoint kiểm tra kết nối `/api/health`.
- Sẵn sàng chuyển sang các bước thiết lập kiến trúc CSDL và giao diện người dùng.
