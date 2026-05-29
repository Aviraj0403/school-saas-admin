import { api } from './api';
import { LeaveApplication } from '@/types/api.types';

export const leaveService = {
  apply: async (data: { applicantId: string; applicantType: 'STUDENT' | 'STAFF'; startDate: string; endDate: string; reason: string; leaveType?: string }) => {
    const payload = {
      applicantId: data.applicantId,
      applicantType: data.applicantType.toLowerCase(),
      leaveType: data.leaveType || 'sick',
      fromDate: data.startDate,
      toDate: data.endDate,
      reason: data.reason,
    };
    const response = await api.post<{ success: boolean; data: LeaveApplication }>('/leave/apply', payload);
    return response.data.data;
  },

  getLeaves: async (page = 1, limit = 10, filters?: { applicantId?: string; applicantType?: string; status?: string }) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters?.applicantId) params.append('applicantId', filters.applicantId);
    if (filters?.applicantType) params.append('applicantType', filters.applicantType);
    if (filters?.status) params.append('status', filters.status);
    const response = await api.get<{ success: boolean; data: LeaveApplication[]; meta: any }>(`/leave?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
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
  },
};
