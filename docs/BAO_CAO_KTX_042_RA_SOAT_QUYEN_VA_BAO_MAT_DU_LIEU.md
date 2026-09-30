# BÁO CÁO NGHIỆM THU NHIỆM VỤ KTX-042
## RÀ SOÁT QUYỀN TRUY CẬP VÀ BẢO MẬT DỮ LIỆU (ACCESS CONTROL & DATA SECURITY AUDIT)

---

### 📌 THÔNG TIN CHUNG
* **Đề tài:** Xây dựng hệ thống quản lý ký túc xá tích hợp AI (Dormitory Management System)
* **Mã nhiệm vụ:** `KTX-042` (Thuộc **EPIC E — Kiểm thử, nghiệm thu và báo cáo**)
* **Nhánh thực hiện:** `task/KTX-042-access-control-and-data-security`
* **Sinh viên thực hiện:** Phạm Thị Ngọc Ánh
* **Mã sinh viên:** DTC235200050 — Lớp: CNTT K22H
* **Trường:** Đại học Công nghệ Thông tin & Truyền thông (ICTU)
* **Đơn vị thực tập:** Công ty Cổ phần Công nghệ TFL
* **Cán bộ hướng dẫn doanh nghiệp:** Lê Anh Duy (TFL Technology JSC)
* **Giảng viên hướng dẫn học viện:** ThS. Trương Thị Hằng Nga (Khoa CNTT - ICTU)

---

## 1. Mục tiêu và Ý nghĩa của Nhiệm vụ KTX-042

Trong quá trình hoàn thiện hệ thống chuẩn bị nghiệm thu đưa vào vận hành thực tế, việc rà soát an toàn bảo mật, phân định rạch ròi quyền hạn truy cập giữa các đối tượng người dùng (**Role-Based Access Control - RBAC**) và bảo vệ thông tin nhận dạng cá nhân (**Personally Identifiable Information - PII**) là yêu cầu bắt buộc:

1. **Ngăn chặn rò rỉ thông tin cá nhân và mật khẩu:** Tuyệt đối không để lộ mật khẩu băm (Bcrypt hash), số điện thoại hoặc dữ liệu riêng tư của sinh viên qua các API công khai hoặc phản hồi JSON.
2. **Bảo vệ khóa bí mật (Secret Protection):** Giữ tuyệt đối an toàn khóa `GEMINI_API_KEY` và `JWT_SECRET` tại backend server, không bao giờ gửi khóa về phía client frontend hoặc phơi bày trong các endpoint kiểm tra trạng thái (`/api/ai/status`).
3. **Thắt chặt ma trận phân quyền (RBAC Matrix):** Ngăn chặn việc sinh viên hoặc khách vãng lai gọi trái phép các API quản trị như: duyệt đơn đăng ký, phân bổ giường ở, thay đổi trạng thái sửa chữa, xem toàn bộ nhật ký hỏi đáp AI (`chat_logs`).
4. **Tự động hóa kiểm toán bảo mật (Security Audit Script):** Xây dựng bộ kịch bản kiểm thử độc lập 15 tiêu chí bảo mật để tự động hóa việc xác thực và ngăn ngừa rủi ro hồi quy (Regression).

---

## 2. Ma trận Phân quyền Hệ thống (RBAC Matrix)

Hệ thống KTX ICTU phân định rõ 3 vai trò người dùng:
- **GUEST (Khách vãng lai):** Người chưa đăng nhập (thí sinh tuyển sinh, phụ huynh, người quan tâm).
- **STUDENT (Sinh viên KTX):** Người dùng có tài khoản với mã sinh viên, đã được cấp quyền truy cập các dịch vụ lưu trú.
- **ADMIN (Cán bộ / Ban Quản lý KTX):** Quản trị viên toàn quyền vận hành, điều phối phòng giường và giám sát hệ thống.

