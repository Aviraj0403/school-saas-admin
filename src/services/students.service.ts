import { api } from './api';
import { Student, CreateStudentDto } from '@/types/api.types';

// Backend ResponseInterceptor shape: { success, data: T[], meta: { total, page, limit, totalPages } }
export const studentsService = {
  getStudents: async (page = 1, limit = 10, search?: string, classId?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    if (classId) params.append('classId', classId);
    const response = await api.get<{ success: boolean; data: Student[]; meta: any }>(`/students?${params}`);
    const items = (response.data.data as any)?.data ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  getStudentById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Student }>(`/students/${id}`);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  createStudent: async (data: CreateStudentDto) => {
    const response = await api.post<{ success: boolean; data: Student }>('/students', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  deleteStudent: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/students/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },
};



