# BÁO CÁO THỰC TẬP - TUẦN 2
## TÌM HIỂU CÔNG NGHỆ NỀN TẢNG SỬ DỤNG TRONG DỰ ÁN (KTX-003)
### (Node.js, Express, TypeScript, Prisma, MySQL)

* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh - DTC235200050
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

### 1. Tổng quan vai trò của từng công nghệ trong hệ thống

```text
[Client / Admin Web App] 
          |  (HTTP/RESTful JSON)
          v
[Express Web Server + TypeScript]  --> [Business Services & Auth Guard]
          |                                      |
          |                                      v
          |--------------------------> [Gemini AI Service]
          v
   [Prisma ORM Client]
          |  (SQL Queries)
          v
  [MySQL 8.4 Database]
```

#### a. Node.js & Express
- **Node.js:** Môi trường thực thi JavaScript phía server (Runtime) dựa trên V8 engine của Google Chrome, hoạt động theo mô hình bất đồng bộ hướng sự kiện (Non-blocking I/O, Event-driven), cho phép xử lý hàng ngàn kết nối đồng thời với hiệu năng cao và sử dụng ít tài nguyên.
- **Express.js:** Framework tối giản và linh hoạt nhất cho Node.js, cung cấp hệ thống Routing mạnh mẽ, cơ chế Middleware dễ mở rộng để xử lý CORS, phân quyền, parse dữ liệu body JSON và xử lý lỗi tập trung.

#### b. TypeScript
- Ngôn ngữ mã nguồn mở phát triển bởi Microsoft, là phần mở rộng có kiểu tĩnh (Strict Static Typing) cho JavaScript.
- **Lợi ích trong dự án:**
  - Bắt lỗi ngay trong quá trình biên dịch (Compile-time type checking), giảm thiểu tối đa các lỗi runtime phổ biến như `TypeError: Cannot read properties of undefined`.
  - Khả năng tự động gợi ý code (IntelliSense) vượt trội trong Visual Studio Code, tăng tốc độ lập trình.
  - Định nghĩa rõ ràng các `Interface`, `DTO` (Data Transfer Object) cho request và response của API.

#### c. Prisma ORM
- Công cụ ORM (Object-Relational Mapping) thế hệ mới dành cho Node.js & TypeScript.
- **Thành phần cốt lõi:**
  1. **Prisma Schema (`schema.prisma`):** Nơi định nghĩa tập trung cấu trúc CSDL và các mối quan hệ (1-1, 1-n, n-n) bằng cú pháp khai báo trực quan, thân thiện.
  2. **Prisma Client:** Thư viện truy vấn CSDL được tự động sinh (auto-generated) dựa trên schema, mang lại trải nghiệm **Type-safe Database Queries** tuyệt đối.
  3. **Prisma Migrate:** Quản lý lịch sử thay đổi cấu trúc bảng CSDL một cách nhất quán và có thể rollback khi cần.
  4. **Prisma Studio:** Giao diện trực quan tích hợp sẵn trên trình duyệt để xem và chỉnh sửa dữ liệu trong MySQL nhanh chóng.

#### d. MySQL 8.4
- Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở phổ biến hàng đầu thế giới, đảm bảo tính toàn vẹn dữ liệu tuân thủ chuẩn ACID.
- Đóng vai trò lưu trữ toàn bộ dữ liệu nghiệp vụ của hệ thống KTX: Người dùng, Tòa nhà, Phòng, Giường, Phiếu đăng ký, Báo hỏng, Thông báo.

---

### 2. Mô hình kiến trúc phân tầng (Layered Architecture) trong Backend

Backend được tổ chức theo kiến trúc 3 tầng chuẩn công nghiệp:
1. **Controller Layer (`src/controllers/`):** Tiếp nhận HTTP Request từ client, gọi tầng Service để xử lý và trả về HTTP Response (mã status 200, 201, 400, 401, 404, 500 kèm dữ liệu JSON).
2. **Service Layer (`src/services/`):** Chứa toàn bộ nghiệp vụ (Business Logic) của hệ thống (ví dụ: kiểm tra phòng còn giường trống không trước khi lưu đơn, mã hóa mật khẩu bằng bcrypt, tạo JWT token, format prompt cho Gemini AI).
3. **Data Access Layer (`prisma/`):** Tương tác trực tiếp với MySQL thông qua Prisma Client để thực hiện các thao tác CRUD.
4. **Middleware Layer (`src/middlewares/`):** Kiểm tra JWT token (`authMiddleware`), kiểm tra vai trò admin (`adminOnlyMiddleware`), kiểm tra tính hợp lệ của dữ liệu đầu vào (`validateMiddleware`).

---

### 3. Quy trình thiết lập và khởi chạy dự án mẫu (Proof-of-Concept)

1. **Khởi tạo dự án TypeScript:**
   - Cài đặt `typescript`, `ts-node-dev`, `@types/node`, `@types/express`.
   - Cấu hình file `tsconfig.json` với `module: "commonjs"`, `target: "ES2022"`, `strict: true`.
2. **Cấu hình Prisma:**
   - Cài đặt `@prisma/client` và `prisma` (devDependencies).
   - Chạy lệnh `npx prisma init --datasource-provider mysql`.
   - Cấu hình chuỗi kết nối `DATABASE_URL` trong file `.env`.
3. **Tạo mã nguồn mẫu và kiểm tra kết nối:**
   - Tạo endpoint `GET /api/health` trả về trạng thái server `uptime`, `timestamp` và `dbStatus`.
