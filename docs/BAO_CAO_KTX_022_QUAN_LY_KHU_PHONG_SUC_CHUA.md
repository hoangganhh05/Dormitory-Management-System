# BÁO CÁO NGHIỆM THU TÁC VỤ KTX-022

## TÊN TÁC VỤ: Quản lý khu, phòng và sức chứa
- **Mã công việc:** `KTX-022`
- **Thuộc Epic:** `EPIC C — Chức năng quản lý KTX`
- **Nhánh thực hiện:** `task/KTX-022-room-capacity-management`
- **Tiêu chuẩn thiết kế:** Global Skill `spartan-ui-expert` (Angular + Spartan UI primitives + Tailwind CSS Enterprise B2B SaaS, triệt để tuân thủ Anti-AI Slop).

---

## 1. Mục tiêu & Tiêu chí nghiệm thu (Acceptance Criteria)
Theo tài liệu phân rã dự án:
> **Tiêu chí:** *"Có danh mục và trạng thái phòng theo quy tắc nghiệp vụ đã xác nhận"*.

### Phạm vi nghiệp vụ triển khai:
1. **Danh mục khu / tòa nhà và phòng (Catalog & Infrastructure):**
   - Quản lý cấu trúc phân cấp: Tòa nhà (Khu A - Nam, Khu B - Nữ,...), Tầng lầu, Số phòng định danh duy nhất (VD: `A101`, `B201`).
   - Phân loại phòng: Tiêu chuẩn (`STANDARD`) hoặc Chất lượng cao (`VIP`).
   - Quản lý đơn giá thuê/tháng và danh mục tiện ích mô tả chi tiết từng phòng.
2. **Quy tắc nghiệp vụ về trạng thái phòng & sức chứa (Business Rules):**
   - **Tự động sinh giường theo sức chứa:** Khi Admin khởi tạo phòng với sức chứa `capacity` (từ 1 đến 12), hệ thống dùng database transaction để tự động khởi tạo các bản ghi giường tương ứng (`G1`, `G2`,..., `G{capacity}`) với trạng thái mặc định là `VACANT` (Trống).
   - **Đồng bộ tự động trạng thái phòng:**
     - Nếu số sinh viên đang ở thực tế `currentOccupancy >= capacity` $\rightarrow$ Trạng thái phòng tự động chuyển sang `FULL` (Đã kín chỗ).
     - Nếu `currentOccupancy < capacity` và không trong chế độ bảo trì $\rightarrow$ Trạng thái phòng là `AVAILABLE` (Sẵn sàng tiếp nhận).
     - Ban Quản lý có thể chủ động chuyển phòng sang chế độ `MAINTENANCE` (Đang bảo trì/sửa chữa thiết bị) $\rightarrow$ Khóa ngay lập tức khả năng đăng ký trực tuyến hoặc xếp phòng của sinh viên.
   - **Quản lý vị trí giường chi tiết (Bed Management):** Cho phép xem sơ đồ giường, nhận diện sinh viên đang ở tại từng giường, chuyển đổi trạng thái giường (`VACANT`, `OCCUPIED`, `RESERVED`).
   - **Nguyên tắc an toàn dữ liệu:** Nghiêm cấm xóa phòng khi đang có sinh viên lưu trú (`currentOccupancy > 0`).

---

## 2. Chi tiết kỹ thuật & Kiến trúc mã nguồn

