import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  attendanceService,
  MarkBulkAttendancePayload,
  MarkSingleAttendancePayload,
} from '@/services/attendance.service';
import { useAuthStore } from '@/store/useAuthStore';

export function useAttendance(date: string, classId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['attendance', { date, classId }],
    queryFn: () => attendanceService.getAttendance(date, classId),
    enabled: isAuthenticated && !!date && !!classId,
    retry: false,
  });
}

export function useMarkBulkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkBulkAttendancePayload) => attendanceService.markBulk(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance'],
      });
    },
  });
}

export function useMarkSingleAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkSingleAttendancePayload) => attendanceService.markSingle(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance'],
      });
    },
  });
}

export function useTodayAttendance(classId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['attendance', 'today', classId],
    queryFn: () => attendanceService.getToday(classId as string),
    enabled: isAuthenticated && !!classId,
    retry: false,
  });
}

export function useClassAttendanceReport(classId?: string, startDate?: string, endDate?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['attendance', 'report', { classId, startDate, endDate }],
    queryFn: () =>
      attendanceService.getClassReport(classId as string, startDate as string, endDate as string),
    enabled: isAuthenticated && !!classId && !!startDate && !!endDate,
    retry: false,
  });
}

export function useStudentAttendanceSummary(studentId?: string, month?: number, year?: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['attendance', 'student-summary', { studentId, month, year }],
    queryFn: () =>
      attendanceService.getStudentSummary(studentId as string, month as number, year as number),
    enabled: isAuthenticated && !!studentId && !!month && !!year,
    retry: false,
  });
}
