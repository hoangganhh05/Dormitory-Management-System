# BÁO CÁO NGHIỆM THU TÁC VỤ KTX-024

## TÊN TÁC VỤ: Phân phòng/giường và theo dõi lưu trú
- **Mã công việc:** `KTX-024`
- **Thuộc Epic:** `EPIC C — Chức năng quản lý KTX`
- **Nhánh thực hiện:** `task/KTX-024-bed-allocation-tracking`
- **Tiêu chuẩn thiết kế:** Global Skill `spartan-ui-expert` (Angular + Spartan UI primitives + Tailwind CSS Enterprise B2B SaaS, triệt để tuân thủ Anti-AI Slop).

---

## 1. Mục tiêu & Tiêu chí nghiệm thu (Acceptance Criteria)
Theo tài liệu phân rã dự án:
> **Tiêu chí:** *"Chỉ triển khai nếu đề cương/yêu cầu nghiệp vụ có; ngăn phân trùng và lưu lịch sử"*.

### Phạm vi luồng nghiệp vụ triển khai:
1. **Phân phòng/giường (Check-in Workflow):**
   - Ban Quản lý tiếp nhận hoặc chỉ định sinh viên vào giường còn trống thực tế (`status = VACANT`).
   - Tự động gợi ý danh sách giường khả dụng phù hợp với giới tính sinh viên (Sinh viên Nam $\rightarrow$ Tòa A; Sinh viên Nữ $\rightarrow$ Tòa B).
   - Tự động đồng bộ số người đang ở trong phòng (`currentOccupancy`), chuyển trạng thái phòng sang `FULL` nếu đã đủ số lượng.
   - Ghi nhận nhật ký phân phòng ban đầu (`CHECK_IN`).

2. **Cơ chế ngăn chặn phân trùng lặp (Anti-Conflict & Anti-Double Allocation):**
   - **Tầng Cơ sở dữ liệu (Database Constraint):** Ràng buộc `@unique` trên trường `occupiedById` của bảng `beds`, ngăn chặn triệt để 2 sinh viên được phân vào cùng một giường hoặc 1 sinh viên chiếm giữ cùng lúc 2 giường ở mức vật lý.
   - **Tầng Ứng dụng (Application-level Validation):**
     - Kiểm tra nếu sinh viên đã có giường lưu trú: Hệ thống trả mã `409 Conflict`, từ chối phân mới và hướng dẫn chuyển sang chức năng "Chuyển giường (Transfer)".
     - Kiểm tra nếu giường mục tiêu không ở trạng thái `VACANT` hoặc đã có người khác chiếm giữ: Hệ thống trả mã `409 Conflict`.
     - Kiểm tra chính sách phân khu giới tính: Ngăn chặn tuyệt đối việc xếp sinh viên Nam sang Tòa B (Nữ) hoặc sinh viên Nữ sang Tòa A (Nam).

3. **Điều chuyển phòng/giường (Transfer Workflow):**
   - Hỗ trợ đổi chỗ ở cho sinh viên sang giường trống khác một cách an toàn và nhất quán dữ liệu.
   - Cơ chế Transaction:
     - Giải phóng giường cũ (`status = VACANT`, `occupiedById = null`).
     - Giảm `currentOccupancy` của phòng cũ và cập nhật lại trạng thái phòng cũ thành `AVAILABLE`.
     - Gán sinh viên vào giường mới (`status = OCCUPIED`, `occupiedById = studentId`).
     - Tăng `currentOccupancy` của phòng mới và cập nhật trạng thái nếu phòng mới đạt tối đa.
     - Tự động ghi nhận nhật ký điều chuyển (`TRANSFER`) lưu rõ thông tin: từ phòng/giường nào sang phòng/giường nào.

4. **Trả phòng/Kết thúc lưu trú (Check-out Workflow):**
   - Giải phóng giường lưu trú, cập nhật `status = VACANT`, `occupiedById = null`.
   - Giảm sĩ số phòng tương ứng, chuyển trạng thái phòng từ `FULL` về `AVAILABLE`.
   - Tự động ghi nhận nhật ký kết thúc lưu trú (`CHECK_OUT`).

