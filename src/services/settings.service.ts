import { api } from './api';
import { Tenant } from '@/types/api.types';

export const settingsService = {
  getTenantDetails: async () => {
    const response = await api.get<Tenant>('/tenant/current');
    return response.data;
  },

  updateTenantDetails: async (data: Partial<Tenant>) => {
    const response = await api.patch<Tenant>('/tenant/current', data);
    return response.data;
  }
};
