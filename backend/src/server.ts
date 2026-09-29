import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(ENV.PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Dormitory Management System API Server`);
  console.log(`  Running on: http://localhost:${ENV.PORT}`);
  console.log(`  Environment: ${ENV.NODE_ENV}`);
  console.log(`  Health Check: http://localhost:${ENV.PORT}/api/health`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
