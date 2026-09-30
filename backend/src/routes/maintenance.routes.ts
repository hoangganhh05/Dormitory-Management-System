import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';

const router = Router();

// Thống kê KPIs yêu cầu bảo trì
router.get('/stats', MaintenanceController.getMaintenanceStats);

// Lịch sử báo hỏng của sinh viên đăng nhập
router.get('/my', MaintenanceController.getMyRequests);

// Danh sách tất cả yêu cầu (Admin Portal)
router.get('/', MaintenanceController.getRequests);

// Chi tiết một yêu cầu
router.get('/:id', MaintenanceController.getRequestById);

// Gửi yêu cầu báo hỏng mới
router.post('/', MaintenanceController.createRequest);

// Cập nhật trạng thái xử lý & phản hồi kỹ thuật (Admin)
router.patch('/:id/status', MaintenanceController.updateStatus);

// Xóa yêu cầu (Admin)
router.delete('/:id', MaintenanceController.deleteRequest);

export default router;
