import { api } from './api';
import { PaginatedResponse } from '@/types/api.types';

export const analyticsService = {
  getFullDashboard: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/dashboard');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getDashboardStats: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/dashboard/core');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getAttendanceTrend: async (classId?: string) => {
    const params = classId ? `?classId=${classId}` : '';
    const response = await api.get<{ success: boolean; data: any }>(`/analytics/attendance/trend${params}`);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getFeeCollectionTrend: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/fee/trend');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getHostelAnalytics: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/hostel');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getLeaveAnalytics: async (month?: number, year?: number) => {
    const params = new URLSearchParams({
      ...(month ? { month: month.toString() } : {}),
      ...(year ? { year: year.toString() } : {})
    });
    const response = await api.get<{ success: boolean; data: any }>(`/analytics/leave?${params.toString()}`);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  /** `subjectId` narrows the log to one record's own history (e.g. a student). */
  getActivityLog: async (page = 1, limit = 10, opts: { subject?: string; subjectId?: string } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(opts.subject ? { subject: opts.subject } : {}),
      ...(opts.subjectId ? { subjectId: opts.subjectId } : {})
    });
    const response = await api.get<any>(`/analytics/activity-log?${params.toString()}`);
    const items = response.data.data?.items ?? [];
    const meta = response.data.data?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  generateReportCardComment: async (studentId: string) => {
    const response = await api.post<{ success: boolean; data: { comment: string } }>('/analytics/ai-comment', { studentId });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  }
};



