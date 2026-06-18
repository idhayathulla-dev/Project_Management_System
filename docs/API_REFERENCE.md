# API Reference Guide

This document outlines the API resources, request/response models, query properties, and security scopes of the Project Management System.

All requests should carry JSON bodies where appropriate. Authentication is verified using the HTTP-only cookie named `token`.

---

## 1. Authentication Endpoints (`/api/auth`)

### Register User
* **Method & Path**: `POST /api/auth/register`
* **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid-1234",
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "createdAt": "2026-06-18T12:00:00.000Z",
        "updatedAt": "2026-06-18T12:00:00.000Z"
      }
    }
  }
  ```
* **Sets Cookie**: `token=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Lax`

---

### Login User
* **Method & Path**: `POST /api/auth/login`
* **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid-1234",
        "fullName": "Jane Doe",
        "email": "jane@example.com"
      }
    }
  }
  ```
* **Sets Cookie**: `token=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Lax`

---

### Logout User
* **Method & Path**: `POST /api/auth/logout`
* **Request Body**: None
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
* **Clears Cookie**: Overwrites `token` to empty with past expiration.

---

### Fetch Active Session
* **Method & Path**: `GET /api/auth/me`
* **Request Body**: None (requires valid `token` cookie)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid-1234",
        "fullName": "Jane Doe",
        "email": "jane@example.com"
      }
    }
  }
  ```

---

## 2. Project Endpoints (`/api/projects`)

### List Projects
* **Method & Path**: `GET /api/projects`
* **Query Parameters**:
  - `page` (number, default `1`)
  - `limit` (number, default `10`)
  - `search` (string, filters by partial match on project name)
  - `status` (enum: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
  - `sortBy` (field: `createdAt`, `projectName`, `startDate`, `endDate`)
  - `order` (`asc` or `desc`, default `desc`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "projects": [
        {
          "id": "project-uuid-5678",
          "projectName": "Alpha Project",
          "description": "Enterprise API migration",
          "status": "IN_PROGRESS",
          "startDate": "2026-06-01T00:00:00.000Z",
          "endDate": "2026-06-30T00:00:00.000Z",
          "userId": "user-uuid-1234",
          "createdAt": "2026-06-01T10:00:00.000Z"
        }
      ]
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### Create Project
* **Method & Path**: `POST /api/projects`
* **Request Body**:
  ```json
  {
    "projectName": "New Website",
    "description": "Marketing website rewrite",
    "status": "NOT_STARTED",
    "startDate": "2026-07-01",
    "endDate": "2026-07-15"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "project": {
        "id": "project-uuid-9999",
        "projectName": "New Website",
        "description": "Marketing website rewrite",
        "status": "NOT_STARTED",
        "startDate": "2026-07-01T00:00:00.000Z",
        "endDate": "2026-07-15T00:00:00.000Z",
        "userId": "user-uuid-1234"
      }
    }
  }
  ```

---

### Get Single Project
* **Method & Path**: `GET /api/projects/:id`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "project": {
        "id": "project-uuid-5678",
        "projectName": "Alpha Project",
        "description": "Enterprise API migration",
        "status": "IN_PROGRESS",
        "startDate": "2026-06-01T00:00:00.000Z",
        "endDate": "2026-06-30T00:00:00.000Z",
        "userId": "user-uuid-1234"
      }
    }
  }
  ```

---

### Update Project
* **Method & Path**: `PUT /api/projects/:id`
* **Request Body**: Any editable field (`projectName`, `description`, `status`, `startDate`, `endDate`).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "project": {
        "id": "project-uuid-5678",
        "projectName": "Alpha Project Updated",
        "status": "COMPLETED"
      }
    }
  }
  ```

---

### Delete Project
* **Method & Path**: `DELETE /api/projects/:id`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Project deleted successfully"
  }
  ```

---

## 3. Task Endpoints (`/api/tasks`)

### List Tasks
* **Method & Path**: `GET /api/tasks`
* **Query Parameters**:
  - `page`, `limit` (default `1`, `10`)
  - `search` (partial match on task name)
  - `status` (enum: `PENDING`, `IN_PROGRESS`, `COMPLETED`)
  - `priority` (enum: `LOW`, `MEDIUM`, `HIGH`)
  - `sortBy` (field: `dueDate`, `createdAt`, `priority`)
  - `order` (`asc` or `desc`, default `desc`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "tasks": [
        {
          "id": "task-uuid-8888",
          "taskName": "Setup Database Schema",
          "description": "Sketch model indexes",
          "priority": "HIGH",
          "status": "PENDING",
          "dueDate": "2026-06-25T00:00:00.000Z",
          "projectId": "project-uuid-5678",
          "project": {
            "projectName": "Alpha Project"
          }
        }
      ]
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### Create Task
* **Method & Path**: `POST /api/tasks`
* **Request Body**:
  ```json
  {
    "taskName": "Write API Docs",
    "description": "Detailed description of all endpoints",
    "priority": "MEDIUM",
    "status": "PENDING",
    "dueDate": "2026-06-30",
    "projectId": "project-uuid-5678"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "task": {
        "id": "task-uuid-2222",
        "taskName": "Write API Docs",
        "priority": "MEDIUM",
        "status": "PENDING",
        "projectId": "project-uuid-5678"
      }
    }
  }
  ```

---

### Get Single Task
* **Method & Path**: `GET /api/tasks/:id`
* **Success Response (200 OK)**: Same structure as Task list items.

---

### Update Task
* **Method & Path**: `PUT /api/tasks/:id`
* **Request Body**: Any editable field (`taskName`, `description`, `priority`, `status`, `dueDate`).
* **Success Response (200 OK)**: Returns success and the updated task resource.

---

### Delete Task
* **Method & Path**: `DELETE /api/tasks/:id`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task deleted successfully"
  }
  ```

---

## 4. Stats Endpoints (`/api/stats`)

### Fetch Summary Metrics
* **Method & Path**: `GET /api/stats`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalProjects": 10,
      "totalTasks": 45,
      "completedTasks": 30,
      "pendingTasks": 15,
      "projectsInProgress": 4,
      "completedProjects": 3,
      "notStartedProjects": 3,
      "highPriorityTasks": 7,
      "overdueTasks": 2
    }
  }
  ```

---

### Fetch Project Status Breakdown
* **Method & Path**: `GET /api/stats/project-status`
* **Success Response (200 OK)**:
  ```json
  {
    "notStarted": 3,
    "inProgress": 4,
    "completed": 3
  }
  ```

---

### Fetch Task Status Breakdown
* **Method & Path**: `GET /api/stats/task-status`
* **Success Response (200 OK)**:
  ```json
  {
    "pending": 15,
    "inProgress": 10,
    "completed": 20
  }
  ```

---

## 5. System Health Check (`/health`)

### Service Health Status
* **Method & Path**: `GET /health`
* **Success Response (200 OK - Healthy)**:
  ```json
  {
    "status": "UP",
    "services": {
      "server": "UP",
      "database": "UP"
    }
  }
  ```
* **Failure Response (500 Internal Server Error - Unhealthy)**:
  ```json
  {
    "status": "DOWN",
    "services": {
      "server": "UP",
      "database": "DOWN"
    },
    "error": "Connection failure error details"
  }
  ```
