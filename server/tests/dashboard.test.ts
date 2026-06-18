import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/prisma';
import { generateToken } from '../src/utils/jwt.utils';

// Mock the Prisma client singleton
jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

describe('Dashboard Statistics API Endpoints', () => {
  const activeUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let tokenCookie: string;

  beforeAll(() => {
    const token = generateToken({ userId: activeUser.id, email: activeUser.email });
    tokenCookie = `token=${token}`;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);
  });

  describe('GET /api/stats - Dashboard Summary Metrics', () => {
    it('should return 401 Unauthorized if token cookie is missing', async () => {
      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(401);
    });

    it('should return aggregated counts scoped strictly to active user', async () => {
      // Mock different count outcomes
      (prisma.project.count as jest.Mock)
        .mockResolvedValueOnce(10) // totalProjects
        .mockResolvedValueOnce(4)  // projectsInProgress
        .mockResolvedValueOnce(3)  // completedProjects
        .mockResolvedValueOnce(3); // notStartedProjects

      (prisma.task.count as jest.Mock)
        .mockResolvedValueOnce(45) // totalTasks
        .mockResolvedValueOnce(30) // completedTasks
        .mockResolvedValueOnce(15) // pendingTasks
        .mockResolvedValueOnce(7)  // highPriorityTasks
        .mockResolvedValueOnce(2); // overdueTasks

      const response = await request(app)
        .get('/api/stats')
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        totalProjects: 10,
        totalTasks: 45,
        completedTasks: 30,
        pendingTasks: 15,
        projectsInProgress: 4,
        completedProjects: 3,
        notStartedProjects: 3,
        highPriorityTasks: 7,
        overdueTasks: 2,
      });

      // Verify ownership scoping on queries
      expect(prisma.project.count).toHaveBeenNthCalledWith(1, {
        where: { userId: activeUser.id },
      });
      expect(prisma.task.count).toHaveBeenNthCalledWith(1, {
        where: { project: { userId: activeUser.id } },
      });
    });
  });

  describe('GET /api/stats/project-status - Chart Data', () => {
    it('should retrieve project distribution count mapping', async () => {
      (prisma.project.count as jest.Mock)
        .mockResolvedValueOnce(2)  // NOT_STARTED
        .mockResolvedValueOnce(4)  // IN_PROGRESS
        .mockResolvedValueOnce(3); // COMPLETED

      const response = await request(app)
        .get('/api/stats/project-status')
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        notStarted: 2,
        inProgress: 4,
        completed: 3,
      });

      // Verify ownership filtering
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { userId: activeUser.id, status: 'NOT_STARTED' },
      });
    });
  });

  describe('GET /api/stats/task-status - Chart Data', () => {
    it('should retrieve task distribution count mapping', async () => {
      (prisma.task.count as jest.Mock)
        .mockResolvedValueOnce(10) // PENDING
        .mockResolvedValueOnce(15) // IN_PROGRESS
        .mockResolvedValueOnce(20); // COMPLETED

      const response = await request(app)
        .get('/api/stats/task-status')
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        pending: 10,
        inProgress: 15,
        completed: 20,
      });

      // Verify scoping
      expect(prisma.task.count).toHaveBeenCalledWith({
        where: { project: { userId: activeUser.id }, status: 'PENDING' },
      });
    });
  });

  describe('GET /health - API Health Check', () => {
    it('should return 200 and status UP when database is reachable', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([1]);

      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('UP');
      expect(response.body.services.server).toBe('UP');
      expect(response.body.services.database).toBe('UP');
    });

    it('should return 500 and status DOWN when database query fails', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('Connection failure'));

      const response = await request(app).get('/health');
      expect(response.status).toBe(500);
      expect(response.body.status).toBe('DOWN');
      expect(response.body.services.server).toBe('UP');
      expect(response.body.services.database).toBe('DOWN');
      expect(response.body.error).toBe('Connection failure');
    });
  });
});
