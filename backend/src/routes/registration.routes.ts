import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Stats summary route (Chỉ Quản trị viên)
router.get('/stats/summary', authenticateToken, requireAdmin, RegistrationController.getRegistrationStats);

// Client my registrations (Sinh viên xem danh sách đơn của mình)
router.get('/my', authenticateToken, RegistrationController.getMyRegistrations);

// Admin xem toàn bộ danh sách đơn đăng ký
router.get('/', authenticateToken, requireAdmin, RegistrationController.getRegistrations);

// Chi tiết đơn đăng ký (Xác thực đăng nhập)
router.get('/:id', authenticateToken, RegistrationController.getRegistrationById);

// Nộp đơn đăng ký mới (Sinh viên)
router.post('/', authenticateToken, RegistrationController.createRegistration);

// Workflow transitions: Phê duyệt / Từ chối (Chỉ Quản trị viên)
router.put('/:id/approve', authenticateToken, requireAdmin, RegistrationController.approveRegistration);
router.patch('/:id/approve', authenticateToken, requireAdmin, RegistrationController.approveRegistration);

router.put('/:id/reject', authenticateToken, requireAdmin, RegistrationController.rejectRegistration);
router.patch('/:id/reject', authenticateToken, requireAdmin, RegistrationController.rejectRegistration);

// Hủy đơn (Sinh viên hủy đơn của chính mình)
router.put('/:id/cancel', authenticateToken, RegistrationController.cancelMyRegistration);
router.patch('/:id/cancel', authenticateToken, RegistrationController.cancelMyRegistration);

export default router;
