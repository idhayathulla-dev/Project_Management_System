import prisma from '../config/prisma';
import logger from '../config/logger';

export class AuditService {
  /**
   * Logs a user-triggered activity in the database.
   * Runs inside a try-catch to ensure that logging failures do not disrupt critical operations.
   */
  static async logAction(userId: string, action: string, details: string) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
        },
      });
      logger.info(`[AUDIT] Action: ${action} | User: ${userId} | Details: ${details}`);
      return log;
    } catch (err) {
      logger.error(`[AUDIT ERROR] Failed to save audit log: ${err}`);
      return null;
    }
  }
}
