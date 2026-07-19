import { api } from './api';
import { Staff, CreateStaffDto } from '@/types/api.types';

export const staffService = {
  getStaffList: async (page = 1, limit = 10, search?: string, designationId?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    if (designationId) params.append('designationId', designationId);
    const response = await api.get<{ success: boolean; data: Staff[]; meta: any }>(`/staff?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  // Staff categories (designations) — auto-synced from roles server-side
  getDesignations: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/staff/designations');
    return response.data?.data ?? [];
  },

  createDesignation: async (name: string) => {
    const response = await api.post<{ success: boolean; data: any }>('/staff/designations', { name });
    return response.data?.data;
  },

  deleteDesignation: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/staff/designations/${id}`);
    return (response.data as any)?.data ?? response.data;
  },

  // Image must already be <= 100 KB — the server rejects larger files with 413
  uploadPhoto: async (id: string, file: Blob, fileName = 'photo.jpg') => {
    const form = new FormData();
    form.append('photo', file, fileName);
    const response = await api.post<{ success: boolean; data: Staff }>(`/staff/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data;
  },

  getStaffById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Staff }>(`/staff/${id}`);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  createStaff: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Staff }>('/staff', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  updateStaff: async (id: string, data: any) => {
    const response = await api.patch<{ success: boolean; data: Staff }>(`/staff/${id}`, data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  deleteStaff: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/staff/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  resetPassword: async (id: string) => {
    const response = await api.patch<{ success: boolean }>(`/staff/${id}/reset-password`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getRoles: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/rbac/roles');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getDepartments: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/departments');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },
};



