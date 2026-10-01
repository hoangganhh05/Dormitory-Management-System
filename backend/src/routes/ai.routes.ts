import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticateToken, requireAdmin, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/ai/status
 * @desc    Lấy trạng thái và cấu hình dịch vụ AI Gemini
 * @access  Public / Optional Auth
 */
router.get('/status', optionalAuth, AIController.getStatus);

/**
 * @route   POST /api/ai/chat
 * @desc    Hội thoại trực tiếp với Trợ lý ảo KTX qua Google Gemini AI
 * @access  Public / Optional Auth (Cá nhân hóa nếu có token)
 * @body    { message: string, history?: Array }
 */
router.post('/chat', optionalAuth, AIController.ask);

/**
 * @route   POST /api/ai/classify-maintenance
 * @desc    Phân loại mức độ khẩn cấp sự cố báo hỏng cơ sở vật chất (Smart Ticketing)
 * @access  Public / Optional Auth
 * @body    { title: string, description: string }
 */
router.post('/classify-maintenance', optionalAuth, AIController.classifyMaintenance);

/**
 * @route   POST /api/ai/ask
 * @desc    Gửi câu hỏi tới Gemini AI hoặc Fallback Engine (tương thích ngược)
 * @access  Public / Optional Auth (Cá nhân hóa nếu có token)
 * @body    { prompt: string, message?: string, history?: Array }
 */
router.post('/ask', optionalAuth, AIController.ask);

/**
 * @route   GET /api/ai/logs
 * @desc    Lấy danh sách nhật ký hỏi đáp AI (Dành riêng cho Quản trị viên)
 * @access  Admin Only (RBAC)
 */
router.get('/logs', authenticateToken, requireAdmin, AIController.getLogs);

/**
 * @route   GET /api/ai/stats
 * @desc    Lấy số liệu thống kê tổng quan hoạt động của Trợ lý AI (KPIs)
 * @access  Admin Only (RBAC)
 */
router.get('/stats', authenticateToken, requireAdmin, AIController.getStats);

export default router;
