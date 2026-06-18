'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '../../components/ProtectedLayout';
import api from '../../lib/api';
import { Project, ProjectStatus, PaginationMeta } from '../../types';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';
import Dialog from '../../components/ui/Dialog';
import {
  Search,
  Plus,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

export default function Projects() {
  const router = useRouter();
  const { success, error } = useToast();
  
  // State variables
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Query parameters
  const [page, setPage] = useState(1);
  const [limit] = useState(6); // 6 projects per page is great for a 3-column grid
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Deletion modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debouncing search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const statusParam = status !== 'ALL' ? `&status=${status}` : '';
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      
      const res = await api.get(
        `/api/projects?page=${page}&limit=${limit}${statusParam}${searchParam}&sortBy=${sortBy}&order=${order}`
      );

      if (res.data?.success) {
        setProjects(res.data.data.projects);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, debouncedSearch, status, sortBy, order]);

  // Handle Project Delete
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/projects/${projectToDelete.id}`);
      success(`Project '${projectToDelete.projectName}' deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      // Reload current list (re-fetch or filter locally)
      fetchProjects();
    } catch (err: any) {
      error(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (val: ProjectStatus) => {
    switch (val) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-755 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
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
      <div className="space-y-6">
        {/* Header Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Projects</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and organize all your project timelines.</p>
          </div>
          <Link
            href="/projects/create"
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        </div>

        {/* Filters and Search toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-sm bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Status */}
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* SortBy selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="createdAt">Date Created</option>
              <option value="projectName">Project Name</option>
              <option value="startDate">Start Date</option>
              <option value="endDate">End Date</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-sm font-medium border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors bg-white cursor-pointer"
            >
              {order === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
            </button>
          </div>
        </div>

        {/* Project List / Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
                <Skeleton className="w-24 h-5 rounded-full" />
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-1/2 h-4" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="w-12 h-8 rounded" />
                  <Skeleton className="w-12 h-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm text-center px-6">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">No projects found</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              Try refining your query, or build a new project timeline to get started.
            </p>
            <Link
              href="/projects/create"
              className="mt-5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-slate-200 hover:border-slate-350 rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                    
                    {/* Project dropdown actions */}
                    <div className="flex gap-1">
                      <Link
                        href={`/projects/${project.id}`}
                        title="View Details"
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/projects/${project.id}/edit`}
                        title="Edit Project"
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-amber-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openDeleteModal(project)}
                        title="Delete Project"
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Link href={`/projects/${project.id}`}>
                    <h3 className="text-base font-bold text-slate-800 mt-4 hover:text-indigo-600 transition-colors truncate">
                      {project.projectName}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 h-10">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between text-xs text-slate-450 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                  <span>to</span>
                  <span>{formatDate(project.endDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
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

        {/* Delete Confirmation Modal */}
        <Dialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Project?"
          description={`Are you sure you want to delete '${projectToDelete?.projectName}'? This will permanently delete the project and all tasks belonging to it. This action cannot be undone.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Project'}
          isDestructive={true}
        />
      </div>
    </ProtectedLayout>
  );
}
