import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public auth routes
router.post('/login', AuthController.login);
router.post('/google-login', AuthController.googleLogin);
router.post('/forgot-password', AuthController.forgotPassword);

// Protected auth routes
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/change-password', authenticateToken, AuthController.changePassword);

export default router;
