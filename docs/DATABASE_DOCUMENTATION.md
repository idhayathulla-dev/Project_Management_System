# Database Documentation

This document describes the schema design, field descriptions, relationships, and index optimization strategy for the Project Management System's database.

## ER Diagram
The visual representation of this schema is located in the screenshots directory: [ER-Diagram.png](../screenshots/ER-Diagram.png).

---

## Schema Overview

The database uses PostgreSQL via the Prisma ORM. The relational structure consists of:
- **One User** can create **Many Projects**.
- **One Project** can contain **Many Tasks**.
- **One User** can have **Many Audit Logs** tracking their system actions.
- Cascade delete rules are configured so deleting a parent resource automatically removes associated child records (e.g. deleting a Project deletes its Tasks).

---

## Table Structure & Fields

### 1. Users (`User` Model)
Represents registered users in the application.

| Field Name | Type | Key / Attribute | Description |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key (`@id`) | Unique system identifier. |
| `fullName` | String | | The user's full name. |
| `email` | String | Unique (`@unique`) | The user's login email address. |
| `passwordHash` | String | | Bcrypt password hash. |
| `createdAt` | DateTime | `@default(now())` | Date and time the account was registered. |
| `updatedAt` | DateTime | `@updatedAt` | Date and time the account was last modified. |

* **Relationships**:
  - `projects`: One-to-many relation to `Project` table.
  - `auditLogs`: One-to-many relation to `AuditLog` table.
* **Indexes**:
  - `@@index([email])` for fast login and lookup queries.

---

### 2. Projects (`Project` Model)
Represents a project created by a user.

| Field Name | Type | Key / Attribute | Description |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key (`@id`) | Unique system identifier. |
| `projectName` | String | | The name of the project. |
| `description` | String? | Nullable | Brief text details of the project. |
| `status` | ProjectStatus | Enum | Status of the project: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`. |
| `startDate` | DateTime | | Estimated or actual start date. |
| `endDate` | DateTime | | Estimated or actual end date. |
| `userId` | String (UUID) | Foreign Key | Owner of this project. |
| `createdAt` | DateTime | `@default(now())` | Timestamp of creation. |
| `updatedAt` | DateTime | `@updatedAt` | Timestamp of last edit. |

* **Relationships**:
  - `user`: Many-to-one relation to `User` table. Cascade deletes: deleting a User will delete all their Projects.
  - `tasks`: One-to-many relation to `Task` table.
* **Indexes**:
  - `@@index([userId])` for scoped user project retrieval.
  - `@@index([status])` for dashboard stats and filtering.

---

### 3. Tasks (`Task` Model)
Represents standard tasks organized under projects.

| Field Name | Type | Key / Attribute | Description |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key (`@id`) | Unique system identifier. |
| `taskName` | String | | Name of the task. |
| `description` | String? | Nullable | Detail of the task to perform. |
| `priority` | TaskPriority | Enum | Priority levels: `LOW`, `MEDIUM`, `HIGH`. |
| `status` | TaskStatus | Enum | Task progress status: `PENDING`, `IN_PROGRESS`, `COMPLETED`. |
| `dueDate` | DateTime | | Task deadline. |
| `projectId` | String (UUID) | Foreign Key | The project this task belongs to. |
| `createdAt` | DateTime | `@default(now())` | Timestamp of creation. |
| `updatedAt` | DateTime | `@updatedAt` | Timestamp of last edit. |

* **Relationships**:
  - `project`: Many-to-one relation to `Project` table. Cascade deletes: deleting a Project will delete all its Tasks.
* **Indexes**:
  - `@@index([projectId])` to quickly fetch tasks under a specific project.
  - `@@index([status])` for filtering and dashboard status queries.
  - `@@index([priority])` for prioritization filtering.

---

### 4. Audit Logs (`AuditLog` Model)
Stores security and operational audit trails of user-triggered actions.

| Field Name | Type | Key / Attribute | Description |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key (`@id`) | Unique system identifier. |
| `action` | String | | Triggered action (e.g. `PROJECT_CREATED`, `TASK_DELETED`). |
| `details` | String | | Contextual details about the action. |
| `userId` | String (UUID) | Foreign Key | The user who triggered the action. |
| `createdAt` | DateTime | `@default(now())` | Timestamp of action. |

* **Relationships**:
  - `user`: Many-to-one relation to `User` table. Cascade deletes: deleting a User will delete all their audit logs.
* **Indexes**:
  - `@@index([userId])` to pull audit timelines for specific users.
  - `@@index([createdAt])` for chronologically sorting logs.

---

## Migration and Setup Instructions

To deploy this database schema, configure your database environment and run the following commands:

### Prerequisites
Create a `.env` file in the project root with your PostgreSQL URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
```

### Commands
1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Run Migrations (Development)**:
   ```bash
   npx prisma migrate dev --name init
   ```
   This will create a PostgreSQL migration, execute it on your database, and generate the client.

3. **Deploy Migrations (Production/CI)**:
   ```bash
   npx prisma migrate deploy
   ```
