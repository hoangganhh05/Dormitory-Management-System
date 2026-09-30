import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class RoomController {
  // Lấy danh sách phòng (kèm theo danh sách giường) và hỗ trợ lọc
  static async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const { building, status, search } = req.query;

      const whereClause: any = {};

      if (building && building !== 'ALL') {
        whereClause.building = { contains: String(building) };
      }

      if (status && status !== 'ALL') {
        whereClause.status = String(status);
      }

      if (search) {
        whereClause.roomNumber = { contains: String(search) };
      }

      const rooms = await prisma.room.findMany({
        where: whereClause,
        include: {
          beds: {
            orderBy: { bedNumber: 'asc' },
          },
        },
        orderBy: { roomNumber: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: rooms,
        total: rooms.length,
      });
    } catch (error: any) {
      console.error('[RoomController.getRooms Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách phòng từ cơ sở dữ liệu',
        error: error.message,
      });
    }
  }

  // Lấy chi tiết một phòng theo ID
  static async getRoomById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID phòng không hợp lệ' });
        return;
      }

      const room = await prisma.room.findUnique({
        where: { id },
        include: {
          beds: true,
          registrations: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!room) {
        res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        return;
      }

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error: any) {
      console.error('[RoomController.getRoomById Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin chi tiết phòng',
        error: error.message,
      });
    }
  }
}
