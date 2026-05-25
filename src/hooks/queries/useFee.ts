import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeService } from '@/services/fee.service';
import { useAuthStore } from '@/store/useAuthStore';
import { CollectFeeDto } from '@/types/api.types';

export function useFeeStructures(academicYear?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-structures', academicYear],
    queryFn: () => feeService.getStructures(academicYear),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => feeService.createStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
  });
}

export function useCollectFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CollectFeeDto) => feeService.collectFee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-collections'] });
      queryClient.invalidateQueries({ queryKey: ['fee-revenue-summary'] });
    },
  });
}

export function useFeeCollections(
  page: number,
  limit: number,
  filters?: { studentId?: string; status?: string },
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-collections', { page, limit, ...filters }],
    queryFn: () => feeService.getCollections(page, limit, filters),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useRevenueSummary(academicYear?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-revenue-summary', academicYear],
    queryFn: () => feeService.getRevenueSummary(academicYear),
    enabled: isAuthenticated,
    retry: false,
  });
}
