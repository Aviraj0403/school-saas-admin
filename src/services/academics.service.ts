import { api } from './api';
import { AcademicClass, AcademicYear, PaginatedResponse, Subject } from '@/types/api.types';

export const academicsService = {
  getClasses: async (page = 1, limit = 10) => {
    const response = await api.get<any>(`/academics/classes?page=${page}&limit=${limit}`);
    const rawData = response.data.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.items ?? []);
    const meta = response.data.data?.meta ?? { total: items.length, page, limit, totalPages: 1 };
    return { items, meta, data: { items, meta } };
  },

  createClass: async (data: any) => {
    const response = await api.post<{ success: boolean; data: AcademicClass }>('/academics/classes', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  updateClass: async (id: string, data: any) => {
    const response = await api.patch<{ success: boolean; data: AcademicClass }>(`/academics/classes/${id}`, data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  deleteClass: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/classes/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  // Get all subjects for a class (via timetable slots - backend alias route)
  getSubjectsByClass: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: Subject[] }>(`/academics/classes/${classId}/subjects`);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  assignSubjectsToClass: async (classId: string, subjectIds: string[]) => {
    const response = await api.post<{ success: boolean; data: any }>(`/academics/classes/${classId}/subjects`, { subjectIds });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  // Get subjects globally (optionally filtered by department)
  getSubjects: async (departmentId?: string) => {
    const url = departmentId
      ? `/academics/subjects?departmentId=${departmentId}`
      : '/academics/subjects';
    const response = await api.get<{ success: boolean; data: Subject[] }>(url);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createSubject: async (data: {
    name: string;
    code: string;
    type?: string;
    departmentId?: string;
    teacherId?: string;
    maxMarks?: number;
    passMarks?: number;
  }) => {
    const response = await api.post<{ success: boolean; data: Subject }>('/academics/subjects', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  updateSubject: async (id: string, data: any) => {
    const response = await api.patch<{ success: boolean; data: Subject }>(`/academics/subjects/${id}`, data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  deleteSubject: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/subjects/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getTimetable: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/academics/timetable/class/${classId}`);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createTimetableEntry: async (data: { classId: string; subjectId: string; teacherId: string; dayOfWeek: number; startTime: string; endTime: string }) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/timetable', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getAcademicYears: async (): Promise<AcademicYear[]> => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/academic-years');
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  getCurrentAcademicYear: async (): Promise<AcademicYear | null> => {
    const response = await api.get<{ success: boolean; data: any }>('/academics/academic-years/current');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getDepartments: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/departments');
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createDepartment: async (data: { name: string; headId?: string }) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/departments', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  updateDepartment: async (id: string, data: { name: string; headId?: string }) => {
    const response = await api.patch<{ success: boolean; data: any }>(`/academics/departments/${id}`, data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  deleteDepartment: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/departments/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  createAcademicYear: async (data: { startDate: string; endDate: string; isCurrent?: boolean }) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/academic-years', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  updateAcademicYear: async (id: string, data: { startDate?: string; endDate?: string; isCurrent?: boolean }) => {
    const response = await api.patch<{ success: boolean; data: any }>(`/academics/academic-years/${id}`, data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  deleteTimetableSlot: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/timetable/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  // ── Lesson Plans ──────────────────────────────────────────
  getLessonPlans: async (classId?: string, subjectId?: string) => {
    let url = '/academics/lesson-plans';
    if (classId || subjectId) {
       const params = new URLSearchParams();
       if (classId) params.append('classId', classId);
       if (subjectId) params.append('subjectId', subjectId);
       url += `?${params.toString()}`;
    }
    const response = await api.get<{ success: boolean; data: any[] }>(url);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createLessonPlan: async (data: any) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/lesson-plans', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  // ── Quizzes ───────────────────────────────────────────────
  getQuizzes: async (classId?: string, subjectId?: string) => {
    let url = '/academics/quizzes';
    if (classId || subjectId) {
       const params = new URLSearchParams();
       if (classId) params.append('classId', classId);
       if (subjectId) params.append('subjectId', subjectId);
       url += `?${params.toString()}`;
    }
    const response = await api.get<{ success: boolean; data: any[] }>(url);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createQuiz: async (data: any) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/quizzes', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  // ── Online Classes ────────────────────────────────────────
  getOnlineClasses: async (classId?: string, subjectId?: string) => {
    let url = '/academics/online-classes';
    if (classId || subjectId) {
       const params = new URLSearchParams();
       if (classId) params.append('classId', classId);
       if (subjectId) params.append('subjectId', subjectId);
       url += `?${params.toString()}`;
    }
    const response = await api.get<{ success: boolean; data: any[] }>(url);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createOnlineClass: async (data: any) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/online-classes', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },
};




