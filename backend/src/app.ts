import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Dormitory Management System API (ICTU - TFL Technology JSC)',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// API Routes
app.use('/api/v1', routes);
app.use('/api', routes); // Alias for convenience

// Global Error Handler
app.use(errorHandler);

export default app;
