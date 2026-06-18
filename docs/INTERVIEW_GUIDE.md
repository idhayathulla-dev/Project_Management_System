# Interview Guide & Technical Decisions

This document highlights the architectural choices, security decisions, and optimization strategies implemented in the Project Management System to serve as a reference for code reviews and technical interviews.

---

## 1. Security Design Choices

### Why HTTP-Only Cookies over LocalStorage?
* **Threat Mitigation (XSS)**: Storing JWT tokens in `localStorage` makes them accessible to JavaScript. If an attacker runs a successful Cross-Site Scripting (XSS) attack (e.g. through a compromised npm dependency), they can read the token and hijack the session. HTTP-only cookies are inaccessible to JavaScript, preventing this vector.
* **Storage Standard**: HTTP-only cookies are automatically appended by the browser to outgoing requests matching the domain scope, providing a standard and secure authentication transport.

### SameSite and Secure Cookie Attributes
* **Secure**: Enforces that cookies are only transmitted over SSL/HTTPS connections in production, preventing man-in-the-middle sniffing.
* **SameSite=None**: Needed when the frontend and backend are hosted on different domains (e.g. Vercel and Render). It permits cross-site requests to include cookies. 
* **CSRF Protection**: Because `SameSite=None` allows cookies on cross-site requests, we mitigate CSRF (Cross-Site Request Forgery) attacks by verifying Custom Headers (such as browser-injected API parameters) and using structured CORS policies.

### Sensitive Data Exposure Checks
* In both authentication, project, and task handlers, database responses are mapped before being sent to the client. The `passwordHash` field is never exposed in API payloads, ensuring credential security.

---

## 2. Backend Design Decisions

### Controller-Service-Prisma Pattern
* **Decoupled Business Logic**: 
  - **Controllers** handle HTTP-layer specifics (parsing query inputs, validating schemas, structuring output status envelopes, catching errors).
  - **Services** contain database actions and computations.
* **Why not Repository Pattern?**: Prisma Client already functions as a repository abstraction. Over-wrapping it in custom repositories would add boilerplate without benefits, aligning with our rule to avoid overengineering.

### Prisma Singleton Connection
* **The Problem**: In environments with hot-reloading (like development servers), compiling files can create new instances of `PrismaClient` on every reload, quickly exhausting the PostgreSQL connection pool.
* **The Solution**: We created a singleton wrapper (`server/src/config/prisma.ts`) that caches the `PrismaClient` instance on the NodeJS `global` object, guaranteeing only a single instance is ever initialized.

---

## 3. Database Optimizations

### Optimized Indexing Strategy
To optimize database performance, indexes are explicitly declared in `prisma/schema.prisma`:
* `User.email`: Unique index to optimize lookups during login.
* `Project.userId` & `Task.projectId`: Indexes on foreign keys to optimize joins and scoping queries.
* `Project.status`, `Task.status`, `Task.priority`: Indexes on filterable enums to speed up listing results and dashboard aggregate counts.

### Cascade Deletion Integrity
* Relational paths are configured with `onDelete: Cascade`. Deleting a User automatically deletes all their Projects, which in turn deletes all their Tasks and Audit Logs. This prevents orphaned rows and keeps relational integrity intact.

---

## 4. API & Query Optimizations

### Scoped Parallel Counts (`Promise.all`)
For `/api/stats`, rather than waiting sequentially for 9 database counts, we trigger them in parallel using `Promise.all`:
```typescript
const [totalProjects, completedTasks, ...] = await Promise.all([
  prisma.project.count({ where: { userId } }),
  prisma.task.count({ where: { project: { userId }, status: 'COMPLETED' } }),
  ...
]);
```
This reduces the request latency from the sum of all queries to the latency of the single slowest query, maximizing performance.

### Authorization Scoping at Query Level
Instead of fetching items and filtering them in memory, we enforce ownership at the database query level:
```typescript
// Fetch tasks only for projects owned by the user
const tasks = await prisma.task.findMany({
  where: {
    project: { userId: activeUserId }
  }
});
```
This guarantees users can never query or list projects/tasks belonging to other accounts.

---

## 5. Frontend Optimizations

### Client Search Debouncing
* Typing in the search bar updates local state immediately, but defers calling the API by 400 milliseconds. 
* If the user types another character before the timer expires, the previous timeout is cancelled. This prevents sending an API request on every keystroke, reducing server load.

