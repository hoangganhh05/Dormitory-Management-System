import { Router } from 'express';
import { AllocationController } from '../controllers/allocation.controller';

const router = Router();

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
