import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// POST /api/auth/register - Register a new user (rate limited)
router.post('/register', authRateLimiter, AuthController.register);

// POST /api/auth/login - Login user (rate limited)
router.post('/login', authRateLimiter, AuthController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', AuthController.logout);

// GET /api/auth/me - Retrieve currently authenticated user context
router.get('/me', authenticate, AuthController.me);

export default router;
