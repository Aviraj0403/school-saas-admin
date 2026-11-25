import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsService } from '@/services/exams.service';
import { useAuthStore } from '@/store/useAuthStore';
import { CreateExamDto } from '@/types/api.types';

export function useExamsList(academicYearId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['exams', academicYearId],
    queryFn: () => examsService.getExams(academicYearId),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExamDto) => examsService.createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useExamResults(examId: string, classId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['exam-results', { examId, classId }],
    queryFn: () => examsService.getClassResults(examId, classId),
    enabled: isAuthenticated && !!examId && !!classId,
    retry: false,
  });
}

export function useStudentExamResults(examId: string, studentId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['student-exam-results', { examId, studentId }],
    queryFn: () => examsService.getStudentResults(examId, studentId),
    enabled: isAuthenticated && !!examId && !!studentId,
    retry: false,
  });
}

export function useAutoAssignSeating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, classIds }: { examId: string; classIds: string[] }) =>
      examsService.autoAssignSeating(examId, classIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seating-chart', variables.examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-halls', variables.examId] });
    },
  });
}

export function useSeatingChart(examId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['seating-chart', examId],
    queryFn: () => examsService.getSeatingChart(examId),
    enabled: isAuthenticated && !!examId,
    retry: false,
  });
}

export function useExamDetails(examId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['exam-details', examId],
    queryFn: () => examsService.getExamDetails(examId as string),
    enabled: isAuthenticated && !!examId,
    retry: false,
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; type?: string; startDate?: string; endDate?: string };
    }) => examsService.updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-details'] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsService.deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function usePublishExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsService.publishExamResults(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-details'] });
    },
  });
}

export function useAddExamSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      data,
    }: {
      examId: string;
      data: Parameters<typeof examsService.addExamSubject>[1];
    }) => examsService.addExamSubject(examId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['exam-details', vars.examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useEnterExamResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      results,
    }: {
      examId: string;
      results: Parameters<typeof examsService.enterResults>[1];
    }) => examsService.enterResults(examId, results),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
      queryClient.invalidateQueries({ queryKey: ['student-exam-results'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      void vars;
    },
  });
}

export function useExamHalls(examId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['exam-halls', examId],
    queryFn: () => examsService.getHallList(examId as string),
    enabled: isAuthenticated && !!examId,
    retry: false,
  });
}

export function useCreateHall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      examId: string;
      hallName: string;
      capacity: number;
      invigilatorId?: string;
    }) => examsService.createHall(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['exam-halls', vars.examId] });
    },
  });
}
