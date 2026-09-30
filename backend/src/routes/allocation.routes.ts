import { Router } from 'express';
import { AllocationController } from '../controllers/allocation.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Toàn bộ chức năng quản lý phân bổ giường và điều chuyển dành cho Quản trị viên KTX
router.use(authenticateToken, requireAdmin);

// Stats & available beds
router.get('/stats', AllocationController.getAllocationStats);
router.get('/available-beds', AllocationController.getAvailableBeds);

// History
router.get('/history', AllocationController.getAllocationHistory);

// Allocation Actions
router.post('/allocate', AllocationController.allocateBed);
router.post('/transfer', AllocationController.transferBed);
router.post('/checkout', AllocationController.checkOut);

export default router;
