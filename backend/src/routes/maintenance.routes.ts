import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';

const router = Router();

router.get('/', MaintenanceController.getRequests);
router.post('/', MaintenanceController.createRequest);
router.patch('/:id/status', MaintenanceController.updateStatus);

export default router;
