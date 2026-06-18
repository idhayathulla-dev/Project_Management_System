import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

export const createProjectSchema = z
  .object({
    projectName: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, 'Project name cannot be empty'),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .nullable(),
    status: z
      .nativeEnum(ProjectStatus, {
        errorMap: () => ({ message: 'Invalid project status value' }),
      })
      .optional(),
    startDate: z.coerce.date({
      required_error: 'Start date is required',
      invalid_type_error: 'Invalid start date format',
    }),
    endDate: z.coerce.date({
      required_error: 'End date is required',
      invalid_type_error: 'Invalid end date format',
    }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });

export const updateProjectSchema = z
  .object({
    projectName: z
      .string()
      .trim()
      .min(1, 'Project name cannot be empty')
      .optional(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .nullable(),
    status: z
      .nativeEnum(ProjectStatus, {
        errorMap: () => ({ message: 'Invalid project status value' }),
      })
      .optional(),
    startDate: z.coerce.date({
      invalid_type_error: 'Invalid start date format',
    }).optional(),
    endDate: z.coerce.date({
      invalid_type_error: 'Invalid end date format',
    }).optional(),
  })
  .refine((data) => {
    // If both dates are updated, verify range
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  }, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });
