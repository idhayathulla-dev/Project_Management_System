# Project Structure

This document outlines the directory structure, file configurations, and design patterns used in the Project Management System.

---

## 1. Monorepo Organization

The project is structured as a monorepo containing distinct directories for the backend server and frontend client, with a shared Prisma database schema at the root.

```
project-management-system/
├── .github/                # GitHub workflows (CI/CD pipelines)
│   └── workflows/
│       └── ci.yml          # Automated type-checking, linting, and tests pipeline
├── client/                 # Next.js Frontend
│   ├── src/                # Frontend source code
│   ├── public/             # Static public assets
│   ├── tests/              # Jest frontend unit & integration tests
│   └── package.json
├── server/                 # Express.js TypeScript Backend
│   ├── src/                # Backend source code
│   ├── tests/              # Backend Jest & Supertest suites
│   └── package.json
├── prisma/                 # Database Schema & Migrations
│   ├── schema.prisma       # Relational models and index configurations
│   └── migrations/
├── docs/                   # System & Setup documentation
│   ├── DATABASE_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── PROJECT_STRUCTURE.md
│   ├── INTERVIEW_GUIDE.md
│   └── API_REFERENCE.md
├── docker/                 # Production multi-stage Dockerfiles
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── screenshots/            # Visual dashboard and layout assets
│   ├── ER-Diagram.png
│   ├── landing-page.png
│   ├── dashboard.png
│   ├── projects.png
│   ├── tasks.png
│   └── swagger.png
├── docker-compose.yml      # Docker Compose orchestration
├── .env.example            # Unified environment variables guide
├── LICENSE                 # Repository open-source license
└── .gitignore
```

---

## 2. Backend Layer Architecture (`server/src/`)

The backend follows a clean, decoupled **Controller-Service-Prisma Client** design pattern:

server/
├── src/
│   ├── config/                 # Service singletons & configurations
│   │   ├── logger.ts           # Winston logging system
│   │   ├── prisma.ts           # Prisma Client connection singleton
│   │   └── swagger.ts          # OpenAPI/Swagger configuration spec
│   ├── controllers/            # HTTP Request-Response routers
│   │   ├── auth.controller.ts
│   │   ├── project.controller.ts
│   │   ├── stats.controller.ts
│   │   └── task.controller.ts
│   ├── services/               # Core business logic handlers
│   │   ├── audit.service.ts    # Central audit log writer
│   │   ├── auth.service.ts     # Password hashing & registration logic
│   │   ├── project.service.ts  # Project CRUD query building
│   │   ├── stats.service.ts    # Promise.all aggregate metrics querying
│   │   └── task.service.ts     # Task CRUD query building
│   ├── middlewares/            # Request interceptors
│   │   ├── auth.middleware.ts  # JWT cookie decryption & user injection
│   │   ├── errorHandler.ts     # Unified JSON envelope error formatter
│   │   └── rateLimiter.ts      # Authentication rate limits
│   ├── routes/                 # Express route mounts
│   ├── validators/             # Zod input validation schemas
│   └── utils/                  # Helper modules
└── tests/                      # Integration testing suite (Jest & Supertest)
```

### Pattern Flows:
1. **HTTP Request** lands on route -> triggers controller.
2. **Controller** extracts data, runs validator checks, invokes appropriate service function, and returns status.
3. **Service** executes SQL commands via the Prisma singleton connection and communicates changes to the **Audit Service**.

---

## 3. Frontend App Router Architecture (`client/`)

The client application leverages Next.js 15 App Router, React Hook Form, Tailwind CSS, and Recharts:

```
client/
├── src/
│   ├── app/                    # Routing pages & layouts
│   │   ├── dashboard/          # Analytics metrics page
│   │   ├── login/              # Login screen
│   │   ├── register/           # Signup screen
│   │   ├── projects/           # Projects list page
│   │   │   ├── create/         # Project creation form
│   │   │   └── [id]/           # Scoped project view (plus edit subfolder)
│   │   ├── tasks/              # Global tasks listing (plus edit subfolder)
│   │   ├── profile/            # Activity timeline logs
│   │   ├── globals.css         # Tailwind styles configuration
│   │   └── layout.tsx          # App base configuration
│   ├── components/             # Reusable UI elements
│   │   ├── ui/                 # Small atomic elements (Dialog, Toast, Skeletons)
│   │   ├── Navbar.tsx          # Top utility navbar
│   │   ├── Sidebar.tsx         # Sidebar navigation links
│   │   └── ProtectedLayout.tsx # Route guard checking user auth state
│   ├── context/                # Context wrappers
│   │   └── AuthContext.tsx     # Session state synchronization hook (useAuth)
│   ├── lib/                    # Configuration files
│   │   └── api.ts              # Axios instance mapping timeouts and credentials
│   └── types/                  # Strict TypeScript interfaces
└── tests/                      # Jest & React Testing Library components
```
