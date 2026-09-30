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
}
