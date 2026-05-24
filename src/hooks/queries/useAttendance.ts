import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { MarkAttendanceDto } from '@/types/api.types';

export function useAttendance(date: string, classId?: string) {
  return useQuery({
    queryKey: ['attendance', { date, classId }],
    queryFn: () => attendanceService.getAttendance(date, classId),
    enabled: !!date,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkAttendanceDto | MarkAttendanceDto[]) => attendanceService.markAttendance(data),
    onSuccess: (_, variables) => {
      // Invalidate attendance query for the specific date so it refetches
      // If variables is an array, we take the date of the first item
      const dateToInvalidate = Array.isArray(variables) ? variables[0]?.date : variables.date;
      if (dateToInvalidate) {
        queryClient.invalidateQueries({ queryKey: ['attendance', { date: dateToInvalidate }] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      }
    },
  });
}
