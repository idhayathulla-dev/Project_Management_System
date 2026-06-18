# Project Management System (PMS)

A modern, enterprise-grade, SaaS-style Project Management System built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Express / Prisma / PostgreSQL**.

---

## 🚀 Key Features

* **Authentication & Role Security**: Secure token-based cookies, SameSite configuration, secure routes, and rate-limiting.
* **Workspace Dashboard**: Beautiful charts visualizing real-time metrics (Total Projects, Task completion status, Priority levels) using Recharts.
* **Project & Task Management**: Full CRUD operations for projects and tasks with status transitions, filter options, and due dates.
* **Robust Health Monitoring**: Integrated `/health` endpoint to monitor server uptime and database connectivity.
* **Swagger API Documentation**: Automated API documentation available directly via Swagger UI.
* **Dockerized Setup**: Multi-stage production-ready Dockerfiles with database migration verification.

---

## 🛠️ Technology Stack

### Frontend Client
* **Framework**: Next.js 15 (App Router)
* **Styling**: Tailwind CSS & Shadcn UI
* **Forms**: React Hook Form with Zod validation
* **Charts**: Recharts
* **State & Networking**: Axios with secure HTTP-only cookies

### Backend API Server
* **Runtime**: Node.js (TypeScript)
* **Framework**: Express.js
* **OR/M**: Prisma ORM
* **Database**: PostgreSQL (Docker / Neon)
* **Testing**: Jest & Supertest

---

## 📁 Project Structure

```text
├── client/                 # Next.js Frontend Client
│   ├── src/                # App Router UI, components, contexts, and api client
│   ├── public/             # Static public assets
│   ├── tests/              # Jest unit & React Testing Library integration tests
│   └── package.json
├── server/                 # Express API Server
│   ├── src/                # Decoupled Controllers, Services, Middlewares, and Router layers
│   ├── tests/              # Backend Jest & Supertest suites
│   └── package.json
├── prisma/                 # Database schema definitions and migrations
│   ├── schema.prisma       # Prisma Database mapping models
│   └── migrations/         # Relational database migration logs
├── docs/                   # Detailed guide documentations
│   ├── DATABASE_DOCUMENTATION.md # Database schema and entity models description
│   ├── DEPLOYMENT_GUIDE.md # Production deployment guide (Neon, Render, Vercel)
│   ├── PROJECT_STRUCTURE.md# Decoupled layer navigation guide
│   ├── INTERVIEW_GUIDE.md  # Architecture, Authentication, and Docker walkthroughs
│   └── API_REFERENCE.md    # Restful JSON API Endpoint Specifications
├── docker/                 # Production multi-stage Docker configurations
│   ├── backend.Dockerfile  # Server Node deployment image config
│   └── frontend.Dockerfile # Client Next.js deployment image config
├── screenshots/            # Operational UI screenshots and data diagrams
│   ├── ER-Diagram.png      # Entity Relationship Diagram
│   ├── landing-page.png    # Login screen screenshot
│   ├── dashboard.png       # Metrics dashboard visual charts
│   ├── projects.png        # Paginated projects overview
│   ├── tasks.png           # Scoped tasks list view
│   └── swagger.png         # Swagger UI documentation interactive page
├── docker-compose.yml      # Service orchestration config for local composition
├── LICENSE                 # MIT Open source license file
└── README.md               # Main documentation entrance
```

---

## ⚙️ Environment Configuration

Copy the root environment example to establish local secrets:
```bash
cp .env.example .env
```

The system uses unified configurations:
* `DATABASE_URL`: Connection string for PostgreSQL (local container: `postgresql://pms_user:pms_password@localhost:5432/pms_database?schema=public`).
* `PORT`: Server port (defaults to `5000`).
* `JWT_SECRET`: Security token for authentication signing.
* `CLIENT_URL`: Cross-origin whitelist (defaults to `http://localhost:3000`).

---

## 🐳 Running the System with Docker Compose (Recommended)

Ensure you have **Docker Desktop** running, then execute the following command at the root of the project to build and spin up the complete stack:

```bash
docker compose up -d --build
```

### Accessing the services
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend API Host**: [http://localhost:5000](http://localhost:5000)
* **Interactive Swagger Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **System Status Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 💻 Running the System for Local Development (Without Docker)

If you are developing features and want live reloading:

### 1. Launch the PostgreSQL Container Only
```bash
docker compose up -d postgres
```

### 2. Apply Database Schema Migrations
From the root folder:
```bash
npx prisma migrate dev
```

### 3. Run the Backend API
Navigate to the `server/` directory, install packages, and start the development server:
```bash
cd server
npm install
npm run dev
```

### 4. Run the Frontend Client
Navigate to the `client/` directory, install packages, and start the development server:
```bash
cd client
npm install
npm run dev
```

---

## 🧪 Testing

### Running Backend Tests
Execute the integration & unit tests in the `server` directory:
```bash
cd server
npm run test
```

### Running Frontend Tests
Execute the unit tests in the `client` directory:
```bash
cd client
npm run test
```

---

## 🚀 Production Deployment
Refer to the [Deployment Guide](file:///c:/Users/idhay/Desktop/Project%20Management%20System/docs/DEPLOYMENT_GUIDE.md) in the `docs` folder for detailed deployment instructions on **Neon**, **Render**, and **Vercel**.