### Suspense Boundaries
* Pages utilizing URL parameters (`useSearchParams()`) are wrapped in Next.js `<Suspense>` boundaries. This prevents Next.js from failing static generation builds during compilation.

---

## 6. The 10-Minute Project Explanation (Pitch Guide)

*Use this outline to pitch the project structure, architectural decisions, and security design from memory.*

### 1. Architecture (1 Minute)
* This project is structured as a **TypeScript monorepo** containing a Next.js 15 App Router client, an Express API backend, and a PostgreSQL database. 
* We decoupled the architecture by enforcing a **headless API model**: the backend serves pure REST endpoints documented interactively via Swagger UI, and the client manages state, routing, and visuals locally, utilizing Axios for data fetching.

### 2. Authentication & Authorization (2 Minutes)
* Sessions are secured using **JWTs stored in HttpOnly, Secure, and SameSite cookies**, which mitigates XSS risks by keeping tokens inaccessible to JavaScript.
* **CORS is explicitly whitelisted** to the frontend domain with credentials enabled, and rate-limiting blocks brute-force authentication attacks.
* Authorization is enforced at the database layer: every project and task query scopes directly to the active user's ID (`req.user.id`), making it structurally impossible for a user to retrieve, edit, or delete another user's project/task (User A vs User B isolation).

### 3. Prisma Schema Design (2 Minutes)
* The relational database is designed around four key models: `User`, `Project`, `Task`, and `AuditLog`.
* All foreign key relationships (e.g. `projectId` in `Task`, `userId` in `Project`) use `onDelete: Cascade` to maintain database hygiene.
* Performance is optimized using **database indexes** on enums (`status`, `priority`) and search strings (`email`), preventing tables from degrading as records increase.

### 4. Dashboard Statistics (1 Minute)
* The dashboard page makes a single call to `/api/stats` to aggregate nine metrics (Total projects, overdue tasks, etc.).
* To prevent latency bottlenecks, the backend uses **Promise.all** to trigger all 9 database counts in parallel. This keeps response times fast and consistent.

### 5. Docker Setup (2 Minutes)
* Both services run containerized via multi-stage Dockerfiles utilizing Alpine Node images.
* **OpenSSL** is explicitly installed in the backend stage to support Prisma's musl-based query engine.
* The backend CMD wait-checks postgres health, deploys schema migrations (`prisma migrate deploy`), verifies status (`prisma migrate status`), and boots up the API server in a production state.
* The frontend compiles build-time environment arguments (`NEXT_PUBLIC_API_URL`) into static, optimized HTML production layers.
* A root `.dockerignore` excludes node modules to reduce context size to kilobytes.

### 6. CI/CD Pipeline (2 Minutes)
* Configured using **GitHub Actions**. Upon any push or PR, the workflow:
  1. Installs project dependencies.
  2. Runs typescript compilation checks (`tsc --noEmit`).
  3. Lints the frontend.
  4. Runs migrations against a temporary PostgreSQL container.
  5. Executes complete Jest and Supertest suites, enforcing code coverage thresholds (**>=80% for backend, >=70% for frontend**).
  6. Compiles production build artifacts.

---

## 7. 25 High-Impact Technical Interview Questions & Answers

### Q1: Why did you choose HTTP-Only cookies instead of storing JWTs in LocalStorage?
**A:** Storing tokens in `localStorage` leaves them open to theft via Cross-Site Scripting (XSS) attacks. If any third-party script or npm package is compromised, an attacker can access `localStorage.getItem('token')`. Setting the `HttpOnly` flag on the response cookie prevents client-side scripts from reading the token.

### Q2: What security attributes did you set on the JWT session cookie and why?
**A:** We configure three attributes:
1. `httpOnly: true` (prevents XSS retrieval).
2. `secure: true` in production (forces cookies to only transmit over encrypted HTTPS lines).
3. `sameSite: 'none'` in production to support cross-domain cookie transmission (between Render and Vercel domains), or `sameSite: 'lax'` with a matching custom root domain to block cross-site request forgery (CSRF).

### Q3: How do you protect the backend API from Cross-Site Request Forgery (CSRF) if cookies are sent automatically?
**A:** When `sameSite` is set to `none`, browsers automatically attach cookies to cross-site requests. We mitigate CSRF by:
1. Explicitly setting a CORS origin whitelist (wildcards like `*` are rejected when credentials are enabled).
2. Forcing the frontend client to supply custom request headers (like standard JSON headers), which browsers block on cross-site form submissions unless explicit CORS pre-flight authorization is granted.

