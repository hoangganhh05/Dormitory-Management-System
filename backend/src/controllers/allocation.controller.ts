import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { BedStatus, RoomStatus, AllocationActionType, Role } from '@prisma/client';

export class AllocationController {
  // 1. Thống kê tổng quan phân phòng & điều chuyển lưu trú
  static async getAllocationStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalStudents,
        housedStudents,
        totalBeds,
        vacantBeds,
        totalHistories,
        checkInCount,
        transferCount,
        checkOutCount,
      ] = await Promise.all([
        prisma.user.count({ where: { role: Role.STUDENT } }),
        prisma.bed.count({ where: { occupiedById: { not: null } } }),
        prisma.bed.count(),
        prisma.bed.count({ where: { status: BedStatus.VACANT } }),
        prisma.bedAllocationHistory.count(),
        prisma.bedAllocationHistory.count({ where: { actionType: AllocationActionType.CHECK_IN } }),
        prisma.bedAllocationHistory.count({ where: { actionType: AllocationActionType.TRANSFER } }),
        prisma.bedAllocationHistory.count({ where: { actionType: AllocationActionType.CHECK_OUT } }),
      ]);

      const unassignedStudents = Math.max(0, totalStudents - housedStudents);

      res.status(200).json({
        success: true,
        data: {
          totalStudents,
          housedStudents,
          unassignedStudents,
          totalBeds,
          vacantBeds,
          totalHistories,
          actions: {
            checkIn: checkInCount,
            transfer: transferCount,
            checkOut: checkOutCount,
          },
        },
      });
    } catch (error: any) {
      console.error('[AllocationController.getAllocationStats Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê phân bổ lưu trú',
        error: error.message,
      });
    }
  }

  // 2. Tra cứu lịch sử phân bổ và điều chuyển phòng/giường
  static async getAllocationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, actionType, search } = req.query;

      const whereClause: any = {};

      if (studentId) {
        whereClause.userId = parseInt(String(studentId), 10);
      }

      if (actionType && actionType !== 'ALL') {
        whereClause.actionType = String(actionType) as AllocationActionType;
      }

      if (search) {
        whereClause.OR = [
          { user: { fullName: { contains: String(search) } } },
          { user: { studentCode: { contains: String(search) } } },
          { fromBedInfo: { contains: String(search) } },
          { toBedInfo: { contains: String(search) } },
          { note: { contains: String(search) } },
        ];
      }

      const histories = await prisma.bedAllocationHistory.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: histories,
        total: histories.length,
      });
    } catch (error: any) {
      console.error('[AllocationController.getAllocationHistory Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải lịch sử điều chuyển lưu trú',
        error: error.message,
      });
    }
  }

  // 3. Lấy danh sách giường còn trống sẵn sàng tiếp nhận phân bổ (kèm lọc giới tính)
  static async getAvailableBeds(req: Request, res: Response): Promise<void> {
    try {
      const { gender, building } = req.query;

      const whereClause: any = {
        status: BedStatus.VACANT,
        occupiedById: null,
        room: {
          status: { not: RoomStatus.MAINTENANCE },
        },
      };

      if (building && building !== 'ALL') {
        whereClause.room.building = { contains: String(building) };
      }

      // Quy tắc phân bổ theo giới tính: Nam -> Tòa A, Nữ -> Tòa B
      if (gender === 'MALE') {
        whereClause.room.building = { contains: 'Tòa A' };
      } else if (gender === 'FEMALE') {
        whereClause.room.building = { contains: 'Tòa B' };
      }

      const beds = await prisma.bed.findMany({
        where: whereClause,
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              building: true,
              floor: true,
              pricePerMonth: true,
              roomType: true,
              capacity: true,
              currentOccupancy: true,
            },
          },
        },
        orderBy: [
          { room: { building: 'asc' } },
          { room: { roomNumber: 'asc' } },
          { bedNumber: 'asc' },
        ],
      });

      res.status(200).json({
        success: true,
        data: beds,
        total: beds.length,
      });
    } catch (error: any) {
      console.error('[AllocationController.getAvailableBeds Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách giường trống',
        error: error.message,
      });
    }
  }

  // 4. [ADMIN] Phân giường lần đầu cho sinh viên (Ngăn phân trùng chặt chẽ)
  static async allocateBed(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, bedId, note } = req.body;

      if (!studentId || !bedId) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ ID sinh viên và ID vị trí giường phân bổ',
        });
        return;
      }

      const parsedStudentId = parseInt(String(studentId), 10);
      const parsedBedId = parseInt(String(bedId), 10);

      // 1. Kiểm tra sinh viên
      const student = await prisma.user.findUnique({
        where: { id: parsedStudentId },
        include: {
          occupiedBed: {
            include: { room: true },
          },
        },
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên' });
        return;
      }

      // Ngăn phân trùng: Nếu sinh viên đã có giường, không cho phân mới mà phải dùng chuyển giường
      if (student.occupiedBed) {
        res.status(409).json({
          success: false,
          message: `Sinh viên ${student.fullName} hiện đã có giường lưu trú (Phòng ${student.occupiedBed.room.roomNumber} - Giường ${student.occupiedBed.bedNumber}). Vui lòng dùng chức năng "Chuyển giường (Transfer)" nếu muốn đổi chỗ ở.`,
        });
        return;
      }

      // 2. Kiểm tra giường đích
      const targetBed = await prisma.bed.findUnique({
        where: { id: parsedBedId },
        include: {
          room: true,
          occupiedBy: true,
        },
      });

      if (!targetBed) {
        res.status(404).json({ success: false, message: 'Không tìm thấy vị trí giường chỉ định' });
        return;
      }

      // Ngăn phân trùng: Giường đích không được có người ở hoặc giữ chỗ
      if (targetBed.occupiedById || targetBed.status !== BedStatus.VACANT) {
        const occupantName = targetBed.occupiedBy?.fullName || 'Người khác';
        res.status(409).json({
          success: false,
          message: `Giường ${targetBed.bedNumber} (Phòng ${targetBed.room.roomNumber}) hiện không khả dụng (đang có ${occupantName} ở hoặc đã được giữ chỗ)!`,
        });
        return;
      }

      if (targetBed.room.status === RoomStatus.MAINTENANCE) {
        res.status(400).json({
          success: false,
          message: `Phòng ${targetBed.room.roomNumber} đang trong chế độ bảo trì, không thể xếp sinh viên vào!`,
        });
        return;
      }

      // Kiểm tra quy tắc giới tính tòa nhà
      if (student.gender === 'MALE' && targetBed.room.building.includes('Tòa B')) {
        res.status(400).json({
          success: false,
          message: 'Quy định KTX: Sinh viên Nam không được phân vào Khu Tòa B (Nữ)',
        });
        return;
      }
      if (student.gender === 'FEMALE' && targetBed.room.building.includes('Tòa A')) {
        res.status(400).json({
          success: false,
          message: 'Quy định KTX: Sinh viên Nữ không được phân vào Khu Tòa A (Nam)',
        });
        return;
      }

      const toInfo = `Phòng ${targetBed.room.roomNumber} - Giường ${targetBed.bedNumber} (${targetBed.room.building})`;

      // Thực hiện Transaction phân giường và ghi lịch sử
      const result = await prisma.$transaction(async (tx) => {
        // Gán giường
        const b = await tx.bed.update({
          where: { id: parsedBedId },
          data: {
            occupiedById: parsedStudentId,
            status: BedStatus.OCCUPIED,
          },
        });

        // Cập nhật sĩ số phòng
        const count = await tx.bed.count({
          where: { roomId: targetBed.roomId, occupiedById: { not: null } },
        });

        const newStatus = count >= targetBed.room.capacity ? RoomStatus.FULL : RoomStatus.AVAILABLE;
        await tx.room.update({
          where: { id: targetBed.roomId },
          data: {
            currentOccupancy: count,
            status: newStatus,
          },
        });

        // Ghi nhận lịch sử lưu trú
        const hist = await tx.bedAllocationHistory.create({
          data: {
            userId: parsedStudentId,
            toBedInfo: toInfo,
            actionType: AllocationActionType.CHECK_IN,
            performedBy: 'Ban Quản Lý KTX',
            note: note ? String(note).trim() : 'Phân giường lưu trú ban đầu',
          },
        });

        return { b, hist };
      });

      res.status(200).json({
        success: true,
        message: `Đã phân bổ thành công sinh viên ${student.fullName} vào ${toInfo}!`,
        data: result,
      });
    } catch (error: any) {
      console.error('[AllocationController.allocateBed Error]', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi phân bổ giường cho sinh viên',
      });
    }
  }

  // 5. [ADMIN] Điều chuyển sinh viên sang phòng / giường khác (Transfer)
  static async transferBed(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, targetBedId, note } = req.body;

      if (!studentId || !targetBedId) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ID sinh viên và ID vị trí giường mới muốn chuyển đến',
        });
        return;
      }

      const parsedStudentId = parseInt(String(studentId), 10);
      const parsedTargetBedId = parseInt(String(targetBedId), 10);

      // 1. Kiểm tra sinh viên và giường hiện tại
      const student = await prisma.user.findUnique({
        where: { id: parsedStudentId },
        include: {
          occupiedBed: {
            include: { room: true },
          },
        },
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên' });
        return;
      }

      if (!student.occupiedBed) {
        res.status(400).json({
          success: false,
          message: `Sinh viên ${student.fullName} hiện chưa được xếp phòng/giường. Vui lòng dùng chức năng "Phân giường lần đầu (Check-in)".`,
        });
        return;
      }

      const oldBed = student.occupiedBed;
      if (oldBed.id === parsedTargetBedId) {
        res.status(400).json({
          success: false,
          message: 'Vị trí giường mới trùng với vị trí giường hiện tại của sinh viên!',
        });
        return;
      }

      // 2. Kiểm tra giường đích
      const targetBed = await prisma.bed.findUnique({
        where: { id: parsedTargetBedId },
        include: {
          room: true,
          occupiedBy: true,
        },
      });

      if (!targetBed) {
        res.status(404).json({ success: false, message: 'Không tìm thấy vị trí giường chuyển đến' });
        return;
      }

      // Ngăn phân trùng: Giường đích phải đang trống
      if (targetBed.occupiedById || targetBed.status !== BedStatus.VACANT) {
        const occupant = targetBed.occupiedBy?.fullName || 'Người khác';
        res.status(409).json({
          success: false,
          message: `Giường đích ${targetBed.bedNumber} (Phòng ${targetBed.room.roomNumber}) hiện đang có ${occupant} ở hoặc đã bị khóa!`,
        });
        return;
      }

      if (targetBed.room.status === RoomStatus.MAINTENANCE) {
        res.status(400).json({
          success: false,
          message: `Phòng đích ${targetBed.room.roomNumber} đang bảo trì, không thể chuyển sinh viên đến!`,
        });
        return;
      }

      // Kiểm tra giới tính
      if (student.gender === 'MALE' && targetBed.room.building.includes('Tòa B')) {
        res.status(400).json({
          success: false,
          message: 'Quy định KTX: Sinh viên Nam không được chuyển sang Khu Tòa B (Nữ)',
        });
        return;
      }
      if (student.gender === 'FEMALE' && targetBed.room.building.includes('Tòa A')) {
        res.status(400).json({
          success: false,
          message: 'Quy định KTX: Sinh viên Nữ không được chuyển sang Khu Tòa A (Nam)',
        });
        return;
      }

      const fromInfo = `Phòng ${oldBed.room.roomNumber} - Giường ${oldBed.bedNumber} (${oldBed.room.building})`;
      const toInfo = `Phòng ${targetBed.room.roomNumber} - Giường ${targetBed.bedNumber} (${targetBed.room.building})`;

      // Transaction điều chuyển và lưu lịch sử
      const result = await prisma.$transaction(async (tx) => {
        // 1. Giải phóng giường cũ
        await tx.bed.update({
          where: { id: oldBed.id },
          data: {
            occupiedById: null,
            status: BedStatus.VACANT,
          },
        });

        // Cập nhật lại occupancy phòng cũ
        const oldRoomCount = await tx.bed.count({
          where: { roomId: oldBed.roomId, occupiedById: { not: null } },
        });
        await tx.room.update({
          where: { id: oldBed.roomId },
          data: {
            currentOccupancy: oldRoomCount,
            status: oldBed.room.status === RoomStatus.MAINTENANCE ? RoomStatus.MAINTENANCE : RoomStatus.AVAILABLE,
          },
        });

        // 2. Chiếm giường mới
        await tx.bed.update({
          where: { id: targetBed.id },
          data: {
            occupiedById: parsedStudentId,
            status: BedStatus.OCCUPIED,
          },
        });

        // Cập nhật lại occupancy phòng mới
        const newRoomCount = await tx.bed.count({
          where: { roomId: targetBed.roomId, occupiedById: { not: null } },
        });
        const newRoomStatus = newRoomCount >= targetBed.room.capacity ? RoomStatus.FULL : RoomStatus.AVAILABLE;
        await tx.room.update({
          where: { id: targetBed.roomId },
          data: {
            currentOccupancy: newRoomCount,
            status: targetBed.room.status === RoomStatus.MAINTENANCE ? RoomStatus.MAINTENANCE : newRoomStatus,
          },
        });

        // 3. Ghi lịch sử chuyển giường
        const hist = await tx.bedAllocationHistory.create({
          data: {
            userId: parsedStudentId,
            fromBedInfo: fromInfo,
            toBedInfo: toInfo,
            actionType: AllocationActionType.TRANSFER,
            performedBy: 'Ban Quản Lý KTX',
            note: note ? String(note).trim() : 'Điều chuyển vị trí giường theo nguyện vọng/sắp xếp của BQL',
          },
        });

        return { hist };
      });

      res.status(200).json({
        success: true,
        message: `Đã điều chuyển sinh viên ${student.fullName} từ ${fromInfo} sang ${toInfo} thành công!`,
        data: result,
      });
    } catch (error: any) {
      console.error('[AllocationController.transferBed Error]', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi điều chuyển vị trí giường',
      });
    }
  }

  // 6. [ADMIN] Trả phòng / Kết thúc lưu trú (Check-out)
  static async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, note } = req.body;

      if (!studentId) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID sinh viên cần trả phòng' });
        return;
      }

      const parsedStudentId = parseInt(String(studentId), 10);

      const student = await prisma.user.findUnique({
        where: { id: parsedStudentId },
        include: {
          occupiedBed: {
            include: { room: true },
          },
        },
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên' });
        return;
      }

      if (!student.occupiedBed) {
        res.status(400).json({
          success: false,
          message: `Sinh viên ${student.fullName} hiện không có giường lưu trú trong hệ thống.`,
        });
        return;
      }

      const bed = student.occupiedBed;
      const fromInfo = `Phòng ${bed.room.roomNumber} - Giường ${bed.bedNumber} (${bed.room.building})`;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Giải phóng giường
        await tx.bed.update({
          where: { id: bed.id },
          data: {
            occupiedById: null,
            status: BedStatus.VACANT,
          },
        });

        // 2. Cập nhật phòng
        const count = await tx.bed.count({
          where: { roomId: bed.roomId, occupiedById: { not: null } },
        });

        await tx.room.update({
          where: { id: bed.roomId },
          data: {
            currentOccupancy: count,
            status: bed.room.status === RoomStatus.MAINTENANCE ? RoomStatus.MAINTENANCE : RoomStatus.AVAILABLE,
          },
        });

        // 3. Ghi lịch sử trả phòng
        const hist = await tx.bedAllocationHistory.create({
          data: {
            userId: parsedStudentId,
            fromBedInfo: fromInfo,
            actionType: AllocationActionType.CHECK_OUT,
            performedBy: 'Ban Quản Lý KTX',
            note: note ? String(note).trim() : 'Kết thúc hợp đồng lưu trú / Trả phòng KTX',
          },
        });

        return { hist };
      });

      res.status(200).json({
        success: true,
        message: `Đã hoàn tất trả phòng cho sinh viên ${student.fullName} (${fromInfo})!`,
        data: result,
      });
    } catch (error: any) {
      console.error('[AllocationController.checkOut Error]', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi thực hiện trả phòng',
      });
    }
  }
}
