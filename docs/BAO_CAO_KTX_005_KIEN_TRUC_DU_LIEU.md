# BÁO CÁO NGHIỆM THU TASK KTX-005
## THIẾT KẾ SƠ BỘ KIẾN TRÚC VÀ DỮ LIỆU

* **Mã task:** KTX-005
* **Tên task:** Thiết kế sơ bộ kiến trúc và dữ liệu
* **Người thực hiện:** Phạm Thị Ngọc Ánh - MSV: DTC235200050 (CNTT K22H)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn:** Lê Anh Duy

---

### 1. Tiêu chí chấp nhận theo Backlog (Acceptance Criteria)

| Tiêu chí trong Backlog | Hiện trạng triển khai thực tế | Đánh giá |
| :--- | :--- | :---: |
| **Có sơ đồ thành phần** | - Sơ đồ kiến trúc thành phần chi tiết (Component Architecture Diagram) kết nối Client/Admin (Angular), API Gateway (Express + TS), Tầng dịch vụ (Services), Dịch vụ ngoài (Gemini AI API) và CSDL MySQL 8.4. |  **ĐẠT** |
| **Có mô hình dữ liệu nháp** | - Mô hình ERD chuẩn hóa gồm 7 bảng dữ liệu quan hệ (`User`, `Room`, `Bed`, `Registration`, `MaintenanceRequest`, `Notification`, `ChatLog`).<br>- Định nghĩa chi tiết trong `backend/prisma/schema.prisma`. |  **ĐẠT** |
| **Được rà soát (Reviewed)** | - Đã rà soát ràng buộc toàn vẹn khóa ngoại (Cascade / SetNull / Composite Unique Index).<br>- Đã viết script nạp dữ liệu mẫu ban đầu (`backend/prisma/seed.ts`). |  **ĐẠT** |

---

### 2. Tổng kết EPIC A (Khảo sát và thiết lập dự án)

Với việc hoàn thành task **KTX-005**, toàn bộ **5/5 task của EPIC A** đã hoàn thành xuất sắc 100%:
1. `KTX-001`: Tìm hiểu cơ cấu tổ chức, văn hóa công ty và công cụ làm việc (**PR #1**).
2. `KTX-002`: Khảo sát yêu cầu hệ thống KTX với người hướng dẫn (**PR #2**).
3. `KTX-003`: Tìm hiểu stack Node.js, Express, TypeScript, Prisma, MySQL (**PR #3**).
4. `KTX-004`: Thiết lập repository và cấu trúc dự án (**PR #4**).
5. `KTX-005`: Thiết kế sơ bộ kiến trúc và dữ liệu (**PR #5**).

---

### 3. Hướng triển khai tiếp theo: **EPIC B --- Giao diện client và admin**
Dự án sẽ chuyển sang EPIC B với các task tiếp theo:
- `KTX-010`: Lập kế hoạch và luồng màn hình hệ thống.
- `KTX-011`: Xây dựng bộ khung giao diện client (Angular).
- `KTX-012`: Xây dựng bộ khung giao diện admin (Angular).
