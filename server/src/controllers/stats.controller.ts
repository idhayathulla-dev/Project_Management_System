import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/stats.service';

export class StatsController {
  /**
   * Retrieves summary statistics for the dashboard.
   */
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const stats = await StatsService.getDashboardStats(req.user.id);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Retrieves project distribution by status.
   */
  static async getProjectStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const stats = await StatsService.getProjectStatusStats(req.user.id);

      return res.status(200).json(stats);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Retrieves task distribution by status.
   */
  static async getTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      const stats = await StatsService.getTaskStatusStats(req.user.id);

      return res.status(200).json(stats);
    } catch (err) {
      return next(err);
    }
  }
}
