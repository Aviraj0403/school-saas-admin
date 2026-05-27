import { api } from './api';
import { PaginatedResponse } from '@/types/api.types';

export const analyticsService = {
  getFullDashboard: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/dashboard');
    return response.data.data;
  },

  getDashboardStats: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/dashboard/core');
    return response.data.data;
  },

  getAttendanceTrend: async (classId?: string) => {
    const params = classId ? `?classId=${classId}` : '';
    const response = await api.get<{ success: boolean; data: any }>(`/analytics/attendance/trend${params}`);
    return response.data.data;
  },

  getFeeCollectionTrend: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/fee/trend');
    return response.data.data;
  },

  getHostelAnalytics: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/analytics/hostel');
    return response.data.data;
  },

  getLeaveAnalytics: async (month?: number, year?: number) => {
    const params = new URLSearchParams({
      ...(month ? { month: month.toString() } : {}),
      ...(year ? { year: year.toString() } : {})
    });
    const response = await api.get<{ success: boolean; data: any }>(`/analytics/leave?${params.toString()}`);
    return response.data.data;
  },

  getActivityLog: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await api.get<any>(`/analytics/activity-log?${params.toString()}`);
    const items = response.data.data?.data ?? [];
    const meta = response.data.data?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  }
};
