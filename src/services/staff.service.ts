import { api } from './api';
import { Staff, CreateStaffDto } from '@/types/api.types';

export const staffService = {
  getStaffList: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await api.get<{ success: boolean; data: Staff[]; meta: any }>(`/staff?${params}`);
    return { items: response.data.data ?? [], meta: response.data.meta ?? { total: 0, page, limit, totalPages: 0 } };
  },

  getStaffById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Staff }>(`/staff/${id}`);
    return response.data.data;
  },

  createStaff: async (data: CreateStaffDto) => {
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
};
