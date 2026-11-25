import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeService, FeeStructureInput, CollectFeeInput } from '@/services/fee.service';
import { useAuthStore } from '@/store/useAuthStore';

export function useFeeStructures(academicYearId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-structures', academicYearId],
    queryFn: () => feeService.getStructures(academicYearId),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FeeStructureInput) => feeService.createStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
  });
}

export function useUpdateFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeeStructureInput> }) =>
      feeService.updateStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      queryClient.invalidateQueries({ queryKey: ['student-dues'] });
      queryClient.invalidateQueries({ queryKey: ['fee-pending'] });
    },
  });
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeService.deleteStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      queryClient.invalidateQueries({ queryKey: ['student-dues'] });
      queryClient.invalidateQueries({ queryKey: ['fee-pending'] });
    },
  });
}

export function useCollectFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CollectFeeInput) => feeService.collectFee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-collections'] });
      queryClient.invalidateQueries({ queryKey: ['fee-revenue-summary'] });
      // The paying student's balance changed too
      queryClient.invalidateQueries({ queryKey: ['student-dues'] });
      queryClient.invalidateQueries({ queryKey: ['fee-pending'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-full-dashboard'] });
    },
  });
}

export function useFeeCollections(
  page: number,
  limit: number,
  filters?: { studentId?: string; status?: string; startDate?: string; endDate?: string },
  enabled = true
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-collections', { page, limit, ...filters }],
    queryFn: () => feeService.getCollections(page, limit, filters),
    enabled: isAuthenticated && enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useReconcileCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeService.reconcileCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-collections'] });
      queryClient.invalidateQueries({ queryKey: ['fee-revenue-summary'] });
      queryClient.invalidateQueries({ queryKey: ['student-dues'] });
      queryClient.invalidateQueries({ queryKey: ['fee-pending'] });
    },
  });
}

export function useRevenueSummary(academicYearId?: string, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-revenue-summary', academicYearId],
    queryFn: () => feeService.getRevenueSummary(academicYearId),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function useStudentDues(studentId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['student-dues', studentId],
    queryFn: () => feeService.getStudentDues(studentId),
    enabled: isAuthenticated && !!studentId,
    retry: false,
  });
}

export function usePendingSummary(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-pending', 'summary'],
    queryFn: () => feeService.getPendingSummary(),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function usePendingByClass(classId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-pending', 'class', classId],
    queryFn: () => feeService.getPendingByClass(classId),
    enabled: isAuthenticated && !!classId,
    retry: false,
  });
}

export function useRazorpayConfig(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['fee-razorpay-config'],
    queryFn: () => feeService.getRazorpayConfig(),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function useSaveRazorpayConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof feeService.saveRazorpayConfig>[0]) =>
      feeService.saveRazorpayConfig(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fee-razorpay-config'] }),
  });
}

export function useSendFeeReminders() {
  return useMutation({
    mutationFn: (daysAhead?: number) => feeService.sendFeeReminders(daysAhead),
  });
}