| Nhóm chức năng / Endpoint | Phương thức | GUEST | STUDENT | ADMIN | Mô tả & Quy tắc bảo vệ |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Xác thực & Danh tính** | | | | | |
| `POST /api/auth/login` | POST |  Cho phép |  Cho phép |  Cho phép | Đăng nhập tài khoản bằng Email hoặc Mã sinh viên. |
| `GET /api/auth/me` | GET | ❌ Chặn (401) |  Cho phép |  Cho phép | Trả về thông tin phiên người dùng đăng nhập hiện tại. |
| `POST /api/auth/change-password` | POST | ❌ Chặn (401) |  Cho phép |  Cho phép | Đổi mật khẩu cá nhân kèm xác thực mật khẩu cũ. |
| **Hồ sơ Sinh viên** | | | | | |
| `GET /api/students/me/profile` | GET | ❌ Chặn (401) |  Cho phép |  Cho phép | Chỉ trả về hồ sơ của chính chủ, ẩn triệt để mật khẩu. |
| `GET /api/students` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Xem danh sách toàn bộ hồ sơ sinh viên lưu trú. |
| `POST /api/students` | POST | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Cán bộ thêm mới hồ sơ sinh viên vào hệ thống. |
| `PUT /api/students/:id` | PUT | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Cập nhật hồ sơ sinh viên chỉ định. |
| **Quản lý Phòng & Sức chứa** | | | | | |
| `GET /api/rooms` | GET |  Cho phép |  Cho phép |  Cho phép | Tra cứu danh sách phòng, tòa, tầng, sức chứa trống. |
| `GET /api/rooms/stats/summary` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Thống kê số lượng phòng trống, đầy, bảo trì. |
| `POST /api/rooms` | POST | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Thêm mới phòng ở ký túc xá. |
| `PUT /api/rooms/:id` | PUT | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Điều chỉnh cấu hình, giá thuê, sức chứa phòng. |
| `DELETE /api/rooms/:id` | DELETE | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Xóa phòng ở. |
| **Đăng ký Lưu trú** | | | | | |
| `GET /api/registrations/my` | GET | ❌ Chặn (401) |  Cho phép |  Cho phép | Xem lịch sử đơn đăng ký của chính sinh viên. |
| `POST /api/registrations` | POST | ❌ Chặn (401) |  Cho phép |  Cho phép | Sinh viên gửi đơn đăng ký lưu trú mới. |
| `GET /api/registrations` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Quản trị viên duyệt danh sách tất cả hồ sơ đăng ký. |
| `PUT /api/registrations/:id/approve` | PUT | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Phê duyệt hồ sơ đăng ký và tự động cập nhật sức chứa. |
| `PUT /api/registrations/:id/reject` | PUT | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Từ chối hồ sơ kèm lý do phản hồi rõ ràng. |
| **Phân bổ Giường & Điều chuyển** | | | | | |
| `GET /api/allocations/stats` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Thống kê phân bổ giường, tỷ lệ lấp đầy. |
| `POST /api/allocations/allocate` | POST | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Gán giường trực tiếp cho sinh viên. |
| `POST /api/allocations/transfer` | POST | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Điều chuyển sinh viên giữa các phòng/giường. |
| `POST /api/allocations/checkout` | POST | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Trả phòng và giải phóng trạng thái giường lưu trú. |
| **Báo hỏng & Sửa chữa** | | | | | |
| `GET /api/maintenance/my` | GET | ❌ Chặn (401) |  Cho phép |  Cho phép | Xem danh sách phiếu báo hỏng thiết bị do mình gửi. |
| `POST /api/maintenance` | POST | ❌ Chặn (401) |  Cho phép |  Cho phép | Gửi yêu cầu sửa chữa thiết bị phòng ở. |
| `GET /api/maintenance` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Danh sách toàn bộ yêu cầu sửa chữa toàn KTX. |
| `PATCH /api/maintenance/:id/status` | PATCH | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Cập nhật tiến độ xử lý và phản hồi kỹ thuật. |
| **Trợ lý AI & Giám sát** | | | | | |
| `GET /api/ai/status` | GET |  Cho phép |  Cho phép |  Cho phép | Lấy trạng thái AI (chỉ gửi boolean `hasKey`, không lộ Key). |
| `POST /api/ai/ask` | POST |  Cho phép (Chế độ Khách) |  Cho phép (Cá nhân hóa) |  Cho phép | Hỏi đáp với Trợ lý AI KTX. |
| `GET /api/ai/logs` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Xem toàn bộ lịch sử hỏi đáp của sinh viên. |
| `GET /api/ai/stats` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Xem Dashboard thống kê và phân tích hành vi hỏi đáp AI. |
| **Dashboard Tổng quan** | | | | | |
| `GET /api/dashboard/stats` | GET | ❌ Chặn (401) | ❌ Chặn (403) |  Cho phép | Bảng điều khiển trung tâm dành cho Quản trị viên. |

---

## 3. Kiến trúc Middleware Xác thực & Phân quyền

