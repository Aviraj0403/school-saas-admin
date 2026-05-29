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

  // Apply theme dynamically from both subdomain resolver AND live active workspace switches!
  useEffect(() => {
    let resolvedTheme = activeTenant?.theme || tenant?.theme;
    
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

    if (resolvedTheme) {
      const root = document.documentElement;
      const theme = resolvedTheme as any;
      if (theme.primaryColor) {
        root.style.setProperty('--primary-color', theme.primaryColor);
      }
      if (theme.secondaryColor) {
        root.style.setProperty('--secondary-color', theme.secondaryColor);
      }
    }
  }, [tenant, activeTenant]);

  return <>{children}</>;
}
