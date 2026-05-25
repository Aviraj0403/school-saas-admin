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

export function useAutoAssignSeating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, classIds }: { examId: string; classIds: string[] }) =>
      examsService.autoAssignSeating(examId, classIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seating-chart', variables.examId] });
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
