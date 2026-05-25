import { api } from './api';
import { Student, CreateStudentDto } from '@/types/api.types';

// Backend ResponseInterceptor shape: { success, data: T[], meta: { total, page, limit, totalPages } }
export const studentsService = {
  getStudents: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await api.get<{ success: boolean; data: Student[]; meta: any }>(`/students?${params}`);
    return { items: response.data.data ?? [], meta: response.data.meta ?? { total: 0, page, limit, totalPages: 0 } };
  },

  getStudentById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Student }>(`/students/${id}`);
    return response.data.data;
  },

  createStudent: async (data: CreateStudentDto) => {
    const response = await api.post<{ success: boolean; data: Student }>('/students', data);
    return response.data.data;
  },

  deleteStudent: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/students/${id}`);
    return response.data;
  },
};
