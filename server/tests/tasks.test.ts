import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/prisma';
import { generateToken } from '../src/utils/jwt.utils';
import { TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';

// Mock the Prisma client singleton
jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('Tasks API Endpoints', () => {
  const activeUser = {
    id: 'user-uuid-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const otherUser = {
    id: 'user-uuid-2',
    fullName: 'Bob Smith',
    email: 'bob@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: '3f69b828-59a1-432d-8693-ee7f4b8ee341',
    projectName: 'Alpha Project',
    description: 'First test project',
    status: ProjectStatus.NOT_STARTED,
    startDate: new Date(),
    endDate: new Date(),
    userId: activeUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask = {
    id: '442f4c93-5ba9-4f70-a359-00f72bc9776d',
    taskName: 'Design Database Schema',
    description: 'Sketch out models and fields',
    priority: TaskPriority.HIGH,
    status: TaskStatus.PENDING,
    dueDate: new Date('2026-06-25T00:00:00.000Z'),
    projectId: mockProject.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: {
      userId: activeUser.id,
      projectName: mockProject.projectName,
    },
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

  describe('GET /api/tasks - Listing & Query Scoping', () => {
    it('should return 401 Unauthorized if token cookie is missing', async () => {
      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(401);
    });

    it('should return user tasks with pagination headers', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTask]);
      (prisma.task.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/tasks?page=1&limit=5')
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
      });
    });

    it('should pass search, status, priority, and sorting constraints to Prisma', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/api/tasks?search=Database&status=PENDING&priority=HIGH&sortBy=dueDate&order=asc')
        .set('Cookie', [tokenCookie]);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          project: {
            userId: activeUser.id,
          },
          taskName: {
            contains: 'Database',
            mode: 'insensitive',
          },
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
        },
        orderBy: {
          dueDate: 'asc',
        },
        skip: 0,
        take: 10,
        include: {
          project: {
            select: {
              projectName: true,
            },
          },
        },
      });
    });
  });

  describe('GET /api/tasks/:id - Single Task View', () => {
    it('should retrieve task details successfully if owned', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      const response = await request(app)
        .get(`/api/tasks/${mockTask.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.id).toBe(mockTask.id);
    });

    it('should return 404 if task does not exist', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tasks/nonexistent-uuid')
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');
    });

    it('should return 403 Forbidden if parent project is owned by another user', async () => {
      const foreignTask = {
        ...mockTask,
        project: {
          userId: otherUser.id,
          projectName: 'Other Project',
        },
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(foreignTask);

      const response = await request(app)
        .get(`/api/tasks/${foreignTask.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access forbidden. You do not own this task\'s project.');
    });
  });

  describe('POST /api/tasks - Create Task', () => {
    const payload = {
      taskName: 'Write Unit Tests',
      description: 'Test all boundary cases',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: '2026-06-30',
      projectId: mockProject.id,
    };

    it('should create task successfully and write audit log if project is owned', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'new-task-uuid',
        ...payload,
        dueDate: new Date(payload.dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/tasks')
        .send(payload)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.taskName).toBe(payload.taskName);

      // Verify Audit Logging
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: activeUser.id,
            action: 'TASK_CREATED',
            details: expect.stringContaining("Created task 'Write Unit Tests'"),
          }),
        })
      );
    });

    it('should fail with 403 if project exists but belongs to another user', async () => {
      const foreignProject = { ...mockProject, userId: otherUser.id };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(foreignProject);

      const response = await request(app)
        .post('/api/tasks')
        .send(payload)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access forbidden. You do not own the parent project.');
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('should fail with 400 if validation constraints are violated', async () => {
      const invalidPayload = {
        ...payload,
        taskName: '', // empty name
        priority: 'EXTREME', // invalid enum
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidPayload)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id - Update Task', () => {
    it('should update task and write audit log', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      const response = await request(app)
        .put(`/api/tasks/${mockTask.id}`)
        .send({ status: TaskStatus.COMPLETED })
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.status).toBe(TaskStatus.COMPLETED);

      // Verify audit logs
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TASK_UPDATED',
          }),
        })
      );
    });

    it('should prevent edits (403) on tasks from other users\' projects', async () => {
      const foreignTask = {
        ...mockTask,
        project: {
          userId: otherUser.id,
          projectName: 'Other Project',
        },
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(foreignTask);

      const response = await request(app)
        .put(`/api/tasks/${foreignTask.id}`)
        .send({ taskName: 'Hacked Task Name' })
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(403);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/tasks/:id - Delete Task', () => {
    it('should delete task and log audit event', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.task.delete as jest.Mock).mockResolvedValue(mockTask);

      const response = await request(app)
        .delete(`/api/tasks/${mockTask.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: mockTask.id },
      });

      // Verify audit logs
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TASK_DELETED',
            details: expect.stringContaining("Deleted task 'Design Database Schema'"),
          }),
        })
      );
    });

    it('should block task deletions (403) on other users\' projects', async () => {
      const foreignTask = {
        ...mockTask,
        project: {
          userId: otherUser.id,
          projectName: 'Other Project',
        },
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(foreignTask);

      const response = await request(app)
        .delete(`/api/tasks/${foreignTask.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(403);
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });
});
