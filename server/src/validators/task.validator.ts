import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  taskName: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(1, 'Task name cannot be empty'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  priority: z
    .nativeEnum(TaskPriority, {
      errorMap: () => ({ message: 'Invalid task priority value' }),
    })
    .optional(),
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Invalid task status value' }),
    })
    .optional(),
  dueDate: z.coerce.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Invalid due date format',
  }),
  projectId: z
    .string({ required_error: 'Project ID is required' })
    .uuid('Invalid Project ID format'),
});

export const updateTaskSchema = z.object({
  taskName: z
    .string()
    .trim()
    .min(1, 'Task name cannot be empty')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  priority: z
    .nativeEnum(TaskPriority, {
      errorMap: () => ({ message: 'Invalid task priority value' }),
    })
    .optional(),
  status: z
    .nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Invalid task status value' }),
    })
    .optional(),
  dueDate: z.coerce.date({
    invalid_type_error: 'Invalid due date format',
  }).optional(),
});
