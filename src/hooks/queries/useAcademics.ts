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
    mutationFn: (data: { name: string; section: string; maxStrength: number; academicYearId: string; teacherId?: string; roomNo?: string }) =>
      academicsService.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
  });
}

// Subjects by class (via timetable alias)
export function useSubjects(classId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'subjects', 'byClass', classId],
    queryFn: () => academicsService.getSubjectsByClass(classId),
    enabled: isAuthenticated && !!classId,
    retry: false,
  });
}

// All subjects globally (optionally filtered by department)
export function useAllSubjects(departmentId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'subjects', 'all', departmentId],
    queryFn: () => academicsService.getSubjects(departmentId),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      code: string;
      type?: string;
      departmentId?: string;
      maxMarks?: number;
      passMarks?: number;
    }) => academicsService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
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

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean } }) =>
      academicsService.updateAcademicYear(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['academics', 'academic-years', 'current'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; headId?: string } }) =>
      academicsService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteTimetableSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteTimetableSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'timetable'] });
    },
  });
}

// ── Lesson Plans ──
export function useLessonPlans(classId?: string, subjectId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'lesson-plans', classId, subjectId],
    queryFn: () => academicsService.getLessonPlans(classId, subjectId),
    enabled: isAuthenticated,
  });
}

export function useCreateLessonPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => academicsService.createLessonPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'lesson-plans'] });
    },
  });
}

// ── Quizzes ──
export function useQuizzes(classId?: string, subjectId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'quizzes', classId, subjectId],
    queryFn: () => academicsService.getQuizzes(classId, subjectId),
    enabled: isAuthenticated,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => academicsService.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'quizzes'] });
    },
  });
}

// ── Online Classes ──
export function useOnlineClasses(classId?: string, subjectId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'online-classes', classId, subjectId],
    queryFn: () => academicsService.getOnlineClasses(classId, subjectId),
    enabled: isAuthenticated,
  });
}

export function useCreateOnlineClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => academicsService.createOnlineClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'online-classes'] });
    },
  });
}
