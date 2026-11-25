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
    mutationFn: (data: {
      name: string;
      section: string;
      maxStrength: number;
      academicYearId: string;
      teacherId?: string;
      roomNo?: string;
    }) => academicsService.createClass(data),
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
      classIds?: string[];
    }) => academicsService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
    },
  });
}

export function useAssignSubjectsToClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) =>
      academicsService.assignSubjectsToClass(classId, subjectIds),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['academics', 'subjects', 'byClass', vars.classId],
      });
      queryClient.invalidateQueries({ queryKey: ['academics', 'timetable', vars.classId] });
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
    mutationFn: (data: { name: string; headId?: string }) =>
      academicsService.createDepartment(data),
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
    mutationFn: (data: { startDate: string; endDate: string; isCurrent?: boolean }) =>
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
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { startDate?: string; endDate?: string; isCurrent?: boolean };
    }) => academicsService.updateAcademicYear(id, data),
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

// ── Classes (edit) ──
export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      academicsService.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
  });
}

// ── Timetable (extended) ──
export function useUpdateTimetableSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof academicsService.updateTimetableSlot>[1];
    }) => academicsService.updateTimetableSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'timetable'] });
    },
  });
}

export function useBulkCreateTimetable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slots: Parameters<typeof academicsService.bulkCreateTimetable>[0]) =>
      academicsService.bulkCreateTimetable(slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'timetable'] });
    },
  });
}

export function useTeacherTimetable(teacherId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'timetable', 'teacher', teacherId],
    queryFn: () => academicsService.getTeacherTimetable(teacherId as string),
    enabled: isAuthenticated && !!teacherId,
    retry: false,
  });
}

export function useEffectiveTimetable(classId?: string, date?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'timetable', 'effective', classId, date],
    queryFn: () => academicsService.getEffectiveTimetable(classId as string, date as string),
    enabled: isAuthenticated && !!classId && !!date,
    retry: false,
  });
}

export function useTimetableOverrides(
  params: { from?: string; to?: string; classId?: string },
  enabled = true
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'timetable', 'overrides', params],
    queryFn: () => academicsService.getTimetableOverrides(params),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function useCreateTimetableOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof academicsService.createTimetableOverride>[0]) =>
      academicsService.createTimetableOverride(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'timetable'] });
    },
  });
}

export function useDeleteTimetableOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteTimetableOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'timetable'] });
    },
  });
}

// ── Lesson plans (extended) ──
export function useUpdateLessonPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      academicsService.updateLessonPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'lesson-plans'] });
    },
  });
}

export function useDeleteLessonPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteLessonPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'lesson-plans'] });
    },
  });
}

export function useLessonTopics(
  params?: { classId?: string; subjectId?: string; orphansOnly?: boolean },
  enabled = true
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'lesson-plans', 'topics', params],
    queryFn: () => academicsService.getLessonTopics(params),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function useDeleteLessonTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteLessonTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'lesson-plans'] });
    },
  });
}

// ── Quizzes (extended) ──
export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => academicsService.updateQuiz(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'quizzes'] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'quizzes'] });
    },
  });
}

export function useQuizQuestions(quizId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'quiz-questions', quizId],
    queryFn: () => academicsService.getQuizQuestions(quizId as string),
    enabled: isAuthenticated && !!quizId,
    retry: false,
  });
}

export function useSaveQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      questionId,
      data,
    }: {
      quizId: string;
      questionId?: string;
      data: any;
    }) =>
      questionId
        ? academicsService.updateQuizQuestion(quizId, questionId, data)
        : academicsService.addQuizQuestion(quizId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'quiz-questions', vars.quizId] });
    },
  });
}

export function useDeleteQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, questionId }: { quizId: string; questionId: string }) =>
      academicsService.deleteQuizQuestion(quizId, questionId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'quiz-questions', vars.quizId] });
    },
  });
}

export function useQuizAttempts(quizId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'quiz-attempts', quizId],
    queryFn: () => academicsService.getQuizAttempts(quizId as string),
    enabled: isAuthenticated && !!quizId,
    retry: false,
  });
}

export function useGradeQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      attemptId,
      score,
    }: {
      quizId: string;
      attemptId: string;
      score: number;
    }) => academicsService.gradeQuizAttempt(quizId, attemptId, score),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'quiz-attempts', vars.quizId] });
    },
  });
}

// ── Online classes (extended) ──
export function useStartOnlineClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.startOnlineClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'online-classes'] });
    },
  });
}

export function useEndOnlineClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsService.endOnlineClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'online-classes'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useOnlineClassDetail(id?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['academics', 'online-classes', 'detail', id],
    queryFn: () => academicsService.getOnlineClass(id as string),
    enabled: isAuthenticated && !!id,
    retry: false,
  });
}

export function useMarkOnlineClassAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      records,
    }: {
      id: string;
      records: Parameters<typeof academicsService.markOnlineClassAttendance>[1];
    }) => academicsService.markOnlineClassAttendance(id, records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics', 'online-classes'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
