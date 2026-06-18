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

const editProjectSchema = z
  .object({
    projectName: z
      .string()
      .trim()
      .min(1, 'Project name is required')
      .max(100, 'Project name must be less than 100 characters'),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .nullable(),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });

type ProjectFormFields = z.infer<typeof editProjectSchema>;

export default function EditProject() {
  const router = useRouter();
  const { id } = useParams();
  const { success, error } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormFields>({
    resolver: zodResolver(editProjectSchema),
  });

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const res = await api.get(`/api/projects/${id}`);
        if (res.data?.success) {
          const project = res.data.data.project;
          
          // Re-format dates to YYYY-MM-DD for HTML input populating
          const startDateFormatted = new Date(project.startDate).toISOString().split('T')[0];
          const endDateFormatted = new Date(project.endDate).toISOString().split('T')[0];

          reset({
            projectName: project.projectName,
            description: project.description || '',
            status: project.status,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
          });
        }
      } catch (err: any) {
        error(err.message || 'Failed to retrieve project details');
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, reset, error, router]);

  const onSubmit = async (data: ProjectFormFields) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        projectName: data.projectName,
        description: data.description || null,
        status: data.status,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      await api.put(`/api/projects/${id}`, payload);
      success(`Project '${data.projectName}' updated successfully.`);
      router.push(`/projects/${id}`);
    } catch (err: any) {
      error(err.message || 'Failed to update project. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        {/* Back Link */}
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </Link>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Project</h1>
          <p className="text-sm text-slate-500 mt-1">Modify configuration parameters for your project.</p>
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
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  {...register('projectName')}
                  placeholder="e.g. Website Re-design"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                    errors.projectName
                      ? 'border-rose-350 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
                {errors.projectName && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.projectName.message}</p>
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
                  placeholder="Brief summary of the goals, milestones, or instructions..."
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
                    Project Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      errors.startDate
                        ? 'border-rose-355 focus:border-rose-500'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.startDate.message}</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      errors.endDate
                        ? 'border-rose-355 focus:border-rose-500'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-2">
                <Link
                  href={`/projects/${id}`}
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
