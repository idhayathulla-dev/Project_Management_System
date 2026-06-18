import prisma from '../config/prisma';

export class StatsService {
  /**
   * Aggregates dashboard counts and status metrics for the authenticated user.
   * Leverages Promise.all to run count queries in parallel.
   */
  static async getDashboardStats(userId: string) {
    const now = new Date();

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
      completedProjects,
      notStartedProjects,
      highPriorityTasks,
      overdueTasks,
    ] = await Promise.all([
      // Total Projects
      prisma.project.count({ where: { userId } }),
      // Total Tasks
      prisma.task.count({ where: { project: { userId } } }),
      // Completed Tasks
      prisma.task.count({ where: { project: { userId }, status: 'COMPLETED' } }),
      // Pending Tasks
      prisma.task.count({ where: { project: { userId }, status: 'PENDING' } }),
      // Projects In Progress
      prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
      // Completed Projects
      prisma.project.count({ where: { userId, status: 'COMPLETED' } }),
      // Not Started Projects
      prisma.project.count({ where: { userId, status: 'NOT_STARTED' } }),
      // High Priority Tasks
      prisma.task.count({ where: { project: { userId }, priority: 'HIGH' } }),
      // Overdue Tasks (not completed and past due date)
      prisma.task.count({
        where: {
          project: { userId },
          status: { not: 'COMPLETED' },
          dueDate: { lt: now },
        },
      }),
    ]);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
      completedProjects,
      notStartedProjects,
      highPriorityTasks,
      overdueTasks,
    };
  }

  /**
   * Returns project counts grouped by status.
   */
  static async getProjectStatusStats(userId: string) {
    const [notStarted, inProgress, completed] = await Promise.all([
      prisma.project.count({ where: { userId, status: 'NOT_STARTED' } }),
      prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { userId, status: 'COMPLETED' } }),
    ]);

    return {
      notStarted,
      inProgress,
      completed,
    };
  }

  /**
   * Returns task counts grouped by status.
   */
  static async getTaskStatusStats(userId: string) {
    const [pending, inProgress, completed] = await Promise.all([
      prisma.task.count({ where: { project: { userId }, status: 'PENDING' } }),
      prisma.task.count({ where: { project: { userId }, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { project: { userId }, status: 'COMPLETED' } }),
    ]);

    return {
      pending,
      inProgress,
      completed,
    };
  }
}
