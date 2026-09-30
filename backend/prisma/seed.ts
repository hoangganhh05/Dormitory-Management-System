import {
  PrismaClient,
  Role,
  Gender,
  RoomType,
  RoomStatus,
  BedStatus,
  UrgencyLevel,
  MaintenanceStatus,
  RegistrationStatus,
  AllocationActionType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('  KHỞI TẠO BỘ DỮ LIỆU DEMO AN TOÀN CHO HỆ THỐNG KTX (KTX-043)  ');
  console.log('===============================================================\n');

  // 1. Mật khẩu hash dùng chung cho demo: '123456'
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 2. Tài khoản Quản trị viên (Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dormitory.com' },
    update: {
      password: hashedPassword,
      fullName: 'Ban Quản Lý KTX ICTU',
      role: Role.ADMIN,
      phone: '0985333555',
      gender: Gender.MALE,
    },
    create: {
      email: 'admin@dormitory.com',
      password: hashedPassword,
      fullName: 'Ban Quản Lý KTX ICTU',
      role: Role.ADMIN,
      phone: '0985333555',
      gender: Gender.MALE,
    },
  });
  console.log(`✅ [Demo Seed] Tài khoản Quản trị: ${admin.email} (Mật khẩu: 123456)`);

  // 3. Tài khoản Sinh viên chính: Phạm Thị Ngọc Ánh (MSV: DTC235200050)
  const student1 = await prisma.user.upsert({
    where: { email: 'ngocanh.cntt@ictu.edu.vn' },
    update: {
      password: hashedPassword,
      fullName: 'Phạm Thị Ngọc Ánh',
      studentCode: 'DTC235200050',
      role: Role.STUDENT,
      phone: '0967862569',
      gender: Gender.FEMALE,
    },
    create: {
      email: 'ngocanh.cntt@ictu.edu.vn',
      password: hashedPassword,
      fullName: 'Phạm Thị Ngọc Ánh',
      studentCode: 'DTC235200050',
      role: Role.STUDENT,
      phone: '0967862569',
      gender: Gender.FEMALE,
    },
  });

  // 4. Tài khoản Sinh viên bạn cùng phòng: Nguyễn Văn An (MSV: DTC235200088)
  const student2 = await prisma.user.upsert({
    where: { email: 'vanan.cntt@ictu.edu.vn' },
    update: {
      password: hashedPassword,
      fullName: 'Nguyễn Văn An',
      studentCode: 'DTC235200088',
      role: Role.STUDENT,
      phone: '0912345678',
      gender: Gender.MALE,
    },
    create: {
      email: 'vanan.cntt@ictu.edu.vn',
      password: hashedPassword,
      fullName: 'Nguyễn Văn An',
      studentCode: 'DTC235200088',
      role: Role.STUDENT,
      phone: '0912345678',
      gender: Gender.MALE,
    },
  });

  // 5. Tài khoản Sinh viên mới nộp đơn chờ duyệt: Trần Thị Hương (MSV: DTC235200099)
  const student3 = await prisma.user.upsert({
    where: { email: 'thihuong.cntt@ictu.edu.vn' },
    update: {
      password: hashedPassword,
      fullName: 'Trần Thị Hương',
      studentCode: 'DTC235200099',
      role: Role.STUDENT,
      phone: '0977889900',
      gender: Gender.FEMALE,
    },
    create: {
      email: 'thihuong.cntt@ictu.edu.vn',
      password: hashedPassword,
      fullName: 'Trần Thị Hương',
      studentCode: 'DTC235200099',
      role: Role.STUDENT,
      phone: '0977889900',
      gender: Gender.FEMALE,
    },
  });
  console.log(`✅ [Demo Seed] Tài khoản Sinh viên: ${student1.fullName} (${student1.studentCode}), ${student2.fullName}, ${student3.fullName}`);

  // 6. Tạo danh mục phòng mẫu
  const roomData = [
    { roomNumber: 'A101', building: 'Tòa A (Nam)', floor: 1, type: RoomType.STANDARD, price: 450000, cap: 4 },
    { roomNumber: 'A102', building: 'Tòa A (Nam)', floor: 1, type: RoomType.VIP, price: 750000, cap: 2 },
    { roomNumber: 'B101', building: 'Tòa B (Nữ)', floor: 1, type: RoomType.STANDARD, price: 450000, cap: 4 },
    { roomNumber: 'B102', building: 'Tòa B (Nữ)', floor: 1, type: RoomType.VIP, price: 750000, cap: 2 },
  ];

  let roomA101Id = 1;
  let bed1Id = 1;
  let bed2Id = 2;

  for (const r of roomData) {
    const room = await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: {
        pricePerMonth: r.price,
        capacity: r.cap,
      },
      create: {
        roomNumber: r.roomNumber,
        building: r.building,
        floor: r.floor,
        roomType: r.type,
        pricePerMonth: r.price,
        capacity: r.cap,
        currentOccupancy: 0,
        status: RoomStatus.AVAILABLE,
        description: `Phòng ${r.roomNumber} - ${r.building}, trang bị đầy đủ quạt, đèn học, bình nóng lạnh.`,
      },
    });

    if (r.roomNumber === 'A101') roomA101Id = room.id;

    for (let i = 1; i <= r.cap; i++) {
      const bedNumber = `G${i}`;
      const bed = await prisma.bed.upsert({
        where: {
          roomId_bedNumber: {
            roomId: room.id,
            bedNumber: bedNumber,
          },
        },
        update: {},
        create: {
          bedNumber: bedNumber,
          roomId: room.id,
          status: BedStatus.VACANT,
        },
      });

      if (r.roomNumber === 'A101' && i === 1) bed1Id = bed.id;
      if (r.roomNumber === 'A101' && i === 2) bed2Id = bed.id;
    }
  }

  // 7. Gán phòng & giường thực tế cho sinh viên Phạm Thị Ngọc Ánh và bạn cùng phòng
  // Giải phóng giường cũ (nếu có) để đảm bảo tính idempotent
  await prisma.bed.updateMany({
    where: { occupiedById: { in: [student1.id, student2.id] } },
    data: { status: BedStatus.VACANT, occupiedById: null },
  });

  await prisma.bed.update({
    where: { id: bed1Id },
    data: {
      status: BedStatus.OCCUPIED,
      occupiedById: student1.id,
    },
  });

  await prisma.bed.update({
    where: { id: bed2Id },
    data: {
      status: BedStatus.OCCUPIED,
      occupiedById: student2.id,
    },
  });

  await prisma.room.update({
    where: { id: roomA101Id },
    data: {
      currentOccupancy: 2,
    },
  });

  console.log(`✅ [Demo Seed] Đã phân bổ phòng A101: Giường G1 (Phạm Thị Ngọc Ánh), Giường G2 (Nguyễn Văn An)`);

  // 8. Tạo đơn đăng ký lưu trú mẫu (1 đơn đã duyệt cho Ngọc Ánh, 1 đơn chờ duyệt cho Hương)
  const existingReg1 = await prisma.registration.findFirst({
    where: { userId: student1.id },
  });
  if (!existingReg1) {
    await prisma.registration.create({
      data: {
        userId: student1.id,
        preferredRoomId: roomA101Id,
        allocatedBedId: bed1Id,
        semester: 'Học kỳ 1 (2026-2027)',
        academicYear: '2026-2027',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-01-31'),
        status: RegistrationStatus.APPROVED,
        note: 'Đơn đăng ký chính thức của sinh viên Phạm Thị Ngọc Ánh',
      },
    });
  }

  const existingReg3 = await prisma.registration.findFirst({
    where: { userId: student3.id },
  });
  if (!existingReg3) {
    await prisma.registration.create({
      data: {
        userId: student3.id,
        preferredRoomId: roomA101Id,
        semester: 'Học kỳ 1 (2026-2027)',
        academicYear: '2026-2027',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2027-02-28'),
        status: RegistrationStatus.PENDING,
        note: 'Đơn đăng ký mới của sinh viên Trần Thị Hương đang chờ Ban Quản lý duyệt',
      },
    });
  }
  console.log(`✅ [Demo Seed] Đã tạo đơn đăng ký mẫu: APPROVED (#1) và PENDING (#2 chờ duyệt demo)`);

  // 9. Tạo yêu cầu báo hỏng mẫu cho phòng A101
  const existingReq = await prisma.maintenanceRequest.findFirst({
    where: { userId: student1.id, roomId: roomA101Id },
  });
  if (!existingReq) {
    await prisma.maintenanceRequest.create({
      data: {
        userId: student1.id,
        roomId: roomA101Id,
        title: 'Bình nóng lạnh phòng A101 không vào điện',
        description: 'Bình nóng lạnh có hiện tượng rò rỉ rơ-le hoặc hỏng atomat, đèn báo không sáng.',
        urgency: UrgencyLevel.HIGH,
        status: MaintenanceStatus.PROCESSING,
        adminFeedback: 'Bộ phận kỹ thuật điện nước đã tiếp nhận và xếp lịch kiểm tra vào sáng mai.',
      },
    });
  }
  console.log(`✅ [Demo Seed] Đã tạo phiếu báo hỏng mẫu: Phòng A101 (Trạng thái: PROCESSING)`);

  // 10. Tạo thông báo mẫu KTX
  await prisma.notification.deleteMany({});
  await prisma.notification.createMany({
    data: [
      {
        title: 'Quy chế giờ giấc mở cửa Ký túc xá ICTU',
        content: 'Ký túc xá mở cửa từ 05h30 và đóng cửa lúc 23h00 hàng ngày. Sinh viên có việc gấp cần thông báo trước cho cán bộ trực bàn qua ứng dụng.',
        isPinned: true,
      },
      {
        title: 'Thông báo nộp tiền phòng Học kỳ 1 Năm học 2026 - 2027',
        content: 'Ban Quản lý KTX thông báo hạn nộp phí lưu trú học kỳ 1 trước ngày 15/10/2026. Sinh viên có thể thanh toán trực tiếp hoặc qua tài khoản nhà trường.',
        isPinned: true,
      },
      {
        title: 'Lịch bảo trì hệ thống cấp nước tầng 1 Tòa A',
        content: 'Ban quản lý thông báo tạm ngừng cấp nước từ 13h30 đến 15h30 ngày thứ Năm để sửa chữa đường ống chính.',
        isPinned: false,
      },
    ],
  });
  console.log(`✅ [Demo Seed] Đã tạo 3 thông báo bảng tin mẫu.`);

  // 11. Tạo mẫu Chat Log AI
  const logCount = await prisma.chatLog.count();
  if (logCount === 0) {
    await prisma.chatLog.createMany({
      data: [
        {
          userId: student1.id,
          sessionId: 'KNOWLEDGE_BASE_FALLBACK|ICTU-RuleEngine-v1',
          userMessage: 'Mấy giờ thì ký túc xá đóng cửa?',
          botReply: 'Theo Điều 1 Nội quy Ký túc xá ICTU: Giờ mở cửa KTX là từ 05:30 sáng và giờ đóng cửa là 23:00 hàng ngày. Sinh viên về muộn vì lý do học tập hoặc công việc đột xuất cần liên hệ Ban Quản lý để được hỗ trợ.',
        },
        {
          userId: student1.id,
          sessionId: 'KNOWLEDGE_BASE_FALLBACK|ICTU-RuleEngine-v1',
          userMessage: 'Tôi đang ở phòng nào vậy?',
          botReply: '🏢 **Thông tin phòng lưu trú của bạn (Phạm Thị Ngọc Ánh - MSV: DTC235200050):**\n- Phòng hiện tại: **A101** (Giường số: **G1**)\n- Tòa nhà: **Tòa A (Nam)** - Tầng: **1**\n- Đơn giá phòng: **450,000 đ/tháng**\n- Bạn cùng phòng: **Nguyễn Văn An** (MSV: DTC235200088 - Giường G2)',
        },
      ],
    });
    console.log(`✅ [Demo Seed] Đã tạo 2 bản ghi nhật ký hỏi đáp AI mẫu.`);
  }

  console.log('\n===============================================================');
  console.log('  HOÀN TẤT THIẾT LẬP BỘ DỮ LIỆU DEMO AN TOÀN SẴN SÀNG 100%!   ');
  console.log('===============================================================\n');
}

main()
  .catch((e) => {
    console.error('[Demo Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
