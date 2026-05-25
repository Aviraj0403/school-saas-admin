import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsService } from '@/services/academics.service';
import { useAuthStore } from '@/store/useAuthStore';

export function useClasses(page = 1, limit = 10) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'classes', { page, limit }],
    queryFn: () => academicsService.getClasses(page, limit),
    enabled: isAuthenticated,
    placeholderData: (prev) => prev,
    retry: false,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; section: string; capacity: number; teacherId?: string }) =>
      academicsService.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
  });
}

export function useSubjects(classId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'subjects', classId],
    queryFn: () => academicsService.getSubjects(classId),
    enabled: isAuthenticated && !!classId,
    retry: false,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; code: string; classId: string; teacherId?: string }) =>
      academicsService.createSubject(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'subjects', vars.classId] });
    },
  });
}

export function useTimetable(classId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'timetable', classId],
    queryFn: () => academicsService.getTimetable(classId),
    enabled: isAuthenticated && !!classId,
    retry: false,
  });
}

export function useCreateTimetableEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      classId: string;
      subjectId: string;
      teacherId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) => academicsService.createTimetableEntry(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'timetable', vars.classId] });
    },
  });
}
