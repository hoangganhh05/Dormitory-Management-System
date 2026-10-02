import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';

const router = Router();

router.get('/public', SettingsController.getPublicSettings);

export default router;
