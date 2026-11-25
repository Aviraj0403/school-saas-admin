import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService, ExpenseInput } from '@/services/payroll.service';
import { useAuthStore } from '@/store/useAuthStore';

export function useSalaryStructure(userId: string, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-salary-structure', userId],
    queryFn: () => payrollService.getSalaryStructure(userId),
    enabled: isAuthenticated && !!userId && enabled,
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
    mutationFn: (data: { month: number; year: number }) => payrollService.generatePayslips(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-payslips'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-finance-summary'] });
    },
  });
}

export function usePayslips(
  filters: { month?: number; year?: number; userId?: string } = {},
  enabled = true
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-payslips', filters],
    queryFn: () => payrollService.getPayslips(filters),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

/** The signed-in staff member's own payslips (no role gate on the backend). */
export function useMyPayslips(year?: number, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-my-payslips', year],
    queryFn: () => payrollService.getMyPayslips(year),
    enabled: isAuthenticated && enabled,
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
      queryClient.invalidateQueries({ queryKey: ['payroll-expenses'] });
    },
  });
}

/** School-admin only on the backend. */
export function useFinanceSummary(year?: string, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-finance-summary', year],
    queryFn: () => payrollService.getFinancialSummary(year),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function useExpenses(page: number, limit: number, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payroll-expenses', { page, limit }],
    queryFn: () => payrollService.listExpenses(page, limit),
    enabled: isAuthenticated && enabled,
    placeholderData: (prev) => prev,
    retry: false,
  });
}

function invalidateExpenses(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['payroll-expenses'] });
  qc.invalidateQueries({ queryKey: ['payroll-finance-summary'] });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseInput) => payrollService.createExpense(data),
    onSuccess: () => invalidateExpenses(qc),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseInput> }) =>
      payrollService.updateExpense(id, data),
    onSuccess: () => invalidateExpenses(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollService.deleteExpense(id),
    onSuccess: () => invalidateExpenses(qc),
  });
}
