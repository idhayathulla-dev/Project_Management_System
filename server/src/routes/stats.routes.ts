import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all stats routes
router.use(authenticate);

// GET /api/stats - Dashboard summary metrics
router.get('/', StatsController.getSummary);

// GET /api/stats/project-status - Project status distribution for charts
router.get('/project-status', StatsController.getProjectStatus);

// GET /api/stats/task-status - Task status distribution for charts
router.get('/task-status', StatsController.getTaskStatus);

export default router;
