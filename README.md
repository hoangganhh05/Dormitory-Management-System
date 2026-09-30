# HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ TÍCH HỢP TRỢ LÝ AI (DORMITORY MANAGEMENT SYSTEM)

[![Angular](https://img.shields.io/badge/Angular-17%2B-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-25.x-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.18-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%201.5-8E75C2?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![Spartan UI](https://img.shields.io/badge/UI-Spartan%20B2B%20SaaS-0F172A?style=flat)](https://spartan.ng/)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-12%2F12%20Passed%20(100%25)-059669?style=flat)](./backend/src/scripts/run-e2e-tests.ts)

> **Báo cáo và Sản phẩm Thực tập Tốt nghiệp / Chuyên môn**
> - **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh — **Mã sinh viên:** `DTC235200050`
> - **Lớp:** CNTT K22H — Khoa Công nghệ Thông tin
> - **Trường:** Đại học Công nghệ Thông tin & Truyền thông — Đại học Thái Nguyên (ICTU)
> - **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
> - **Cán bộ hướng dẫn (TFL):** Lê Anh Duy (SĐT: 0967.862.569)
> - **Giảng viên quản lý (ICTU):** ThS. Trương Thị Hằng Nga (SĐT: 0985.333.555)

---

## 1. Giới thiệu tổng quan Đề tài

Dự án **Hệ thống Quản lý Ký túc xá Tích hợp AI (Dormitory Management System)** được nghiên cứu và phát triển nhằm giải quyết triệt để các hạn chế của quy trình quản lý ký túc xá thủ công truyền thống:
- **Tự động hóa luồng tiếp nhận & xếp phòng:** Sinh viên nộp đơn online, hệ thống tự động kiểm tra chỉ tiêu sức chứa phòng theo giới tính (Tòa A dành cho Nam, Tòa B dành cho Nữ), hỗ trợ Ban Quản lý duyệt và tự động gán vị trí giường trống.
- **Tiếp nhận & điều phối sửa chữa cơ sở vật chất:** Tiếp nhận phản ánh hư hỏng thiết bị (điện, nước, khóa cửa), cập nhật tiến độ xử lý và gửi phản hồi cho sinh viên.
- **Trợ lý ảo AI đàm thoại thông minh (Google Gemini):** Tư vấn 24/7 về quy chế, nội quy giờ giấc, biểu phí, hướng dẫn thủ tục; tích hợp cơ chế cá nhân hóa nhận diện phòng ở, bạn cùng phòng của từng sinh viên và cơ chế Fallback Engine bảo đảm hệ thống hoạt động liên tục ngay cả khi mất kết nối ngoài.
- **Bảng điều khiển Giám sát dành cho Admin:** Đo lường tải AI, thống kê câu hỏi theo thời gian thực và quản trị toàn diện danh mục phòng, giường, sinh viên, đơn từ.

---

## 2. Kiến trúc Công nghệ (Technology Stack)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND: ANGULAR 17+                              │
│  - Kiến trúc Standalone Components, Signal-based State Management       │
│  - Thiết kế chuẩn Spartan UI & Tailwind CSS Enterprise B2B SaaS         │
│  - Tuân thủ nghiêm ngặt Anti-AI Slop (Minimalist, Neutral Slate/Zinc)   │
│  - Chat Widget nổi góc màn hình với auto-scroll, markdown rendering     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP (RESTful JSON / JWT Auth)
┌────────────────────────────────────▼────────────────────────────────────┐
│                  BACKEND: NODE.JS / EXPRESS / TYPESCRIPT                │
│  - 4-Tier Layered Architecture (Routes, Controllers, Services, Prisma)  │
│  - Bảo mật JWT Token, Middleware phân quyền RBAC (ADMIN vs STUDENT)     │
│  - Google Generative AI SDK (gemini-1.5-flash) Server-Side Proxy        │
│  - Rule-based Knowledge Base Fallback Engine (KTX ICTU 10 Điều nội quy) │
│  - Personalized User Context Grounding & Privacy Guard                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Prisma Client (Type-Safe Query)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    DATABASE: MYSQL 8.4 COMMUNITY SERVER                 │
│  - Chuẩn quan hệ ACID (InnoDB), ràng buộc toàn vẹn khóa ngoại (FK)       │
│  - 9 Bảng thực thể: users, rooms, beds, registrations,                   │
│    maintenance_requests, notifications, notification_reads,             │
│    chat_logs, bed_allocation_histories                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cấu trúc thư mục Dự án

```text
Dormitory-Management-System/
├── backend/                             # Mã nguồn Backend API
│   ├── prisma/
│   │   ├── schema.prisma                # Schema CSDL 9 bảng thực thể quan hệ
│   │   └── seed.ts                      # Script nạp dữ liệu mẫu ban đầu (Admin, SV, Phòng)
│   ├── src/
│   │   ├── config/                      # Cấu hình môi trường (env), Prisma Client
│   │   ├── controllers/                 # Tầng điều khiển nghiệp vụ (Auth, Room, Reg, Maintenance, AI...)
│   │   ├── middlewares/                 # Xử lý lỗi tập trung, xác thực JWT
│   │   ├── routes/                      # Định tuyến RESTful endpoints
│   │   ├── services/                    # Tầng nghiệp vụ lõi & Gemini Service Proxy
│   │   ├── scripts/
│   │   │   └── run-e2e-tests.ts         # Bộ kiểm thử tích hợp tự động hóa E2E 12 bước
│   │   ├── app.ts                       # Cấu hình Express app & CORS
│   │   └── server.ts                    # Entry point cổng 5000
│   ├── package.json
│   └── tsconfig.json
├── frontend/                            # Mã nguồn Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                    # Guards, Interceptors, HTTP Services (Auth, Room, Reg, AI...)
│   │   │   ├── features/
│   │   │   │   ├── auth/                # Màn hình Đăng nhập & Đăng ký
│   │   │   │   ├── client/              # Cổng thông tin Sinh viên (Dashboard, Phòng, Báo hỏng, Đơn từ...)
│   │   │   │   └── admin/               # Bảng điều khiển Quản trị (Dashboard, Quản lý phòng, Duyệt đơn, AI Logs...)
│   │   │   └── shared/
│   │   │       └── chat-widget/         # Component Chat Widget AI nổi toàn trang (Signal-based)
│   │   ├── environments/                # Cấu hình biến môi trường Frontend
│   │   └── styles.css                   # Thiết kế Spartan UI & Tailwind Palette
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── docs/                                # Tài liệu kỹ thuật & Báo cáo chuyên đề các tuần
│   ├── TUAN_1_CO_CAU_CONG_CU.md
│   ├── TUAN_2_STACK_CONG_NGHE.md
│   ├── KHAO_SAT_YEU_CAU_NGHIEP_VU.md
│   ├── THIET_KE_KIEN_TRUC_CSDL.md
│   ├── KE_HOACH_LUONG_MAN_HINH_SITEMAP.md
│   ├── BAO_CAO_KTX_020_QUAN_LY_TAI_KHOAN_DANG_NHAP.md
│   ├── BAO_CAO_KTX_021_HO_SO_LUU_TRU.md
│   ├── BAO_CAO_KTX_022_QUAN_LY_KHU_PHONG_SUC_CHUA.md
│   ├── BAO_CAO_KTX_023_DANG_KY_VA_XU_LY_HO_SO.md
│   ├── BAO_CAO_KTX_024_PHAN_PHONG_VA_THEO_DOI_LUU_TRU.md
│   ├── BAO_CAO_KTX_025_TRA_CUU_THONG_TIN_VA_THONG_BAO.md
│   ├── BAO_CAO_KTX_026_QUAN_LY_SUA_CHUA_THIET_BI.md
│   ├── BAO_CAO_KTX_030_NGHIEN_CUU_VA_TICH_HOP_GEMINI.md
│   ├── BAO_CAO_KTX_032_LICH_SU_HOI_THOAI_VA_NGU_CANH_AI.md
│   ├── BAO_CAO_KTX_033_CA_NHAN_HOA_TRO_LY_AI.md
│   ├── BAO_CAO_KTX_034_GIAM_SAT_NHAT_KY_TRO_LY_AI.md
│   ├── BAO_CAO_KTX_040_KIEM_THU_TICH_HOP_TOAN_DIEN_E2E.md
│   └── BAO_CAO_TONG_KET_THUC_TAP_TOT_NGHIEP.md
├── .gitignore
└── README.md
```

---

## 4. Hướng dẫn Cài đặt & Khởi chạy Hệ thống

### Bước 1: Khởi động Cơ sở dữ liệu MySQL
- Đảm bảo dịch vụ MySQL đang chạy trên cổng `3306` (CSDL: `dormitory_db`).
- Cấu hình chuỗi kết nối trong `backend/.env`:
  ```env
  DATABASE_URL="mysql://root:password@localhost:3306/dormitory_db"
  PORT=5000
  JWT_SECRET="tfl-dormitory-jwt-secret-key-2026"
  GEMINI_API_KEY="" # (Tùy chọn: có thể để trống, hệ thống tự động kích hoạt Fallback Engine)
  GEMINI_MODEL="gemini-1.5-flash"
  ```

### Bước 2: Cài đặt và Khởi chạy Backend
```bash
cd backend
npm install
npx prisma db push        # Đồng bộ cấu trúc bảng vào MySQL
npm run prisma:seed       # Nạp dữ liệu mẫu ban đầu (Admin, Sinh viên, Phòng mẫu)
npm run dev               # Khởi chạy server phát triển trên cổng 5000
```
- Endpoint kiểm tra sức khỏe server: `http://localhost:5000/api/health`

### Bước 3: Cài đặt và Khởi chạy Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npx ng serve
```
- Truy cập ứng dụng tại: `http://localhost:4200`

---

## 5. Tài khoản Kiểm thử Mẫu (Demo Credentials)

| Vai trò | Tên người dùng | Tên đăng nhập / Email | Mật khẩu | Chức năng chính |
|:---|:---|:---|:---:|:---|
| **Admin** (Ban Quản lý) | Ban Quản Lý KTX | `admin@dormitory.com` | `123456` | Toàn quyền quản trị phòng, giường, xét duyệt đơn, phân công sửa chữa, giám sát nhật ký AI |
| **Sinh viên** (Nữ) | Phạm Thị Ngọc Ánh | `ngocanh.cntt@ictu.edu.vn`<br>*(hoặc MSV: `DTC235200050`)* | `123456` | Đang ở phòng B101 (Tòa B Nữ) - Giường G1, tra cứu bạn cùng phòng, gửi phiếu sửa chữa, chat AI cá nhân hóa |
| **Sinh viên** (Nam) | Nguyễn Văn An | `vanan.cntt@ictu.edu.vn`<br>*(hoặc MSV: `DTC235200088`)* | `123456` | Nộp đơn đăng ký phòng Tòa A, theo dõi tiến độ xét duyệt |

---

## 6. Chạy Bộ Kiểm thử Tích hợp Toàn diện (E2E Test)

Hệ thống được tích hợp sẵn kịch bản kiểm thử tự động hóa 12 bước bao phủ toàn bộ các luồng liên hoàn:
```bash
cd backend
npm run test:e2e
```
**Kết quả thực tế:**
```
================================================================
  KTX-040: CHẠY BỘ KIỂM THỬ TÍCH HỢP TOÀN DIỆN HỆ THỐNG (E2E)  
  Hệ thống Quản lý Ký túc xá Tích hợp AI - ICTU & TFL Tech      
================================================================
=> TỔNG KẾT: 12/12 bài kiểm thử thành công (100.0%).
🎉 TẤT CẢ CÁC LUỒNG TÍCH HỢP HỆ THỐNG ĐÃ HOẠT ĐỘNG HOÀN HẢO 100%!
```

---

## 7. Bảng Tổng kết Các Nhiệm vụ Đã Hoàn Thành (Sprint Tracking)

| Epic | Mã Task | Tên nhiệm vụ | Trạng thái |
|:---:|:---:|:---|:---:|
| **EPIC A** | `KTX-001` $\rightarrow$ `KTX-005` | Khảo sát nghiệp vụ, thiết lập Git Flow, CI/CD Actions, Kiến trúc CSDL Prisma | ✅ Hoàn thành |
| **EPIC B** | `KTX-010` $\rightarrow$ `KTX-014` | Sitemap & User Flows, Khung giao diện Client & Admin (Spartan B2B SaaS) | ✅ Hoàn thành |
| **EPIC C** | `KTX-020` | Quản lý Tài khoản & Đăng nhập (JWT, Phân quyền RBAC) | ✅ Hoàn thành |
| | `KTX-021` | Hồ sơ cá nhân & Quản lý thông tin lưu trú sinh viên | ✅ Hoàn thành |
| | `KTX-022` | Quản lý Danh mục Tòa nhà, Tầng, Phòng & Sức chứa giường | ✅ Hoàn thành |
| | `KTX-023` | Quy trình Nộp đơn và Xét duyệt Đăng ký lưu trú | ✅ Hoàn thành |
| | `KTX-024` | Phân phòng tự động & Lịch sử biến động lưu trú (Check-in / Transfer) | ✅ Hoàn thành |
| | `KTX-025` | Bảng tin thông báo KTX & Theo dõi trạng thái đã đọc | ✅ Hoàn thành |
| | `KTX-026` | Quản lý Phiếu báo hỏng cơ sở vật chất & Điều phối sửa chữa | ✅ Hoàn thành |
| **EPIC D** | `KTX-030` | Nghiên cứu SDK Gemini AI, Kiến trúc Server Proxy & Fallback Engine | ✅ Hoàn thành |
| | `KTX-031` | Xây dựng Floating AI Chatbot Widget trong Angular (Signal-based) | ✅ Hoàn thành |
| | `KTX-032` | Lưu trữ Lịch sử Hội thoại `localStorage` & Duy trì Ngữ cảnh Đa lượt | ✅ Hoàn thành |
| | `KTX-033` | Tích hợp AI Cá nhân hóa theo Ngữ cảnh Sinh viên (User Context Grounding) | ✅ Hoàn thành |
| | `KTX-034` | Phân hệ Giám sát Trợ lý AI, Bảng điều khiển KPIs & Lưu trữ `chat_logs` | ✅ Hoàn thành |
| **EPIC E** | `KTX-040` | Bộ kiểm thử tích hợp toàn diện đầu - cuối E2E (12/12 Passed - 100%) & Tìm hiểu quy trình nghiệm thu CS113 Hải Phòng | ✅ Hoàn thành |
| | `KTX-041` | Đóng gói sản phẩm, kiểm thử các luồng chức năng Client/Admin & Báo cáo tổng kết | ✅ Hoàn thành |
| | `KTX-042` | Rà soát ma trận phân quyền (RBAC Audit 15/15 Passed) & An toàn dữ liệu, chống rò rỉ secret/PII | ✅ Hoàn thành |
| | `KTX-043` | Chuẩn bị bản demo an toàn, kịch bản thuyết trình nghiệm thu 5 màn & Launcher 1 chạm | ✅ Hoàn thành |
| | `KTX-044` | Hoàn thiện trọn bộ 8 báo cáo tuần theo đề cương đã ký & Tổng kết bàn giao hồ sơ thực tập | ✅ Hoàn thành |

---

## 📚 Trọn bộ Hồ sơ 8 Tuần Thực tập Tốt nghiệp (Khớp 100% Đề cương)

| Tuần | Nội dung công việc theo Đề cương Đã duyệt | File Báo cáo Chi tiết |
| :---: | :--- | :--- |
| **Tuần 1** | Tìm hiểu cơ cấu tổ chức, văn hóa công ty TFL và cài đặt công cụ làm việc. | [`docs/TUAN_1_CO_CAU_CONG_CU.md`](file:///e:/Dormitory-Management-System/docs/TUAN_1_CO_CAU_CONG_CU.md) |
| **Tuần 2** | Tìm hiểu các công nghệ nền tảng sử dụng trong dự án (Node.js, Express, TypeScript, Prisma, MySQL). | [`docs/TUAN_2_STACK_CONG_NGHE.md`](file:///e:/Dormitory-Management-System/docs/TUAN_2_STACK_CONG_NGHE.md) |
| **Tuần 3** | Tìm hiểu về tích hợp AI Chatbot (Gemini 1.5 Flash, Server Proxy, Fallback Engine). | [`docs/TUAN_3_TICH_HOP_AI_GEMINI.md`](file:///e:/Dormitory-Management-System/docs/TUAN_3_TICH_HOP_AI_GEMINI.md) |
| **Tuần 4** | Quy trình nghiệm thu dự án thực tế: Hệ thống tiếp nhận thông tin và giám sát cuộc gọi Cảnh sát 113 - Công an tỉnh Hải Phòng. | [`docs/TUAN_4_QUY_TRINH_NGHIEM_THU_CS113.md`](file:///e:/Dormitory-Management-System/docs/TUAN_4_QUY_TRINH_NGHIEM_THU_CS113.md) |
| **Tuần 5** | Lên kế hoạch xây dựng hệ thống quản lý KTX (Khảo sát nghiệp vụ, User Flows, CSDL 9 bảng). | [`docs/TUAN_5_KE_HOACH_XAY_DUNG_KTX.md`](file:///e:/Dormitory-Management-System/docs/TUAN_5_KE_HOACH_XAY_DUNG_KTX.md) |
| **Tuần 6** | Xây dựng bộ khung và giao diện Client Portal & Admin Portal (Spartan UI, Tailwind CSS Anti-AI Slop). | [`docs/TUAN_6_XAY_DUNG_GIAO_DIEN_CLIENT_ADMIN.md`](file:///e:/Dormitory-Management-System/docs/TUAN_6_XAY_DUNG_GIAO_DIEN_CLIENT_ADMIN.md) |
| **Tuần 7** | Xây dựng chức năng nghiệp vụ Client/Admin, kết nối REST API và Grounding Trợ lý AI cá nhân hóa. | [`docs/TUAN_7_XAY_DUNG_CHUC_NANG_CLIENT_ADMIN.md`](file:///e:/Dormitory-Management-System/docs/TUAN_7_XAY_DUNG_CHUC_NANG_CLIENT_ADMIN.md) |
| **Tuần 8** | Kiểm thử tích hợp E2E, kiểm toán an toàn bảo mật RBAC, tổng kết và đánh giá quá trình thực tập. | [`docs/TUAN_8_TONG_KET_VA_DANH_GIA.md`](file:///e:/Dormitory-Management-System/docs/TUAN_8_TONG_KET_VA_DANH_GIA.md) |

### 📑 Tài liệu Nghiệm thu & Bàn giao Trọng tâm
- 📘 **Báo cáo Tổng kết Thực tập Tốt nghiệp:** [`docs/BAO_CAO_TONG_KET_THUC_TAP_TOT_NGHIEP.md`](file:///e:/Dormitory-Management-System/docs/BAO_CAO_TONG_KET_THUC_TAP_TOT_NGHIEP.md)
- 📗 **Báo cáo Nghiệm thu KTX-044 (Bàn giao trọn bộ hồ sơ):** [`docs/BAO_CAO_KTX_044_HOAN_THIEN_HO_SO_THUC_TAP.md`](file:///e:/Dormitory-Management-System/docs/BAO_CAO_KTX_044_HOAN_THIEN_HO_SO_THUC_TAP.md)
- 🧪 **Báo cáo Kiểm thử Tự động E2E (KTX-040):** [`docs/BAO_CAO_KTX_040_KIEM_THU_TICH_HOP_TOAN_DIEN_E2E.md`](file:///e:/Dormitory-Management-System/docs/BAO_CAO_KTX_040_KIEM_THU_TICH_HOP_TOAN_DIEN_E2E.md)
- 🔒 **Báo cáo Kiểm toán Bảo mật & RBAC (KTX-042):** [`docs/BAO_CAO_KTX_042_RA_SOAT_QUYEN_VA_BAO_MAT_DU_LIEU.md`](file:///e:/Dormitory-Management-System/docs/BAO_CAO_KTX_042_RA_SOAT_QUYEN_VA_BAO_MAT_DU_LIEU.md)
- 🎬 **Kịch bản Thuyết trình Demo Nghiệm thu (KTX-043):** [`docs/BAO_CAO_KTX_043_CHUAN_BI_DEMO_VA_HUONG_DAN_CHAY.md`](file:///e:/Dormitory-Management-System/docs/BAO_CAO_KTX_043_CHUAN_BI_DEMO_VA_HUONG_DAN_CHAY.md)

---
*Bản quyền thuộc về Sinh viên thực hiện: **Phạm Thị Ngọc Ánh** — Đơn vị thực tập: **Công ty Cổ phần Công nghệ TFL** & **Trường Đại học CNTT & TT (ICTU)**.*
