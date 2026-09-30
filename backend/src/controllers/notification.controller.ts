import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  TargetRole,
  Role,
} from '@prisma/client';

interface AuthUserContext {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  building?: string | null;
}

export class NotificationController {
  /**
   * Helper trích xuất thông tin người dùng từ JWT token (nếu có)
   */
  private static async extractAuthUser(req: Request): Promise<AuthUserContext | null> {
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
              room: {
                select: {
                  building: true,
                },
              },
            },
          },
        },
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        building: user.occupiedBed?.room?.building || null,
      };
    } catch {
      return null;
    }
  }

  // 1. Thống kê thông báo (KPIs cho Admin hoặc Dashboard)
  static async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const [total, published, draft, archived, pinned, urgent, byCategoryList] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { status: NotificationStatus.PUBLISHED } }),
        prisma.notification.count({ where: { status: NotificationStatus.DRAFT } }),
        prisma.notification.count({ where: { status: NotificationStatus.ARCHIVED } }),
        prisma.notification.count({ where: { isPinned: true } }),
        prisma.notification.count({ where: { priority: NotificationPriority.URGENT } }),
        prisma.notification.groupBy({
          by: ['category'],
          _count: { id: true },
        }),
      ]);

      const categoriesCount: Record<string, number> = {};
      byCategoryList.forEach((item) => {
        categoriesCount[item.category] = item._count.id;
      });

      res.status(200).json({
        success: true,
        data: {
          total,
          published,
          draft,
          archived,
          pinned,
          urgent,
          categories: categoriesCount,
        },
      });
    } catch (error: any) {
      console.error('[NotificationController.getNotificationStats Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thống kê thông báo',
        error: error.message,
      });
    }
  }

  // 2. Tra cứu danh sách thông báo (Phân quyền bảo mật theo đối tượng nhận)
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await NotificationController.extractAuthUser(req);
      const {
        category,
        priority,
        status,
        targetRole,
        targetBuilding,
        isPinned,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(100, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const andConditions: any[] = [];

      // Phân quyền theo vai trò (Role-based & Audience-based Visibility):
      if (!authUser) {
        // Khách vãng lai / Sinh viên chưa đăng nhập:
        andConditions.push({ status: NotificationStatus.PUBLISHED });
        andConditions.push({ targetRole: TargetRole.ALL });
        andConditions.push({ targetBuilding: null });
      } else if (authUser.role === Role.STUDENT) {
        // Sinh viên đã đăng nhập:
        // 1. Chỉ xem thông báo đã xuất bản
        andConditions.push({ status: NotificationStatus.PUBLISHED });
        // 2. Chỉ xem thông báo cho ALL hoặc STUDENT (Tuyệt đối không thấy ADMIN)
        andConditions.push({ targetRole: { in: [TargetRole.ALL, TargetRole.STUDENT] } });

        // 3. Phân quyền theo tòa nhà lưu trú:
        if (authUser.building) {
          // Sinh viên có phòng tại tòa cụ thể (ví dụ Tòa A)
          // Được xem thông báo chung toàn KTX (null) HOẶC thông báo dành riêng cho tòa của mình
          andConditions.push({
            OR: [
              { targetBuilding: null },
              { targetBuilding: authUser.building },
            ],
          });
        } else {
          // Sinh viên chưa được xếp phòng: chỉ xem thông báo chung không giới hạn tòa
          andConditions.push({ targetBuilding: null });
        }
      } else if (authUser.role === Role.ADMIN) {
        // Quản trị viên KTX: Toàn quyền xem mọi thông báo, có thể lọc theo tham số query
        if (status && Object.values(NotificationStatus).includes(status as any)) {
          andConditions.push({ status: status as NotificationStatus });
        }
        if (targetRole && Object.values(TargetRole).includes(targetRole as any)) {
          andConditions.push({ targetRole: targetRole as TargetRole });
        }
        if (targetBuilding && targetBuilding !== 'ALL') {
          andConditions.push({ targetBuilding: String(targetBuilding) });
        }
      }

      // Lọc theo Chuyên mục (Category)
      if (category && Object.values(NotificationCategory).includes(category as any)) {
        andConditions.push({ category: category as NotificationCategory });
      }

      // Lọc theo Mức độ ưu tiên (Priority)
      if (priority && Object.values(NotificationPriority).includes(priority as any)) {
        andConditions.push({ priority: priority as NotificationPriority });
      }

      // Lọc theo cờ Ghim (Pinned)
      if (isPinned !== undefined) {
        andConditions.push({ isPinned: isPinned === 'true' });
      }

      // Tìm kiếm từ khóa (Search Keyword)
      if (search && String(search).trim() !== '') {
        const keyword = String(search).trim();
        andConditions.push({
          OR: [
            { title: { contains: keyword } },
            { summary: { contains: keyword } },
            { content: { contains: keyword } },
          ],
        });
      }

      const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

      const [total, notifications] = await Promise.all([
        prisma.notification.count({ where: whereClause }),
        prisma.notification.findMany({
          where: whereClause,
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
            reads: authUser
              ? {
                  where: { userId: authUser.id },
                  select: { readAt: true },
                }
              : false,
            _count: {
              select: { reads: true },
            },
          },
          orderBy: [
            { isPinned: 'desc' },
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limitNum,
        }),
      ]);

      // Chuẩn hóa kết quả trả về kèm trạng thái đã đọc
      const formattedData = notifications.map((n: any) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        content: n.content,
        category: n.category,
        priority: n.priority,
        targetRole: n.targetRole,
        targetBuilding: n.targetBuilding,
        isPinned: n.isPinned,
        status: n.status,
        viewCount: n.viewCount,
        readsCount: n._count?.reads || 0,
        isRead: authUser ? (n.reads && n.reads.length > 0) : false,
        author: n.author ? { id: n.author.id, fullName: n.author.fullName, role: n.author.role } : null,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));

      res.status(200).json({
        success: true,
        data: formattedData,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    } catch (error: any) {
      console.error('[NotificationController.getNotifications Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tra cứu danh sách thông báo',
        error: error.message,
      });
    }
  }

  // 3. Xem chi tiết thông báo (Kiểm tra quyền truy cập + ghi nhận lượt xem & đã đọc)
  static async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notifId = Number(id);
      if (isNaN(notifId)) {
        res.status(400).json({ success: false, message: 'ID thông báo không hợp lệ' });
        return;
      }

      const authUser = await NotificationController.extractAuthUser(req);

      const notification = await prisma.notification.findUnique({
        where: { id: notifId },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: { reads: true },
          },
        },
      });

      if (!notification) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông báo yêu cầu' });
        return;
      }

      // Kiểm tra quyền xem (Audience Validation):
      if (!authUser) {
        if (notification.status !== NotificationStatus.PUBLISHED || notification.targetRole !== TargetRole.ALL || notification.targetBuilding !== null) {
          res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông báo này' });
          return;
        }
      } else if (authUser.role === Role.STUDENT) {
        if (notification.status !== NotificationStatus.PUBLISHED) {
          res.status(403).json({ success: false, message: 'Thông báo này chưa được phát hành' });
          return;
        }
        if (notification.targetRole === TargetRole.ADMIN) {
          res.status(403).json({ success: false, message: 'Thông báo này chỉ dành riêng cho Ban Quản trị' });
          return;
        }
        if (notification.targetBuilding && notification.targetBuilding !== authUser.building) {
          res.status(403).json({
            success: false,
            message: `Thông báo này chỉ gửi tới cư dân ${notification.targetBuilding}`,
          });
          return;
        }
      }

      // Tăng số lượt xem (View count)
      await prisma.notification.update({
        where: { id: notifId },
        data: { viewCount: { increment: 1 } },
      });

      // Nếu người dùng đã đăng nhập, tự động ghi nhận đã đọc (Read Receipt)
      let isRead = false;
      if (authUser) {
        try {
          await prisma.notificationRead.upsert({
            where: {
              notificationId_userId: {
                notificationId: notifId,
                userId: authUser.id,
              },
            },
            create: {
              notificationId: notifId,
              userId: authUser.id,
            },
            update: {
              readAt: new Date(),
            },
          });
          isRead = true;
        } catch (e) {
          // Bỏ qua lỗi nếu đã tồn tại
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ...notification,
          viewCount: notification.viewCount + 1,
          readsCount: notification._count.reads,
          isRead,
        },
      });
    } catch (error: any) {
      console.error('[NotificationController.getNotificationById Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải chi tiết thông báo',
        error: error.message,
      });
    }
  }

  // 4. [ADMIN] Đăng tải thông báo mới
  static async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await NotificationController.extractAuthUser(req);
      if (!authUser || authUser.role !== Role.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Chỉ Ban Quản lý / Quản trị viên mới có quyền tạo thông báo',
        });
        return;
      }

      const {
        title,
        content,
        summary,
        category = NotificationCategory.GENERAL,
        priority = NotificationPriority.NORMAL,
        targetRole = TargetRole.ALL,
        targetBuilding = null,
        isPinned = false,
        status = NotificationStatus.PUBLISHED,
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Tiêu đề thông báo không được để trống' });
        return;
      }

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: 'Nội dung thông báo không được để trống' });
        return;
      }

      // Tự động tạo tóm tắt nếu chưa có
      const finalSummary = summary?.trim() || content.trim().substring(0, 160) + '...';

      const newNotif = await prisma.notification.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          summary: finalSummary,
          category,
          priority,
          targetRole,
          targetBuilding: targetBuilding ? String(targetBuilding).trim() : null,
          isPinned: Boolean(isPinned),
          status,
          authorId: authUser.id,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Tạo thông báo thành công!',
        data: newNotif,
      });
    } catch (error: any) {
      console.error('[NotificationController.createNotification Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo thông báo mới',
        error: error.message,
      });
    }
  }

  // 5. [ADMIN] Cập nhật thông báo
  static async updateNotification(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await NotificationController.extractAuthUser(req);
      if (!authUser || authUser.role !== Role.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Chỉ Ban Quản lý / Quản trị viên mới có quyền cập nhật thông báo',
        });
        return;
      }

      const { id } = req.params;
      const notifId = Number(id);
      if (isNaN(notifId)) {
        res.status(400).json({ success: false, message: 'ID thông báo không hợp lệ' });
        return;
      }

      const existing = await prisma.notification.findUnique({ where: { id: notifId } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông báo cần sửa' });
        return;
      }

      const {
        title,
        content,
        summary,
        category,
        priority,
        targetRole,
        targetBuilding,
        isPinned,
        status,
      } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = String(title).trim();
      if (content !== undefined) updateData.content = String(content).trim();
      if (summary !== undefined) updateData.summary = String(summary).trim();
      if (category !== undefined) updateData.category = category;
      if (priority !== undefined) updateData.priority = priority;
      if (targetRole !== undefined) updateData.targetRole = targetRole;
      if (targetBuilding !== undefined) {
        updateData.targetBuilding = targetBuilding ? String(targetBuilding).trim() : null;
      }
      if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);
      if (status !== undefined) updateData.status = status;

      const updated = await prisma.notification.update({
        where: { id: notifId },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông báo thành công!',
        data: updated,
      });
    } catch (error: any) {
      console.error('[NotificationController.updateNotification Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông báo',
        error: error.message,
      });
    }
  }

  // 6. [ADMIN] Bật / Tắt Ghim thông báo
  static async togglePin(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await NotificationController.extractAuthUser(req);
      if (!authUser || authUser.role !== Role.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Chỉ Ban Quản lý mới có quyền thay đổi trạng thái ghim',
        });
        return;
      }

      const { id } = req.params;
      const notifId = Number(id);
      const notif = await prisma.notification.findUnique({ where: { id: notifId } });
      if (!notif) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        return;
      }

      const updated = await prisma.notification.update({
        where: { id: notifId },
        data: { isPinned: !notif.isPinned },
      });

      res.status(200).json({
        success: true,
        message: updated.isPinned ? 'Đã ghim thông báo lên đầu bảng tin' : 'Đã bỏ ghim thông báo',
        data: updated,
      });
    } catch (error: any) {
      console.error('[NotificationController.togglePin Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thay đổi trạng thái ghim',
        error: error.message,
      });
    }
  }

  // 7. [ADMIN] Xóa thông báo
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await NotificationController.extractAuthUser(req);
      if (!authUser || authUser.role !== Role.ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Chỉ Ban Quản lý mới có quyền xóa thông báo',
        });
        return;
      }

      const { id } = req.params;
      const notifId = Number(id);
      const existing = await prisma.notification.findUnique({ where: { id: notifId } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông báo cần xóa' });
        return;
      }

      await prisma.notification.delete({ where: { id: notifId } });

      res.status(200).json({
        success: true,
        message: 'Đã xóa thông báo thành công!',
      });
    } catch (error: any) {
      console.error('[NotificationController.deleteNotification Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa thông báo',
        error: error.message,
      });
    }
  }

  // 8. Đánh dấu đã đọc một thông báo
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await NotificationController.extractAuthUser(req);
      if (!authUser) {
        res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đánh dấu đã đọc' });
        return;
      }

      const { id } = req.params;
      const notifId = Number(id);

      await prisma.notificationRead.upsert({
        where: {
          notificationId_userId: {
            notificationId: notifId,
            userId: authUser.id,
          },
        },
        create: {
          notificationId: notifId,
          userId: authUser.id,
        },
        update: {
          readAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu đọc thông báo',
      });
    } catch (error: any) {
      console.error('[NotificationController.markAsRead Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đánh dấu đã đọc',
        error: error.message,
      });
    }
  }

  // 9. Đánh dấu tất cả thông báo hiện có là đã đọc
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const authUser = await NotificationController.extractAuthUser(req);
      if (!authUser) {
        res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện' });
        return;
      }

      // Lấy danh sách các thông báo người dùng này có quyền xem
      const whereRole: any =
        authUser.role === Role.ADMIN
          ? {}
          : {
              targetRole: { in: [TargetRole.ALL, TargetRole.STUDENT] },
              status: NotificationStatus.PUBLISHED,
            };

      const notifications = await prisma.notification.findMany({
        where: whereRole,
        select: { id: true },
      });

      // Tạo bản ghi đọc cho các thông báo chưa đọc
      const readPromises = notifications.map((n) =>
        prisma.notificationRead.upsert({
          where: {
            notificationId_userId: {
              notificationId: n.id,
              userId: authUser.id,
            },
          },
          create: {
            notificationId: n.id,
            userId: authUser.id,
          },
          update: {
            readAt: new Date(),
          },
        })
      );

      await Promise.all(readPromises);

      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu đọc toàn bộ thông báo',
      });
    } catch (error: any) {
      console.error('[NotificationController.markAllAsRead Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đánh dấu đọc toàn bộ',
        error: error.message,
      });
    }
  }
}
