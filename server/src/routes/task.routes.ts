import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all task routes
router.use(authenticate);

// GET /api/tasks - List tasks under user's ownership with filters/search/pagination
router.get('/', TaskController.list);

// GET /api/tasks/:id - Retrieve details of a specific task
router.get('/:id', TaskController.getById);

// POST /api/tasks - Create a new task under an owned project
router.post('/', TaskController.create);

// PUT /api/tasks/:id - Update an existing task
router.put('/:id', TaskController.update);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', TaskController.delete);

export default router;
