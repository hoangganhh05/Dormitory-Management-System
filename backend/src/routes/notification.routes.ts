import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

// Thống kê thông báo
router.get('/stats', NotificationController.getNotificationStats);

// Đánh dấu đọc tất cả
router.post('/mark-all-read', NotificationController.markAllAsRead);

// Danh sách thông báo (phân quyền & tìm kiếm & lọc)
router.get('/', NotificationController.getNotifications);

// Chi tiết thông báo
router.get('/:id', NotificationController.getNotificationById);

// Đăng tải thông báo mới (Admin)
router.post('/', NotificationController.createNotification);

// Cập nhật thông báo (Admin)
router.put('/:id', NotificationController.updateNotification);

// Bật / Tắt ghim thông báo (Admin)
router.patch('/:id/pin', NotificationController.togglePin);

// Xóa thông báo (Admin)
router.delete('/:id', NotificationController.deleteNotification);

// Đánh dấu đã đọc một thông báo
router.post('/:id/read', NotificationController.markAsRead);

export default router;
