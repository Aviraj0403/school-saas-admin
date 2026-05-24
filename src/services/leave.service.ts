import { api } from './api';
import { PaginatedResponse, LeaveApplication } from '@/types/api.types';

export const leaveService = {
  apply: async (data: { applicantId: string; applicantType: 'STUDENT' | 'STAFF'; startDate: string; endDate: string; reason: string }) => {
    const response = await api.post<{ success: boolean; data: LeaveApplication }>('/leave/apply', data);
    return response.data;
  },

  getLeaves: async (page = 1, limit = 10, filters?: { applicantId?: string; applicantType?: string; status?: string }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.applicantId ? { applicantId: filters.applicantId } : {}),
      ...(filters?.applicantType ? { applicantType: filters.applicantType } : {}),
      ...(filters?.status ? { status: filters.status } : {})
    });
    const response = await api.get<PaginatedResponse<LeaveApplication>>(`/leave?${params.toString()}`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.patch<{ success: boolean }>(`/leave/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason: string) => {
    const response = await api.patch<{ success: boolean }>(`/leave/${id}/reject`, { reason });
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.patch<{ success: boolean }>(`/leave/${id}/cancel`);
    return response.data;
  },

  getBalance: async (applicantId: string, year?: number) => {
    const yr = year || new Date().getFullYear();
    const response = await api.get<{ success: boolean; data: any }>(`/leave/balance/${applicantId}?year=${yr}`);
    return response.data.data;
  }
};
