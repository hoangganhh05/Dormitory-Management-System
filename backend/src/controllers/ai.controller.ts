import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { GeminiService, UserDormitoryContext, RoommateInfo } from '../services/gemini.service';

export class AIController {
  /**
   * GET /api/ai/status
   * Trả về trạng thái cấu hình và metadata của dịch vụ AI Gemini.
   */
  static getStatus(req: Request, res: Response): void {
    try {
      const status = GeminiService.getServiceStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Không thể lấy trạng thái dịch vụ AI.',
        error: error.message,
      });
    }
  }

  /**
   * Trích xuất thông tin thực tế của sinh viên (User Context Grounding) từ token
   */
  private static async resolveUserContext(req: Request): Promise<UserDormitoryContext | undefined> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);
      if (!decoded || !decoded.id) return undefined;

      // 1. Lấy thông tin user và giường/phòng đang ở
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          occupiedBed: {
            include: {
              room: {
                include: {
                  beds: {
                    include: {
                      occupiedBy: {
                        select: {
                          id: true,
                          fullName: true,
                          studentCode: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) return undefined;

      // 2. Tìm danh sách bạn cùng phòng (nếu đang ở một phòng)
      let currentRoomInfo: UserDormitoryContext['currentRoom'] = null;
      if (user.occupiedBed && user.occupiedBed.room) {
        const room = user.occupiedBed.room;
        const roommates: RoommateInfo[] = room.beds
          .filter((b: any) => b.occupiedById && b.occupiedById !== user.id && b.occupiedBy)
          .map((b: any) => ({
            fullName: b.occupiedBy!.fullName,
            studentCode: b.occupiedBy!.studentCode,
            bedNumber: b.bedNumber,
          }));

        currentRoomInfo = {
          roomNumber: room.roomNumber,
          building: room.building,
          floor: room.floor,
          roomType: room.roomType,
          bedNumber: user.occupiedBed.bedNumber,
          pricePerMonth: Number(room.pricePerMonth),
          roommates,
        };
      }

      // 3. Lấy đơn đăng ký lưu trú gần nhất
      const latestReg = await prisma.registration.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      // 4. Lấy các phiếu báo hỏng đang chờ hoặc đang xử lý
      const pendingMaintenance = await prisma.maintenanceRequest.findMany({
        where: {
          userId: user.id,
          status: { not: 'RESOLVED' },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      return {
        userId: user.id,
        fullName: user.fullName,
        studentCode: user.studentCode,
        gender: user.gender,
        role: user.role,
        currentRoom: currentRoomInfo,
        latestRegistration: latestReg
          ? {
              status: latestReg.status,
              semester: latestReg.semester,
              createdAt: latestReg.createdAt.toISOString(),
            }
          : null,
        pendingMaintenanceRequests: pendingMaintenance.map((m: any) => ({
          title: m.title,
          urgency: m.urgency,
          status: m.status,
          createdAt: m.createdAt.toISOString(),
        })),
      };
    } catch {
      return undefined;
    }
  }

  /**
   * POST /api/ai/ask
   * Nhận câu hỏi từ client, gọi GeminiService và trả về câu trả lời.
   * Body: { prompt: string, history?: Array<{ role: string, content: string }> }
   */
  static async ask(req: Request, res: Response): Promise<void> {
    const { prompt, history } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Thiếu tham số bắt buộc: "prompt" phải là chuỗi ký tự không rỗng.',
      });
      return;
    }

    // Giới hạn độ dài câu hỏi để chống lạm dụng
    if (prompt.trim().length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Câu hỏi quá dài. Vui lòng giới hạn trong 1000 ký tự.',
      });
      return;
    }

    // Validate history nếu có truyền lên
    const validHistory = Array.isArray(history) ? history : undefined;

    try {
      // Trích xuất ngữ cảnh sinh viên nếu request kèm token
      const userContext = await AIController.resolveUserContext(req);

      const aiResponse = await GeminiService.askAI(prompt, validHistory, userContext);

      // Ghi nhật ký hỏi đáp vào CSDL (bất đồng bộ để không chặn luồng trả lời)
      try {
        await prisma.chatLog.create({
          data: {
            userId: userContext?.userId ? Number(userContext.userId) : null,
            sessionId: `${aiResponse.source}|${aiResponse.modelUsed}`,
            userMessage: prompt.trim(),
            botReply: aiResponse.answer,
          },
        });
      } catch (logErr: any) {
        console.warn('[AIController] Lỗi khi lưu ChatLog vào CSDL:', logErr.message);
      }

      res.status(200).json({
        success: true,
        data: aiResponse,
      });
    } catch (error: any) {
      console.error('[AIController] Lỗi xử lý câu hỏi AI:', error.message);
      res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi xử lý yêu cầu AI. Vui lòng thử lại sau.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/ai/logs
   * Lấy danh sách nhật ký hỏi đáp AI dành cho Ban Quản lý (Admin)
   * Query: page, limit, search, source
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const search = (req.query.search as string)?.trim() || '';
      const source = (req.query.source as string)?.trim() || '';

      const where: any = {};

      if (search) {
        where.OR = [
          { userMessage: { contains: search } },
          { botReply: { contains: search } },
          { user: { fullName: { contains: search } } },
          { user: { studentCode: { contains: search } } },
        ];
      }

      if (source && source !== 'ALL') {
        where.sessionId = { startsWith: source };
      }

      const [total, logs] = await Promise.all([
        prisma.chatLog.count({ where }),
        prisma.chatLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                studentCode: true,
                email: true,
                gender: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      // Chuẩn hóa dữ liệu trả về kèm bóc tách source & model từ sessionId
      const formattedLogs = logs.map((log: any) => {
        const parts = (log.sessionId || '').split('|');
        const sourceName = parts[0] || 'KNOWLEDGE_BASE_FALLBACK';
        const modelName = parts[1] || 'ICTU-Dormitory-RuleEngine-v1';

        return {
          id: log.id,
          userMessage: log.userMessage,
          botReply: log.botReply,
          source: sourceName,
          model: modelName,
          createdAt: log.createdAt,
          user: log.user
            ? {
                id: log.user.id,
                fullName: log.user.fullName,
                studentCode: log.user.studentCode,
                email: log.user.email,
                gender: log.user.gender,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          logs: formattedLogs,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
      });
    } catch (error: any) {
      console.error('[AIController] Lỗi lấy danh sách nhật ký AI:', error.message);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách nhật ký AI.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/ai/stats
   * Thống kê tổng quan số liệu hoạt động của Trợ lý AI (KPIs)
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalQueries, geminiLiveCount, fallbackCount, authenticatedCount, guestCount, todayCount] =
        await Promise.all([
          prisma.chatLog.count(),
          prisma.chatLog.count({ where: { sessionId: { startsWith: 'GEMINI_LIVE' } } }),
          prisma.chatLog.count({ where: { sessionId: { startsWith: 'KNOWLEDGE_BASE_FALLBACK' } } }),
          prisma.chatLog.count({ where: { userId: { not: null } } }),
          prisma.chatLog.count({ where: { userId: null } }),
          prisma.chatLog.count({ where: { createdAt: { gte: today } } }),
        ]);

      res.status(200).json({
        success: true,
        data: {
          totalQueries,
          todayQueries: todayCount,
          bySource: {
            geminiLive: geminiLiveCount,
            fallbackKnowledge: fallbackCount,
          },
          byUserType: {
            authenticated: authenticatedCount,
            guest: guestCount,
          },
          serviceStatus: GeminiService.getServiceStatus(),
        },
      });
    } catch (error: any) {
      console.error('[AIController] Lỗi lấy thống kê AI:', error.message);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy số liệu thống kê AI.',
        error: error.message,
      });
    }
  }
}