5. **Theo dõi lưu trú & Lưu vết lịch sử (Audit History Tracking):**
   - Bảng cơ sở dữ liệu chuyên biệt `BedAllocationHistory` lưu vết toàn bộ hoạt động: loại hành động (`CHECK_IN`, `TRANSFER`, `CHECK_OUT`), phòng/giường trước đó, phòng/giường mới, người thực hiện (Ban Quản Lý KTX), ghi chú lý do và mốc thời gian chi tiết.
   - Cung cấp giao diện tra cứu lịch sử riêng cho từng sinh viên (Modal Timeline).
   - Cung cấp giao diện tra cứu toàn diện toàn hệ thống với bộ lọc theo loại thao tác và tìm kiếm tức thời.

---

## 2. Chi tiết kỹ thuật & Kiến trúc mã nguồn

### 2.1. CSDL & Prisma ORM
- **Enum mới:** `AllocationActionType` (`CHECK_IN`, `TRANSFER`, `CHECK_OUT`).
- **Model mới:** `BedAllocationHistory`:
  ```prisma
  enum AllocationActionType {
    CHECK_IN
    TRANSFER
    CHECK_OUT
  }

  model BedAllocationHistory {
    id           Int                  @id @default(autoincrement())
    userId       Int
    user         User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
    fromBedInfo  String?              @db.VarChar(191)
    toBedInfo    String?              @db.VarChar(191)
    actionType   AllocationActionType
    performedBy  String?              @default("Ban Quản Lý KTX") @db.VarChar(191)
    note         String?              @db.Text
    createdAt    DateTime             @default(now())

    @@index([userId])
    @@index([actionType])
    @@map("bed_allocation_histories")
  }
  ```
- **Ràng buộc quan hệ User - Bed:** `User.occupiedBed` $\leftrightarrow$ `Bed.occupiedBy` với `@unique` trên `occupiedById`.

