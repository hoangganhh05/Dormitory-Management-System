import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Client routes (Yêu cầu đăng nhập, xem và cập nhật hồ sơ của chính mình)
router.get('/me/profile', authenticateToken, StudentController.getMyProfile);
router.put('/me/profile', authenticateToken, StudentController.updateMyProfile);
router.post('/avatar', authenticateToken, StudentController.updateMyAvatar);

// Admin routes (Chỉ Quản trị viên KTX mới có quyền xem toàn bộ, tạo, cập nhật hồ sơ)
router.get('/', authenticateToken, requireAdmin, StudentController.getAllStudents);
router.get('/:id', authenticateToken, requireAdmin, StudentController.getStudentById);
router.post('/', authenticateToken, requireAdmin, StudentController.createStudent);
router.put('/:id', authenticateToken, requireAdmin, StudentController.updateStudent);

export default router;
