import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticateToken, requireAdmin, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// Stats summary route (Chỉ Quản trị viên KTX)
router.get('/stats/summary', authenticateToken, requireAdmin, RoomController.getRoomStats);

// Tra cứu danh sách và chi tiết phòng (Public / Khách / Sinh viên có thể xem phòng để đăng ký)
router.get('/', optionalAuth, RoomController.getRooms);
router.get('/:id', optionalAuth, RoomController.getRoomById);

// Thao tác quản trị cấu hình phòng & giường (Chỉ Quản trị viên)
router.post('/', authenticateToken, requireAdmin, RoomController.createRoom);
router.put('/:id', authenticateToken, requireAdmin, RoomController.updateRoom);
router.delete('/:id', authenticateToken, requireAdmin, RoomController.deleteRoom);

// Cập nhật trạng thái giường trong phòng (Chỉ Quản trị viên)
router.put('/:roomId/beds/:bedId', authenticateToken, requireAdmin, RoomController.updateBedStatus);

export default router;
