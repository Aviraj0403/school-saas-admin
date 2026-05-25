import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { useAuthStore } from '@/store/useAuthStore';
import { MarkAttendanceDto } from '@/types/api.types';

export function useAttendance(date: string, classId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['attendance', { date, classId }],
    queryFn: () => attendanceService.getAttendance(date, classId),
    enabled: isAuthenticated && !!date,
    retry: false,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkAttendanceDto | MarkAttendanceDto[]) =>
      attendanceService.markAttendance(data),
    onSuccess: (_, variables) => {
      const dateToInvalidate = Array.isArray(variables)
        ? variables[0]?.date
        : variables.date;
      if (dateToInvalidate) {
        queryClient.invalidateQueries({ queryKey: ['attendance', { date: dateToInvalidate }] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      }
    },
  });
}