### 2.1. Backend API (Express + Prisma ORM + MySQL 8.4)
- **Controller:** [`backend/src/controllers/room.controller.ts`](file:///e:/Dormitory-Management-System/backend/src/controllers/room.controller.ts)
- **Routes:** [`backend/src/routes/room.routes.ts`](file:///e:/Dormitory-Management-System/backend/src/routes/room.routes.ts) mounted tại `/api/rooms`
- **Endpoints:**
  - `GET /api/rooms/stats/summary`: Thống kê tổng hợp sức chứa toàn trường (Tổng phòng, tổng sức chứa, số người đang ở, chỗ còn trống, tỷ lệ lấp đầy %, phân bổ theo từng tòa nhà).
  - `GET /api/rooms`: Lấy danh sách toàn bộ phòng, hỗ trợ lọc đa chiều theo Tòa nhà, Trạng thái (`AVAILABLE`, `FULL`, `MAINTENANCE`), Loại phòng (`STANDARD`, `VIP`) và từ khóa tìm kiếm.
  - `GET /api/rooms/:id`: Lấy chi tiết thông tin phòng, danh sách toàn bộ giường và thông tin định danh sinh viên lưu trú.
  - `POST /api/rooms`: Khởi tạo phòng mới và tự động sinh bản ghi các giường tương ứng.
  - `PUT /api/rooms/:id`: Cập nhật thông số phòng (Giá, loại phòng, trạng thái, mô tả).
  - `PUT /api/rooms/:roomId/beds/:bedId`: Cập nhật trạng thái từng giường cụ thể.
  - `DELETE /api/rooms/:id`: Xóa phòng (ràng buộc kiểm tra không còn sinh viên lưu trú).

### 2.2. Frontend (Angular 19 Standalone + Spartan UI + Tailwind CSS)
- **Model:** [`frontend/src/app/core/models/room.model.ts`](file:///e:/Dormitory-Management-System/frontend/src/app/core/models/room.model.ts)
  - Khai báo đầy đủ interfaces: `Room`, `Bed`, `BedOccupant`, `CreateRoomDto`, `UpdateRoomDto`, `RoomStatsSummary`, `BuildingStat`.
- **Service:** [`frontend/src/app/core/services/room.service.ts`](file:///e:/Dormitory-Management-System/frontend/src/app/core/services/room.service.ts)
- **Giao diện Quản trị viên:** [`frontend/src/app/features/admin/admin-rooms/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/admin/admin-rooms/)
  - **Metrics Dashboard:** 5 thẻ chỉ số thông tin cao (Tổng phòng, Tổng giường, Đang ở, Chỗ trống, Tỷ lệ lấp đầy với thanh tiến trình trực quan).
  - **Khu vực tóm tắt tòa nhà:** Chip thống kê nhanh từng tòa nhà.
  - **Thanh công cụ tìm kiếm & bộ lọc:** Tìm theo số phòng, chọn tòa, trạng thái, loại phòng và nút đặt lại.
  - **Bảng dữ liệu chuẩn Enterprise:** Cột sức chứa kèm mini-bar trực quan (`2/4 chỗ`, thanh màu xanh/vàng/đỏ theo tỷ lệ lấp đầy).
  - **Modal Sơ đồ Giường & Người lưu trú:** Hiển thị trực quan từng giường, thông tin sinh viên đang ở (Họ tên, Mã SV, SĐT) và nút thao tác trạng thái giường.
  - **Modal Tạo mới & Modal Chỉnh sửa phòng:** Bố cục form 2 cột rõ ràng, nhãn trường sắc nét, input hint hướng dẫn cụ thể.
- **Giao diện Sinh viên:** [`frontend/src/app/features/client/client-rooms/`](file:///e:/Dormitory-Management-System/frontend/src/app/features/client/client-rooms/)
  - Bổ sung nhận diện và xử lý trạng thái phòng bảo trì (`MAINTENANCE`), hiển thị số giường còn trống thực tế để sinh viên nộp hồ sơ đăng ký chính xác.
- **Tuân thủ quy tắc Anti-AI Slop:**
  - Không gradient tím hồng neon, không phát sáng lòe loẹt.
  - Bo góc chuẩn mực (`rounded-md`, `rounded-lg`), phân cách 1px border `border-slate-200`.
  - Icon SVG kỹ thuật sắc nét, thông tin trình bày cô đọng và chuyên nghiệp.

---

## 3. Kết quả Kiểm thử & Biên dịch

### 3.1. Biên dịch Backend (TypeScript)
```bash
npx tsc
# Kết quả: 0 errors (Exit code 0)
```

### 3.2. Biên dịch Frontend (Angular AOT)
```bash
npx ng build
# Kết quả:
√ Building...
Initial chunk files | Names         |  Raw size | Estimated transfer size
main-QFY767SA.js    | main          | 568.10 kB |               124.33 kB
styles-7A2YJ6EE.css | styles        | 971 bytes |               971 bytes
Application bundle generation complete. - 0 errors!
```

### 3.3. Kiểm thử API thực tế với cơ sở dữ liệu MySQL
1. `GET /api/rooms/stats/summary`: Trả về dữ liệu thống kê tổng hợp sức chứa chính xác: 4 phòng, 12 giường, 0 đang ở, 12 chỗ trống.
2. `POST /api/rooms`: Tạo thành công phòng thử nghiệm `B301` với 4 giường (`G1`..`G4`) tự động khởi tạo.
3. `PUT /api/rooms/:id`: Cập nhật mô tả và trạng thái phòng thành công.
4. `DELETE /api/rooms/:id`: Xóa phòng `B301` và các giường liên quan thành công.

---

## 4. Kết luận
Tác vụ `KTX-022` đã hoàn thành 100% các tiêu chí chấp nhận đã duyệt, bảo đảm tiêu chuẩn quản lý danh mục và trạng thái phòng theo đúng quy tắc nghiệp vụ đã phê duyệt, áp dụng triệt để Global Skill `spartan-ui-expert`. Sẵn sàng tạo Pull Request để merge vào nhánh `develop`.
