import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { ProjectStatus } from '@prisma/client';

export class ProjectController {
  /**
   * Lists projects for the currently authenticated user.
   * Extracts query parameters for searching, filtering, sorting, and pagination.
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { page, limit, search, status, sortBy, order } = req.query;

      // Type checks and parameter parsing
      const parsedStatus = Object.values(ProjectStatus).includes(status as any)
        ? (status as ProjectStatus)
        : undefined;

      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search ? (search as string) : undefined,
        status: parsedStatus,
        sortBy: sortBy ? (sortBy as string) : undefined,
        order: order === 'asc' ? 'asc' : ('desc' as any),
      };

      const result = await ProjectService.listUserProjects(req.user.id, options);

      return res.status(200).json({
        success: true,
        data: { projects: result.projects },
        pagination: result.pagination,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Retrieves a single project owned by the user.
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { id } = req.params;
      const project = await ProjectService.getProjectById(id, req.user.id);

      return res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Creates a new project.
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      // Validate input payload
      const result = createProjectSchema.safeParse(req.body);
      if (!result.success) {
        const error: any = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(error);
      }

      const project = await ProjectService.createProject(req.user.id, result.data);

      return res.status(201).json({
        success: true,
        data: { project },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Updates an existing project.
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { id } = req.params;

      // Validate input payload
      const result = updateProjectSchema.safeParse(req.body);
      if (!result.success) {
        const error: any = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(error);
      }

      const project = await ProjectService.updateProject(id, req.user.id, result.data);

      return res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Deletes a project.
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const { id } = req.params;
      const project = await ProjectService.deleteProject(id, req.user.id);

      return res.status(200).json({
        success: true,
        message: `Project '${project.projectName}' deleted successfully`,
        data: { project },
      });
    } catch (err) {
      return next(err);
    }
  }
}
