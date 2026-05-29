import { api } from './api';
import { AcademicClass, PaginatedResponse, Subject } from '@/types/api.types';

export const academicsService = {
  getClasses: async (page = 1, limit = 10) => {
    const response = await api.get<any>(`/academics/classes?page=${page}&limit=${limit}`);
    const items = response.data.data?.items ?? [];
    const meta = response.data.data?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  createClass: async (data: any) => {
    const response = await api.post<{ success: boolean; data: AcademicClass }>('/academics/classes', data);
    return response.data;
  },

  getSubjects: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: Subject[] }>(`/academics/classes/${classId}/subjects`);
    return response.data.data;
  },

  createSubject: async (data: { name: string; code: string; classId: string; teacherId?: string }) => {
    const response = await api.post<{ success: boolean; data: Subject }>('/academics/subjects', data);
    return response.data;
  },

  getTimetable: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/academics/timetable/${classId}`);
    return response.data.data;
  },

  createTimetableEntry: async (data: { classId: string; subjectId: string; teacherId: string; dayOfWeek: number; startTime: string; endTime: string }) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/timetable', data);
    return response.data;
  },

  getAcademicYears: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/academic-years');
    return response.data.data;
  },

  getCurrentAcademicYear: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/academics/academic-years/current');
    return response.data.data;
  },

  getDepartments: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/departments');
    return response.data.data;
  },

  createDepartment: async (data: { name: string; headId?: string }) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/departments', data);
    return response.data;
  },

  createAcademicYear: async (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/academic-years', data);
    return response.data;
  },
};

