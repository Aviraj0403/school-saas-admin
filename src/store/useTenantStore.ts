import { create } from 'zustand';
import { api } from '@/services/api';

interface TenantTheme {
  primaryColor?: string;
  secondaryColor?: string;
}

interface TenantData {
  id: string;
  name: string;
  subdomain: string;
  projectCode?: string;
  theme: TenantTheme | null;
  activeModules: string[];
}

interface TenantState {
  tenant: TenantData | null;
  isLoading: boolean;
  error: string | null;
  fetchTenant: (subdomain: string) => Promise<void>;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  isLoading: false,
  error: null,
  fetchTenant: async (subdomain: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/tenants/resolve/${subdomain}`);
      // Backend returns { success: true, data: {...} } via ResponseInterceptor
      const tenantData = response.data?.data ?? response.data;
      set({ tenant: tenantData, isLoading: false });
    } catch (error: any) {
      // Non-fatal — just clear loading state, don't block the UI
      set({
        error: error.response?.data?.message || 'Tenant not found',
        isLoading: false,
        tenant: null,
      });
    }
  },
}));
