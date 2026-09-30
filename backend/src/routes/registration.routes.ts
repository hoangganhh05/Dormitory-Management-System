import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';

const router = Router();

router.get('/', RegistrationController.getRegistrations);
router.post('/', RegistrationController.createRegistration);
router.patch('/:id/approve', RegistrationController.approveRegistration);
router.patch('/:id/reject', RegistrationController.rejectRegistration);

export default router;
