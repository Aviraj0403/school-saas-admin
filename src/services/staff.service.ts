import { api } from './api';
import { Staff, CreateStaffDto } from '@/types/api.types';

export const staffService = {
  getStaffList: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await api.get<{ success: boolean; data: Staff[]; meta: any }>(`/staff?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  getStaffById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Staff }>(`/staff/${id}`);
    return response.data.data;
  },

  createStaff: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Staff }>('/staff', data);
    return response.data.data;
  },

  updateStaff: async (id: string, data: any) => {
    const response = await api.patch<{ success: boolean; data: Staff }>(`/staff/${id}`, data);
    return response.data.data;
  },

  deleteStaff: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/staff/${id}`);
    return response.data;
  },

  resetPassword: async (id: string) => {
    const response = await api.patch<{ success: boolean }>(`/staff/${id}/reset-password`);
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/rbac/roles');
    return response.data.data;
  },

  getDepartments: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/departments');
    return response.data.data;
  },
};
