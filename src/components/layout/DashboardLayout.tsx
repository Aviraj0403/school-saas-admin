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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Soft Luminous Backdrop Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/0 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-violet-500/20 to-pink-500/0 blur-[120px] pointer-events-none animate-pulse duration-[10000ms]"></div>
        
        {/* Sleek Glassmorphic Form Card */}
        <div className="relative z-10 backdrop-blur-xl bg-slate-900/60 dark:bg-slate-900/40 border border-slate-800/80 rounded-3xl shadow-2xl max-w-md w-full p-8 md:p-10 flex flex-col gap-6">
          
          {/* Glowing Premium Logo & Branding */}
          <div className="flex flex-col items-center mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 border border-indigo-400/20 animate-bounce duration-[3000ms]">
              <i className="pi pi-graduation-cap text-white text-3xl"></i>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              School SaaS Admin
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5 font-medium tracking-wide">
              Sign in to manage your school ecosystem
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {loginMutation.isError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-center text-rose-400 text-xs font-semibold">
                <i className="pi pi-exclamation-circle text-base"></i>
                <span>
                  {(loginMutation.error as any)?.response?.data?.message ||
                    'Login failed. Please check your credentials.'}
                </span>
              </div>
            )}

            {/* Email Field with Left Icon */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <div className="relative flex items-center group">
                <i className="pi pi-envelope absolute left-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-200"></i>
                <InputText
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white text-sm placeholder-slate-650"
                  placeholder="admin@school.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field with Left Icon */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                Password
              </label>
              <div className="relative flex items-center group [&>span]:w-full">
                <i className="pi pi-lock absolute left-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-200 z-10"></i>
                <Password
                  inputId="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full [&>input]:w-full [&>input]:pl-11 [&>input]:p-3.5 [&>input]:bg-slate-950/50 [&>input]:border [&>input]:border-slate-800 [&>input]:rounded-xl [&>input]:outline-none [&>input]:focus:border-indigo-500 [&>input]:focus:ring-1 [&>input]:focus:ring-indigo-500 [&>input]:transition-all [&>input]:text-white [&>input]:text-sm [&>input]:placeholder-slate-650"
                  toggleMask
                  feedback={false}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              label="Sign In to Dashboard"
              icon="pi pi-sign-in"
              loading={loginMutation.isPending}
              className="mt-2 w-full bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-700 hover:to-violet-750 text-white font-bold p-3.5 rounded-xl border-0 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all"
            />
          </form>

          {/* Styled Premium Demo Credentials Card */}
          <div className="mt-2 p-4.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2">
              <i className="pi pi-info-circle text-amber-500 text-xs"></i>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Demo Credentials</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">SuperAdmin:</span>
                <span className="font-mono text-indigo-300 font-semibold select-all">superadmin@aviraj.com</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">School Admin:</span>
                <span className="font-mono text-indigo-300 font-semibold select-all">admin@demo.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Toast ref={toastRef} position="top-right" />
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
        style={{ marginLeft: sidebarOpen ? '240px' : '0' }}
      >
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
