# BÁO CÁO NGHIỆM THU TASK KTX-004
## THIẾT LẬP REPOSITORY VÀ CẤU TRÚC DỰ ÁN

* **Mã task:** KTX-004
* **Tên task:** Thiết lập repository và cấu trúc dự án
* **Người thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

### 1. Tiêu chí chấp nhận theo Backlog (Acceptance Criteria)

| Tiêu chí trong Backlog | Hiện trạng triển khai thực tế | Đánh giá |
| :--- | :--- | :---: |
| **Cấu trúc client/server** | - Phân hệ Client: `frontend/` xây dựng bằng Angular 21 (TypeScript, Standalone Components, Routing).<br>- Phân hệ Server: `backend/` xây dựng bằng Node.js + Express + TypeScript + Prisma ORM. |  **ĐẠT** |
| **Tài liệu README** | - File `README.md` tại thư mục gốc mô tả tổng quan đề tài, bảng phân loại công nghệ, sơ đồ cây thư mục chi tiết và lệnh khởi chạy từng phân hệ. |  **ĐẠT** |
| **Cấu hình môi trường mẫu** | - Backend: File `backend/.env.example` liệt kê đầy đủ các biến mẫu (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`).<br>- Frontend: File `frontend/src/environments/environment.ts` và `environment.development.ts`. |  **ĐẠT** |
| **Không đưa secret lên Git** | - File `.gitignore` cấu hình chặn tuyệt đối file `.env`, `*.pem`, `*.key`, `credentials.json`, `node_modules/` và các file tạm.<br>- Đã kiểm tra commit history: không có bất kỳ secret/password nào bị commit. |  **ĐẠT** |

---

### 2. Sơ đồ cây thư mục chuẩn hóa (Project Structure)

```text
Dormitory-Management-System/
├── backend/                              # Máy chủ API (Node.js + Express + TypeScript)
│   ├── prisma/                           # Mô hình CSDL Prisma & Seed data
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/                       # env.ts, prisma.ts
│   │   ├── controllers/                  # Tiếp nhận và xử lý HTTP Request
│   │   ├── middlewares/                  # errorHandler.ts, JWT auth guards
│   │   ├── routes/                       # health.routes.ts, index.ts
│   │   ├── services/                     # Business logic
│   │   ├── types/                        # ApiResponse, JwtUserPayload interfaces
│   │   ├── app.ts                        # Cấu hình Express, CORS, JSON Parser
│   │   └── server.ts                     # HTTP Server entry point
│   ├── .env.example                      # Template cấu hình môi trường
│   ├── package.json
│   └── tsconfig.json
├── frontend/                             # Giao diện người dùng (Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                     # Singleton services, guards, interceptors
│   │   │   ├── features/                 # Modules chức năng Client & Admin
│   │   │   ├── shared/                   # Shared UI components, pipes
│   │   │   ├── app.config.ts             # Application routing & providers
│   │   │   ├── app.routes.ts             # Route definitions
│   │   │   └── app.ts                    # Root component
│   │   ├── environments/                 # Cấu hình API endpoint môi trường dev/prod
│   │   │   ├── environment.ts
│   │   │   └── environment.development.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── docs/                                 # Tài liệu báo cáo & thiết kế
│   ├── TUAN_1_CO_CAU_CONG_CU.md          # KTX-001
│   ├── KHAO_SAT_YEU_CAU_NGHIEP_VU.md     # KTX-002
│   ├── TUAN_2_STACK_CONG_NGHE.md         # KTX-003
│   ├── BAO_CAO_KTX_004_CAU_TRUC_DU_AN.md # KTX-004
│   └── THIET_KE_KIEN_TRUC_CSDL.md        # KTX-005
├── .gitignore                            # Quy tắc an toàn bảo mật mã nguồn
└── README.md                             # Hướng dẫn chi tiết dự án
```

---

### 3. Kết luận
Task KTX-004 đã hoàn thành xuất sắc, đáp ứng 100% các tiêu chí chấp nhận của EPIC A. Toàn bộ nền tảng client/server và các quy tắc bảo mật mã nguồn đã sẵn sàng để chuyển sang task KTX-005 (Thiết kế sơ bộ kiến trúc và dữ liệu).
