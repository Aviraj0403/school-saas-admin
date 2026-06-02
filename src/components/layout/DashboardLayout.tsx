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
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-slate-950 bg-cover bg-center select-none"
        style={{ backgroundImage: `url('/neural_network_bg.png')` }}
      >
        {/* Ambient Overlay Layer */}
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px] z-0 pointer-events-none" />

        {/* Soft Luminous Backdrop Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/0 blur-[130px] pointer-events-none animate-pulse duration-[8000ms]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-cyan-500/30 to-blue-500/0 blur-[130px] pointer-events-none animate-pulse duration-[10000ms]"></div>
        
        {/* Responsive Side-by-Side Flex Container */}
        <div className="relative z-10 flex flex-col md:flex-row gap-6 max-w-4xl w-full items-stretch justify-center">
          
          {/* Static Glassmorphic Login Card */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex-1 p-8 md:p-10 flex flex-col gap-6 transition-all duration-300">
            {/* Glowing Premium Logo & Branding */}
            <div className="flex flex-col items-center mb-2">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 opacity-75 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-16 h-16 bg-slate-950/80 rounded-2xl flex items-center justify-center mb-4 border border-blue-400/20 shadow-inner">
                  <i className="pi pi-graduation-cap text-blue-450 text-3xl"></i>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent mt-2">
                School SaaS Admin
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1.5 font-medium tracking-wide">
                Sign in to manage your school ecosystem
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {loginMutation.isError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-center text-rose-450 text-xs font-semibold">
                  <i className="pi pi-exclamation-circle text-base text-rose-400"></i>
                  <span>
                    {(loginMutation.error as any)?.response?.data?.message ||
                      'Login failed. Please check your credentials.'}
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                  Email Address
                </label>
                <div className="relative flex items-center group w-full">
                  <i className="pi pi-envelope absolute left-4 text-slate-400 group-focus-within:text-blue-405 transition-colors duration-200 z-10 pointer-events-none"></i>
                  <InputText
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 p-3.5 bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white text-sm placeholder-slate-500 rounded-xl z-0"
                    placeholder="admin@school.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <div className="relative flex items-center group w-full">
                  <i className="pi pi-lock absolute left-4 text-slate-400 group-focus-within:text-blue-405 transition-colors duration-200 z-10 pointer-events-none"></i>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 p-3.5 bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white text-sm placeholder-slate-500 rounded-xl outline-none z-0"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors duration-200 z-10 focus:outline-none flex items-center justify-center"
                  >
                    <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} text-sm`}></i>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                label="Sign In to Dashboard"
                icon="pi pi-sign-in"
                loading={loginMutation.isPending}
                className="mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-800 text-white font-bold p-3.5 rounded-xl border-0 shadow-lg shadow-blue-600/10 hover:shadow-blue-600/25 active:scale-[0.98] transition-all"
              />
            </form>
          </div>

          {/* Static Glassmorphic Demo Credentials Card (Side-by-Side) */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex-1 p-8 md:p-10 flex flex-col justify-between gap-6 transition-all duration-300">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-450/20 flex items-center justify-center">
                  <i className="pi pi-info-circle text-blue-400 text-lg"></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Workspace Demo Access</h2>
                  <p className="text-slate-400 text-[10px] font-medium tracking-wide">Quick-copy credentials to preview distinct roles</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                {/* SuperAdmin Item */}
                <div className="p-4 bg-slate-950/40 border border-slate-850/50 rounded-2xl flex flex-col gap-1.5 hover:border-blue-500/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest">SuperAdmin Role</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold">Platform Owner</span>
                  </div>
                  <div className="flex flex-col text-xs mt-1">
                    <span className="text-slate-400 font-semibold">Email:</span>
                    <span className="font-mono text-white mt-0.5 select-all break-all bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">superadmin@aviraj.com</span>
                  </div>
                </div>

                {/* School Admin Item */}
                <div className="p-4 bg-slate-950/40 border border-slate-850/50 rounded-2xl flex flex-col gap-1.5 hover:border-blue-500/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest">School Admin Role</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] font-bold">School Manager</span>
                  </div>
                  <div className="flex flex-col text-xs mt-1">
                    <span className="text-slate-400 font-semibold">Email:</span>
                    <span className="font-mono text-white mt-0.5 select-all break-all bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">admin@demo.com</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-950/15 border border-blue-900/20 rounded-2xl flex items-center gap-3">
              <i className="pi pi-shield text-blue-400 text-sm"></i>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Shared default password for both accounts: <span className="font-mono text-blue-300 font-bold select-all bg-slate-900/50 px-1.5 py-0.5 rounded">123456</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Neural Network Particle Canvas Background Component
  function NeuralNetworkCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      const particleCount = 45;
      const particles: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        glow: number;
      }[] = [];

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.8 + 0.8,
          glow: Math.random() * 8 + 4,
        });
      }

      const animate = () => {
        ctx.clearRect(0, 0, width, height);

        // Draw connections
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particleCount; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particleCount; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 150) {
              const alpha = (1 - dist / 150) * 0.16;
              ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw particles
        for (let i = 0; i < particleCount; i++) {
          const p = particles[i];
          
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          ctx.fillStyle = 'rgba(165, 180, 252, 0.7)';
          ctx.shadowBlur = p.glow;
          ctx.shadowColor = '#818cf8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
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
        className="transition-all duration-300 ease-in-out pt-16 smooth-sidebar-transition"
        style={{ marginLeft: sidebarOpen ? '240px' : '0' }}
      >
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