### Q4: Why did you implement the Prisma Client as a singleton in the backend configuration?
**A:** Instantiating `new PrismaClient()` creates a database connection pool. In Node development servers with hot-reloading (like `ts-node-dev`), a new client is created every time the code updates. This quickly exhausts the database's max connection limit. Storing the instance on the NodeJS `global` object caches and reuses it across compilations.

### Q5: How is authorization enforced on tasks to prevent User B from editing User A's tasks?
**A:** In the task controllers (like `TaskController.update` or `TaskController.getById`), we check project ownership. The database lookup query fetches the task *only if* the parent project is owned by the logged-in user:
```typescript
const task = await prisma.task.findFirst({
  where: { id: taskId, project: { userId: activeUserId } }
});
if (!task) throw new ForbiddenError('Access forbidden');
```
If the ID belongs to another user's task, the query returns null, resulting in a 403 Forbidden or 404 Not Found error.

### Q6: How does the `/api/stats` endpoint query 9 different dashboard counts without lagging?
**A:**Sequential `await` database queries execute synchronously, blocking the thread and adding up response times. We execute all 9 queries in parallel using `Promise.all`:
```typescript
const [total, completed, pending, ...] = await Promise.all([
  prisma.project.count({ where: { userId } }),
  prisma.task.count({ where: { project: { userId }, status: 'COMPLETED' } }),
  ...
]);
```
This reduces response latency to the duration of the slowest query in the list.

### Q7: Why did you declare indexes on fields like status and priority in your Prisma schema?
**A:** By default, database searches require scanning every row in a table (O(N) complexity). We indexed enums like `ProjectStatus`, `TaskStatus`, and `TaskPriority` because these fields are frequently used in search filters and dashboard aggregates. The indexes organize the database as a B-Tree, reducing search complexity to O(log N).

### Q8: What does the cascade deletion setting accomplish in your database?
**A:** It maintains database relational integrity. In `schema.prisma`, we set `onDelete: Cascade` on foreign keys:
```prisma
project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
```
If a project is deleted, PostgreSQL automatically removes all associated tasks and audit logs, avoiding orphaned data rows.

### Q9: Why is search input debounced on the frontend Next.js client?
**A:** Without debouncing, every single keystroke in the search bar triggers an API request to the backend. If a user types "Restaurant project", 18 search requests hit the database. Debouncing introduces a 400ms delay: it waits for the user to pause typing before sending a single, consolidated API request.

### Q10: How did you resolve the Next.js static build compilation failures regarding `useSearchParams`?
**A:** Next.js tries to statically pre-render all pages during `npm run build`. Pages using `useSearchParams` rely on client-side URL parameters that are unavailable during build time. This crashes the compiler. Wrapping components using URL search parameters inside `<Suspense>` tells Next.js to compile them dynamically on client hydration.

### Q11: What is the difference between a multi-stage Docker build and a single-stage Docker build?
**A:** Single-stage builds carry build dependencies (like compilers, typescript devDependencies, and test runners) into the final production image, resulting in large images (often >1GB) and security vulnerabilities. Multi-stage builds compile code in a temporary "builder" stage, and copy *only* the compiled production artifacts (`dist/`, production `node_modules/`, configurations) to a clean runner stage, reducing image sizes to a fraction.

### Q12: Why did you install OpenSSL explicitly inside the backend Alpine Docker image?
**A:** Prisma's query engine runs compile-optimized binary engines tailored to specific platforms. Alpine Linux uses a lightweight C library wrapper (`musl`). To run Prisma commands like `prisma migrate deploy` inside an Alpine container, the system must have `libssl` installed. Running `apk add --no-cache openssl` makes the Prisma runtime compatible.

### Q13: How does the backend container verify database migration safety on startup?
**A:** The container start command (`CMD`) in `server/Dockerfile` runs `npx prisma migrate deploy` followed by `npx prisma migrate status`. The `deploy` command applies any pending migrations. The `status` command verifies that the schema engine is fully synchronized with the database. If migration application fails, the command exits with non-zero status, preventing a broken backend service from starting.

### Q14: How does the backend rates limits configuration prevent brute-force attacks?
**A:** We integrated `express-rate-limit` as middleware on auth routes (`login` and `register`). It monitors client IPs and limits access to 5 requests per 15-minute window. Excess requests are rejected with a `429 Too Many Requests` status, protecting authentication logic.

