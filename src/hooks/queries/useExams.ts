import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsService } from '@/services/exams.service';
import { CreateExamDto } from '@/types/api.types';

export function useExamsList(academicYearId?: string) {
  return useQuery({
    queryKey: ['exams', academicYearId],
    queryFn: () => examsService.getExams(academicYearId),
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
  return useQuery({
    queryKey: ['exam-results', { examId, classId }],
    queryFn: () => examsService.getClassResults(examId, classId),
    enabled: !!examId && !!classId,
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
  return useQuery({
    queryKey: ['seating-chart', examId],
    queryFn: () => examsService.getSeatingChart(examId),
    enabled: !!examId,
  });
}
