'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedLayout from '../../../components/ProtectedLayout';
import api from '../../../lib/api';
import { Project, Task, ProjectStatus, TaskStatus, TaskPriority } from '../../../types';
import { useToast } from '../../../components/ui/Toast';
import Skeleton from '../../../components/ui/Skeleton';
import Dialog from '../../../components/ui/Dialog';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Menu,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = useParams();
  const { success, error } = useToast();

  // Project & Task States
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Task queries
  const [taskSearch, setTaskSearch] = useState('');
  const [debouncedTaskSearch, setDebouncedTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('ALL');
  const [taskPriority, setTaskPriority] = useState('ALL');

  // Deletion Modals State
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Debouncing task search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTaskSearch(taskSearch);
    }, 350);
    return () => clearTimeout(handler);
  }, [taskSearch]);

  const fetchProjectDetails = async () => {
    setLoadingProject(true);
    try {
      const res = await api.get(`/api/projects/${id}`);
      if (res.data?.success) {
        setProject(res.data.data.project);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch project details');
      router.push('/projects');
    } finally {
      setLoadingProject(false);
    }
  };

  const fetchProjectTasks = async () => {
    setLoadingTasks(true);
    try {
      const statusParam = taskStatus !== 'ALL' ? `&status=${taskStatus}` : '';
      const priorityParam = taskPriority !== 'ALL' ? `&priority=${taskPriority}` : '';
      const searchParam = debouncedTaskSearch ? `&search=${encodeURIComponent(debouncedTaskSearch)}` : '';
      
      const res = await api.get(
        `/api/tasks?projectId=${id}${statusParam}${priorityParam}${searchParam}&limit=100` // Pull up to 100 tasks under details
      );
      if (res.data?.success) {
        setTasks(res.data.data.tasks);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch project tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  useEffect(() => {
    fetchProjectTasks();
  }, [id, debouncedTaskSearch, taskStatus, taskPriority]);

  // Project Deletion
  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await api.delete(`/api/projects/${id}`);
      success(`Project '${project?.projectName}' deleted successfully.`);
      router.push('/projects');
    } catch (err: any) {
      error(err.message || 'Failed to delete project');
    } finally {
      setIsDeletingProject(false);
      setIsDeleteProjectOpen(false);
    }
  };

  // Task Deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await api.delete(`/api/tasks/${taskToDelete.id}`);
      success(`Task '${taskToDelete.taskName}' deleted successfully.`);
      setIsDeleteTaskOpen(false);
      setTaskToDelete(null);
      fetchProjectTasks();
    } catch (err: any) {
      error(err.message || 'Failed to delete task');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const openDeleteTaskModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteTaskOpen(true);
  };

  // Quick Task Status Toggle
  const toggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/api/tasks/${task.id}`, { status: newStatus });
      success(`Task marked as ${newStatus.replace('_', ' ').toLowerCase()}.`);
      fetchProjectTasks();
    } catch (err: any) {
      error(err.message || 'Failed to update task status');
    }
  };

  // Get Styling utilities
  const getStatusColor = (val: ProjectStatus) => {
    switch (val) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-600 border-indigo-250 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getPriorityColor = (val: TaskPriority) => {
    switch (val) {
      case 'HIGH':
        return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-850 dark:text-slate-450';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ProtectedLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Back navigation */}
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Project info card */}
        {loadingProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
            <Skeleton className="w-24 h-5 rounded-full" />
            <Skeleton className="w-1/2 h-8" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-1/3 h-4" />
          </div>
        ) : (
          project && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {project.projectName}
                </h1>

                <p className="text-sm text-slate-500 max-w-3xl whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col justify-end gap-3 shrink-0 self-start md:self-auto w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-1 md:flex-none"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Project
                </Link>
                <button
                  onClick={() => setIsDeleteProjectOpen(true)}
                  className="px-4 py-2 text-sm font-semibold text-rose-650 hover:bg-rose-50/50 border border-rose-100 hover:border-rose-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-1 md:flex-none"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            </div>
          )
        )}

        {/* Task Board Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Project Tasks</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage deliverables specific to this project.</p>
            </div>
            <Link
              href={`/tasks/create?projectId=${id}`}
              className="px-3.5 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Link>
          </div>

          {/* Task Filters Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-xs bg-slate-50 focus:bg-white transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Tasks Listing Skeletons vs Data */}
          {loadingTasks ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 w-1/2">
                    <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                    <div className="space-y-1.5 w-full">
                      <Skeleton className="w-3/4 h-5" />
                      <Skeleton className="w-1/2 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-20 h-5 rounded-full" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-400">
              No tasks found. Click "Add Task" to create your first workflow check.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Left Side: Checkbox + Name + Date */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="text-slate-400 hover:text-indigo-650 transition-colors shrink-0 cursor-pointer"
                    >
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="overflow-hidden">
                      <h4
                        className={`text-sm font-semibold text-slate-800 truncate ${
                          task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.taskName}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Badges + Action Dropdowns */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border-blue-150'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>

                    {/* Actions */}
                    <div className="flex gap-0.5">
                      <Link
                        href={`/tasks/${task.id}/edit`}
                        title="Edit Task"
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-600 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openDeleteTaskModal(task)}
                        title="Delete Task"
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-650 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Delete Modal */}
        <Dialog
          isOpen={isDeleteProjectOpen}
          onClose={() => setIsDeleteProjectOpen(false)}
          onConfirm={handleDeleteProject}
          title="Delete Project?"
          description={`Are you sure you want to delete '${project?.projectName}'? All tasks under this project will be permanently removed. This action cannot be undone.`}
          confirmLabel={isDeletingProject ? 'Deleting...' : 'Delete'}
          isDestructive={true}
        />

        {/* Task Delete Modal */}
        <Dialog
          isOpen={isDeleteTaskOpen}
          onClose={() => setIsDeleteTaskOpen(false)}
          onConfirm={handleDeleteTask}
          title="Delete Task?"
          description={`Are you sure you want to delete '${taskToDelete?.taskName}'? This action cannot be undone.`}
          confirmLabel={isDeletingTask ? 'Deleting...' : 'Delete'}
          isDestructive={true}
        />
      </div>
    </ProtectedLayout>
  );
}
