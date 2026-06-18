import prisma from '../config/prisma';
import { ProjectStatus } from '@prisma/client';
import { AuditService } from './audit.service';

export interface ProjectQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export class ProjectService {
  /**
   * Retrieves paginated list of projects for a specific user.
   * Supports search, status filtering, custom sorting, and pagination.
   */
  static async listUserProjects(userId: string, options: ProjectQueryOptions) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId, // Strictly filter by authenticated user
    };

    // Case-insensitive partial search on project name
    if (options.search) {
      whereClause.projectName = {
        contains: options.search.trim(),
        mode: 'insensitive',
      };
    }

    // Exact match on status enum
    if (options.status) {
      whereClause.status = options.status;
    }

    // Safe sorting fields
    const allowedSortFields = ['createdAt', 'startDate', 'endDate', 'projectName'];
    const sortBy = allowedSortFields.includes(options.sortBy || '') ? options.sortBy : 'createdAt';
    const order = options.order === 'asc' ? 'asc' : 'desc';

    const orderByClause = {
      [sortBy as string]: order,
    };

    // Execute parallel count and list queries
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.project.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a project by ID, verifying ownership.
   */
  static async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      const error: any = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (project.userId !== userId) {
      const error: any = new Error('Access forbidden. You do not own this project.');
      error.statusCode = 403;
      throw error;
    }

    return project;
  }

  /**
   * Creates a new project and records an audit log.
   */
  static async createProject(userId: string, data: { projectName: string; description?: string | null; status?: ProjectStatus; startDate: Date; endDate: Date }) {
    const project = await prisma.project.create({
      data: {
        ...data,
        userId,
      },
    });

    // Write audit log
    await AuditService.logAction(userId, 'PROJECT_CREATED', `Created project '${project.projectName}' (ID: ${project.id})`);

    return project;
  }

  /**
   * Updates an existing project after checking ownership. Logs audit trails.
   */
  static async updateProject(projectId: string, userId: string, data: { projectName?: string; description?: string | null; status?: ProjectStatus; startDate?: Date; endDate?: Date }) {
    // Check existence and ownership
    const existingProject = await this.getProjectById(projectId, userId);

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    // Determine what was updated for details
    const changes: string[] = [];
    if (data.projectName && data.projectName !== existingProject.projectName) changes.push(`name to '${data.projectName}'`);
    if (data.status && data.status !== existingProject.status) changes.push(`status to '${data.status}'`);
    const details = changes.length > 0 ? `Updated project: changed ${changes.join(', ')}` : `Updated project metadata`;

    await AuditService.logAction(userId, 'PROJECT_UPDATED', `${details} (ID: ${projectId})`);

    return updatedProject;
  }

  /**
   * Deletes a project after checking ownership. Logs audit trails.
   */
  static async deleteProject(projectId: string, userId: string) {
    // Check existence and ownership
    const project = await this.getProjectById(projectId, userId);

    await prisma.project.delete({
      where: { id: projectId },
    });

    await AuditService.logAction(userId, 'PROJECT_DELETED', `Deleted project '${project.projectName}' (ID: ${projectId})`);

    return project;
  }
}
