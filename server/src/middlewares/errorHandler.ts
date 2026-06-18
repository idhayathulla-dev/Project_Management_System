import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];

  // Log using Winston
  if (statusCode === 500) {
    logger.error('Centralized Error Handler caught exception: %o', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn(`Client Request Warning (${statusCode}): ${message} - Path: ${req.path}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
