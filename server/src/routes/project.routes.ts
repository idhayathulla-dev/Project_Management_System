import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all project routes
router.use(authenticate);

// GET /api/projects - List user's projects with filtering/pagination/sorting
router.get('/', ProjectController.list);

// GET /api/projects/:id - Retrieve project details
router.get('/:id', ProjectController.getById);

// POST /api/projects - Create a new project
router.post('/', ProjectController.create);

// PUT /api/projects/:id - Update an existing project
router.put('/:id', ProjectController.update);

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', ProjectController.delete);

export default router;
