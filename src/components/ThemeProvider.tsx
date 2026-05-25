'use client';

import React, { useEffect } from 'react';
import { useTenantStore } from '@/store/useTenantStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant, fetchTenant } = useTenantStore();

  useEffect(() => {
    // Determine subdomain from hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // localhost → use 'demo' as default subdomain for dev
    // demo.school.com → 'demo'
    // school.com → skip (no subdomain)
    let subdomain = '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
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

  useEffect(() => {
    if (tenant?.theme) {
      const root = document.documentElement;
      const theme = tenant.theme as any;
      if (theme.primaryColor) {
        root.style.setProperty('--primary-color', theme.primaryColor);
      }
      if (theme.secondaryColor) {
        root.style.setProperty('--secondary-color', theme.secondaryColor);
      }
    }
  }, [tenant]);

  return <>{children}</>;
}
