import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

// Mock the Prisma client singleton
jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Authentication API Endpoints', () => {
  const mockUser = {
    id: 'user-uuid-1234',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password-string',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and set a JWT cookie', async () => {
      // Setup mock behavior
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            fullName: mockUser.fullName,
            email: mockUser.email,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        },
      });

      // Verify cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should return 400 validation error if input validation fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'J', // too short
          email: 'invalid-email',
          password: '123', // too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 error if email is already taken', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email address is already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user and set auth token cookie', async () => {
      const plainPassword = 'Password123!';
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: plainPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(mockUser.email);

      // Verify cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });

    it('should return 401 if password does not match hash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: 'different-password-hash',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 if email is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the token cookie on logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=;');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user details if correct token cookie is supplied', async () => {
      const plainPassword = 'Password123!';
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const userWithHashedPass = {
        ...mockUser,
        passwordHash,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithHashedPass);

      // We need to fetch a token to send in the cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: plainPassword,
        });
      
      const cookieHeader = loginResponse.headers['set-cookie'][0];
      const tokenString = cookieHeader.split(';')[0]; // "token=XXXXXXX"

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [tokenString]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(mockUser.email);
    });

    it('should return 401 if auth cookie is missing', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
