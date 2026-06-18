import prisma from '../config/prisma';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { AuditService } from './audit.service';

export interface TaskQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: string;
  order?: 'asc' | 'desc';
  projectId?: string; // Optional filtering by a specific project ID
}

export class TaskService {
  /**
   * Retrieves paginated list of tasks for the user (scoped to user's projects).
   * Supports search, status/priority filtering, project filtering, custom sorting, and pagination.
   */
  static async listUserTasks(userId: string, options: TaskQueryOptions) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      project: {
        userId, // Enforce that the parent project is owned by this user
      },
    };

    // Case-insensitive partial search on task name
    if (options.search) {
      whereClause.taskName = {
        contains: options.search.trim(),
        mode: 'insensitive',
      };
    }

    // Filter by project ID if provided
    if (options.projectId) {
      whereClause.projectId = options.projectId;
    }

    // Exact matches on status and priority
    if (options.status) {
      whereClause.status = options.status;
    }

    if (options.priority) {
      whereClause.priority = options.priority;
    }

    // Safe sorting fields
    const allowedSortFields = ['createdAt', 'dueDate', 'taskName', 'priority'];
    const sortBy = allowedSortFields.includes(options.sortBy || '') ? options.sortBy : 'createdAt';
    const order = options.order === 'asc' ? 'asc' : 'desc';

    const orderByClause = {
      [sortBy as string]: order,
    };

    // Parallel count and find queries
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        include: {
          project: {
            select: {
              projectName: true,
            },
          },
        },
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a task by ID after validating project ownership.
   */
  static async getTaskById(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            userId: true,
            projectName: true,
          },
        },
      },
    });

    if (!task) {
      const error: any = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Check project ownership
    if (task.project.userId !== userId) {
      const error: any = new Error('Access forbidden. You do not own this task\'s project.');
      error.statusCode = 403;
      throw error;
    }

    return task;
  }

  /**
   * Creates a new task under a project, checking project ownership.
   */
  static async createTask(userId: string, data: { taskName: string; description?: string | null; priority?: TaskPriority; status?: TaskStatus; dueDate: Date; projectId: string }) {
    // Verify project exists and is owned by the user
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      const error: any = new Error('Parent project not found');
      error.statusCode = 404;
      throw error;
    }

    if (project.userId !== userId) {
      const error: any = new Error('Access forbidden. You do not own the parent project.');
      error.statusCode = 403;
      throw error;
    }

    const task = await prisma.task.create({
      data,
    });

    // Write audit log
    await AuditService.logAction(userId, 'TASK_CREATED', `Created task '${task.taskName}' inside project '${project.projectName}' (ID: ${task.id})`);

    return task;
  }

  /**
   * Updates an existing task after checking ownership. Logs audit trails.
   */
  static async updateTask(taskId: string, userId: string, data: { taskName?: string; description?: string | null; priority?: TaskPriority; status?: TaskStatus; dueDate?: Date }) {
    // Checks existence and ownership
    const existingTask = await this.getTaskById(taskId, userId);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    // Determine what was updated for logs
    const changes: string[] = [];
    if (data.taskName && data.taskName !== existingTask.taskName) changes.push(`name to '${data.taskName}'`);
    if (data.status && data.status !== existingTask.status) changes.push(`status to '${data.status}'`);
    if (data.priority && data.priority !== existingTask.priority) changes.push(`priority to '${data.priority}'`);
    const details = changes.length > 0 ? `Updated task: changed ${changes.join(', ')}` : `Updated task metadata`;

    await AuditService.logAction(userId, 'TASK_UPDATED', `${details} (ID: ${taskId})`);

    return updatedTask;
  }

  /**
   * Deletes a task after checking ownership. Logs audit trails.
   */
  static async deleteTask(taskId: string, userId: string) {
    // Checks existence and ownership
    const task = await this.getTaskById(taskId, userId);

    await prisma.task.delete({
      where: { id: taskId },
    });

    await AuditService.logAction(userId, 'TASK_DELETED', `Deleted task '${task.taskName}' (ID: ${taskId})`);

    return task;
  }
}
