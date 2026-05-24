'use client';

import React, { useEffect } from 'react';
import { useTenantStore } from '@/store/useTenantStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant, fetchTenant } = useTenantStore();

  useEffect(() => {
    // Determine subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // For local testing, we assume 'demo.localhost' -> 'demo'
    // If just 'localhost', default to 'demo' or 'superadmin' logic
    let subdomain = 'demo'; 
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }

    fetchTenant(subdomain);
  }, [fetchTenant]);

  useEffect(() => {
    if (tenant?.theme) {
      const root = document.documentElement;
      if (tenant.theme.primaryColor) {
        root.style.setProperty('--primary-color', tenant.theme.primaryColor);
      }
      if (tenant.theme.secondaryColor) {
        root.style.setProperty('--secondary-color', tenant.theme.secondaryColor);
      }
    }
  }, [tenant]);

  return <>{children}</>;
}
