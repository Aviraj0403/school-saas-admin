'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogin } from '@/hooks/queries/useAuth';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Collapse sidebar on mobile by default
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          if (pathname !== '/dashboard') {
            router.replace('/dashboard');
          }
        },
      },
    );
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-slate-700">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <i className="pi pi-graduation-cap text-white text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School SaaS Admin</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {loginMutation.isError && (
              <Message
                severity="error"
                text={
                  (loginMutation.error as any)?.response?.data?.message ||
                  'Login failed. Please check your credentials.'
                }
                className="w-full"
              />
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="admin@school.com"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Password
                inputId="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full [&>input]:w-full"
                toggleMask
                feedback={false}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              loading={loginMutation.isPending}
              className="mt-2 w-full bg-indigo-600 border-indigo-600 hover:bg-indigo-700"
            />
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Demo Credentials</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">SuperAdmin: <span className="font-mono">superadmin@aviraj.com</span></p>
            <p className="text-xs text-gray-600 dark:text-gray-300">School Admin: <span className="font-mono">admin@demo.com</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <AppTopbar onToggleMenu={() => setSidebarOpen(!sidebarOpen)} />
      <AppSidebar isOpen={sidebarOpen} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[9] bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className="transition-all duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarOpen ? '256px' : '0' }}
      >
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
