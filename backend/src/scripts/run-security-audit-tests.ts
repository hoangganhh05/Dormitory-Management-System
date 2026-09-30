/**
 * AUTOMATED SECURITY & RBAC AUDIT TEST SUITE (KTX-042)
 * Kiểm thử tự động ma trận phân quyền (RBAC) và an toàn dữ liệu, chống rò rỉ secret / PII
 * Sinh viên thực hiện: Phạm Thị Ngọc Ánh - DTC235200050
 */

export {};

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function sendRequest(
  method: string,
  url: string,
  body?: any,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  return { status: res.status, data };
}

interface SecurityTestCase {
  id: string;
  name: string;
  category: 'RBAC_UNAUTHENTICATED' | 'RBAC_FORBIDDEN' | 'RBAC_AUTHORIZED' | 'DATA_PRIVACY' | 'SECRET_PROTECTION';
  fn: () => Promise<boolean>;
}

async function runSecurityAudit() {
  console.log('========================================================================');
  console.log('  KIỂM TOÁN AN TOÀN BẢO MẬT & PHÂN QUYỀN RBAC (KTX-042)');
  console.log('  Hệ thống: Dormitory Management System with Gemini AI');
  console.log('  Thời gian thực hiện: ' + new Date().toLocaleString('vi-VN'));
  console.log('========================================================================\n');

  let adminToken = '';
  let studentToken = '';

  // 1. Chuẩn bị Token cho Admin và Student
  try {
    const adminLogin = await sendRequest('POST', '/auth/login', {
      identifier: 'admin@dormitory.com',
      password: '123456',
    });
    adminToken = adminLogin.data?.data?.token;

    const studentLogin = await sendRequest('POST', '/auth/login', {
      identifier: 'ngocanh.cntt@ictu.edu.vn',
      password: '123456',
    });
    studentToken = studentLogin.data?.data?.token;

    if (!adminToken || !studentToken) {
      throw new Error('Không lấy được token xác thực: ' + JSON.stringify({ adminLogin: adminLogin.data, studentLogin: studentLogin.data }));
    }
  } catch (err: any) {
    console.error('❌ Lỗi khởi tạo phiên đăng nhập để kiểm toán:', err.message);
    return;
  }

  const tests: SecurityTestCase[] = [
    // --- 1. KIỂM THỬ TỪ CHỐI KHI KHÔNG CÓ TOKEN (401 UNAUTHORIZED) ---
    {
      id: 'SEC-01',
      name: 'Chặn truy cập Dashboard Quản trị khi chưa đăng nhập (Expect 401)',
      category: 'RBAC_UNAUTHENTICATED',
      fn: async () => {
        const res = await sendRequest('GET', '/dashboard/stats');
        return res.status === 401;
      },
    },
    {
      id: 'SEC-02',
      name: 'Chặn truy cập Nhật ký Trợ lý AI khi chưa đăng nhập (Expect 401)',
      category: 'RBAC_UNAUTHENTICATED',
      fn: async () => {
        const res = await sendRequest('GET', '/ai/logs');
        return res.status === 401;
      },
    },
    {
      id: 'SEC-03',
      name: 'Chặn truy cập Phân bổ giường khi chưa đăng nhập (Expect 401)',
      category: 'RBAC_UNAUTHENTICATED',
      fn: async () => {
        const res = await sendRequest('GET', '/allocations/stats');
        return res.status === 401;
      },
    },

    // --- 2. KIỂM THỬ MA TRẬN PHÂN QUYỀN SINH VIÊN (403 FORBIDDEN KHI TRUY CẬP VÙNG ADMIN) ---
    {
      id: 'SEC-04',
      name: 'Chặn Sinh viên xem Nhật ký AI của toàn bộ hệ thống (Expect 403)',
      category: 'RBAC_FORBIDDEN',
      fn: async () => {
        const res = await sendRequest('GET', '/ai/logs', undefined, studentToken);
        return res.status === 403;
      },
    },
    {
      id: 'SEC-05',
      name: 'Chặn Sinh viên xem Thống kê KPIs AI giám sát (Expect 403)',
      category: 'RBAC_FORBIDDEN',
      fn: async () => {
        const res = await sendRequest('GET', '/ai/stats', undefined, studentToken);
        return res.status === 403;
      },
    },
    {
      id: 'SEC-06',
      name: 'Chặn Sinh viên xem Danh sách toàn bộ hồ sơ sinh viên khác (Expect 403)',
      category: 'RBAC_FORBIDDEN',
      fn: async () => {
        const res = await sendRequest('GET', '/students', undefined, studentToken);
        return res.status === 403;
      },
    },
    {
      id: 'SEC-07',
      name: 'Chặn Sinh viên thực hiện phân bổ / điều chuyển giường lưu trú (Expect 403)',
      category: 'RBAC_FORBIDDEN',
      fn: async () => {
        const res = await sendRequest(
          'POST',
          '/allocations/allocate',
          { studentId: 999, bedId: 999 },
          studentToken
        );
        return res.status === 403;
      },
    },
    {
      id: 'SEC-08',
      name: 'Chặn Sinh viên phê duyệt đơn đăng ký lưu trú (Expect 403)',
      category: 'RBAC_FORBIDDEN',
      fn: async () => {
        const res = await sendRequest('PUT', '/registrations/1/approve', {}, studentToken);
        return res.status === 403;
      },
    },

    // --- 3. KIỂM THỬ HỢP LỆ VỚI QUYỀN QUẢN TRỊ VIÊN (200 OK) ---
    {
      id: 'SEC-09',
      name: 'Cho phép Quản trị viên xem Dashboard & Thống kê phân bổ (Expect 200)',
      category: 'RBAC_AUTHORIZED',
      fn: async () => {
        const res = await sendRequest('GET', '/dashboard/stats', undefined, adminToken);
        return res.status === 200 && res.data?.success === true;
      },
    },
    {
      id: 'SEC-10',
      name: 'Cho phép Quản trị viên truy xuất Nhật ký & Thống kê AI (Expect 200)',
      category: 'RBAC_AUTHORIZED',
      fn: async () => {
        const resLogs = await sendRequest('GET', '/ai/logs', undefined, adminToken);
        const resStats = await sendRequest('GET', '/ai/stats', undefined, adminToken);
        return resLogs.status === 200 && resStats.status === 200;
      },
    },
    {
      id: 'SEC-11',
      name: 'Cho phép Sinh viên xem hồ sơ cá nhân của chính mình (Expect 200)',
      category: 'RBAC_AUTHORIZED',
      fn: async () => {
        const res = await sendRequest('GET', '/students/me/profile', undefined, studentToken);
        return res.status === 200 && res.data?.data?.studentCode === 'DTC235200050';
      },
    },

    // --- 4. KIỂM THỬ BẢO VỆ DỮ LIỆU CÁ NHÂN (DATA PRIVACY & PII) ---
    {
      id: 'SEC-12',
      name: 'Kiểm tra tuyệt đối không rò rỉ Mật khẩu (Password Hash) trong API Hồ sơ',
      category: 'DATA_PRIVACY',
      fn: async () => {
        const res = await sendRequest('GET', '/students/me/profile', undefined, studentToken);
        const student = res.data?.data;
        return student && student.password === undefined;
      },
    },
    {
      id: 'SEC-13',
      name: 'Kiểm tra danh sách sinh viên Admin không chứa trường password',
      category: 'DATA_PRIVACY',
      fn: async () => {
        const res = await sendRequest('GET', '/students', undefined, adminToken);
        const list = res.data?.data || [];
        const leaked = list.some((u: any) => u.password !== undefined);
        return !leaked;
      },
    },

    // --- 5. KIỂM THỬ BẢO VỆ KHÓA DỊCH VỤ (SECRET PROTECTION) ---
    {
      id: 'SEC-14',
      name: 'Kiểm tra API trạng thái AI không để lộ chuỗi API Key của Gemini',
      category: 'SECRET_PROTECTION',
      fn: async () => {
        const res = await sendRequest('GET', '/ai/status');
        const str = JSON.stringify(res.data);
        return !str.includes('AIza') && !str.includes('jwt-secret');
      },
    },
    {
      id: 'SEC-15',
      name: 'Kiểm tra Nhật ký AI không lưu trữ token xác thực hoặc mật khẩu thô',
      category: 'SECRET_PROTECTION',
      fn: async () => {
        const res = await sendRequest('GET', '/ai/logs', undefined, adminToken);
        const logs = res.data?.data?.logs || [];
        const leaked = logs.some((l: any) =>
          (l.userMessage && l.userMessage.includes('studentpassword123')) ||
          (l.user && l.user.password !== undefined)
        );
        return !leaked;
      },
    },
  ];

  let passed = 0;
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    process.stdout.write(`[${i + 1}/${tests.length}] ${t.id} - ${t.name}... `);
    try {
      const ok = await t.fn();
      if (ok) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED (Assertion failed)');
      }
    } catch (e: any) {
      console.log('❌ ERROR:', e.message);
    }
  }

  console.log('\n------------------------------------------------------------------------');
  console.log(`KẾT QUẢ KIỂM TOÁN AN TOÀN BẢO MẬT: ${passed}/${tests.length} tiêu chí đạt chuẩn (${Math.round((passed / tests.length) * 100)}%)`);
  console.log('------------------------------------------------------------------------\n');

  if (passed === tests.length) {
    console.log('🎉 TẤT CẢ CÁC TIÊU CHÍ AN TOÀN BẢO MẬT & PHÂN QUYỀN ĐẠT 100% TIÊU CHUẨN KTX-042!\n');
  } else {
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Lỗi thực thi kiểm toán bảo mật:', err);
  process.exit(1);
});
