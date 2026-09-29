import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error_or_not_migrated_yet';
  }

  res.status(200).json({
    success: true,
    service: 'Dormitory Management System API',
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
  });
});

export default router;
