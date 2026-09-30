import { Router } from 'express';
import healthRoutes from './health.routes';
import roomRoutes from './room.routes';
import registrationRoutes from './registration.routes';
import maintenanceRoutes from './maintenance.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Business API routes
router.use('/rooms', roomRoutes);
router.use('/registrations', registrationRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
