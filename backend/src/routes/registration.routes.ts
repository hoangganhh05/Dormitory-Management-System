import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';

const router = Router();

// Stats summary route (must be before /:id)
router.get('/stats/summary', RegistrationController.getRegistrationStats);

// Client my registrations
router.get('/my', RegistrationController.getMyRegistrations);

// Admin & Client CRUD
router.get('/', RegistrationController.getRegistrations);
router.get('/:id', RegistrationController.getRegistrationById);
router.post('/', RegistrationController.createRegistration);

// Workflow transitions
router.put('/:id/approve', RegistrationController.approveRegistration);
router.patch('/:id/approve', RegistrationController.approveRegistration);

router.put('/:id/reject', RegistrationController.rejectRegistration);
router.patch('/:id/reject', RegistrationController.rejectRegistration);

router.put('/:id/cancel', RegistrationController.cancelMyRegistration);
router.patch('/:id/cancel', RegistrationController.cancelMyRegistration);

export default router;
