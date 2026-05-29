import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';

export function useLeavesList(page: number, limit: number, filters?: { applicantId?: string; applicantType?: string; status?: string }) {
  return useQuery({
    queryKey: ['leaves', { page, limit, ...filters }],
    queryFn: () => leaveService.getLeaves(page, limit, filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { applicantId: string; applicantType: 'STUDENT' | 'STAFF'; startDate: string; endDate: string; reason: string; leaveType?: string }) => 
      leaveService.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leaveService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => leaveService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useLeaveBalance(applicantId: string, year?: number) {
  return useQuery({
    queryKey: ['leave-balance', { applicantId, year }],
    queryFn: () => leaveService.getBalance(applicantId, year),
    enabled: !!applicantId,
  });
}
