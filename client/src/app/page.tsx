'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FolderKanban, CheckSquare, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <span className="font-semibold text-lg">PM System</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
          Modern project management <br />
          <span className="text-indigo-600">tailored for tech teams</span>
        </h1>
        <p className="mt-6 text-lg text-slate-500 max-w-2xl">
          Organize projects, schedule tasks, track team velocity, and review visual metrics inside a minimal, enterprise-grade workspace.
        </p>
        
        <div className="mt-10 flex gap-4">
          <Link
            href={user ? '/dashboard' : '/register'}
            className="px-6 py-3 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer group"
          >
            {user ? 'Open Workspace' : 'Create Free Account'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-5xl text-left">
          <div className="p-6 bg-white border border-slate-200/50 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">Projects CRUD</h3>
            <p className="text-sm text-slate-500 mt-2">Create, modify, and delete projects with full timeline details.</p>
          </div>

          <div className="p-6 bg-white border border-slate-200/50 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">Task Boards</h3>
            <p className="text-sm text-slate-500 mt-2">Manage tasks within projects, setting status, deadlines, and priorities.</p>
          </div>

          <div className="p-6 bg-white border border-slate-200/50 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">Visual Analytics</h3>
            <p className="text-sm text-slate-500 mt-2">Review status distributions and completions via beautiful Recharts.</p>
          </div>

          <div className="p-6 bg-white border border-slate-200/50 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">HTTP-only JWT</h3>
            <p className="text-sm text-slate-500 mt-2">Highly secure authentication cookies, rate-limiters, and Helmet guards.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-200/60 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Project Management System. All rights reserved.
      </footer>
    </div>
  );
}
