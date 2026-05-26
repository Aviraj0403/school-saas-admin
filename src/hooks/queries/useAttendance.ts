import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, MarkBulkAttendancePayload, MarkSingleAttendancePayload } from '@/services/attendance.service';
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
    mutationFn: (data: MarkBulkAttendancePayload) =>
      attendanceService.markBulk(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', { date: variables.date, classId: variables.classId }],
      });
    },
  });
}

export function useMarkSingleAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkSingleAttendancePayload) =>
      attendanceService.markSingle(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', { date: variables.date, classId: variables.classId }],
      });
    },
  });
}
