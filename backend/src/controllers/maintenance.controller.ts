import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { UrgencyLevel, MaintenanceStatus } from '@prisma/client';

export class MaintenanceController {
  // Lấy danh sách yêu cầu bảo trì / báo hỏng
  static async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;

      const whereClause: any = {};
      if (status && status !== 'ALL') {
        whereClause.status = String(status) as MaintenanceStatus;
      }

      const requests = await prisma.maintenanceRequest.findMany({
        where: whereClause,
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
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: requests,
        total: requests.length,
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

  // Tạo mới một yêu cầu báo hỏng (Client)
  static async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const { roomNumber, title, description, urgency, studentCode } = req.body;

      if (!roomNumber || !description) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp số phòng và mô tả chi tiết sự cố',
        });
        return;
      }

      // Tìm phòng theo số phòng
      const room = await prisma.room.findFirst({
        where: { roomNumber: String(roomNumber) },
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: `Không tìm thấy phòng số ${roomNumber}`,
        });
        return;
      }

      // Tìm user báo sự cố (hoặc mặc định user mẫu nếu chưa đăng nhập)
      let user = null;
      if (studentCode) {
        user = await prisma.user.findFirst({ where: { studentCode } });
      }
      if (!user) {
        user = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
      }

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Không tìm thấy thông tin sinh viên gửi yêu cầu',
        });
        return;
      }

      let parsedUrgency: UrgencyLevel = UrgencyLevel.MEDIUM;
      if (urgency === 'HIGH' || urgency === 'Khẩn cấp') parsedUrgency = UrgencyLevel.HIGH;
      else if (urgency === 'LOW' || urgency === 'Thấp') parsedUrgency = UrgencyLevel.LOW;

      const newRequest = await prisma.maintenanceRequest.create({
        data: {
          roomId: room.id,
          userId: user.id,
          title: title || 'Báo hỏng cơ sở vật chất phòng',
          description,
          urgency: parsedUrgency,
          status: MaintenanceStatus.PENDING,
        },
        include: {
          room: true,
          user: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu sửa chữa thiết bị thành công!',
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

  // Cập nhật trạng thái xử lý yêu cầu (Admin)
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { status, adminFeedback } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
        return;
      }

      const updated = await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: status as MaintenanceStatus,
          adminFeedback: adminFeedback || null,
        },
        include: {
          room: true,
          user: true,
        },
      });

      res.status(200).json({
        success: true,
        message: `Đã cập nhật trạng thái yêu cầu #${id}`,
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
}
