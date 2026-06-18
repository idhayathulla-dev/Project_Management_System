export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectName: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  taskName: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    projectName: string;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
  completedProjects: number;
  notStartedProjects: number;
  highPriorityTasks: number;
  overdueTasks: number;
}

export interface ProjectStatusStats {
  notStarted: number;
  inProgress: number;
  completed: number;
}

export interface TaskStatusStats {
  pending: number;
  inProgress: number;
  completed: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedAPIResponse<T> {
  success: boolean;
  data: T;
  pagination: PaginationMeta;
}
