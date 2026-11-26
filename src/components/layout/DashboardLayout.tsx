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
const COLLAPSE_KEY = 'admin_sidebar_collapsed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // mobile drawer + desktop icon rail (remembered between visits)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, activeUser, activeTenant, isMirroring, setContext } = useAuthStore();
  const [mounted, setMounted] = useState(globalMounted);
  const pathname = usePathname();

  // Refresh who-I-am (modules, permissions, scope) from the server on every load
  const me = useGetMe();
  useEffect(() => {
    if (me.data) setContext(me.data);
  }, [me.data, setContext]);

  useEffect(() => {
    globalMounted = true;
    setMounted(true);
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* storage unavailable */
    }

    const handleShowToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const { severity, summary, detail: description } = detail;
      if (severity === 'success') toast.success(summary, { description });
      else if (severity === 'error') toast.error(summary, { description });
      else if (severity === 'warn') toast.warning(summary, { description });
      else toast.info(summary, { description });
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('show-toast', handleShowToast);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('show-toast', handleShowToast);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close the drawer after navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable */
      }
      return next;
    });

  if (!mounted) return null;
  if (!isAuthenticated) return <LoginScreen />;

  const routeStatus = activeUser
    ? evaluateRoute(pathname ?? '/', {
        role: activeUser.role,
        isSuperAdmin: !!useAuthStore.getState().user?.isSuperAdmin,
        isMirroring,
        activeModules: activeTenant?.activeModules,
        canRead: (m) => useAuthStore.getState().permissions.includes(`${m}:read`),
      })
    : 'ok';

  return (
    <div className="bg-mesh relative isolate flex h-dvh w-full flex-col overflow-hidden font-sans text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <MirroringBanner />

      <div className="relative z-10 flex min-h-0 w-full flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className={`shell-scrim fixed inset-0 z-30 transition-opacity duration-150 lg:hidden ${
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />

        <AppSidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <AppTopbar
            onToggleMenu={() => setMobileOpen((p) => !p)}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
          />
          <main
            id="main-content"
            className="min-w-0 flex-1 overflow-y-auto scroll-smooth overscroll-contain"
          >
            <div className="page-container flex min-h-full min-w-0 flex-col">
              <div className="page-enter min-w-0 flex-1">
                {routeStatus === 'ok' ? children : <AccessState status={routeStatus} />}
              </div>
            </div>
            <AppFooter />
          </main>
        </div>
      </div>
    </div>
  );
}
