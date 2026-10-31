'use client';

import React, { useEffect } from 'react';
import { useTenantStore } from '@/store/useTenantStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant, fetchTenant } = useTenantStore();
  const { activeTenant } = useAuthStore();

  useEffect(() => {
    // Determine subdomain from hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // localhost → use 'demo' as default subdomain for dev
    let subdomain = '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      subdomain = 'demo';
    } else if (hostname === 'schooldemo.jdinfotechsolutions.in') {
      subdomain = 'demo';
    } else if (parts.length >= 3 && parts[0] !== 'www') {
      subdomain = parts[0];
    }

    // Only fetch if we have a subdomain — silently skip on bare domain
    if (subdomain) {
      fetchTenant(subdomain).catch(() => {
        // Non-fatal: theme just won't be applied
      });
    }
  }, [fetchTenant]);

  // School users can't read /tenants/:id, so login may have stored a placeholder tenant.
  // Once the public subdomain record for the same school arrives, adopt its real name,
  // modules and theme.
  useEffect(() => {
    if (!tenant || !activeTenant || tenant.id !== activeTenant.id) return;
    if (activeTenant.name !== 'Your School' && activeTenant.name !== 'School Admin') return;
    useAuthStore.getState().setTenant({
      id: tenant.id,
      name: tenant.name,
      activeModules: tenant.activeModules?.length
        ? tenant.activeModules
        : activeTenant.activeModules,
      projectCode: tenant.projectCode,
      subdomain: tenant.subdomain,
      prefix: (tenant as any).prefix,
      theme: tenant.theme ?? undefined,
    });
  }, [tenant, activeTenant]);

  // Apply theme dynamically from both subdomain resolver AND live active workspace switches!
  useEffect(() => {
    const applyTheme = () => {
      let resolvedTheme = activeTenant?.theme || tenant?.theme;

      // Override with user selected custom theme if saved in localStorage
      try {
        const localThemeStr = localStorage.getItem('selected-theme');
        if (localThemeStr) {
          const localTheme = JSON.parse(localThemeStr);
          if (localTheme?.primaryColor) {
            resolvedTheme = localTheme;
          }
        }
      } catch (e) {
        // Safe fallback
      }

      // Auto-detect SP Anglo or Anglo schools to assign blue/white theme by default
      const schoolName = (activeTenant?.name || tenant?.name || '').toLowerCase();
      const subdomain = (activeTenant?.subdomain || tenant?.subdomain || '').toLowerCase();
      const isAnglo = schoolName.includes('anglo') || subdomain.includes('anglo');

      if (isAnglo && (!resolvedTheme || Object.keys(resolvedTheme).length === 0)) {
        resolvedTheme = {
          primaryColor: '#1e40af', // Dark Blue
          secondaryColor: '#f8fafc', // White/Light
        };
      }

      // Light is the default; users can opt into dark from the top bar
      let themeMode = 'light';
      try {
        const savedMode = localStorage.getItem('theme-mode');
        if (savedMode === 'light' || savedMode === 'dark') {
          themeMode = savedMode;
        } else {
          localStorage.setItem('theme-mode', 'light');
        }
      } catch (e) {
        // Safe fallback
      }

      const root = document.documentElement;
      if (themeMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      if (resolvedTheme) {
        const theme = resolvedTheme as any;
        if (theme.primaryColor) {
          root.style.setProperty('--primary-color', theme.primaryColor);
        }
        if (theme.secondaryColor) {
          root.style.setProperty('--secondary-color', theme.secondaryColor);
        }
      }
    };

    applyTheme();

    // Listen to live custom palette or mode transitions
    window.addEventListener('theme-changed', applyTheme);
    return () => {
      window.removeEventListener('theme-changed', applyTheme);
    };
  }, [tenant, activeTenant]);

  return <>{children}</>;
}
