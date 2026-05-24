import { api } from './api';
import { PaginatedResponse, Student, CreateStudentDto } from '@/types/api.types';

export const studentsService = {
  getStudents: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {})
    });
    const response = await api.get<PaginatedResponse<Student>>(`/students?${params.toString()}`);
    return response.data;
  },

  getStudentById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Student }>(`/students/${id}`);
    return response.data.data;
  },

  createStudent: async (data: CreateStudentDto) => {
    const response = await api.post<{ success: boolean; data: Student }>('/students', data);
    return response.data;
  },

  deleteStudent: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/students/${id}`);
    return response.data;
  }
};
