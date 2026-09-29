import { PrismaClient, Role, Gender, RoomType, RoomStatus, BedStatus, UrgencyLevel, MaintenanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu nạp dữ liệu mẫu (Seed Data) cho KTX ---');

  // 1. Tạo mật khẩu hash mẫu: '123456'
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 2. Tạo tài khoản Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dormitory.com' },
    update: {},
    create: {
      email: 'admin@dormitory.com',
      password: hashedPassword,
      fullName: 'Ban Quản Lý KTX',
      role: Role.ADMIN,
      phone: '0985333555',
      gender: Gender.MALE,
    },
  });
  console.log(`[Seed] Đã tạo Admin: ${admin.email}`);

  // 3. Tạo tài khoản Sinh viên mẫu
  const student1 = await prisma.user.upsert({
    where: { email: 'ngocanh.cntt@ictu.edu.vn' },
    update: {},
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

  const student2 = await prisma.user.upsert({
    where: { email: 'vanan.cntt@ictu.edu.vn' },
    update: {},
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
  console.log(`[Seed] Đã tạo Sinh viên: ${student1.fullName}, ${student2.fullName}`);

  // 4. Tạo các phòng mẫu (Tòa A dành cho Nam, Tòa B dành cho Nữ)
  const roomData = [
    { roomNumber: 'A101', building: 'Tòa A (Nam)', floor: 1, type: RoomType.STANDARD, price: 450000, cap: 4 },
    { roomNumber: 'A102', building: 'Tòa A (Nam)', floor: 1, type: RoomType.VIP, price: 750000, cap: 2 },
    { roomNumber: 'B101', building: 'Tòa B (Nữ)', floor: 1, type: RoomType.STANDARD, price: 450000, cap: 4 },
    { roomNumber: 'B102', building: 'Tòa B (Nữ)', floor: 1, type: RoomType.VIP, price: 750000, cap: 2 },
  ];

  for (const r of roomData) {
    const room = await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: {},
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

    // Tạo các giường trong phòng
    for (let i = 1; i <= r.cap; i++) {
      const bedNumber = `G${i}`;
      await prisma.bed.upsert({
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
    }
  }
  console.log(`[Seed] Đã tạo 4 phòng mẫu và các giường tương ứng.`);

  // 5. Tạo thông báo mẫu KTX
  await prisma.notification.createMany({
    data: [
      {
        title: 'Quy chế giờ giấc mở cửa Ký túc xá',
        content: 'Ký túc xá mở cửa từ 05h30 và đóng cửa lúc 23h00 hàng ngày. Sinh viên có việc gấp cần thông báo trước cho cán bộ trực bàn.',
        isPinned: true,
      },
      {
        title: 'Lịch bảo trì hệ thống cấp nước tầng 1 Tòa A',
        content: 'Ban quản lý thông báo tạm ngừng cấp nước từ 13h30 đến 15h30 ngày thứ Năm để sửa chữa đường ống chính.',
        isPinned: false,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`[Seed] Đã tạo thông báo bảng tin mẫu.`);

  console.log('--- Hoàn tất nạp dữ liệu mẫu thành công! ---');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
