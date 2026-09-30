import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', AuthController.getMe);
router.post('/change-password', AuthController.changePassword);
router.post('/forgot-password', AuthController.forgotPassword);

export default router;
