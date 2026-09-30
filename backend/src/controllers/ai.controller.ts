import { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';

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
      const aiResponse = await GeminiService.askAI(prompt, validHistory);
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
