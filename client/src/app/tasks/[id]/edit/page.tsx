'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedLayout from '../../../../components/ProtectedLayout';
import api from '../../../../lib/api';
import { useToast } from '../../../../components/ui/Toast';
import Skeleton from '../../../../components/ui/Skeleton';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const editTaskSchema = z.object({
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
});

type TaskFormFields = z.infer<typeof editTaskSchema>;

export default function EditTask() {
  const router = useRouter();
  const { id } = useParams();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentProjectId, setParentProjectId] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormFields>({
    resolver: zodResolver(editTaskSchema),
  });

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const res = await api.get(`/api/tasks/${id}`);
        if (res.data?.success) {
          const task = res.data.data.task;
          
          setParentProjectId(task.projectId);

          // Re-format ISO string to YYYY-MM-DD for date input
          const dueDateFormatted = new Date(task.dueDate).toISOString().split('T')[0];

          reset({
            taskName: task.taskName,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            dueDate: dueDateFormatted,
          });
        }
      } catch (err: any) {
        error(err.message || 'Failed to retrieve task details');
        router.push('/tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id, reset, error, router]);

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
      };

      await api.put(`/api/tasks/${id}`, payload);
      success(`Task '${data.taskName}' updated successfully.`);
      
      // Smart redirect: go back to parent project view if available, otherwise global tasks
      if (parentProjectId) {
        router.push(`/projects/${parentProjectId}`);
      } else {
        router.push('/tasks');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update task. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backLink = parentProjectId ? `/projects/${parentProjectId}` : '/tasks';

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Task</h1>
          <p className="text-sm text-slate-500 mt-1">Modify deliverables or statuses for this task.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {loading ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-full h-24" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
