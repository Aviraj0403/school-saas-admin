import { api } from './api';
import { AcademicClass, PaginatedResponse, Subject } from '@/types/api.types';

export const academicsService = {
  getClasses: async (page = 1, limit = 10) => {
    const response = await api.get<PaginatedResponse<AcademicClass>>(`/academics/classes?page=${page}&limit=${limit}`);
    return response.data;
  },

  getSubjects: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: Subject[] }>(`/academics/classes/${classId}/subjects`);
    return response.data.data;
  }
};
