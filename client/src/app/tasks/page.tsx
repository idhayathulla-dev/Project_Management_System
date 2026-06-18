'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedLayout from '../../components/ProtectedLayout';
import api from '../../lib/api';
import { Task, TaskStatus, TaskPriority, PaginationMeta } from '../../types';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';
import Dialog from '../../components/ui/Dialog';
import {
  Search,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
} from 'lucide-react';

export default function Tasks() {
  const { success, error } = useToast();
  
  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Queries
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Deletion Modals State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const statusParam = status !== 'ALL' ? `&status=${status}` : '';
      const priorityParam = priority !== 'ALL' ? `&priority=${priority}` : '';
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      
      const res = await api.get(
        `/api/tasks?page=${page}&limit=${limit}${statusParam}${priorityParam}${searchParam}&sortBy=${sortBy}&order=${order}`
      );
      if (res.data?.success) {
        setTasks(res.data.data.tasks);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, debouncedSearch, status, priority, sortBy, order]);

  // Handle Task Deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/tasks/${taskToDelete.id}`);
      success(`Task '${taskToDelete.taskName}' deleted successfully.`);
      setIsDeleteOpen(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err: any) {
      error(err.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteOpen(true);
  };

  // Toggle completion
  const toggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/api/tasks/${task.id}`, { status: newStatus });
      success(`Task marked as ${newStatus.replace('_', ' ').toLowerCase()}.`);
      fetchTasks();
    } catch (err: any) {
      error(err.message || 'Failed to toggle status');
    }
  };

  // Styling helpers
  const getPriorityColor = (val: TaskPriority) => {
    switch (val) {
      case 'HIGH':
        return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-450';
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
      <div className="space-y-6 animate-fade-in">
        {/* Header Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Tasks</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track and update deliverables across your active projects.</p>
          </div>
          <Link
            href="/tasks/create"
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-sm bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            {/* Status */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Priority */}
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            {/* SortBy */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="createdAt">Date Created</option>
              <option value="dueDate">Due Date</option>
              <option value="taskName">Task Name</option>
              <option value="priority">Priority</option>
            </select>

            {/* Order */}
            <button
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-sm font-medium border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors bg-white cursor-pointer"
            >
              {order === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
            </button>
          </div>
        </div>

        {/* Task Cards List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 w-2/3">
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="w-1/2 h-5" />
                    <Skeleton className="w-1/3 h-3.5" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-16 h-6 rounded-full" />
                  <Skeleton className="w-20 h-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm text-center px-6">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
              <ListTodo className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">No tasks found</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              Refine your filters, or add a task under one of your project dashboards.
            </p>
            <Link
              href="/tasks/create"
              className="mt-5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              Create Task
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors"
              >
                {/* Left side: Toggle button + Task Title + Project context */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className="text-slate-450 hover:text-indigo-600 transition-colors shrink-0 mt-1 sm:mt-0 cursor-pointer"
                  >
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <h3
                      className={`text-sm font-semibold text-slate-800 truncate ${
                        task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {task.taskName}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-450 font-medium">
                      <span className="text-indigo-650 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-semibold text-[10px] uppercase truncate max-w-[150px]">
                        {task.project?.projectName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Badges and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border-blue-150'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex gap-0.5">
                    <Link
                      href={`/tasks/${task.id}/edit`}
                      title="Edit Task"
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-amber-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openDeleteModal(task)}
                      title="Delete Task"
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 mt-6">
            <span className="text-xs text-slate-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Task Delete Dialog */}
        <Dialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteTask}
          title="Delete Task?"
          description={`Are you sure you want to delete '${taskToDelete?.taskName}'? This action cannot be undone.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Task'}
          isDestructive={true}
        />
      </div>
    </ProtectedLayout>
  );
}