Hệ thống đã triển khai bộ Middleware chuyên dụng tại file [`backend/src/middlewares/auth.middleware.ts`](file:///e:/Dormitory-Management-System/backend/src/middlewares/auth.middleware.ts):

```typescript
// 1. Xác thực Token JWT
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Yêu cầu xác thực: Không tìm thấy Access Token hợp lệ.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ.' });
  }
};

// 2. Kiểm tra vai trò người dùng (RBAC)
export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập hoặc thực hiện thao tác này.' });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRoles(Role.ADMIN);
export const requireStudent = requireRoles(Role.STUDENT);
```

---

## 4. Kết quả Kiểm thử Tự động An toàn Bảo mật & RBAC (15/15 Passed)

Bộ kiểm thử tự động tại [`backend/src/scripts/run-security-audit-tests.ts`](file:///e:/Dormitory-Management-System/backend/src/scripts/run-security-audit-tests.ts) được thực thi và xác nhận:

```text
========================================================================
  KIỂM TOÁN AN TOÀN BẢO MẬT & PHÂN QUYỀN RBAC (KTX-042)
  Hệ thống: Dormitory Management System with Gemini AI
  Thời gian thực hiện: 15:23:25 30/9/2026
========================================================================

[1/15] SEC-01 - Chặn truy cập Dashboard Quản trị khi chưa đăng nhập (Expect 401)... ✅ PASSED
[2/15] SEC-02 - Chặn truy cập Nhật ký Trợ lý AI khi chưa đăng nhập (Expect 401)... ✅ PASSED
[3/15] SEC-03 - Chặn truy cập Phân bổ giường khi chưa đăng nhập (Expect 401)... ✅ PASSED
[4/15] SEC-04 - Chặn Sinh viên xem Nhật ký AI của toàn bộ hệ thống (Expect 403)... ✅ PASSED
[5/15] SEC-05 - Chặn Sinh viên xem Thống kê KPIs AI giám sát (Expect 403)... ✅ PASSED
[6/15] SEC-06 - Chặn Sinh viên xem Danh sách toàn bộ hồ sơ sinh viên khác (Expect 403)... ✅ PASSED
[7/15] SEC-07 - Chặn Sinh viên thực hiện phân bổ / điều chuyển giường lưu trú (Expect 403)... ✅ PASSED
[8/15] SEC-08 - Chặn Sinh viên phê duyệt đơn đăng ký lưu trú (Expect 403)... ✅ PASSED
[9/15] SEC-09 - Cho phép Quản trị viên xem Dashboard & Thống kê phân bổ (Expect 200)... ✅ PASSED
[10/15] SEC-10 - Cho phép Quản trị viên truy xuất Nhật ký & Thống kê AI (Expect 200)... ✅ PASSED
[11/15] SEC-11 - Cho phép Sinh viên xem hồ sơ cá nhân của chính mình (Expect 200)... ✅ PASSED
[12/15] SEC-12 - Kiểm tra tuyệt đối không rò rỉ Mật khẩu (Password Hash) trong API Hồ sơ... ✅ PASSED
[13/15] SEC-13 - Kiểm tra danh sách sinh viên Admin không chứa trường password... ✅ PASSED
[14/15] SEC-14 - Kiểm tra API trạng thái AI không để lộ chuỗi API Key của Gemini... ✅ PASSED
[15/15] SEC-15 - Kiểm tra Nhật ký AI không lưu trữ token xác thực hoặc mật khẩu thô... ✅ PASSED

------------------------------------------------------------------------
KẾT QUẢ KIỂM TOÁN AN TOÀN BẢO MẬT: 15/15 tiêu chí đạt chuẩn (100%)
------------------------------------------------------------------------

🎉 TẤT CẢ CÁC TIÊU CHÍ AN TOÀN BẢO MẬT & PHÂN QUYỀN ĐẠT 100% TIÊU CHUẨN KTX-042!
```

---

## 5. Kết luận Nghiệm thu KTX-042

Tác vụ **`KTX-042: Rà soát quyền truy cập và dữ liệu`** đã được hoàn thành xuất sắc 100% tiêu chí chấp nhận:
- Ma trận phân quyền RBAC được thiết lập nghiêm ngặt, rành mạch giữa Guest, Student và Admin.
- Dữ liệu cá nhân, mật khẩu băm và bí mật môi trường (`GEMINI_API_KEY`, `JWT_SECRET`) được bảo vệ an toàn tuyệt đối.
- Toàn bộ 15 kịch bản kiểm toán bảo mật và 12 kịch bản tích hợp E2E đều đạt tỷ lệ thành công 100%.

Sẵn sàng tạo Pull Request để hợp nhất vào nhánh `develop`.
