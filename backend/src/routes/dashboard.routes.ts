import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Dashboard thống kê tổng quan chỉ dành cho Quản trị viên
router.get('/stats', authenticateToken, requireAdmin, DashboardController.getStats);

export default router;
