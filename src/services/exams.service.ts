import { api } from './api';
import { ApiResponse, Exam, CreateExamDto, ExamResult } from '@/types/api.types';

export const examsService = {
  getExams: async (academicYearId?: string) => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    const response = await api.get<{ success: boolean; data: Exam[] }>(`/exams${params}`);
    return response.data;
  },

  createExam: async (data: CreateExamDto) => {
    const response = await api.post<{ success: boolean; data: Exam }>('/exams', data);
    return response.data;
  },

  getExamDetails: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Exam & { subjects: any[] } }>(`/exams/${id}`);
    return response.data.data;
  },

  getClassResults: async (examId: string, classId: string) => {
    const response = await api.get<{ success: boolean; data: ExamResult[] }>(`/exams/${examId}/results/class/${classId}`);
    return response.data.data;
  },

  getStudentResults: async (examId: string, studentId: string) => {
    const response = await api.get<{ success: boolean; data: ExamResult[] }>(`/exams/${examId}/results/student/${studentId}`);
    return response.data.data;
  },

  publishExamResults: async (examId: string) => {
    const response = await api.patch<{ success: boolean }>(`/exams/${examId}/publish`);
    return response.data;
  },

  // Exam Controller - Halls & Seating
  getHalls: async (examId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/exam-controller/halls/${examId}`);
    return response.data.data;
  },

  createHall: async (data: { examId: string; hallName: string; capacity: number; invigilatorId?: string }) => {
    const response = await api.post<{ success: boolean; data: any }>('/exam-controller/halls', data);
    return response.data;
  },

  autoAssignSeating: async (examId: string, classIds: string[]) => {
    const response = await api.post<{ success: boolean; data: any }>(`/exam-controller/seating/${examId}/auto-assign`, { classIds });
    return response.data;
  },

  getSeatingChart: async (examId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/exam-controller/seating/${examId}`);
    return response.data.data;
  }
};
