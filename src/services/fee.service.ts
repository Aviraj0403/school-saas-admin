import { api } from './api';
import { FeeStructure, FeeCollection, CollectFeeDto } from '@/types/api.types';

export const feeService = {
  getStructures: async (academicYear?: string) => {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await api.get<{ success: boolean; data: FeeStructure[] }>(`/fee/structures${params}`);
    return response.data.data ?? [];
  },

  createStructure: async (data: any) => {
    const response = await api.post<{ success: boolean; data: FeeStructure }>('/fee/structures', data);
    return response.data.data;
  },

  collectFee: async (data: CollectFeeDto) => {
    const response = await api.post<{ success: boolean; data: any }>('/fee/collect', data);
    return response.data.data;
  },

  getCollections: async (page = 1, limit = 10, filters?: { studentId?: string; status?: string }) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);
    const response = await api.get<{ success: boolean; data: FeeCollection[]; meta: any }>(`/fee/collections?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  getStudentDues: async (studentId: string) => {
    const response = await api.get<{ success: boolean; data: any }>(`/fee/student/${studentId}/dues`);
    return response.data.data;
  },

  getRevenueSummary: async (academicYear?: string) => {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await api.get<{ success: boolean; data: any }>(`/fee/revenue/summary${params}`);
    return response.data.data;
  },
};