### Q15: What is the purpose of `.dockerignore` and how did it affect your build speeds?
**A:** When building a Docker image, the daemon copies the entire workspace folder (the "build context") into the container. Without `.dockerignore`, local files like `node_modules`, `.next`, and logs (hundreds of megabytes) are transferred. Excluding these directories with `.dockerignore` reduced build context transfer size from **1.02 GB to 55 KB**, speeding up context transfer to milliseconds.

### Q16: How did you configure test coverage thresholds in Jest?
**A:** We defined Jest configuration boundaries under the `coverageThreshold` attribute. We enforce a minimum threshold of **80% coverage** for lines/statements/functions on the server, and **70% coverage** on the client. If code modifications drop coverage below these thresholds, Jest exits with an error code, failing the CI build.

### Q17: How did you handle Zod input validation errors on the backend?
**A:** We validate client inputs using Zod schemas (`createProjectSchema`, `createTaskSchema`). If validation fails, we extract the structural errors and map them to standard validation messages. These errors are passed to our centralized error handler, returning a structured `400 Bad Request` payload:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "endDate", "message": "End date cannot be before start date" }]
}
```

### Q18: What is your database audit logging strategy and how is it fail-safe?
**A:** We created an `AuditService` that writes action entries (`PROJECT_CREATED`, `TASK_DELETED`) to the `AuditLog` table. To ensure business operations never crash if logging encounters an issue, the service wraps database writes in a `try/catch` block. If logging fails, the error is written to server logs, but the primary user request continues uninterrupted.

### Q19: Why is `Helmet` used in your Express application, and how did you configure it for Swagger?
**A:** `Helmet` secures Express applications by setting various HTTP headers (XSS filters, clickjacking blocks, strict transport security). By default, Helmet sets a Content Security Policy (CSP) that blocks inline scripts. Because Swagger UI relies on inline scripts to render interactive API docs, we modified Helmet to disable Content Security Policy blocks (`helmet({ contentSecurityPolicy: false })`) specifically to allow Swagger resources.

### Q20: What is the role of the centralized error handling middleware in Express?
**A:** Express route errors are caught in `try/catch` blocks and passed to `next(err)`. A dedicated error handler at the end of the middleware stack (`server/src/middlewares/errorHandler.ts`) catches these errors, formats them into a standard JSON envelope, sets the appropriate HTTP status code (e.g. 400, 401, 403, 404, 500), and logs detailed stack traces to files using Winston.

### Q21: What is Winston and how is it configured in this application?
**A:** `Winston` is a multi-transport logging library for Node.js. Unlike `console.log`, Winston writes logs with severity levels (`info`, `warn`, `error`) and structured timestamps. We configured Winston to write logs to both the standard terminal output (for container logs) and to files (`logs/error.log` and `logs/combined.log`) for persistent auditing.

### Q22: Why did you choose React Hook Form with Zod validation on Next.js client forms?
**A:** Standard React forms trigger full-component re-renders on every keystroke, which can slow down performance. `React Hook Form` uses uncontrolled inputs under the hood, dramatically increasing render efficiency. Integrating it with Zod allows us to use the same validation schema rules on the client as the backend, ensuring a consistent user experience.

### Q23: How do you handle unauthorized redirects on the Next.js client?
**A:** We wrap the application pages in a global `AuthContext` provider. It checks for a valid session. If a user is not authenticated and attempts to access protected routes (under `/dashboard`, `/projects`, `/tasks`), the context wrapper automatically redirects them to `/login` using the Next.js router.

### Q24: What checks does the CI/CD pipeline run to ensure code quality?
**A:** The GitHub Actions pipeline runs six sequential steps on pull requests:
1. Installs project dependencies.
2. Runs TypeScript type-safety compilation checks (`tsc --noEmit`).
3. Lints frontend files.
4. Performs database schema validations.
5. Runs Jest test suites (enforcing coverage thresholds).
6. Compiles production build artifacts.

### Q25: Why is the `type-check` script (`tsc --noEmit`) useful in a JavaScript/TypeScript project?
**A:** Compilers like Vite or Next.js sometimes skip deep type-checking in development to increase build speed. Running `tsc --noEmit` tells the TypeScript compiler to analyze the codebase for static type safety and syntax mismatches without exporting any compiled output files. Running this in the CI pipeline prevents runtime type errors.
