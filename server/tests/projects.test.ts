import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/prisma';
import { generateToken } from '../src/utils/jwt.utils';
import { ProjectStatus } from '@prisma/client';

// Mock the Prisma client singleton
jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
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

describe('Projects API Endpoints', () => {
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
    id: 'project-uuid-1',
    projectName: 'Alpha Project',
    description: 'First test project',
    status: ProjectStatus.NOT_STARTED,
    startDate: new Date('2026-06-01T00:00:00.000Z'),
    endDate: new Date('2026-06-30T00:00:00.000Z'),
    userId: activeUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let tokenCookie: string;

  beforeAll(() => {
    // Generate valid JWT token for authenticated requests
    const token = generateToken({ userId: activeUser.id, email: activeUser.email });
    tokenCookie = `token=${token}`;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default authentication middleware user lookup mock
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);
  });

  describe('GET /api/projects - Listing & Queries', () => {
    it('should return 401 Unauthorized if token cookie is missing', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return projects list with pagination metadata', async () => {
      const mockProjectsList = [mockProject];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjectsList);
      (prisma.project.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/projects?page=1&limit=10')
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].projectName).toBe(mockProject.projectName);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should correctly build Prisma query clauses for search, status, and sorting', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.project.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/api/projects?search=Alpha&status=IN_PROGRESS&sortBy=projectName&order=asc')
        .set('Cookie', [tokenCookie]);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          userId: activeUser.id,
          projectName: {
            contains: 'Alpha',
            mode: 'insensitive',
          },
          status: ProjectStatus.IN_PROGRESS,
        },
        orderBy: {
          projectName: 'asc',
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('GET /api/projects/:id - Single Project Retrieval', () => {
    it('should retrieve project details successfully', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .get(`/api/projects/${mockProject.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.id).toBe(mockProject.id);
    });

    it('should return 404 if project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/projects/nonexistent-uuid')
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 403 Forbidden if project is owned by another user', async () => {
      const foreignProject = { ...mockProject, userId: otherUser.id };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(foreignProject);

      const response = await request(app)
        .get(`/api/projects/${foreignProject.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access forbidden. You do not own this project.');
    });
  });

  describe('POST /api/projects - Create Project', () => {
    const payload = {
      projectName: 'Beta Project',
      description: 'Second test project',
      status: ProjectStatus.NOT_STARTED,
      startDate: '2026-07-01',
      endDate: '2026-07-15',
    };

    it('should create project successfully and log an audit trail', async () => {
      (prisma.project.create as jest.Mock).mockResolvedValue({
        id: 'new-project-uuid',
        ...payload,
        userId: activeUser.id,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/projects')
        .send(payload)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.projectName).toBe(payload.projectName);

      // Verify Audit Logging was triggered
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: activeUser.id,
            action: 'PROJECT_CREATED',
            details: expect.stringContaining("Created project 'Beta Project'"),
          }),
        })
      );
    });

    it('should fail with 400 validation error if end date is before start date', async () => {
      const invalidPayload = {
        ...payload,
        startDate: '2026-07-15',
        endDate: '2026-07-01', // Before start date
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidPayload)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/projects/:id - Update Project', () => {
    it('should update project successfully and log audit trail', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        projectName: 'Updated Project Name',
      });

      const response = await request(app)
        .put(`/api/projects/${mockProject.id}`)
        .send({ projectName: 'Updated Project Name' })
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.projectName).toBe('Updated Project Name');

      // Verify audit logging was triggered
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PROJECT_UPDATED',
          }),
        })
      );
    });

    it('should block modifications (403) to other users\' projects', async () => {
      const foreignProject = { ...mockProject, userId: otherUser.id };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(foreignProject);

      const response = await request(app)
        .put(`/api/projects/${foreignProject.id}`)
        .send({ projectName: 'Hacked Name' })
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(403);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/projects/:id - Delete Project', () => {
    it('should delete project and write audit log', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.project.delete as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .delete(`/api/projects/${mockProject.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });

      // Verify audit logging
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PROJECT_DELETED',
            details: expect.stringContaining("Deleted project 'Alpha Project'"),
          }),
        })
      );
    });

    it('should prevent delete operations (403) for other users\' projects', async () => {
      const foreignProject = { ...mockProject, userId: otherUser.id };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(foreignProject);

      const response = await request(app)
        .delete(`/api/projects/${foreignProject.id}`)
        .set('Cookie', [tokenCookie]);

      expect(response.status).toBe(403);
      expect(prisma.project.delete).not.toHaveBeenCalled();
    });
  });
});
