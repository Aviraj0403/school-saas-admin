'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import AppFooter from './AppFooter';
import { MirroringBanner } from './MirroringBanner';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogin } from '@/hooks/queries/useAuth';
import { toast } from 'sonner';

let globalMounted = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSize, setSidebarSize] = useState<'default' | 'collapsed'>('default');
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(globalMounted);

  // Login State
  const [schoolCode, setSchoolCode] = useState('');
  const [identifier, setIdentifier] = useState(''); // email for staff, admission no for student
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarSize((s) => (s === 'default' ? 'collapsed' : 'default'));
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [detectedSchool, setDetectedSchool] = useState<string | null>(null);

  const loginMutation = useLogin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    globalMounted = true;
    setMounted(true);

    // Auto-detect school from subdomain (Mock implementation)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('satysaiprep')) {
        setDetectedSchool('Satyasai Prep Academy');
        setSchoolCode('SATYASAI');
      } else if (hostname.includes('demo')) {
        setDetectedSchool('EduNexus Demo School');
        setSchoolCode('DEMO');
      }

      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }

      const handleShowToast = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          const { severity, summary, detail } = customEvent.detail;
          if (severity === 'success') {
            toast.success(summary, { description: detail });
          } else if (severity === 'error') {
            toast.error(summary, { description: detail });
          } else if (severity === 'warn') {
            toast.warning(summary, { description: detail });
          } else {
            toast.info(summary, { description: detail });
          }
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
    setIsAuthenticating(true);

    // In a real implementation, you would pass `schoolCode` to the backend
    // to determine which table to authenticate against (users vs students).
    const loginPayload = {
      email: identifier, // This can be email or admissionNo
      password,
      schoolCode: schoolCode,
    };

    loginMutation.mutate(loginPayload, {
      onSuccess: () => {
        setIsAuthenticating(false);
        if (pathname !== '/dashboard') {
          router.replace('/dashboard');
        }
      },
      onError: () => {
        setIsAuthenticating(false);
      },
    });
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-zinc-950 bg-cover bg-center select-none"
        style={{ backgroundImage: `url('/ai_student_bg.png')` }}
      >
        {/* Ambient Overlay Layer */}
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-0 pointer-events-none" />

        {/* Soft Luminous Backdrop Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none animate-pulse duration-[8000ms]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none animate-pulse duration-[10000ms]"></div>
        <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none"></div>

        {/* Responsive Flex Container */}
        <div className="relative z-10 flex flex-col md:flex-row gap-8 max-w-5xl w-full items-stretch justify-center">
          {/* Main Login Card */}
          <div className="backdrop-blur-2xl bg-zinc-900/60 border border-zinc-700/50 rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex-1 flex flex-col overflow-hidden transition-all duration-500 relative">
            {/* Top Branding Header */}
            <div className="bg-gradient-to-r from-zinc-900/90 to-zinc-800/90 p-8 border-b border-zinc-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

              <div className="flex flex-col items-center relative z-10">
                <div className="relative group mb-4">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-blue-500 rounded-md opacity-40 blur-lg group-hover:opacity-75 transition duration-500"></div>
                  <div className="relative w-16 h-16 bg-zinc-950 rounded-md flex items-center justify-center border border-zinc-700/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                    <i className="pi pi-graduation-cap text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-400 text-3xl drop-shadow-sm"></i>
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {detectedSchool ? detectedSchool : 'EduNexus OS'}
                </h1>
                <p className="text-zinc-400 text-xs md:text-sm mt-2 font-medium tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Secure Unified Authentication
                </p>
              </div>
            </div>

            <div className="p-8 md:p-10 flex flex-col gap-6">
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                {loginMutation.isError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-md flex gap-3 items-center text-rose-450 text-xs font-semibold animate-in fade-in zoom-in duration-300">
                    <i className="pi pi-exclamation-circle text-base text-rose-400 shrink-0"></i>
                    <span>
                      {(loginMutation.error as any)?.response?.data?.message ||
                        'Authentication failed. Please check your credentials.'}
                    </span>
                  </div>
                )}

                {/* School Code Field (Only shown if not auto-detected or if superadmin needs to switch) */}
                {!detectedSchool && (
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="schoolCode"
                      className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 flex justify-between"
                    >
                      <span>School Code</span>
                      <span className="text-blue-400/70 font-normal normal-case tracking-normal">
                        Optional for SuperAdmin
                      </span>
                    </label>
                    <div className="relative flex items-center group w-full">
                      <i className="pi pi-building absolute left-4 text-zinc-400 group-focus-within:text-blue-400 transition-colors duration-200 z-10 pointer-events-none"></i>
                      <input
                        id="schoolCode"
                        type="text"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                        className="w-full py-3.5 pr-3.5 pl-11 bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white text-sm placeholder-zinc-500 rounded-md outline-none z-0 uppercase"
                        placeholder="e.g. SATYASAI"
                      />
                    </div>
                  </div>
                )}

                {/* Identifier Field (Email vs Admission No) */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="identifier"
                    className="font-bold text-[10px] uppercase tracking-widest text-zinc-400"
                  >
                    Email Address or Admission No.
                  </label>
                  <div className="relative flex items-center group w-full">
                    <i className="pi pi-user absolute left-4 text-zinc-400 group-focus-within:text-blue-400 transition-colors duration-200 z-10 pointer-events-none"></i>
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="w-full py-3.5 pr-3.5 pl-11 bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white text-sm placeholder-zinc-500 rounded-md outline-none z-0"
                      placeholder="admin@school.com or ADM-2023-001"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="password"
                    className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 flex justify-between"
                  >
                    <span>Password</span>
                    <a
                      href="#"
                      className="text-blue-400/80 hover:text-blue-400 font-normal normal-case tracking-normal transition-colors"
                    >
                      Forgot?
                    </a>
                  </label>
                  <div className="relative flex items-center group w-full">
                    <i className="pi pi-lock absolute left-4 text-zinc-400 group-focus-within:text-blue-400 transition-colors duration-200 z-10 pointer-events-none"></i>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full py-3.5 pl-11 pr-12 bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white text-sm placeholder-zinc-500 rounded-md outline-none z-0 tracking-wide"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-zinc-400 hover:text-zinc-200 transition-colors duration-200 z-10 focus:outline-none flex items-center justify-center"
                    >
                      <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} text-sm`}></i>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-500 hover:to-blue-500 text-white font-bold py-4 rounded-md border-0 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_10px_25px_-10px_rgba(59,130,246,0.8)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                  {isAuthenticating ? (
                    <i className="pi pi-spinner pi-spin text-lg"></i>
                  ) : (
                    <>
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                      <span className="relative z-10 text-sm tracking-wide">Secure Sign In</span>
                      <i className="pi pi-arrow-right relative z-10 text-sm group-hover:translate-x-1 transition-transform"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contextual Info & Quick Seeded Logins Panel */}
          <div className="hidden md:flex flex-col gap-6 w-80 shrink-0">
            <div className="backdrop-blur-xl bg-zinc-900/60 border border-zinc-700/50 rounded-md p-6 shadow-xl flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>

              <div>
                <div className="flex items-center gap-2.5 mb-4 relative z-10">
                  <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <i className="pi pi-key text-blue-400 text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white leading-none">
                      Seeded Demo Credentials
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-medium">1-Click Auto Fill</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative z-10">
                  {[
                    {
                      label: 'Super Admin',
                      email: 'superadmin@aviraj.com',
                      pass: 'SuperAdmin@123',
                      icon: 'pi-shield',
                      color: 'text-purple-400 bg-purple-500/10',
                    },
                    {
                      label: 'School Admin',
                      email: 'admin@demo.com',
                      pass: 'School@123',
                      icon: 'pi-building',
                      color: 'text-blue-400 bg-blue-500/10',
                    },
                    {
                      label: 'Teacher',
                      email: 'teacher1@demo.com',
                      pass: 'School@123',
                      icon: 'pi-user',
                      color: 'text-emerald-400 bg-emerald-500/10',
                    },
                    {
                      label: 'Accountant',
                      email: 'accountant@demo.com',
                      pass: 'School@123',
                      icon: 'pi-wallet',
                      color: 'text-amber-400 bg-amber-500/10',
                    },
                    {
                      label: 'Librarian',
                      email: 'librarian@demo.com',
                      pass: 'School@123',
                      icon: 'pi-book',
                      color: 'text-teal-400 bg-teal-500/10',
                    },
                    {
                      label: 'Student',
                      email: 'student1@demo.com',
                      pass: 'School@123',
                      icon: 'pi-graduation-cap',
                      color: 'text-indigo-400 bg-indigo-500/10',
                    },
                    {
                      label: 'Parent',
                      email: 'parent1@demo.com',
                      pass: 'School@123',
                      icon: 'pi-users',
                      color: 'text-rose-400 bg-rose-500/10',
                    },
                  ].map((demo) => (
                    <button
                      key={demo.label}
                      type="button"
                      onClick={() => {
                        setIdentifier(demo.email);
                        setPassword(demo.pass);
                        window.dispatchEvent(
                          new CustomEvent('show-toast', {
                            detail: {
                              severity: 'info',
                              summary: `Auto-filled ${demo.label}`,
                              detail: `Identifier: ${demo.email}`,
                              life: 2500,
                            },
                          })
                        );
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-md bg-zinc-950/40 hover:bg-zinc-800/80 border border-zinc-800 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${demo.color}`}
                        >
                          <i className={`pi ${demo.icon}`}></i>
                        </div>
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                          {demo.label}
                        </span>
                      </div>
                      <i className="pi pi-arrow-right text-[10px] text-zinc-500 group-hover:text-zinc-300"></i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/60 relative z-10 text-center">
                <p className="text-[10px] text-zinc-400 font-medium">
                  Click any role to auto-fill credentials
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 font-sans overflow-x-hidden`}
    >
      <MirroringBanner />
      <AppTopbar onToggleMenu={handleToggleMenu} />
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        size={sidebarSize}
        onToggleSize={() => setSidebarSize((s) => (s === 'default' ? 'collapsed' : 'default'))}
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          id="mobile-overlay-close"
          className="fixed top-[70px] inset-x-0 bottom-0 z-30 bg-zinc-950/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`transition-all duration-300 ease-in-out pt-[70px] ${sidebarOpen ? (sidebarSize === 'collapsed' ? 'md:pl-[70px]' : 'md:pl-[260px]') : 'pl-0'} w-full min-h-screen flex flex-col`}
      >
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-[1600px] mx-auto overflow-x-hidden">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
