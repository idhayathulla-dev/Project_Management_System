'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Loader2, KeyRound, Mail } from 'lucide-react';

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address format'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginFields = z.infer<typeof loginFormSchema>;

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFields) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      success('Welcome back! Login successful.');
    } catch (err: any) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            P
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">Sign in to Workspace</h2>
          <p className="text-sm text-slate-500">Welcome back! Please enter your details.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label 
              htmlFor="email"
              className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  errors.email
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label 
              htmlFor="password"
              className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  errors.password
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Register for free
          </Link>
        </p>
      </div>
    </div>
  );
}
