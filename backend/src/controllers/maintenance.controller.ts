import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { UrgencyLevel, MaintenanceStatus, Role } from '@prisma/client';

export class MaintenanceController {
  /**
   * Helper trích xuất thông tin người dùng từ token
   */
  private static async extractAuthUser(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
      if (!decoded || !decoded.id) return null;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          occupiedBed: {
            include: {
              room: true,
            },
          },
        },
      });

      return user;
    } catch {
      return null;
    }
  }

  // 1. Thống kê số liệu yêu cầu sửa chữa (cho Admin Dashboard & Header)
  static async getMaintenanceStats(req: Request, res: Response): Promise<void> {
    try {
      const [total, pending, processing, resolved, rejected, highUrgency] = await Promise.all([
        prisma.maintenanceRequest.count(),
        prisma.maintenanceRequest.count({ where: { status: MaintenanceStatus.PENDING } }),
        prisma.maintenanceRequest.count({ where: { status: MaintenanceStatus.PROCESSING } }),
        prisma.maintenanceRequest.count({ where: { status: MaintenanceStatus.RESOLVED } }),
        prisma.maintenanceRequest.count({ where: { status: MaintenanceStatus.REJECTED } }),
        prisma.maintenanceRequest.count({ where: { urgency: UrgencyLevel.HIGH } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          total,
          pending,
          processing,
          resolved,
          rejected,
          highUrgency,
        },
      });
    } catch (error: any) {
      console.error('[MaintenanceController.getMaintenanceStats Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thống kê số liệu yêu cầu bảo trì',
        error: error.message,
      });
    }
  }

  // 2. Lấy danh sách toàn bộ yêu cầu bảo trì (Admin Portal - có lọc & tìm kiếm & phân trang)
  static async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status, urgency, building, search, page = 1, limit = 20 } = req.query;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(100, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const andConditions: any[] = [];

      // Lọc theo trạng thái
      if (status && status !== 'ALL' && Object.values(MaintenanceStatus).includes(status as any)) {
        andConditions.push({ status: status as MaintenanceStatus });
      }

      // Lọc theo mức độ khẩn cấp
      if (urgency && urgency !== 'ALL' && Object.values(UrgencyLevel).includes(urgency as any)) {
        andConditions.push({ urgency: urgency as UrgencyLevel });
      }

      // Lọc theo tòa nhà
      if (building && building !== 'ALL') {
        andConditions.push({ room: { building: { contains: String(building) } } });
      }

      // Tìm kiếm theo từ khóa
      if (search && String(search).trim() !== '') {
        const keyword = String(search).trim();
        andConditions.push({
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
            { room: { roomNumber: { contains: keyword } } },
            { user: { fullName: { contains: keyword } } },
            { user: { studentCode: { contains: keyword } } },
            { user: { phone: { contains: keyword } } },
          ],
        });
      }

      const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

      const [total, requests] = await Promise.all([
        prisma.maintenanceRequest.count({ where: whereClause }),
        prisma.maintenanceRequest.findMany({
          where: whereClause,
          include: {
            room: {
              select: {
                id: true,
                roomNumber: true,
                building: true,
                floor: true,
                roomType: true,
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
                studentCode: true,
                phone: true,
                email: true,
                gender: true,
              },
            },
          },
          orderBy: [
            { urgency: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limitNum,
        }),
      ]);

      res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    } catch (error: any) {
      console.error('[MaintenanceController.getRequests Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách yêu cầu bảo trì',
        error: error.message,
      });
    }
  }

  // 3. Lấy danh sách yêu cầu của sinh viên đang đăng nhập (Client Portal)
  static async getMyRequests(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await MaintenanceController.extractAuthUser(req);
      if (!authUser) {
        res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để xem lịch sử báo hỏng cơ sở vật chất',
        });
        return;
      }

      // Lấy các yêu cầu do chính sinh viên tạo HOẶC các yêu cầu thuộc phòng sinh viên đang ở
      const roomId = authUser.occupiedBed?.roomId;

      const whereClause: any = {
        OR: [{ userId: authUser.id }],
      };

      if (roomId) {
        whereClause.OR.push({ roomId });
      }

      const requests = await prisma.maintenanceRequest.findMany({
        where: whereClause,
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              building: true,
              floor: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: requests,
        total: requests.length,
      });
    } catch (error: any) {
      console.error('[MaintenanceController.getMyRequests Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải lịch sử báo hỏng của bạn',
        error: error.message,
      });
    }
  }

  // 4. Lấy chi tiết một yêu cầu bảo trì
  static async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
        return;
      }

      const item = await prisma.maintenanceRequest.findUnique({
        where: { id },
        include: {
          room: true,
          user: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      if (!item) {
        res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu sửa chữa' });
        return;
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error: any) {
      console.error('[MaintenanceController.getRequestById Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải chi tiết yêu cầu bảo trì',
        error: error.message,
      });
    }
  }

  // 5. Tạo mới một yêu cầu báo hỏng (Client hoặc Admin hỗ trợ ghi nhận)
  static async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await MaintenanceController.extractAuthUser(req);
      const { roomNumber, title, description, urgency } = req.body;

      if (!description || !description.trim()) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mô tả chi tiết sự cố hỏng hóc',
        });
        return;
      }

      // Sinh viên luôn phải báo đúng phòng đang được phân trong CSDL.
      // Chỉ tài khoản quản trị mới được chỉ định phòng khác trong request.
      let targetRoomNumber = authUser?.role === Role.STUDENT
        ? authUser.occupiedBed?.room?.roomNumber
        : roomNumber?.trim() || authUser?.occupiedBed?.room?.roomNumber;

      if (!targetRoomNumber) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp số phòng cần sửa chữa',
        });
        return;
      }

      // Tìm phòng trong CSDL
      const room = await prisma.room.findFirst({
        where: { roomNumber: targetRoomNumber },
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: `Không tìm thấy phòng số ${targetRoomNumber} trong hệ thống KTX`,
        });
        return;
      }

      // Xác định user gửi yêu cầu
      const targetUserId: number | null = authUser?.id || null;

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          message: 'Không tìm thấy thông tin sinh viên gửi yêu cầu',
        });
        return;
      }

      // Parse mức độ khẩn cấp
      let parsedUrgency: UrgencyLevel = UrgencyLevel.MEDIUM;
      if (urgency === 'HIGH' || urgency === 'Khẩn cấp') parsedUrgency = UrgencyLevel.HIGH;
      else if (urgency === 'LOW' || urgency === 'Thấp') parsedUrgency = UrgencyLevel.LOW;

      const newRequest = await prisma.maintenanceRequest.create({
        data: {
          roomId: room.id,
          userId: targetUserId,
          title: title?.trim() || 'Báo hỏng cơ sở vật chất phòng',
          description: description.trim(),
          urgency: parsedUrgency,
          status: MaintenanceStatus.PENDING,
        },
        include: {
          room: true,
          user: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
              phone: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu sửa chữa thiết bị thành công! Đội kỹ thuật sẽ tiếp nhận và xử lý.',
        data: newRequest,
      });
    } catch (error: any) {
      console.error('[MaintenanceController.createRequest Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi yêu cầu sửa chữa thiết bị',
        error: error.message,
      });
    }
  }

  // 6. [ADMIN] Cập nhật tiến độ xử lý & Phản hồi kỹ thuật
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { status, adminFeedback } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
        return;
      }

      if (!status || !Object.values(MaintenanceStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Trạng thái yêu cầu không hợp lệ (PENDING, PROCESSING, RESOLVED, REJECTED)',
        });
        return;
      }

      const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu sửa chữa' });
        return;
      }

      const updated = await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: status as MaintenanceStatus,
          adminFeedback: adminFeedback !== undefined ? (adminFeedback?.trim() || null) : existing.adminFeedback,
        },
        include: {
          room: true,
          user: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
              phone: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: `Đã cập nhật trạng thái yêu cầu #${id} thành công!`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[MaintenanceController.updateStatus Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái yêu cầu bảo trì',
        error: error.message,
      });
    }
  }

  // 7. [ADMIN] Xóa yêu cầu bảo trì
  static async deleteRequest(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
        return;
      }

      const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu cần xóa' });
        return;
      }

      await prisma.maintenanceRequest.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: `Đã xóa yêu cầu sửa chữa #${id} thành công!`,
      });
    } catch (error: any) {
      console.error('[MaintenanceController.deleteRequest Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa yêu cầu bảo trì',
        error: error.message,
      });
    }
  }
}
