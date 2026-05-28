import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/payroll.service';
import { useAuthStore } from '@/store/useAuthStore';

export function useSalaryStructure(userId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-salary-structure', userId],
    queryFn: () => payrollService.getSalaryStructure(userId),
    enabled: isAuthenticated && !!userId,
    retry: false,
  });
}

export function useUpsertSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      payrollService.upsertSalaryStructure(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-salary-structure', variables.userId] });
    },
  });
}

export function useGeneratePayslips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: number; year: number }) =>
      payrollService.generatePayslips(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-payslips'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-finance-summary'] });
    },
  });
}

export function usePayslips(filters: { month?: number; year?: number; userId?: string } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-payslips', filters],
    queryFn: () => payrollService.getPayslips(filters),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function usePayPayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod: string }) =>
      payrollService.payPayslip(id, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-payslips'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-finance-summary'] });
    },
  });
}

export function useFinanceSummary(year?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-finance-summary', year],
    queryFn: () => payrollService.getFinancialSummary(year),
    enabled: isAuthenticated,
    retry: false,
  });
}
