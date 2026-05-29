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
    mutationFn: (data: { name: string; section: string; maxStrength: number; academicYearId: string; teacherId?: string }) =>
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

export function useAcademicYears() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'academic-years'],
    queryFn: () => academicsService.getAcademicYears(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCurrentAcademicYear() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'academic-years', 'current'],
    queryFn: () => academicsService.getCurrentAcademicYear(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useDepartmentsList() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'departments'],
    queryFn: () => academicsService.getDepartments(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; headId?: string }) => academicsService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'departments'] });
      // Invalidate the staff's departments list query as well!
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) =>
      academicsService.createAcademicYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['academics', 'academic-years', 'current'] });
    },
  });
}



