import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { RegistrationStatus, BedStatus, UrgencyLevel } from '@prisma/client';

export class DashboardController {
  // Thống kê tổng hợp phục vụ Executive Dashboard Admin
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const [
        totalRooms,
        totalBeds,
        occupiedBeds,
        pendingRegistrations,
        urgentIssues,
        recentRegistrations,
        recentMaintenance,
        rooms,
      ] = await Promise.all([
        prisma.room.count(),
        prisma.bed.count(),
        prisma.bed.count({ where: { status: BedStatus.OCCUPIED } }),
        prisma.registration.count({ where: { status: RegistrationStatus.PENDING } }),
        prisma.maintenanceRequest.count({
          where: {
            urgency: UrgencyLevel.HIGH,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
        }),
        prisma.registration.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true, studentCode: true } },
            preferredRoom: { select: { roomNumber: true } },
          },
        }),
        prisma.maintenanceRequest.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            room: { select: { roomNumber: true } },
            user: { select: { fullName: true } },
          },
        }),
        prisma.room.findMany({
          include: { beds: true },
        }),
      ]);

      const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

      // Tính tỷ lệ lấp đầy theo tòa
      const buildingStats: { [key: string]: { total: number; occupied: number } } = {};
      rooms.forEach((r) => {
        const bName = r.building.includes('Tòa A') ? 'Tòa A (Nam)' : 'Tòa B (Nữ)';
        if (!buildingStats[bName]) {
          buildingStats[bName] = { total: 0, occupied: 0 };
        }
        buildingStats[bName].total += r.beds.length;
        buildingStats[bName].occupied += r.beds.filter((b) => b.status === BedStatus.OCCUPIED).length;
      });

      res.status(200).json({
        success: true,
        data: {
          totalRooms,
          totalBeds,
          occupiedBeds,
          vacantBeds: totalBeds - occupiedBeds,
          occupancyRate,
          pendingRegistrations,
          urgentIssues,
          buildingStats,
          recentRegistrations,
          recentMaintenance,
        },
      });
    } catch (error: any) {
      console.error('[DashboardController.getStats Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tổng hợp số liệu thống kê Dashboard',
        error: error.message,
      });
    }
  }
}
