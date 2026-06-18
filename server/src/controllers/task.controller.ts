import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class TaskController {
  /**
   * Lists tasks scoped to user's projects.
   * Extracts query parameters for searching, filtering by status/priority/project, sorting, and pagination.
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { page, limit, search, status, priority, sortBy, order, projectId } = req.query;

      // Parse status enum
      const parsedStatus = Object.values(TaskStatus).includes(status as any)
        ? (status as TaskStatus)
        : undefined;

      // Parse priority enum
      const parsedPriority = Object.values(TaskPriority).includes(priority as any)
        ? (priority as TaskPriority)
        : undefined;

      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search ? (search as string) : undefined,
        status: parsedStatus,
        priority: parsedPriority,
        sortBy: sortBy ? (sortBy as string) : undefined,
        order: order === 'asc' ? 'asc' : ('desc' as any),
        projectId: projectId ? (projectId as string) : undefined,
      };

      const result = await TaskService.listUserTasks(req.user.id, options);

      return res.status(200).json({
        success: true,
        data: { tasks: result.tasks },
        pagination: result.pagination,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Retrieves a task by ID (validates ownership of project).
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { id } = req.params;
      const task = await TaskService.getTaskById(id, req.user.id);

      return res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Creates a new task.
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      // Validate inputs
      const result = createTaskSchema.safeParse(req.body);
      if (!result.success) {
        const error: any = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(error);
      }

      const task = await TaskService.createTask(req.user.id, result.data);

      return res.status(201).json({
        success: true,
        data: { task },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Updates an existing task.
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { id } = req.params;

      // Validate inputs
      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        const error: any = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(error);
      }

      const task = await TaskService.updateTask(id, req.user.id, result.data);

      return res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Deletes a task.
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { id } = req.params;
      const task = await TaskService.deleteTask(id, req.user.id);

      return res.status(200).json({
        success: true,
        message: `Task '${task.taskName}' deleted successfully`,
        data: { task },
      });
    } catch (err) {
      return next(err);
    }
  }
}
