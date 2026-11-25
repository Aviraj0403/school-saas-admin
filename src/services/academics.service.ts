import { api } from './api';
import { AcademicClass, AcademicYear, PaginatedResponse, Subject } from '@/types/api.types';
import { asList, unwrap } from '@/lib/utils';

export const academicsService = {
  getClasses: async (page = 1, limit = 10) => {
    const response = await api.get<any>(`/academics/classes?page=${page}&limit=${limit}`);
    const rawData = response.data.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.items ?? []);
    const meta = response.data.data?.meta ?? { total: items.length, page, limit, totalPages: 1 };
    return { items, meta, data: { items, meta } };
  },

  createClass: async (data: any) => {
    const response = await api.post<{ success: boolean; data: AcademicClass }>(
      '/academics/classes',
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  updateClass: async (id: string, data: any) => {
    const response = await api.patch<{ success: boolean; data: AcademicClass }>(
      `/academics/classes/${id}`,
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  deleteClass: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/classes/${id}`);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  // Get all subjects for a class (via timetable slots - backend alias route)
  getSubjectsByClass: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: Subject[] }>(
      `/academics/classes/${classId}/subjects`
    );
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  assignSubjectsToClass: async (classId: string, subjectIds: string[]) => {
    const response = await api.post<{ success: boolean; data: any }>(
      `/academics/classes/${classId}/subjects`,
      { subjectIds }
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
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
    const response = await api.post<{ success: boolean; data: Subject }>(
      '/academics/subjects',
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  updateSubject: async (id: string, data: any) => {
    const response = await api.patch<{ success: boolean; data: Subject }>(
      `/academics/subjects/${id}`,
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  deleteSubject: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/subjects/${id}`);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  getTimetable: async (classId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(
      `/academics/timetable/class/${classId}`
    );
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createTimetableEntry: async (data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => {
    const response = await api.post<{ success: boolean; data: any }>('/academics/timetable', data);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  getAcademicYears: async (): Promise<AcademicYear[]> => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/academic-years');
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  getCurrentAcademicYear: async (): Promise<AcademicYear | null> => {
    const response = await api.get<{ success: boolean; data: any }>(
      '/academics/academic-years/current'
    );
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getDepartments: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/academics/departments');
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createDepartment: async (data: { name: string; headId?: string }) => {
    const response = await api.post<{ success: boolean; data: any }>(
      '/academics/departments',
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  updateDepartment: async (id: string, data: { name: string; headId?: string }) => {
    const response = await api.patch<{ success: boolean; data: any }>(
      `/academics/departments/${id}`,
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  deleteDepartment: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/departments/${id}`);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  createAcademicYear: async (data: { startDate: string; endDate: string; isCurrent?: boolean }) => {
    const response = await api.post<{ success: boolean; data: any }>(
      '/academics/academic-years',
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  updateAcademicYear: async (
    id: string,
    data: { startDate?: string; endDate?: string; isCurrent?: boolean }
  ) => {
    const response = await api.patch<{ success: boolean; data: any }>(
      `/academics/academic-years/${id}`,
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  deleteTimetableSlot: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/academics/timetable/${id}`);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
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
    const response = await api.post<{ success: boolean; data: any }>(
      '/academics/lesson-plans',
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
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
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
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
    const response = await api.post<{ success: boolean; data: any }>(
      '/academics/online-classes',
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  // ── Classes ───────────────────────────────────────────────
  getAllClasses: async (): Promise<any[]> => {
    const res = await api.get('/academics/classes');
    return asList(unwrap(res));
  },

  // ── Timetable (extended) ──────────────────────────────────
  updateTimetableSlot: async (
    id: string,
    data: {
      teacherId?: string;
      roomNo?: string;
      periodNumber?: number;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    const res = await api.patch(`/academics/timetable/${id}`, data);
    return unwrap(res);
  },

  bulkCreateTimetable: async (
    slots: Array<{
      classId: string;
      subjectId: string;
      teacherId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      periodNumber?: number;
      roomNo?: string;
    }>
  ) => {
    const res = await api.post('/academics/timetable/bulk', slots);
    return unwrap(res);
  },

  getTeacherTimetable: async (teacherId: string): Promise<any[]> => {
    const res = await api.get(`/academics/timetable/teacher/${teacherId}`);
    return asList(unwrap(res));
  },

  getEffectiveTimetable: async (classId: string, date: string) => {
    const res = await api.get(`/academics/timetable/class/${classId}/effective`, {
      params: { date },
    });
    return unwrap<any>(res);
  },

  getTimetableOverrides: async (params: {
    from?: string;
    to?: string;
    classId?: string;
  }): Promise<any[]> => {
    const res = await api.get('/academics/timetable/overrides', { params });
    return asList(unwrap(res));
  },

  createTimetableOverride: async (data: {
    date: string;
    type: 'holiday' | 'cancelled' | 'special';
    description?: string;
    classId?: string;
    slotId?: string;
    substituteTeacherId?: string;
  }) => {
    const res = await api.post('/academics/timetable/overrides', data);
    return unwrap(res);
  },

  deleteTimetableOverride: async (id: string) => {
    const res = await api.delete(`/academics/timetable/overrides/${id}`);
    return unwrap(res);
  },

  // ── Lesson plans (extended) ───────────────────────────────
  updateLessonPlan: async (id: string, data: any) => {
    const res = await api.patch(`/academics/lesson-plans/${id}`, data);
    return unwrap(res);
  },

  deleteLessonPlan: async (id: string) => {
    const res = await api.delete(`/academics/lesson-plans/${id}`);
    return unwrap(res);
  },

  getLessonTopics: async (params?: {
    classId?: string;
    subjectId?: string;
    orphansOnly?: boolean;
  }): Promise<any[]> => {
    const res = await api.get('/academics/lesson-plans/topics', {
      params: { ...params, orphansOnly: params?.orphansOnly ? 'true' : undefined },
    });
    return asList(unwrap(res));
  },

  deleteLessonTopic: async (id: string) => {
    const res = await api.delete(`/academics/lesson-plans/topics/${id}`);
    return unwrap(res);
  },

  // ── Quizzes (extended) ────────────────────────────────────
  updateQuiz: async (id: string, data: any) => {
    const res = await api.patch(`/academics/quizzes/${id}`, data);
    return unwrap(res);
  },

  deleteQuiz: async (id: string) => {
    const res = await api.delete(`/academics/quizzes/${id}`);
    return unwrap(res);
  },

  getQuizQuestions: async (quizId: string): Promise<any[]> => {
    const res = await api.get(`/academics/quizzes/${quizId}/questions`);
    return asList(unwrap(res));
  },

  addQuizQuestion: async (quizId: string, data: any) => {
    const res = await api.post(`/academics/quizzes/${quizId}/questions`, data);
    return unwrap(res);
  },

  updateQuizQuestion: async (quizId: string, questionId: string, data: any) => {
    const res = await api.patch(`/academics/quizzes/${quizId}/questions/${questionId}`, data);
    return unwrap(res);
  },

  deleteQuizQuestion: async (quizId: string, questionId: string) => {
    const res = await api.delete(`/academics/quizzes/${quizId}/questions/${questionId}`);
    return unwrap(res);
  },

  getQuizAttempts: async (quizId: string): Promise<any[]> => {
    const res = await api.get(`/academics/quizzes/${quizId}/attempts`);
    return asList(unwrap(res));
  },

  gradeQuizAttempt: async (quizId: string, attemptId: string, score: number) => {
    const res = await api.patch(`/academics/quizzes/${quizId}/attempts/${attemptId}/grade`, {
      score,
    });
    return unwrap(res);
  },

  // ── Online classes (extended) ─────────────────────────────
  startOnlineClass: async (id: string) => {
    const res = await api.patch(`/academics/online-classes/${id}/start`);
    return unwrap(res);
  },

  endOnlineClass: async (id: string) => {
    const res = await api.patch(`/academics/online-classes/${id}/end`);
    return unwrap(res);
  },

  getOnlineClass: async (id: string) => {
    const res = await api.get(`/academics/online-classes/${id}`);
    return unwrap<any>(res);
  },

  markOnlineClassAttendance: async (
    id: string,
    records: Array<{ studentId: string; joinedAt?: string; leftAt?: string; duration?: number }>
  ) => {
    const res = await api.post(`/academics/online-classes/${id}/attendance`, { records });
    return unwrap(res);
  },
};
