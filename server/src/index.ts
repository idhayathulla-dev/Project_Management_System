import './config/dotenv'; // Load env variables first before other imports evaluate
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import statsRoutes from './routes/stats.routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import logger from './config/logger';
import prisma from './config/prisma';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares - CSP disabled to prevent blocking Swagger UI resources
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Standard Parsers
app.use(express.json());
app.use(cookieParser());

// Setup Swagger Docs
setupSwagger(app);

// Health check endpoint (verifies database connectivity)
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'UP',
      services: {
        server: 'UP',
        database: 'UP',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Health check failed:', err);
    res.status(500).json({
      status: 'DOWN',
      services: {
        server: 'UP',
        database: 'DOWN',
      },
      error: err.message || 'Database connection error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Route Declarations
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);

// Fallback for non-existent routes
app.use((req, _res, next) => {
  const error: any = new Error(`Route ${req.method} ${req.path} not found`);
  error.statusCode = 404;
  next(error);
});

// Centralized error handling
app.use(errorHandler);

// Skip active listening in testing environment (Supertest handles this internally)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server successfully started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
