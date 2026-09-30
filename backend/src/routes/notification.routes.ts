import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken, requireAdmin, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// Thống kê thông báo (Chỉ Quản trị viên)
router.get('/stats', authenticateToken, requireAdmin, NotificationController.getNotificationStats);

// Đánh dấu đọc tất cả (Yêu cầu đăng nhập)
router.post('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);

// Danh sách thông báo (Public / Optional Auth - sinh viên đăng nhập thấy thông báo cá nhân/khu)
router.get('/', optionalAuth, NotificationController.getNotifications);

// Chi tiết thông báo
router.get('/:id', optionalAuth, NotificationController.getNotificationById);

// Đăng tải thông báo mới (Chỉ Quản trị viên)
router.post('/', authenticateToken, requireAdmin, NotificationController.createNotification);

// Cập nhật thông báo (Chỉ Quản trị viên)
router.put('/:id', authenticateToken, requireAdmin, NotificationController.updateNotification);

// Bật / Tắt ghim thông báo (Chỉ Quản trị viên)
router.patch('/:id/pin', authenticateToken, requireAdmin, NotificationController.togglePin);

// Xóa thông báo (Chỉ Quản trị viên)
router.delete('/:id', authenticateToken, requireAdmin, NotificationController.deleteNotification);

// Đánh dấu đã đọc một thông báo (Yêu cầu đăng nhập)
router.post('/:id/read', authenticateToken, NotificationController.markAsRead);

export default router;
