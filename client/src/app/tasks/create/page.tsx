'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedLayout from '../../../components/ProtectedLayout';
import api from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { Project } from '../../../types';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Skeleton from '../../../components/ui/Skeleton';

const createTaskSchema = z.object({
  taskName: z
    .string()
    .trim()
    .min(1, 'Task name is required')
    .max(100, 'Task name must be less than 100 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.string().min(1, 'Due date is required'),
  projectId: z.string().uuid('Please select a valid project'),
});

type TaskFormFields = z.infer<typeof createTaskSchema>;

function TaskCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  
  const queryProjectId = searchParams.get('projectId') || '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TaskFormFields>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      taskName: '',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '',
      projectId: queryProjectId,
    },
  });

  // Load projects owned by user to populate the selector dropdown
  useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        const res = await api.get('/api/projects?limit=100');
        if (res.data?.success) {
          setProjects(res.data.data.projects);
          
          // If query project matches one of user's, pre-select it
          if (queryProjectId) {
            const hasProject = res.data.data.projects.some((p: Project) => p.id === queryProjectId);
            if (hasProject) {
              setValue('projectId', queryProjectId);
            }
          }
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch your projects');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchUserProjects();
  }, [queryProjectId, setValue, error]);

  const onSubmit = async (data: TaskFormFields) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        taskName: data.taskName,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        dueDate: new Date(data.dueDate).toISOString(),
        projectId: data.projectId,
      };

      await api.post('/api/tasks', payload);
      success(`Task '${data.taskName}' added successfully.`);
      
      // Smart redirect: if they came from project view, go back there
      if (queryProjectId) {
        router.push(`/projects/${queryProjectId}`);
      } else {
        router.push('/tasks');
      }
    } catch (err: any) {
      error(err.message || 'Failed to create task. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backLink = queryProjectId ? `/projects/${queryProjectId}` : '/tasks';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        href={backLink}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create New Task</h1>
        <p className="text-sm text-slate-500 mt-1">Add a new deliverable item under a project.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Associated Project */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Parent Project
            </label>
            {loadingProjects ? (
              <Skeleton className="w-full h-10" />
            ) : (
              <select
                {...register('projectId')}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  errors.projectId ? 'border-rose-350 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              >
                <option value="">-- Select a project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            )}
            {errors.projectId && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.projectId.message}</p>
            )}
          </div>

          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Task Name
            </label>
            <input
              type="text"
              {...register('taskName')}
              placeholder="e.g. Set up Postgres migration config"
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                errors.taskName
                  ? 'border-rose-350 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {errors.taskName && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.taskName.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Detail out tasks checklist, instructions, or sub-deliverables..."
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                errors.description
                  ? 'border-rose-350 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  errors.dueDate ? 'border-rose-355 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {errors.dueDate && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-2">
            <Link
              href={backLink}
              className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-100 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateTask() {
  return (
    <ProtectedLayout>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }>
        <TaskCreateForm />
      </Suspense>
    </ProtectedLayout>
  );
}
