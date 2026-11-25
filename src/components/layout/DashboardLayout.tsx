'use client';

import React, { useState, useEffect } from 'react';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import AppFooter from './AppFooter';
import { MirroringBanner } from './MirroringBanner';
import { useAuthStore } from '@/store/useAuthStore';
import LoginScreen from './LoginScreen';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';
import { useGetMe } from '@/hooks/queries/useAuth';
import { evaluateRoute } from '@/config/routeAccess';
import { AccessState } from './AccessState';

let globalMounted = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Lazy initializer: synchronously detect mobile so the first render is correct
  // — no flash, and hamburger toggle works from the very first frame.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true; // SSR fallback: desktop
  });
  const [sidebarSize, setSidebarSize] = useState<'default' | 'collapsed'>('default');
  const { isAuthenticated, activeUser, activeTenant, isMirroring, setContext } = useAuthStore();
  const pathname = usePathname();
  // Refresh who-I-am (modules, permissions, scope) from the server on every load
  const me = useGetMe();
  useEffect(() => {
    if (me.data) setContext(me.data);
  }, [me.data, setContext]);
  const [mounted, setMounted] = useState(globalMounted);

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarSize((s) => (s === 'default' ? 'collapsed' : 'default'));
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  useEffect(() => {
    globalMounted = true;
    setMounted(true);

    if (typeof window !== 'undefined') {
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

  if (!mounted) return null;

  if (!isAuthenticated) return <LoginScreen />;

  const routeStatus = activeUser
    ? evaluateRoute(pathname ?? '/', {
        role: activeUser.role,
        isSuperAdmin: !!useAuthStore.getState().user?.isSuperAdmin,
        isMirroring,
        activeModules: activeTenant?.activeModules,
      })
    : 'ok';

  const desktopPad = sidebarSize === 'collapsed' ? 'lg:pl-[108px]' : 'lg:pl-[292px]';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-sans">
      {/* Aurora canvas */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-aurora absolute -top-40 left-[20%] h-[420px] w-[620px] rounded-full bg-brand/[0.13] blur-[110px] dark:bg-brand/20" />
        <div className="animate-aurora absolute -top-24 right-[-8%] h-[380px] w-[520px] rounded-full bg-brand-2/[0.12] blur-[110px] [animation-delay:-6s] dark:bg-brand-2/15" />
      </div>

      <MirroringBanner />
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        size={sidebarSize}
        onToggleSize={() => setSidebarSize((s) => (s === 'default' ? 'collapsed' : 'default'))}
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#140f2d]/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`relative flex min-h-screen w-full flex-col transition-[padding] duration-300 ease-out ${sidebarOpen ? desktopPad : 'lg:pl-0'}`}
      >
        <AppTopbar onToggleMenu={handleToggleMenu} />
        <main className="page-enter mx-auto w-full max-w-[1480px] flex-1 overflow-x-hidden px-4 pb-8 pt-2 sm:px-6 lg:pr-8 lg:pl-0">
          {routeStatus === 'ok' ? children : <AccessState status={routeStatus} />}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
