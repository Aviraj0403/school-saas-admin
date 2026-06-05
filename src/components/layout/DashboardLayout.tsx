'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogin } from '@/hooks/queries/useAuth';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';

let globalMounted = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(globalMounted);
  const toastRef = useRef<Toast>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    globalMounted = true;
    setMounted(true);
    // Collapse sidebar on mobile by default
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }

      const handleShowToast = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (toastRef.current && customEvent.detail) {
          toastRef.current.show({
            severity: customEvent.detail.severity || 'info',
            summary: customEvent.detail.summary || 'Notification',
            detail: customEvent.detail.detail || '',
            life: customEvent.detail.life || 4000,
            content: (props) => (
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2">
                  <i className={`pi ${
                    customEvent.detail.severity === 'success' ? 'pi-check-circle text-emerald-500' :
                    customEvent.detail.severity === 'error' ? 'pi-times-circle text-rose-500' :
                    customEvent.detail.severity === 'warn' ? 'pi-exclamation-triangle text-amber-500' :
                    'pi-info-circle text-indigo-500'
                  } text-lg`}></i>
                  <span className="font-bold text-sm text-slate-800 dark:text-white">{props.message.summary}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 pl-7">{props.message.detail}</div>
              </div>
            )
          });
        }
      };

      window.addEventListener('show-toast', handleShowToast);
      return () => {
        window.removeEventListener('show-toast', handleShowToast);
      };
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans">
        
        {/* Responsive Flex Container */}
        <div className="w-full max-w-md flex flex-col items-center">
          
          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
              <i className="pi pi-box text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              School CRM
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Minimal Login Card */}
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-8">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {loginMutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg flex items-center gap-2 text-sm">
                  <i className="pi pi-exclamation-circle"></i>
                  <span>
                    {(loginMutation.error as any)?.response?.data?.message ||
                      'Invalid credentials. Please try again.'}
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <InputText
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900 dark:text-white text-sm rounded-lg"
                  placeholder="admin@school.com"
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2.5 pr-10 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900 dark:text-white text-sm rounded-lg outline-none"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} text-sm`}></i>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                label="Sign In"
                loading={loginMutation.isPending}
                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-2.5 rounded-lg border-0 transition-colors"
              />
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>Demo Accounts:</p>
            <div className="mt-2 flex gap-4 justify-center">
              <span>Admin: <b>admin@demo.com</b></span>
              <span>SuperAdmin: <b>superadmin@aviraj.com</b></span>
            </div>
            <p className="mt-1 text-xs">Password: 123456</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden">
      <Toast ref={toastRef} position="top-right" />
      <AppTopbar onToggleMenu={() => setSidebarOpen(!sidebarOpen)} />
      <AppSidebar isOpen={sidebarOpen} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`transition-all duration-200 ease-in-out pt-16 ${sidebarOpen ? 'md:ml-[240px]' : 'ml-0'} w-full md:w-auto min-h-screen`}
      >
        <main className="p-6 lg:p-10 min-h-[calc(100vh-64px)] w-full max-w-[1600px] mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
