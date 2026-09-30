import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';

const router = Router();

/**
 * @route   GET /api/ai/status
 * @desc    Lấy trạng thái và cấu hình dịch vụ AI Gemini
 * @access  Private (yêu cầu đăng nhập) - trong môi trường dev có thể để public
 */
router.get('/status', AIController.getStatus);

/**
 * @route   POST /api/ai/ask
 * @desc    Gửi câu hỏi tới Gemini AI hoặc Fallback Engine
 * @access  Private
 * @body    { prompt: string }
 */
router.post('/ask', AIController.ask);

/**
 * @route   GET /api/ai/logs
 * @desc    Lấy danh sách nhật ký hỏi đáp AI (Dành riêng cho Admin)
 * @access  Admin
 */
router.get('/logs', AIController.getLogs);

/**
 * @route   GET /api/ai/stats
 * @desc    Lấy số liệu thống kê tổng quan hoạt động của Trợ lý AI (KPIs)
 * @access  Admin
 */
router.get('/stats', AIController.getStats);

export default router;
