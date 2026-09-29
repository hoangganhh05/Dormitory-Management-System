# Hệ Thống Quản Lý Ký Túc Xá Tích Hợp AI (Dormitory Management System)

> **Đề tài thực tập tốt nghiệp / nghề nghiệp**
> - **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (Lớp CNTT K22H) - Trường Đại học CNTT & TT (ICTU)
> - **Cơ sở thực tập:** Công ty Cổ phần Công nghệ TFL
> - **Cán bộ hướng dẫn (TFL):** Lê Anh Duy (SĐT: 0967862569)
> - **Giảng viên quản lý (ICTU):** ThS. Trương Thị Hằng Nga (SĐT: 0985.333.555)

---

## 1. Giới thiệu dự án
Dự án **Hệ thống Quản lý Ký túc xá tích hợp AI (Dormitory Management System)** được phát triển nhằm tin học hóa và tối ưu quy trình quản lý lưu trú, tiếp nhận sinh viên, phân bổ phòng/giường, xử lý yêu cầu báo hỏng và hỗ trợ tư vấn nội quy KTX tự động thông qua trợ lý ảo AI (Google Gemini).

## 2. Công nghệ sử dụng
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, MySQL
- **Frontend:** Angular (TypeScript, Standalone Components, Routing)
- **Trí tuệ nhân tạo:** Google Gemini AI API
- **Quản lý phiên bản:** Git

## 3. Cấu trúc thư mục dự án

```text
Dormitory-Management-System/
├── backend/                  # Mã nguồn Backend API (Express + TS + Prisma + MySQL)
│   ├── prisma/               # Schema CSDL Prisma
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/           # Cấu hình môi trường, DB, AI
│   │   ├── middlewares/      # Middleware bắt lỗi, phân quyền
│   │   ├── routes/           # Định tuyến API
│   │   ├── app.ts            # Cấu hình Express app
│   │   └── server.ts         # Server entry point
│   ├── .env.example          # Biến môi trường mẫu
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Mã nguồn Frontend (Angular)
│   ├── src/
│   │   ├── app/              # Components, Routes, Services
│   │   ├── index.html
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── docs/                     # Tài liệu báo cáo thực tập & Thiết kế kỹ thuật
│   ├── TUAN_1_CO_CAU_CONG_CU.md
│   ├── TUAN_2_STACK_CONG_NGHE.md
│   ├── KHAO_SAT_YEU_CAU_NGHIEP_VU.md
│   └── THIET_KE_KIEN_TRUC_CSDL.md
├── .gitignore
└── README.md
```

## 4. Hướng dẫn khởi chạy

### Backend (Node.js):
```bash
cd backend
npm install
npm run dev
# API Health Check: http://localhost:5000/api/health
```

### Frontend (Angular):
```bash
cd frontend
npm install
npm start
# Ứng dụng chạy tại: http://localhost:4200
```
