import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Thống kê KPIs yêu cầu bảo trì (Chỉ Quản trị viên)
router.get('/stats', authenticateToken, requireAdmin, MaintenanceController.getMaintenanceStats);

// Lịch sử báo hỏng của sinh viên đăng nhập
router.get('/my', authenticateToken, MaintenanceController.getMyRequests);

// Danh sách tất cả yêu cầu (Chỉ Quản trị viên)
router.get('/', authenticateToken, requireAdmin, MaintenanceController.getRequests);

// Chi tiết một yêu cầu (Yêu cầu đăng nhập)
router.get('/:id', authenticateToken, MaintenanceController.getRequestById);

// Gửi yêu cầu báo hỏng mới (Sinh viên đăng nhập)
router.post('/', authenticateToken, MaintenanceController.createRequest);

// Cập nhật trạng thái xử lý & phản hồi kỹ thuật (Chỉ Quản trị viên)
router.patch('/:id/status', authenticateToken, requireAdmin, MaintenanceController.updateStatus);

// Xóa yêu cầu (Chỉ Quản trị viên)
router.delete('/:id', authenticateToken, requireAdmin, MaintenanceController.deleteRequest);

export default router;
