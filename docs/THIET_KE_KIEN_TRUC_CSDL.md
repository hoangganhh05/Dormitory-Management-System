# THIẾT KẾ SƠ BỘ KIẾN TRÚC VÀ CƠ SỞ DỮ LIỆU (KTX-005)

* **Dự án:** Hệ thống Quản lý Ký túc xá tích hợp AI (Dormitory Management System)
* **Người thực hiện:** Phạm Thị Ngọc Ánh

---

## 1. Sơ đồ kiến trúc thành phần (Component Architecture)

```mermaid
flowchart TD
    subgraph Frontend["Giao diện Người dùng (Frontend)"]
        ClientApp["Client Portal (Sinh viên)<br>- Đăng ký lưu trú<br>- Xem thông tin phòng<br>- Báo hỏng thiết bị<br>- Trò chuyện với AI Chatbot"]
        AdminApp["Admin Dashboard (Ban quản lý)<br>- Thống kê phòng/giường<br>- Duyệt đơn đăng ký<br>- Phân công sửa chữa<br>- Đăng thông báo KTX"]
    end

    subgraph API_Gateway["Tầng API & Middleware (Express + TypeScript)"]
        AuthMid["JWT Auth & Role Guard"]
        CorsMid["CORS & Error Handler"]
        Routes["API Endpoints (/api/v1)<br>/auth, /rooms, /registrations, /issues, /ai"]
    end

    subgraph Business_Services["Tầng Dịch vụ Nghiệp vụ (Services)"]
        AuthService["Auth & User Service"]
        RoomService["Room & Bed Service"]
        RegService["Registration & Allocation Service"]
        IssueService["Maintenance Request Service"]
        AIService["Gemini AI Integration Service"]
    end

    subgraph External_Services["Dịch vụ Ngoài"]
        GeminiAPI["Google Gemini 1.5 Flash / Pro API"]
    end

    subgraph Data_Storage["Lưu trữ Dữ liệu"]
        PrismaClient["Prisma ORM Client"]
        MySQL_DB[("MySQL Database<br>dormitory_db")]
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

## 2. Mô hình thực thể quan hệ (ERD - Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ Registration : submits
    User ||--o{ MaintenanceRequest : reports
    User ||--o{ Notification : receives
    User ||--o{ ChatLog : interacts
    Room ||--o{ Bed : contains
    Room ||--o{ MaintenanceRequest : located_in
    Bed ||--o| Registration : allocated_to
    Bed ||--o| User : occupied_by

    User {
        int id PK
        string email UK
        string password
        string fullName
        string studentCode UK
        string phone
        string gender
        string role "ADMIN / STUDENT"
        datetime createdAt
        datetime updatedAt
    }

    Room {
        int id PK
        string roomNumber UK
        string building
        int floor
        string roomType "STANDARD / VIP"
        decimal pricePerMonth
        int capacity
        int currentOccupancy
        string status "AVAILABLE / FULL / MAINTENANCE"
        datetime createdAt
        datetime updatedAt
    }

    Bed {
        int id PK
        string bedNumber
        int roomId FK
        int occupiedById FK "nullable"
        string status "VACANT / OCCUPIED / RESERVED"
        datetime createdAt
        datetime updatedAt
    }

    Registration {
        int id PK
        int userId FK
        int preferredRoomId FK "nullable"
        int allocatedBedId FK "nullable"
        string semester
        string academicYear
        datetime startDate
        datetime endDate
        string status "PENDING / APPROVED / REJECTED / CANCELLED"
        string note
        datetime createdAt
        datetime updatedAt
    }

    MaintenanceRequest {
        int id PK
        int userId FK
        int roomId FK
        string title
        string description
        string urgency "LOW / MEDIUM / HIGH"
        string status "PENDING / PROCESSING / RESOLVED / REJECTED"
        string adminFeedback
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        int id PK
        string title
        string content
        string targetRole "ALL / STUDENT / ADMIN"
        datetime createdAt
    }

    ChatLog {
        int id PK
        int userId FK "nullable"
        string userMessage
        string botReply
        string sessionId
        datetime createdAt
    }
```

---

## 3. Đặc tả chi tiết các bảng dữ liệu chính

1. **`User`**: Lưu thông tin tài khoản người dùng, phân quyền qua trường `role` (`ADMIN` hoặc `STUDENT`). Đối với sinh viên, có lưu mã sinh viên (`studentCode`), số điện thoại, giới tính để phục vụ phân phòng theo giới tính.
2. **`Room`**: Quản lý thông tin từng phòng: số phòng, tòa nhà, tầng, loại phòng, đơn giá, sức chứa tối đa và số người đang ở thực tế.
3. **`Bed`**: Quản lý chi tiết từng giường trong phòng để ngăn ngừa hiện tượng xếp trùng giường (`status`: VACANT, OCCUPIED, RESERVED).
4. **`Registration`**: Quản lý phiếu xin lưu trú KTX của sinh viên kèm trạng thái xét duyệt của Ban quản lý.
5. **`MaintenanceRequest`**: Quản lý các yêu cầu sửa chữa cơ sở vật chất phát sinh từ sinh viên.
6. **`Notification`**: Bảng tin thông báo chung của KTX.
7. **`ChatLog`**: Lưu vết các phiên hội thoại với AI để đánh giá chất lượng câu trả lời của trợ lý ảo Gemini.
