import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dormitorySettings = [
  { key: 'OPENING_HOUR', value: '05:30', description: 'Giờ mở cửa KTX' },
  { key: 'CLOSING_HOUR', value: '23:00', description: 'Giờ đóng cửa KTX' },
  { key: 'HOTLINE', value: '0208.3846.115', description: 'Số hotline hỗ trợ sinh viên' },
  { key: 'DUTY_ROOM', value: 'Phòng Quản lý KTX Tòa A1', description: 'Địa điểm trực Ban Quản lý' },
  { key: 'CURRENT_ACADEMIC_YEAR', value: '2026 - 2027', description: 'Năm học hiện tại' },
  { key: 'CURRENT_SEMESTER', value: 'Học kỳ 1', description: 'Học kỳ hiện tại' },
];

async function main(): Promise<void> {
  for (const setting of dormitorySettings) {
    await prisma.dormitorySetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }

  console.log(`Đã đồng bộ ${dormitorySettings.length} cấu hình KTX.`);
}

main()
  .catch((error) => {
    console.error('Không thể seed cấu hình KTX:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
