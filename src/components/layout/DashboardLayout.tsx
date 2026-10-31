'use client';

import React, { useState, useEffect } from 'react';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import AppFooter from './AppFooter';
import { MirroringBanner } from './MirroringBanner';
import { useAuthStore } from '@/store/useAuthStore';
import LoginScreen from './LoginScreen';
import { usePermission } from '@/hooks/usePermission';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

let globalMounted = false;

// Module slug mapping for URL path prefixes
const ROUTE_MODULE_MAP: Record<string, string> = {
  '/students': 'students',
  '/staff': 'staff',
  '/academics': 'academics',
  '/attendance': 'attendance',
  '/exams': 'exams',
  '/fee': 'fee',
  '/library': 'library',
  '/transport': 'transport',
  '/hostel': 'hostel',
  '/communication': 'communication',
  '/whatsapp': 'communication',
  '/website': 'communication',
  '/settings/roles': 'settings',
  '/settings': 'settings',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, isSuperAdmin, isSchoolAdmin } = usePermission();

  // Lazy initializer: synchronously detect mobile so the first render is correct
  // — no flash, and hamburger toggle works from the very first frame.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true; // SSR fallback: desktop
  });
  const [sidebarSize, setSidebarSize] = useState<'default' | 'collapsed'>('default');
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(globalMounted);

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarSize((s) => (s === 'default' ? 'collapsed' : 'default'));
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  // Determine if current route is allowed
  const hasRouteAccess = React.useMemo(() => {
    if (!isAuthenticated || isSuperAdmin || isSchoolAdmin) return true;
    if (pathname === '/dashboard' || pathname === '/') return true;

    // Check against route module map
    for (const [routePrefix, moduleSlug] of Object.entries(ROUTE_MODULE_MAP)) {
      if (pathname.startsWith(routePrefix)) {
        return hasPermission(moduleSlug, 'read');
      }
    }
    return true;
  }, [pathname, isAuthenticated, isSuperAdmin, isSchoolAdmin, hasPermission]);

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
          {!hasRouteAccess ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm mt-8">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Access Restricted
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Your assigned role does not have authorization to view this module. Contact your
                school administrator to adjust your permissions matrix.
              </p>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="mt-6 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            children
          )}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