### 2.2. Backend API (Express + Prisma + MySQL)
- **Controller:** [`backend/src/controllers/allocation.controller.ts`](file:///e:/Dormitory-Management-System/backend/src/controllers/allocation.controller.ts)
- **Routes:** [`backend/src/routes/allocation.routes.ts`](file:///e:/Dormitory-Management-System/backend/src/routes/allocation.routes.ts) mounted tại `/api/allocations`
- **Danh sách Endpoints:**
  - `GET /api/allocations/stats`: Thống kê tổng quan mật độ lưu trú, tổng sinh viên, đã xếp giường, chưa xếp, tổng giường, giường trống, số lượng các thao tác điều chuyển.
  - `GET /api/allocations/available-beds`: Lấy danh sách giường còn trống (`VACANT`), hỗ trợ lọc tự động theo giới tính sinh viên (`NAM`/`MALE` $\rightarrow$ Tòa A, `NU`/`FEMALE` $\rightarrow$ Tòa B).
  - `GET /api/allocations/history`: Tra cứu nhật ký lưu trú hỗ trợ phân trang, lọc theo `studentId`, `actionType` (`CHECK_IN`, `TRANSFER`, `CHECK_OUT`), và tìm kiếm toàn văn.
  - `POST /api/allocations/allocate`: Tiếp nhận và xếp giường mới (Check-in), kiểm tra chặn trùng lặp.
  - `POST /api/allocations/transfer`: Điều chuyển giường an toàn giữa các phòng.
  - `POST /api/allocations/checkout`: Hoàn tất trả phòng, giải phóng giường và cập nhật sĩ số.

### 2.3. Frontend (Angular 19 Standalone + Spartan UI + Tailwind CSS)
- **Models:** [`frontend/src/app/core/models/allocation.model.ts`](file:///e:/Dormitory-Management-System/frontend/src/app/core/models/allocation.model.ts)
- **Service:** [`frontend/src/app/core/services/allocation.service.ts`](file:///e:/Dormitory-Management-System/frontend/src/app/core/services/allocation.service.ts)
- **Component Nâng cấp:** [`frontend/src/app/features/admin/admin-students/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/admin/admin-students/)
  - **Tabs chuyển đổi chế độ xem:**
    - Tab 1: *"Danh sách hồ sơ sinh viên"* — Bảng danh sách sinh viên tích hợp thẻ badge trạng thái lưu trú trực quan (ví dụ: `Phòng B101 - G1` màu xanh ngọc hoặc `Chưa xếp phòng` màu xám).
    - Tab 2: *"Nhật ký điều chuyển & Lưu trú"* — Bảng audit log chi tiết toàn hệ thống với bộ lọc loại hành động và ô tìm kiếm.
  - **Hệ thống Modal thao tác nghiệp vụ:**
    - *Modal Phân giường mới (`isAllocateModalOpen`):* Hiển thị thông tin sinh viên, danh sách giường trống theo tòa phù hợp giới tính, ô nhập ghi chú.
    - *Modal Đổi giường (`isTransferModalOpen`):* Hiển thị vị trí phòng/giường hiện tại, chọn vị trí giường mới, nhập lý do chuyển.
    - *Modal Nhật ký lưu trú sinh viên (`isHistoryModalOpen`):* Timeline trực quan theo dõi toàn bộ các lần Check-in, Transfer, Check-out của từng cá nhân.

---

## 3. Kết quả Kiểm thử & Biên dịch

### 3.1. Frontend Build Verification
- Thực thi: `npm run build` tại thư mục `frontend/`.
- Kết quả: **Khởi tạo và biên dịch thành công (Exit Code: 0)**, không có bất kỳ lỗi cú pháp template hay type error nào.
  ```text
  Initial chunk files | Names   | Raw size  | Estimated transfer size
  main-4RS47EOD.js    | main    | 636.39 kB | 131.06 kB
  styles-7A2YJ6EE.css | styles  | 971 bytes | 971 bytes
  Application bundle generation complete. [19.294 seconds]
  ```

### 3.2. Backend Integration Test Suite
Thực thi bộ kịch bản kiểm thử API tích hợp độc lập:
1. **Kiểm tra Check-in:**
   - Trạng thái: HTTP 200 OK.
   - Kết quả: Phân sinh viên Phạm Thị Ngọc Ánh vào Giường G1 - Phòng B101.
2. **Kiểm tra Chống phân trùng lặp (Cùng sinh viên):**
   - Trạng thái: **HTTP 409 Conflict** (Bảo vệ thành công).
   - Thông báo: *"Sinh viên Phạm Thị Ngọc Ánh hiện đã có giường lưu trú (Phòng B101 - Giường G1). Vui lòng dùng chức năng 'Chuyển giường (Transfer)' nếu muốn đổi chỗ ở."*
3. **Kiểm tra Phân khu Giới tính:**
   - Trạng thái: **HTTP 400 Bad Request** (Bảo vệ thành công).
   - Thông báo: *"Quy định KTX: Sinh viên Nam không được phân vào Khu Tòa B (Nữ)"*.
4. **Kiểm tra Chuyển giường (Transfer):**
   - Trạng thái: HTTP 200 OK.
   - Kết quả: Đổi từ Giường G1 sang Giường G3 thành công, giải phóng Giường G1 về `VACANT`.
5. **Kiểm tra Trả phòng (Check-out):**
   - Trạng thái: HTTP 200 OK.
   - Kết quả: Trả phòng cho sinh viên, Giường G3 trở lại trạng thái `VACANT`.
6. **Kiểm tra Nhật ký kiểm toán (Audit History Tracking):**
   - Toàn bộ các thao tác `CHECK_IN`, `TRANSFER`, `CHECK_OUT` đều được lưu trữ đầy đủ trong CSDL kèm thông tin nguồn/đích và mốc thời gian chính xác.

---

## 4. Kết luận & Kế hoạch tiếp theo
- Tác vụ **`KTX-024: Phân phòng/giường và theo dõi lưu trú`** đã hoàn thành 100% các tiêu chí nghiệm thu đề ra.
- Mã nguồn tuân thủ nghiêm ngặt phong cách **Spartan UI & Tailwind CSS Enterprise B2B SaaS (Anti-AI Slop)**.
- Sẵn sàng bàn giao và tạo Pull Request vào nhánh `develop`.
- Tác vụ kế tiếp sau khi hợp nhất: **`KTX-025: Tra cứu thông tin và thông báo`**.
