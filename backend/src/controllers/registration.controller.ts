import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { Gender, RegistrationStatus, BedStatus, RoomStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class RegistrationController {
  // 1. Thống kê tổng hợp đơn đăng ký cho Admin Dashboard
  static async getRegistrationStats(req: Request, res: Response): Promise<void> {
    try {
      const registrations = await prisma.registration.findMany({
        select: {
          id: true,
          status: true,
          semester: true,
          createdAt: true,
        },
      });

      const total = registrations.length;
      let pending = 0;
      let approved = 0;
      let rejected = 0;
      let cancelled = 0;

      registrations.forEach((r) => {
        if (r.status === RegistrationStatus.PENDING) pending++;
        else if (r.status === RegistrationStatus.APPROVED) approved++;
        else if (r.status === RegistrationStatus.REJECTED) rejected++;
        else if (r.status === RegistrationStatus.CANCELLED) cancelled++;
      });

      res.status(200).json({
        success: true,
        data: {
          total,
          pending,
          approved,
          rejected,
          cancelled,
        },
      });
    } catch (error: any) {
      console.error('[RegistrationController.getRegistrationStats Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thống kê đơn đăng ký',
        error: error.message,
      });
    }
  }

  // 2. Lấy danh sách đơn đăng ký (Admin Portal)
  static async getRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const { status, semester, search } = req.query;

      const whereClause: any = {};

      if (status && status !== 'ALL') {
        whereClause.status = String(status) as RegistrationStatus;
      }

      if (semester && semester !== 'ALL') {
        whereClause.semester = { contains: String(semester) };
      }

      if (search) {
        whereClause.OR = [
          { user: { fullName: { contains: String(search) } } },
          { user: { studentCode: { contains: String(search) } } },
          { user: { email: { contains: String(search) } } },
          { user: { phone: { contains: String(search) } } },
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
              beds: {
                orderBy: { bedNumber: 'asc' },
              },
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

  // 3. Lấy chi tiết đơn đăng ký theo ID
  static async getRegistrationById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID đơn đăng ký không hợp lệ' });
        return;
      }

      const registration = await prisma.registration.findUnique({
        where: { id },
        include: {
          user: true,
          preferredRoom: {
            include: {
              beds: {
                orderBy: { bedNumber: 'asc' },
                include: {
                  occupiedBy: {
                    select: { id: true, fullName: true, studentCode: true },
                  },
                },
              },
            },
          },
          allocatedBed: true,
        },
      });

      if (!registration) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn đăng ký' });
        return;
      }

      res.status(200).json({
        success: true,
        data: registration,
      });
    } catch (error: any) {
      console.error('[RegistrationController.getRegistrationById Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải chi tiết đơn đăng ký',
        error: error.message,
      });
    }
  }

  // 4. [CLIENT] Lấy danh sách đơn đăng ký của chính sinh viên đang đăng nhập
  static async getMyRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Chưa xác thực đăng nhập' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);

      const list = await prisma.registration.findMany({
        where: { userId: decoded.id },
        include: {
          preferredRoom: {
            select: {
              roomNumber: true,
              building: true,
              floor: true,
              pricePerMonth: true,
              roomType: true,
            },
          },
          allocatedBed: {
            select: {
              id: true,
              bedNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: list,
      });
    } catch (error: any) {
      console.error('[RegistrationController.getMyRegistrations Error]', error);
      res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
        error: error.message,
      });
    }
  }

  // 5. [CLIENT] Tạo mới đơn đăng ký lưu trú
  static async createRegistration(req: Request, res: Response): Promise<void> {
    try {
      const {
        fullName,
        studentCode,
        email,
        phone,
        gender,
        roomId,
        semester,
        academicYear,
        startDate,
        endDate,
        notes,
      } = req.body;

      // Kiểm tra nếu client gửi kèm token đăng nhập
      let userId: number | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
          userId = decoded.id;
        } catch {
          // Token không bắt buộc nếu sinh viên đăng ký lần đầu ngoài form công khai
        }
      }

      let user;
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      }

      if (!user) {
        if (!fullName || !studentCode || !email) {
          res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ thông tin: Họ tên, Mã sinh viên và Email',
          });
          return;
        }

        user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: String(email).trim().toLowerCase() },
              { studentCode: String(studentCode).trim().toUpperCase() },
            ],
          },
        });

        if (!user) {
          const defaultPassword = await bcrypt.hash('123456', 10);
          user = await prisma.user.create({
            data: {
              fullName: String(fullName).trim(),
              studentCode: String(studentCode).trim().toUpperCase(),
              email: String(email).trim().toLowerCase(),
              phone: phone ? String(phone).trim() : null,
              gender: gender === 'FEMALE' ? Gender.FEMALE : Gender.MALE,
              password: defaultPassword,
            },
          });
        }
      }

      if (!roomId) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng chọn phòng ký túc xá nguyện vọng',
        });
        return;
      }

      const parsedRoomId = parseInt(String(roomId), 10);
      const room = await prisma.room.findUnique({
        where: { id: parsedRoomId },
        include: { beds: true },
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Phòng ký túc xá được chọn không tồn tại',
        });
        return;
      }

      if (room.status === RoomStatus.MAINTENANCE) {
        res.status(400).json({
          success: false,
          message: `Phòng ${room.roomNumber} hiện đang bảo trì, không thể tiếp nhận đăng ký mới lúc này`,
        });
        return;
      }

      // Kiểm tra xem sinh viên đã có đơn PENDING cho cùng học kỳ chưa
      const existingPending = await prisma.registration.findFirst({
        where: {
          userId: user.id,
          status: RegistrationStatus.PENDING,
        },
      });

      if (existingPending) {
        res.status(409).json({
          success: false,
          message: 'Bạn hiện đã có một đơn đăng ký đang chờ xét duyệt (#REG-' + existingPending.id + '). Vui lòng chờ BQL xử lý hoặc hủy đơn cũ trước khi gửi đơn mới.',
        });
        return;
      }

      const defaultSemester = semester || 'Học kỳ 1 (2026 - 2027)';
      const defaultAcademicYear = academicYear || '2026-2027';
      const parsedStart = startDate ? new Date(startDate) : new Date();
      const parsedEnd = endDate ? new Date(endDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

      const registration = await prisma.registration.create({
        data: {
          userId: user.id,
          preferredRoomId: room.id,
          semester: defaultSemester,
          academicYear: defaultAcademicYear,
          startDate: parsedStart,
          endDate: parsedEnd,
          status: RegistrationStatus.PENDING,
          note: notes ? String(notes).trim() : null,
        },
        include: {
          user: true,
          preferredRoom: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Gửi đơn đăng ký lưu trú thành công! Ban Quản lý KTX sẽ xét duyệt hồ sơ trong thời gian sớm nhất.',
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
        message: 'Lỗi khi gửi đơn đăng ký lưu trú',
        error: error.message,
      });
    }
  }

  // 6. [ADMIN] Phê duyệt đơn đăng ký & phân bổ giường
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
        include: {
          preferredRoom: {
            include: {
              beds: true,
            },
          },
        },
      });

      if (!registration) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký' });
        return;
      }

      if (registration.status !== RegistrationStatus.PENDING) {
        res.status(400).json({
          success: false,
          message: `Đơn đăng ký #${id} hiện có trạng thái "${registration.status}", không thể duyệt lại`,
        });
        return;
      }

      let targetBedId: number | null = bedId ? parseInt(String(bedId), 10) : null;

      // Nếu không truyền bedId, tự động tìm giường trống đầu tiên của phòng nguyện vọng
      if (!targetBedId && registration.preferredRoom) {
        const vacantBed = registration.preferredRoom.beds.find((b) => b.status === BedStatus.VACANT);
        if (vacantBed) {
          targetBedId = vacantBed.id;
        }
      }

      // Thực hiện phê duyệt trong database transaction
      const result = await prisma.$transaction(async (tx) => {
        let assignedBedNumber = '';

        if (targetBedId) {
          const bed = await tx.bed.findUnique({
            where: { id: targetBedId },
            include: { room: true },
          });

          if (!bed) {
            throw new Error(`Giường ID ${targetBedId} không tồn tại.`);
          }

          if (bed.status === BedStatus.OCCUPIED) {
            throw new Error(`Giường ${bed.bedNumber} đã có người ở. Vui lòng chọn giường khác.`);
          }

          assignedBedNumber = bed.bedNumber;

          // Cập nhật giường thành OCCUPIED và gán vào sinh viên
          await tx.bed.update({
            where: { id: targetBedId },
            data: {
              status: BedStatus.OCCUPIED,
              occupiedById: registration.userId,
            },
          });

          // Cập nhật sĩ số phòng và trạng thái phòng
          const updatedOccupancy = await tx.bed.count({
            where: { roomId: bed.roomId, occupiedById: { not: null } },
          });

          const newRoomStatus = updatedOccupancy >= bed.room.capacity ? RoomStatus.FULL : RoomStatus.AVAILABLE;
          await tx.room.update({
            where: { id: bed.roomId },
            data: {
              currentOccupancy: updatedOccupancy,
              status: bed.room.status === RoomStatus.MAINTENANCE ? RoomStatus.MAINTENANCE : newRoomStatus,
            },
          });
        }

        // Cập nhật đơn đăng ký
        const updatedReg = await tx.registration.update({
          where: { id },
          data: {
            status: RegistrationStatus.APPROVED,
            allocatedBedId: targetBedId,
          },
          include: {
            user: true,
            preferredRoom: true,
            allocatedBed: true,
          },
        });

        return { updatedReg, assignedBedNumber };
      });

      res.status(200).json({
        success: true,
        message: `Đã phê duyệt đơn đăng ký #${id} cho sinh viên ${result.updatedReg.user.fullName}${result.assignedBedNumber ? ' (Giường ' + result.assignedBedNumber + ')' : ''}!`,
        data: result.updatedReg,
      });
    } catch (error: any) {
      console.error('[RegistrationController.approveRegistration Error]', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi phê duyệt đơn đăng ký',
      });
    }
  }

  // 7. [ADMIN] Từ chối đơn đăng ký
  static async rejectRegistration(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { rejectionReason } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Mã đơn đăng ký không hợp lệ' });
        return;
      }

      const registration = await prisma.registration.findUnique({ where: { id } });
      if (!registration) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký' });
        return;
      }

      if (registration.status !== RegistrationStatus.PENDING) {
        res.status(400).json({
          success: false,
          message: `Đơn đăng ký #${id} hiện có trạng thái "${registration.status}", không thể từ chối`,
        });
        return;
      }

      const reason = rejectionReason ? String(rejectionReason).trim() : 'Hồ sơ chưa đáp ứng đủ tiêu chuẩn tiếp nhận đợt này.';

      const updated = await prisma.registration.update({
        where: { id },
        data: {
          status: RegistrationStatus.REJECTED,
          rejectionReason: reason,
        },
        include: {
          user: true,
          preferredRoom: true,
        },
      });

      res.status(200).json({
        success: true,
        message: `Đã từ chối đơn đăng ký #${id}!`,
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

  // 8. [CLIENT] Sinh viên tự hủy đơn đăng ký của mình
  static async cancelMyRegistration(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Chưa xác thực thông tin đăng nhập' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Mã đơn đăng ký không hợp lệ' });
        return;
      }

      const registration = await prisma.registration.findUnique({
        where: { id },
      });

      if (!registration) {
        res.status(404).json({ success: false, message: 'Không tìm thấy đơn đăng ký' });
        return;
      }

      if (registration.userId !== decoded.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên đơn đăng ký này' });
        return;
      }

      if (registration.status !== RegistrationStatus.PENDING) {
        res.status(400).json({
          success: false,
          message: 'Chỉ có thể hủy đơn khi đang ở trạng thái Chờ duyệt (PENDING)',
        });
        return;
      }

      const updated = await prisma.registration.update({
        where: { id },
        data: {
          status: RegistrationStatus.CANCELLED,
        },
      });

      res.status(200).json({
        success: true,
        message: `Đã hủy đơn đăng ký #${id} thành công!`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[RegistrationController.cancelMyRegistration Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy đơn đăng ký',
        error: error.message,
      });
    }
  }
}
