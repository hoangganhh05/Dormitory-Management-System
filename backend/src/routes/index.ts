import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Additional routes (auth, rooms, registrations, issues, ai) will be registered here

export default router;
