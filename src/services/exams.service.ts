import { api } from './api';
import { Exam, CreateExamDto, ExamResult } from '@/types/api.types';
import { asList, unwrap } from '@/lib/utils';

export const examsService = {
  getExams: async (academicYearId?: string) => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    const response = await api.get<{ success: boolean; data: Exam[] }>(`/exams${params}`);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  createExam: async (data: CreateExamDto) => {
    const response = await api.post<{ success: boolean; data: Exam }>('/exams', data);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  getExamDetails: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Exam & { subjects: any[] } }>(
      `/exams/${id}`
    );
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getClassResults: async (examId: string, classId: string) => {
    const response = await api.get<{ success: boolean; data: ExamResult[] }>(
      `/exams/${examId}/results/class/${classId}`
    );
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getStudentResults: async (examId: string, studentId: string) => {
    const response = await api.get<{ success: boolean; data: ExamResult[] }>(
      `/exams/${examId}/results/student/${studentId}`
    );
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  publishExamResults: async (examId: string) => {
    const response = await api.patch<{ success: boolean }>(`/exam-controller/publish/${examId}`);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  // Exam Controller - Halls & Seating
  getHalls: async (examId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(
      `/exam-controller/halls/${examId}`
    );
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  createHall: async (data: {
    examId: string;
    hallName: string;
    capacity: number;
    invigilatorId?: string;
  }) => {
    const response = await api.post<{ success: boolean; data: any }>(
      '/exam-controller/halls',
      data
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  autoAssignSeating: async (examId: string, classIds: string[]) => {
    const response = await api.post<{ success: boolean; data: any }>(
      `/exam-controller/seating/${examId}/auto-assign`,
      { classIds }
    );
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  getSeatingChart: async (examId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(
      `/exam-controller/seating/${examId}`
    );
    const halls = ((response.data as any)?.data as any)?.items || response.data?.data || [];

    const flatSeating = [];
    for (const hall of halls) {
      if (hall.seating) {
        for (const seat of hall.seating) {
          flatSeating.push({
            hallName: hall.hallName,
            studentName: seat.student?.name || 'Unknown',
            admissionNo: seat.student?.admissionNo || '-',
            seatNo: seat.seatNumber,
          });
        }
      }
    }
    return flatSeating;
  },

  // ── Exam controller reports ────────────────────────────────────
  // Two endpoints with no UI: the teacher/class coverage report and the
  // weekly test summary a class teacher would use to spot gaps.

  getTeacherClassReport: async () => {
    const r = await api.get('/exam-controller/teacher-class-report');
    return (r.data as any)?.data?.items ?? (r.data as any)?.data ?? [];
  },

  getWeeklySummary: async (classId: string) => {
    const r = await api.get(`/exam-controller/weekly-summary/${classId}`);
    return (r.data as any)?.data ?? null;
  },

  // ── Exam CRUD / subjects / marks entry ────────────────────────
  updateExam: async (
    id: string,
    data: { name?: string; type?: string; startDate?: string; endDate?: string }
  ) => {
    const res = await api.patch(`/exams/${id}`, data);
    return unwrap(res);
  },

  deleteExam: async (id: string) => {
    const res = await api.delete(`/exams/${id}`);
    return unwrap(res);
  },

  addExamSubject: async (
    examId: string,
    data: {
      subjectId: string;
      classId: string;
      date: string;
      startTime: string;
      duration: number;
      maxMarks: number;
      passMarks: number;
    }
  ) => {
    const res = await api.post(`/exams/${examId}/subjects`, data);
    return unwrap(res);
  },

  enterResults: async (
    examId: string,
    results: Array<{
      studentId: string;
      subjectId: string;
      marksObtained?: number;
      isAbsent?: boolean;
      grade?: string;
      remarks?: string;
    }>
  ) => {
    const res = await api.post(`/exams/${examId}/results`, { results });
    return unwrap(res);
  },

  getHallList: async (examId: string): Promise<any[]> => {
    const res = await api.get(`/exam-controller/halls/${examId}`);
    return asList(unwrap(res));
  },
};
