import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { familyService } from '@/services/family.service';
import { useAuthStore } from '@/store/useAuthStore';

const useEnabled = (extra: boolean = true) => useAuthStore((s) => s.isAuthenticated) && extra;

export const useFamilyChildren = () => {
  const enabled = useEnabled();
  return useQuery({
    queryKey: ['family', 'children'],
    queryFn: familyService.getChildren,
    enabled,
    retry: false,
    staleTime: 5 * 60_000,
  });
};

export const useFamilyAttendance = (studentId: string, month: number, year: number) => {
  const enabled = useEnabled(!!studentId);
  return useQuery({
    queryKey: ['family', 'attendance', studentId, month, year],
    queryFn: () => familyService.getAttendance(studentId, month, year),
    enabled,
    retry: false,
  });
};

export const useFamilyTimetable = (studentId: string) => {
  const enabled = useEnabled(!!studentId);
  return useQuery({
    queryKey: ['family', 'timetable', studentId],
    queryFn: () => familyService.getTimetable(studentId),
    enabled,
    retry: false,
  });
};

export const useFamilyHomework = (studentId: string) => {
  const enabled = useEnabled(!!studentId);
  return useQuery({
    queryKey: ['family', 'homework', studentId],
    queryFn: () => familyService.getHomework(studentId),
    enabled,
    retry: false,
  });
};

export const useFamilyResults = (studentId: string) => {
  const enabled = useEnabled(!!studentId);
  return useQuery({
    queryKey: ['family', 'results', studentId],
    queryFn: () => familyService.getResults(studentId),
    enabled,
    retry: false,
  });
};

export const useFamilyFees = (studentId: string) => {
  const enabled = useEnabled(!!studentId);
  return useQuery({
    queryKey: ['family', 'fees', studentId],
    queryFn: () => familyService.getFees(studentId),
    enabled,
    retry: false,
  });
};

export const useFamilyPayments = (studentId: string) => {
  const enabled = useEnabled(!!studentId);
  return useQuery({
    queryKey: ['family', 'payments', studentId],
    queryFn: () => familyService.getPayments(studentId),
    enabled,
    retry: false,
  });
};

export const useInitiateFamilyPayment = () =>
  useMutation({
    mutationFn: (v: { studentId: string; amount?: number }) =>
      familyService.initiatePayment(v.studentId, v.amount),
  });

export const useVerifyFamilyPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: familyService.verifyPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', 'fees'] });
      qc.invalidateQueries({ queryKey: ['family', 'payments'] });
    },
  });
};

export const useSubmitFamilyHomework = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      assignmentId: string;
      studentId: string;
      notes: string;
      file?: File | null;
    }) => familyService.submitHomework(v.assignmentId, v.studentId, v.notes, v.file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', 'homework'] });
    },
  });
};

export const useStudentTransport = (studentId: string, enabledFlag = true) => {
  const enabled = useEnabled(!!studentId && enabledFlag);
  return useQuery({
    queryKey: ['family', 'transport', studentId],
    queryFn: () => familyService.getTransport(studentId),
    enabled,
    retry: false,
  });
};

export const useVehicleLocation = (vehicleId?: string | null) => {
  const enabled = useEnabled(!!vehicleId);
  return useQuery({
    queryKey: ['family', 'vehicle-location', vehicleId],
    queryFn: () => familyService.getVehicleLocation(vehicleId as string),
    enabled,
    retry: false,
    refetchInterval: 30_000,
  });
};

export const useLibraryIssues = (studentId: string) => {
  const enabled = useEnabled(!!studentId);
  return useQuery({
    queryKey: ['family', 'library', studentId],
    queryFn: () => familyService.getLibraryIssues(studentId),
    enabled,
    retry: false,
  });
};

export const usePortalOnlineClasses = (classId?: string | null) => {
  const enabled = useEnabled(!!classId);
  return useQuery({
    queryKey: ['family', 'online-classes', classId],
    queryFn: () => familyService.getOnlineClasses(classId as string),
    enabled,
    retry: false,
  });
};

export const usePortalQuizzes = (classId?: string | null) => {
  const enabled = useEnabled(!!classId);
  return useQuery({
    queryKey: ['family', 'quizzes', classId],
    queryFn: () => familyService.getQuizzes(classId as string),
    enabled,
    retry: false,
  });
};

export const useQuizQuestions = (quizId?: string | null) => {
  const enabled = useEnabled(!!quizId);
  return useQuery({
    queryKey: ['family', 'quiz-questions', quizId],
    queryFn: () => familyService.getQuizQuestions(quizId as string),
    enabled,
    retry: false,
  });
};

export const useStartQuizAttempt = () =>
  useMutation({
    mutationFn: (v: { quizId: string; studentId: string }) =>
      familyService.startQuizAttempt(v.quizId, v.studentId),
  });

export const useSubmitQuizAttempt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { quizId: string; studentId: string; answers: Record<string, any> }) =>
      familyService.submitQuizAttempt(v.quizId, v.studentId, v.answers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family', 'quizzes'] }),
  });
};

export const useFamilyAnnouncements = (targetRole: string, limit = 5) => {
  const enabled = useEnabled();
  return useQuery({
    queryKey: ['family', 'announcements', targetRole, limit],
    queryFn: () => familyService.getAnnouncements(targetRole, limit),
    enabled,
    retry: false,
  });
};

export const useFamilyEvents = () => {
  const enabled = useEnabled();
  return useQuery({
    queryKey: ['family', 'events'],
    queryFn: familyService.getEvents,
    enabled,
    retry: false,
  });
};
