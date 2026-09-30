import { Router } from 'express';
import healthRoutes from './health.routes';
import roomRoutes from './room.routes';
import registrationRoutes from './registration.routes';
import maintenanceRoutes from './maintenance.routes';
import dashboardRoutes from './dashboard.routes';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import allocationRoutes from './allocation.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Health check endpoint
router.use('/health', healthRoutes);

// Authentication & Account routes
router.use('/auth', authRoutes);

// Business API routes
router.use('/students', studentRoutes);
router.use('/rooms', roomRoutes);
router.use('/registrations', registrationRoutes);
router.use('/allocations', allocationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
