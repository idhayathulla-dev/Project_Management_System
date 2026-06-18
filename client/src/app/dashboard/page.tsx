'use client';

import React, { useEffect, useState } from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';
import api from '../../lib/api';
import { DashboardStats, ProjectStatusStats, TaskStatusStats } from '../../types';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertCircle,
  Play,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStatusStats | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStatusStats | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchDashboardData = async () => {
      try {
        const [statsRes, projectRes, taskRes] = await Promise.all([
          api.get('/api/stats'),
          api.get('/api/stats/project-status'),
          api.get('/api/stats/task-status'),
        ]);

        if (statsRes.data?.success) setStats(statsRes.data.data);
        if (projectRes.data) setProjectStats(projectRes.data);
        if (taskRes.data) setTaskStats(taskRes.data);
      } catch (err: any) {
        error(err.message || 'Failed to retrieve dashboard analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [error]);

  if (!isMounted) return null;

  // Chart data formatting
  const projectChartData = projectStats
    ? [
        { name: 'Not Started', value: projectStats.notStarted, color: '#94a3b8' }, // Slate 400
        { name: 'In Progress', value: projectStats.inProgress, color: '#6366f1' }, // Indigo 500
        { name: 'Completed', value: projectStats.completed, color: '#10b981' }, // Emerald 500
      ].filter(item => item.value > 0)
    : [];

  const taskChartData = taskStats
    ? [
        { name: 'Pending', count: taskStats.pending },
        { name: 'In Progress', count: taskStats.inProgress },
        { name: 'Completed', count: taskStats.completed },
      ]
    : [];

  return (
    <ProtectedLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time project statuses and task completion metrics.
          </p>
        </div>

        {/* Loading Skeletons vs Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-12 h-6" />
                <Skeleton className="w-24 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat Card 1 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Projects</span>
                <FolderKanban className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.totalProjects}</p>
            </div>

            {/* Stat Card 2 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Projects In Progress</span>
                <Play className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.projectsInProgress}</p>
            </div>

            {/* Stat Card 3 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Completed Projects</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.completedProjects}</p>
            </div>

            {/* Stat Card 4 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Not Started Projects</span>
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.notStartedProjects}</p>
            </div>

            {/* Stat Card 5 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Tasks</span>
                <CheckSquare className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.totalTasks}</p>
            </div>

            {/* Stat Card 6 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Completed Tasks</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.completedTasks}</p>
            </div>

            {/* Stat Card 7 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">High Priority Tasks</span>
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.highPriorityTasks}</p>
            </div>

            {/* Stat Card 8 */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Overdue Tasks</span>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.overdueTasks}</p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Chart */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Project Status Distribution</h3>
            {loading ? (
              <Skeleton className="w-full h-[300px] rounded-lg" />
            ) : projectChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
                No project status data to display
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {projectChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Task Chart */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Task Status Distribution</h3>
            {loading ? (
              <Skeleton className="w-full h-[300px] rounded-lg" />
            ) : taskChartData.every(item => item.count === 0) ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
                No task status data to display
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskChartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {taskChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 2 ? '#10b981' : index === 1 ? '#3b82f6' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
