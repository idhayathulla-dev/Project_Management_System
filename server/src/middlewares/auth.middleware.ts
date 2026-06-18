import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Middleware to authenticate requests.
 * Extracts the JWT from secure HTTP-only cookies, verifies it, and attaches the user payload to the request.
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      const error: any = new Error('Access denied. No authentication token provided.');
      error.statusCode = 401;
      return next(error);
    }

    // Verify token payload
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const error: any = new Error('Access denied. Authentication token is invalid or has expired.');
      error.statusCode = 401;
      return next(error);
    }

    // Fetch user from DB using singleton
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const error: any = new Error('Access denied. User no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    // Attach user information to request
    req.user = user;
    return next();
  } catch (err) {
    logger.error(`Authentication middleware error: ${err}`);
    return next(err);
  }
};

/**
 * Authorization Foundation (for future phases):
 * Since project and task data belongs exclusively to the user who created it,
 * we will implement ownership check guards in future CRUD routes.
 * Below is a foundational helper to check resource ownership.
 */
export const checkOwnership = (resourceUserId: string, currentUserId: string) => {
  if (resourceUserId !== currentUserId) {
    const error: any = new Error('Access forbidden. You do not own this resource.');
    error.statusCode = 403;
    throw error;
  }
};
