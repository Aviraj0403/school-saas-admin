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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden">
        
        {/* Soft glowing ambient backgrounds for Premium Elite feel */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-md">
          {/* Main Login Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] shadow-xl dark:shadow-2xl flex flex-col p-8 sm:p-10 transition-all duration-300">
            
            {/* Branding Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 ring-1 ring-indigo-600/20">
                <i className="pi pi-graduation-cap text-3xl"></i>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white text-center">
                School SaaS
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium text-center">
                Sign in to your administration panel
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {loginMutation.isError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex gap-3 items-center text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <i className="pi pi-exclamation-circle text-base"></i>
                  <span>
                    {(loginMutation.error as any)?.response?.data?.message ||
                      'Login failed. Please check your credentials.'}
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative flex items-center group w-full">
                  <i className="pi pi-envelope absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200 z-10 pointer-events-none"></i>
                  <InputText
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full py-3.5 pr-3.5 pl-11 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white text-sm placeholder-slate-400 rounded-xl shadow-sm z-0"
                    placeholder="admin@school.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative flex items-center group w-full">
                  <i className="pi pi-lock absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200 z-10 pointer-events-none"></i>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full py-3.5 pl-11 pr-12 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white text-sm placeholder-slate-400 rounded-xl shadow-sm outline-none z-0"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-200 z-10 focus:outline-none flex items-center justify-center"
                  >
                    <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} text-sm`}></i>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold p-3.5 rounded-xl border-0 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ opacity: loginMutation.isPending ? 0.7 : 1 }}
              >
                {loginMutation.isPending ? <i className="pi pi-spinner pi-spin"></i> : <i className="pi pi-sign-in"></i>}
                Sign In securely
              </button>
            </form>
          </div>

          {/* Minimalist Demo Information */}
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <i className="pi pi-info-circle"></i>
              <span>Demo Credentials</span>
            </div>
            <div className="flex justify-center gap-4 text-[11px] font-mono text-slate-400 dark:text-slate-500">
              <span className="bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">superadmin@aviraj.com</span>
              <span className="bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">admin@demo.com</span>
            </div>
            <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Password for all: <span className="font-bold font-mono">123456</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Removed unnecessary NeuralNetworkCanvas

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden">
      <Toast ref={toastRef} position="top-right" />
      <AppTopbar onToggleMenu={() => setSidebarOpen(!sidebarOpen)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          id="mobile-overlay-close"
          className="fixed top-16 inset-x-0 bottom-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`transition-all duration-300 ease-in-out pt-16 ${sidebarOpen ? 'md:pl-[240px]' : 'pl-0'} w-full min-h-screen`}
      >
        <main className="p-4 sm:p-6 min-h-[calc(100vh-64px)] w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
