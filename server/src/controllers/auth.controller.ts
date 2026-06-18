import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { generateToken } from '../utils/jwt.utils';
import { getCookieOptions } from '../utils/cookie.utils';

export class AuthController {
  /**
   * Registers a user, signs a JWT token, sets it in a secure cookie, and returns the user payload.
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate inputs
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        const error: any = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(error);
      }

      const { fullName, email, password } = result.data;

      // Register the user
      const user = await AuthService.register(fullName, email, password);

      // Generate token and attach cookie
      const token = generateToken({ userId: user.id, email: user.email });
      res.cookie('token', token, getCookieOptions());

      return res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Logs a user in, verifies credentials, issues a JWT token in a secure cookie, and returns user details.
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate inputs
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        const error: any = new Error('Validation failed');
        error.statusCode = 400;
        error.errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(error);
      }

      const { email, password } = result.data;

      // Authenticate
      const user = await AuthService.login(email, password);

      // Generate token and attach cookie
      const token = generateToken({ userId: user.id, email: user.email });
      res.cookie('token', token, getCookieOptions());

      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Clears the HTTP-only auth token cookie to log the user out.
   */
  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      const options = { ...getCookieOptions() };
      delete options.maxAge; // Expiry isn't needed for clearing

      res.clearCookie('token', options);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Returns details of the currently authenticated user session.
   */
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthorized');
        error.statusCode = 401;
        return next(error);
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            fullName: req.user.fullName,
            email: req.user.email,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  }
}
