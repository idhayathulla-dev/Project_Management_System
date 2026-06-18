'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (pathname.startsWith('/projects/create')) return 'New Project';
    if (pathname.includes('/edit') && pathname.includes('/projects/')) return 'Edit Project';
    if (pathname.includes('/projects/')) return 'Project Details';
    if (pathname.startsWith('/projects')) return 'Projects Dashboard';
    if (pathname.startsWith('/tasks/create')) return 'New Task';
    if (pathname.includes('/edit') && pathname.includes('/tasks/')) return 'Edit Task';
    if (pathname.startsWith('/tasks')) return 'Tasks List';
    if (pathname.startsWith('/profile')) return 'User Profile';
    return 'Project Manager';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/75 backdrop-blur-md sticky top-0 flex items-center justify-between px-6 z-30 shrink-0">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{getPageTitle()}</h2>
      <div className="flex items-center gap-4">
        {/* Notifications Icon (SaaS Aesthetic) */}
        <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 relative p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
        </button>
        
        {user && (
          <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0">
              {getInitials(user.fullName)}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-350 hidden sm:inline">
              {user.fullName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
