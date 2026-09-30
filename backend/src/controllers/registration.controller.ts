import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { Gender, RegistrationStatus, BedStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class RegistrationController {
  // Lấy danh sách đơn đăng ký (cho Admin và tra cứu)
  static async getRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const { status, search } = req.query;

      const whereClause: any = {};

      if (status && status !== 'ALL') {
        whereClause.status = String(status) as RegistrationStatus;
      }

      if (search) {
        whereClause.OR = [
          { user: { fullName: { contains: String(search) } } },
          { user: { studentCode: { contains: String(search) } } },
          { preferredRoom: { roomNumber: { contains: String(search) } } },
        ];
      }

      const registrations = await prisma.registration.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
              email: true,
              phone: true,
              gender: true,
            },
          },
          preferredRoom: {
            include: {
              beds: true,
            },
          },
          allocatedBed: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: registrations,
        total: registrations.length,
      });
    } catch (error: any) {
      console.error('[RegistrationController.getRegistrations Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách đơn đăng ký',
        error: error.message,
      });
    }
  }

  // Tạo mới một đơn đăng ký (Client gửi lên)
  static async createRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, studentCode, email, phone, gender, roomId, semester, notes } = req.body;

      if (!fullName || !studentCode || !email || !roomId || !semester) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (họ tên, mã SV, email, phòng, học kỳ)',
        });
        return;
      }

      // Tìm hoặc tạo người dùng sinh viên
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { studentCode }],
        },
      });

      if (!user) {
        const defaultPassword = await bcrypt.hash('123456', 10);
        user = await prisma.user.create({
          data: {
            fullName,
            studentCode,
            email,
            phone: phone || null,
            gender: gender === 'FEMALE' ? Gender.FEMALE : Gender.MALE,
            password: defaultPassword,
          },
        });
      }

      // Xác minh phòng tồn tại
      const parsedRoomId = parseInt(roomId, 10);
      const room = await prisma.room.findUnique({
        where: { id: parsedRoomId },
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Phòng ký túc xá được chọn không tồn tại',
        });
        return;
      }

      // Tạo đơn đăng ký
      const registration = await prisma.registration.create({
        data: {
          userId: user.id,
          preferredRoomId: room.id,
          semester: semester,
          academicYear: '2026-2027',
          startDate: new Date(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 tháng
          status: RegistrationStatus.PENDING,
          note: notes || null,
        },
        include: {
          user: true,
          preferredRoom: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Nộp đơn đăng ký lưu trú KTX thành công!',
        data: {
          id: registration.id,
          registrationCode: `REG-2026-${String(registration.id).padStart(4, '0')}`,
          registration,
        },
      });
    } catch (error: any) {
      console.error('[RegistrationController.createRegistration Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý đơn đăng ký',
        error: error.message,
      });
    }
  }

  // Phê duyệt đơn đăng ký & phân bổ giường (Admin)
  static async approveRegistration(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { bedId } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Mã đơn đăng ký không hợp lệ' });
        return;
      }

      const registration = await prisma.registration.findUnique({
        where: { id },
        include: { preferredRoom: true },
      });

      if (!registration) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn đăng ký' });
        return;
      }

      const parsedBedId = bedId ? parseInt(bedId, 10) : null;

      // Cập nhật giao dịch: Duyệt đơn, gán giường, cập nhật trạng thái giường và sĩ số phòng
      const updatedRegistration = await prisma.$transaction(async (tx) => {
        if (parsedBedId) {
          await tx.bed.update({
            where: { id: parsedBedId },
            data: {
              status: BedStatus.OCCUPIED,
              occupiedById: registration.userId,
            },
          });

          if (registration.preferredRoomId) {
            await tx.room.update({
              where: { id: registration.preferredRoomId },
              data: {
                currentOccupancy: { increment: 1 },
              },
            });
          }
        }

        return tx.registration.update({
          where: { id },
          data: {
            status: RegistrationStatus.APPROVED,
            allocatedBedId: parsedBedId,
          },
          include: {
            user: true,
            preferredRoom: true,
            allocatedBed: true,
          },
        });
      });

      res.status(200).json({
        success: true,
        message: `Đã phê duyệt đơn đăng ký #${id} thành công!`,
        data: updatedRegistration,
      });
    } catch (error: any) {
      console.error('[RegistrationController.approveRegistration Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi phê duyệt đơn đăng ký',
        error: error.message,
      });
    }
  }

  // Từ chối đơn đăng ký (Admin)
  static async rejectRegistration(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { rejectionReason } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Mã đơn đăng ký không hợp lệ' });
        return;
      }

      const updated = await prisma.registration.update({
        where: { id },
        data: {
          status: RegistrationStatus.REJECTED,
          rejectionReason: rejectionReason || 'Không đủ điều kiện tiếp nhận đợt này',
        },
        include: {
          user: true,
          preferredRoom: true,
        },
      });

      res.status(200).json({
        success: true,
        message: `Đã từ chối đơn đăng ký #${id}`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[RegistrationController.rejectRegistration Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi từ chối đơn đăng ký',
        error: error.message,
      });
    }
  }
}
