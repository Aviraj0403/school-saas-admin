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
      const response = await api.get(`/tenant/public/${subdomain}`);
      set({ tenant: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load tenant', isLoading: false });
    }
  },
}));
