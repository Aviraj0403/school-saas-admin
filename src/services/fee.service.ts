import { api } from './api';
import { ApiResponse, PaginatedResponse, FeeStructure, FeeCollection, CollectFeeDto } from '@/types/api.types';

export const feeService = {
  getStructures: async (academicYear?: string) => {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await api.get<{ success: boolean; data: FeeStructure[] }>(`/fee/structures${params}`);
    return response.data;
  },

  createStructure: async (data: any) => {
    const response = await api.post<{ success: boolean; data: FeeStructure }>('/fee/structures', data);
    return response.data;
  },

  collectFee: async (data: CollectFeeDto) => {
    const response = await api.post<ApiResponse<any>>('/fee/collect', data);
    return response.data;
  },

  getCollections: async (page = 1, limit = 10, filters?: { studentId?: string; status?: string }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.status ? { status: filters.status } : {})
    });
    const response = await api.get<PaginatedResponse<FeeCollection>>(`/fee/collections?${params.toString()}`);
    return response.data;
  },

  getStudentDues: async (studentId: string) => {
    const response = await api.get<{ success: boolean; data: any }>(`/fee/student/${studentId}/dues`);
    return response.data;
  },

  getRevenueSummary: async (academicYear?: string) => {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await api.get<{ success: boolean; data: any }>(`/fee/revenue/summary${params}`);
    return response.data.data;
  }
};
