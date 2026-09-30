import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { RoomType, RoomStatus, BedStatus } from '@prisma/client';

export class RoomController {
  // 1. Lấy danh sách phòng và trạng thái sức chứa (kèm danh sách giường và người đang ở)
  static async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const { building, status, roomType, search } = req.query;

      const whereClause: any = {};

      if (building && building !== 'ALL') {
        whereClause.building = { contains: String(building) };
      }

      if (status && status !== 'ALL') {
        whereClause.status = String(status) as RoomStatus;
      }

      if (roomType && roomType !== 'ALL') {
        whereClause.roomType = String(roomType) as RoomType;
      }

      if (search) {
        whereClause.OR = [
          { roomNumber: { contains: String(search) } },
          { building: { contains: String(search) } },
        ];
      }

      const rooms = await prisma.room.findMany({
        where: whereClause,
        include: {
          beds: {
            orderBy: { bedNumber: 'asc' },
            include: {
              occupiedBy: {
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
          },
        },
        orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }],
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

  // 2. Lấy chi tiết một phòng theo ID kèm danh sách giường, người ở và bảo trì
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
          beds: {
            orderBy: { bedNumber: 'asc' },
            include: {
              occupiedBy: {
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
          },
          registrations: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  studentCode: true,
                },
              },
            },
          },
          maintenanceRequests: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  studentCode: true,
                },
              },
            },
          },
        },
      });

      if (!room) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin phòng' });
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

  // 3. Thống kê tổng hợp sức chứa và trạng thái phòng toàn hệ thống
  static async getRoomStats(req: Request, res: Response): Promise<void> {
    try {
      const rooms = await prisma.room.findMany({
        include: {
          beds: true,
        },
      });

      const totalRooms = rooms.length;
      let totalCapacity = 0;
      let totalOccupancy = 0;
      let availableRoomsCount = 0;
      let fullRoomsCount = 0;
      let maintenanceRoomsCount = 0;

      // Group by building
      const buildingStatsMap: Record<
        string,
        {
          building: string;
          totalRooms: number;
          capacity: number;
          occupancy: number;
          availableBeds: number;
        }
      > = {};

      rooms.forEach((r) => {
        totalCapacity += r.capacity;
        totalOccupancy += r.currentOccupancy;

        if (r.status === RoomStatus.AVAILABLE) availableRoomsCount++;
        else if (r.status === RoomStatus.FULL) fullRoomsCount++;
        else if (r.status === RoomStatus.MAINTENANCE) maintenanceRoomsCount++;

        if (!buildingStatsMap[r.building]) {
          buildingStatsMap[r.building] = {
            building: r.building,
            totalRooms: 0,
            capacity: 0,
            occupancy: 0,
            availableBeds: 0,
          };
        }

        buildingStatsMap[r.building].totalRooms += 1;
        buildingStatsMap[r.building].capacity += r.capacity;
        buildingStatsMap[r.building].occupancy += r.currentOccupancy;
        buildingStatsMap[r.building].availableBeds += Math.max(0, r.capacity - r.currentOccupancy);
      });

      const totalVacantBeds = Math.max(0, totalCapacity - totalOccupancy);
      const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

      res.status(200).json({
        success: true,
        data: {
          totalRooms,
          totalCapacity,
          totalOccupancy,
          totalVacantBeds,
          occupancyRate,
          roomsByStatus: {
            available: availableRoomsCount,
            full: fullRoomsCount,
            maintenance: maintenanceRoomsCount,
          },
          buildings: Object.values(buildingStatsMap),
        },
      });
    } catch (error: any) {
      console.error('[RoomController.getRoomStats Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tổng hợp thống kê sức chứa phòng',
        error: error.message,
      });
    }
  }

  // 4. [ADMIN] Tạo mới phòng ký túc xá (tự động khởi tạo danh sách giường theo sức chứa)
  static async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const {
        roomNumber,
        building,
        floor,
        roomType,
        pricePerMonth,
        capacity,
        description,
      } = req.body;

      if (!roomNumber || !building || floor === undefined || !pricePerMonth || !capacity) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ các thông tin bắt buộc: Số phòng, Tòa nhà, Tầng, Giá thuê và Sức chứa',
        });
        return;
      }

      const formattedRoomNumber = String(roomNumber).trim().toUpperCase();

      // Kiểm tra trùng số phòng
      const existing = await prisma.room.findUnique({
        where: { roomNumber: formattedRoomNumber },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: `Số phòng ${formattedRoomNumber} đã tồn tại trong hệ thống KTX`,
        });
        return;
      }

      const cap = parseInt(String(capacity), 10);
      if (isNaN(cap) || cap <= 0 || cap > 12) {
        res.status(400).json({
          success: false,
          message: 'Sức chứa phòng phải là số nguyên từ 1 đến 12 giường',
        });
        return;
      }

      // Tạo phòng và tự động sinh danh sách giường
      const newRoom = await prisma.$transaction(async (tx) => {
        const createdRoom = await tx.room.create({
          data: {
            roomNumber: formattedRoomNumber,
            building: String(building).trim(),
            floor: parseInt(String(floor), 10),
            roomType: roomType === 'VIP' ? RoomType.VIP : RoomType.STANDARD,
            pricePerMonth: parseFloat(String(pricePerMonth)),
            capacity: cap,
            currentOccupancy: 0,
            status: RoomStatus.AVAILABLE,
            description: description ? String(description).trim() : null,
          },
        });

        // Tạo beds G1, G2, ..., G{cap}
        const bedsData = Array.from({ length: cap }, (_, idx) => ({
          bedNumber: `G${idx + 1}`,
          roomId: createdRoom.id,
          status: BedStatus.VACANT,
        }));

        await tx.bed.createMany({
          data: bedsData,
        });

        return tx.room.findUnique({
          where: { id: createdRoom.id },
          include: { beds: true },
        });
      });

      res.status(201).json({
        success: true,
        message: `Khởi tạo phòng ${formattedRoomNumber} thành công với ${cap} giường!`,
        data: newRoom,
      });
    } catch (error: any) {
      console.error('[RoomController.createRoom Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo mới phòng KTX',
        error: error.message,
      });
    }
  }

  // 5. [ADMIN] Cập nhật thông tin phòng và quy tắc đồng bộ trạng thái
  static async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID phòng không hợp lệ' });
        return;
      }

      const {
        roomNumber,
        building,
        floor,
        roomType,
        pricePerMonth,
        status,
        description,
      } = req.body;

      const currentRoom = await prisma.room.findUnique({
        where: { id },
        include: { beds: true },
      });

      if (!currentRoom) {
        res.status(404).json({ success: false, message: 'Không tìm thấy phòng cần cập nhật' });
        return;
      }

      // Xác định trạng thái phòng theo quy tắc nghiệp vụ đã phê duyệt
      let resolvedStatus = currentRoom.status;

      if (status === RoomStatus.MAINTENANCE) {
        resolvedStatus = RoomStatus.MAINTENANCE;
      } else if (status === RoomStatus.AVAILABLE || status === RoomStatus.FULL) {
        // Tự động kiểm tra sức chứa thực tế
        if (currentRoom.currentOccupancy >= currentRoom.capacity) {
          resolvedStatus = RoomStatus.FULL;
        } else {
          resolvedStatus = RoomStatus.AVAILABLE;
        }
      }

      const updated = await prisma.room.update({
        where: { id },
        data: {
          ...(roomNumber && { roomNumber: String(roomNumber).trim().toUpperCase() }),
          ...(building && { building: String(building).trim() }),
          ...(floor !== undefined && { floor: parseInt(String(floor), 10) }),
          ...(roomType && { roomType: roomType === 'VIP' ? RoomType.VIP : RoomType.STANDARD }),
          ...(pricePerMonth !== undefined && { pricePerMonth: parseFloat(String(pricePerMonth)) }),
          status: resolvedStatus,
          ...(description !== undefined && { description: description ? String(description).trim() : null }),
        },
        include: {
          beds: {
            include: {
              occupiedBy: {
                select: { id: true, fullName: true, studentCode: true },
              },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: `Cập nhật thông tin phòng ${updated.roomNumber} thành công!`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[RoomController.updateRoom Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin phòng',
        error: error.message,
      });
    }
  }

  // 6. [ADMIN] Cập nhật trạng thái từng giường trong phòng (Bảo trì / Trống / Đặt chỗ)
  static async updateBedStatus(req: Request, res: Response): Promise<void> {
    try {
      const roomId = parseInt(String(req.params.roomId), 10);
      const bedId = parseInt(String(req.params.bedId), 10);
      const { status } = req.body;

      if (isNaN(roomId) || isNaN(bedId)) {
        res.status(400).json({ success: false, message: 'Tham số ID phòng hoặc giường không hợp lệ' });
        return;
      }

      const bed = await prisma.bed.findFirst({
        where: { id: bedId, roomId },
      });

      if (!bed) {
        res.status(404).json({ success: false, message: 'Không tìm thấy giường trong phòng này' });
        return;
      }

      // Nếu đang có người ở mà muốn chuyển sang VACANT, cần giải phóng người ở
      let targetOccupiedById = bed.occupiedById;
      if (status === BedStatus.VACANT) {
        targetOccupiedById = null;
      }

      const updatedBed = await prisma.$transaction(async (tx) => {
        const b = await tx.bed.update({
          where: { id: bedId },
          data: {
            status: status as BedStatus,
            occupiedById: targetOccupiedById,
          },
        });

        // Tính lại số người đang ở thực tế trong phòng
        const countOccupied = await tx.bed.count({
          where: {
            roomId,
            occupiedById: { not: null },
          },
        });

        const room = await tx.room.findUnique({ where: { id: roomId } });
        if (room && room.status !== RoomStatus.MAINTENANCE) {
          const newRoomStatus = countOccupied >= room.capacity ? RoomStatus.FULL : RoomStatus.AVAILABLE;
          await tx.room.update({
            where: { id: roomId },
            data: {
              currentOccupancy: countOccupied,
              status: newRoomStatus,
            },
          });
        }

        return b;
      });

      res.status(200).json({
        success: true,
        message: `Cập nhật trạng thái giường ${bed.bedNumber} thành công!`,
        data: updatedBed,
      });
    } catch (error: any) {
      console.error('[RoomController.updateBedStatus Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái giường',
        error: error.message,
      });
    }
  }

  // 7. [ADMIN] Xóa phòng (chỉ cho phép khi phòng chưa có sinh viên lưu trú)
  static async deleteRoom(req: Request, res: Response): Promise<void> {
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
        },
      });

      if (!room) {
        res.status(404).json({ success: false, message: 'Không tìm thấy phòng để xóa' });
        return;
      }

      if (room.currentOccupancy > 0) {
        res.status(400).json({
          success: false,
          message: `Không thể xóa phòng ${room.roomNumber} vì hiện đang có ${room.currentOccupancy} sinh viên lưu trú!`,
        });
        return;
      }

      await prisma.room.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: `Đã xóa phòng ${room.roomNumber} và toàn bộ giường liên quan thành công!`,
      });
    } catch (error: any) {
      console.error('[RoomController.deleteRoom Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa phòng',
        error: error.message,
      });
    }
  }
}
