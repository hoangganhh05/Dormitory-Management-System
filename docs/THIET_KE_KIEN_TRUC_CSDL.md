# THIẾT KẾ SƠ BỘ KIẾN TRÚC VÀ CƠ SỞ DỮ LIỆU (KTX-005)

* **Dự án:** Hệ thống Quản lý Ký túc xá tích hợp AI (Dormitory Management System)
* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (Lớp CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

## 1. Sơ đồ kiến trúc thành phần (Component Architecture)

```mermaid
flowchart TD
    subgraph Frontend_App["Phân hệ Giao diện (Frontend - Angular)"]
        ClientApp["Client Portal (Sinh viên)<br>- Đăng ký lưu trú<br>- Xem thông tin phòng & giường<br>- Gửi phiếu báo hỏng thiết bị<br>- Trò chuyện cùng Trợ lý AI (Gemini)"]
        AdminApp["Admin Dashboard (Ban Quản lý KTX)<br>- Thống kê công suất phòng/giường<br>- Xét duyệt đơn đăng ký lưu trú<br>- Quản lý & phân công sửa chữa<br>- Đăng tải thông báo chung"]
    end

    subgraph API_Gateway["Tầng API Gateway & Middleware (Express + TypeScript)"]
        AuthMid["JWT Auth & Role Guard"]
        CorsMid["CORS & Error Handler"]
        Routes["API Endpoints (/api/v1)<br>/auth, /rooms, /registrations, /issues, /ai"]
    end

    subgraph Business_Services["Tầng Dịch vụ Nghiệp vụ (Business Services)"]
        AuthService["Auth & User Service"]
        RoomService["Room & Bed Allocation Service"]
        RegService["Registration Workflow Service"]
        IssueService["Maintenance Request Service"]
        AIService["Gemini AI Integration Service"]
    end

    subgraph External_AI["Dịch vụ Trí tuệ Nhân tạo"]
        GeminiAPI["Google Gemini 1.5 Flash API<br>(Xử lý câu hỏi tự nhiên & tra cứu nội quy KTX)"]
    end

    subgraph Data_Storage["Tầng Lưu trữ & ORM"]
        PrismaClient["Prisma ORM Client v6"]
        MySQL_DB[("MySQL Database 8.4<br>database: dormitory_db")]
    end

    ClientApp -->|HTTP REST / JSON| AuthMid
    AdminApp -->|HTTP REST / JSON| AuthMid
    AuthMid --> CorsMid --> Routes
    Routes --> AuthService & RoomService & RegService & IssueService & AIService
    AIService -->|Google Generative AI SDK| GeminiAPI
    AuthService & RoomService & RegService & IssueService --> PrismaClient
    PrismaClient -->|Connection Pool| MySQL_DB
```

---

## 2. Sơ đồ quan hệ thực thể CSDL (ERD - Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ Registration : submits
    User ||--o{ MaintenanceRequest : reports
    User ||--o{ ChatLog : interacts
    User ||--o| Bed : occupies
    Room ||--o{ Bed : contains
    Room ||--o{ MaintenanceRequest : located_in
    Room ||--o{ Registration : preferred_by
    Bed ||--o{ Registration : allocated_to

    User {
        int id PK "Tự tăng"
        string email UK "Duy nhất"
        string password "Bcrypt hash"
        string fullName "Họ tên"
        string studentCode UK "Mã sinh viên"
        string phone "Số điện thoại"
        string gender "MALE / FEMALE / OTHER"
        string role "ADMIN / STUDENT"
        datetime createdAt
        datetime updatedAt
    }

    Room {
        int id PK "Tự tăng"
        string roomNumber UK "Số phòng (VD: A101)"
        string building "Tên tòa nhà (Tòa A, Tòa B)"
        int floor "Tầng"
        string roomType "STANDARD / VIP"
        decimal pricePerMonth "Đơn giá tháng"
        int capacity "Sức chứa tối đa"
        int currentOccupancy "Số người đang ở"
        string status "AVAILABLE / FULL / MAINTENANCE"
        text description "Ghi chú tiện ích"
        datetime createdAt
        datetime updatedAt
    }

    Bed {
        int id PK "Tự tăng"
        string bedNumber "Số giường (G1, G2,...)"
        int roomId FK "Mã phòng"
        int occupiedById FK "Mã người ở (nullable)"
        string status "VACANT / OCCUPIED / RESERVED"
        datetime createdAt
        datetime updatedAt
    }

    Registration {
        int id PK "Tự tăng"
        int userId FK "Sinh viên nộp đơn"
        int preferredRoomId FK "Phòng nguyện vọng"
        int allocatedBedId FK "Giường được gán"
        string semester "Học kỳ"
        string academicYear "Năm học"
        datetime startDate "Ngày bắt đầu ở"
        datetime endDate "Ngày kết thúc"
        string status "PENDING / APPROVED / REJECTED / CANCELLED"
        text note "Ghi chú sinh viên"
        text rejectionReason "Lý do từ chối (nếu có)"
        datetime createdAt
        datetime updatedAt
    }

    MaintenanceRequest {
        int id PK "Tự tăng"
        int userId FK "Sinh viên báo hỏng"
        int roomId FK "Phòng xảy ra sự cố"
        string title "Tiêu đề hỏng hóc"
        text description "Mô tả chi tiết"
        string urgency "LOW / MEDIUM / HIGH"
        string status "PENDING / PROCESSING / RESOLVED / REJECTED"
        text adminFeedback "Phản hồi ban quản lý"
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        int id PK "Tự tăng"
        string title "Tiêu đề thông báo"
        text content "Nội dung thông báo"
        string targetRole "ALL / STUDENT / ADMIN"
        boolean isPinned "Ghim lên đầu trang"
        datetime createdAt
        datetime updatedAt
    }

    ChatLog {
        int id PK "Tự tăng"
        int userId FK "Sinh viên hỏi (nullable)"
        string sessionId "Phiên làm việc"
        text userMessage "Câu hỏi của sinh viên"
        text botReply "Câu trả lời của AI"
        datetime createdAt
    }
```

---

## 3. Rà soát tính toàn vẹn và Ràng buộc dữ liệu (Integrity & Constraints)

1. **Ràng buộc duy nhất (Unique Constraints):**
   - `User.email`: Mỗi tài khoản một email duy nhất.
   - `User.studentCode`: Mã sinh viên duy nhất trong hệ thống.
   - `Room.roomNumber`: Số hiệu phòng duy nhất.
   - `[Bed.roomId, Bed.bedNumber]`: Khóa tổ hợp đảm bảo trong cùng một phòng không thể có 2 giường trùng số hiệu.
2. **Quy tắc xóa dữ liệu (Referential Actions):**
   - Khi xóa `Room`: Tự động xóa danh sách `Bed` thuộc phòng (`onDelete: Cascade`).
   - Khi xóa `User`: Xóa phiếu `Registration` và `MaintenanceRequest` tương ứng (`onDelete: Cascade`), nếu sinh viên đang ở giường thì chuyển `occupiedById` về `NULL` (`onDelete: SetNull`).
3. **Chiến lược phân phòng an toàn (Data Race Prevention):**
   - Sử dụng Transaction trong Prisma khi Admin duyệt đơn: kiểm tra trạng thái giường là `VACANT`, đổi giường sang `OCCUPIED`, gán `occupiedById` cho sinh viên và tăng `currentOccupancy` của phòng lên 1.

---

## 4. Biên bản rà soát thiết kế kiến trúc và CSDL (Architecture Sign-off)

- **Người thiết kế:** Phạm Thị Ngọc Ánh
- **Người rà soát:** Lê Anh Duy (Cán bộ hướng dẫn TFL)
- **Kết luận:** Mô hình kiến trúc 4 tầng và thiết kế CSDL 7 thực thể đã đáp ứng đầy đủ yêu cầu nghiệp vụ quản lý ký túc xá, đảm bảo chuẩn hóa dữ liệu (3NF) và có kịch bản nạp dữ liệu mẫu (`seed.ts`) hoàn chỉnh. Phê duyệt chuyển sang giai đoạn xây dựng giao diện và chức năng.
