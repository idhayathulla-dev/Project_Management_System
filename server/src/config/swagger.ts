import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Project Management System API',
    version: '1.0.0',
    description: 'API documentation for the internship assessment Project Management System. Enforces secure, cookie-based JWT authorization.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'Secure JWT authorization token stored in HttpOnly cookie.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          projectName: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          taskName: { type: 'string' },
          description: { type: 'string', nullable: true },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
          dueDate: { type: 'string', format: 'date-time' },
          projectId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      cookieAuth: [],
    },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', minLength: 2, example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully, token returned in secure cookie.',
            headers: {
              'Set-Cookie': {
                schema: { type: 'string', example: 'token=xxx; HttpOnly; Secure; SameSite=Lax' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid inputs or email already taken.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'jane@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User logged in successfully.',
            headers: {
              'Set-Cookie': {
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Input validation failure.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          401: {
            description: 'Invalid credentials.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout user',
        responses: {
          200: {
            description: 'Cleared session cookies.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user session information',
        responses: {
          200: {
            description: 'Returns profile.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List user\'s projects',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'startDate', 'endDate', 'projectName'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Array of owned projects with pagination data.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectName', 'startDate', 'endDate'],
                properties: {
                  projectName: { type: 'string', example: 'Alpha Build' },
                  description: { type: 'string', example: 'Details' },
                  status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
                  startDate: { type: 'string', format: 'date', example: '2026-06-01' },
                  endDate: { type: 'string', format: 'date', example: '2026-06-30' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Project created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        project: { $ref: '#/components/schemas/Project' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation failures.' },
          401: { description: 'Unauthorized.' },
        },
      },
    },
    '/api/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Retrieve project details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Project details.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        project: { $ref: '#/components/schemas/Project' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
          403: { description: 'Access Forbidden (not the owner).' },
          404: { description: 'Project not found.' },
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update an existing project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  projectName: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Project updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        project: { $ref: '#/components/schemas/Project' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation failures.' },
          401: { description: 'Unauthorized.' },
          403: { description: 'Forbidden.' },
          404: { description: 'Not found.' },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Project successfully deleted.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
          403: { description: 'Forbidden.' },
          404: { description: 'Not found.' },
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List user\'s tasks',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'dueDate', 'taskName', 'priority'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'projectId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Array of tasks with pagination.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task under a project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['taskName', 'dueDate', 'projectId'],
                properties: {
                  taskName: { type: 'string', example: 'Setup Server' },
                  description: { type: 'string', example: 'Details...' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
                  status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
                  dueDate: { type: 'string', format: 'date', example: '2026-06-25' },
                  projectId: { type: 'string', format: 'uuid', example: 'c30d970d-f0b0-466a-93ef-d2c668b5a32b' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Task created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation failure.' },
          401: { description: 'Unauthorized.' },
          403: { description: 'Forbidden (parent project not owned).' },
        },
      },
    },
    '/api/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Task details.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
          403: { description: 'Forbidden.' },
          404: { description: 'Not found.' },
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update a task',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  taskName: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                  status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
                  dueDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Task updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
          403: { description: 'Forbidden.' },
          404: { description: 'Not Found.' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Task deleted successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
          403: { description: 'Forbidden.' },
          404: { description: 'Not Found.' },
        },
      },
    },
    '/api/stats': {
      get: {
        tags: ['Statistics'],
        summary: 'Retrieve dashboard summary statistics',
        responses: {
          200: {
            description: 'Aggregated stats metrics.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalProjects: { type: 'integer', example: 10 },
                        totalTasks: { type: 'integer', example: 45 },
                        completedTasks: { type: 'integer', example: 30 },
                        pendingTasks: { type: 'integer', example: 15 },
                        projectsInProgress: { type: 'integer', example: 4 },
                        completedProjects: { type: 'integer', example: 3 },
                        notStartedProjects: { type: 'integer', example: 3 },
                        highPriorityTasks: { type: 'integer', example: 7 },
                        overdueTasks: { type: 'integer', example: 2 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
        },
      },
    },
    '/api/stats/project-status': {
      get: {
        tags: ['Statistics'],
        summary: 'Retrieve project distribution status counts for charts',
        responses: {
          200: {
            description: 'Status raw counts mapping.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notStarted: { type: 'integer', example: 2 },
                    inProgress: { type: 'integer', example: 4 },
                    completed: { type: 'integer', example: 3 },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
        },
      },
    },
    '/api/stats/task-status': {
      get: {
        tags: ['Statistics'],
        summary: 'Retrieve task distribution status counts for charts',
        responses: {
          200: {
            description: 'Status raw counts mapping.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    pending: { type: 'integer', example: 10 },
                    inProgress: { type: 'integer', example: 15 },
                    completed: { type: 'integer', example: 20 },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized.' },
        },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [], // Paths are documented inline inside the definition above for type safety and clean route files
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
