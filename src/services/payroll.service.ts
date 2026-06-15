import { api } from './api';

export interface SalaryStructure {
  id?: string;
  userId: string;
  baseSalary: number;
  hra: number;
  allowance: number;
  deductions: number;
}

export interface Payslip {
  id: string;
  userId: string;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: number;
  hra: number;
  allowance: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PAID';
  paymentMethod?: string;
  paidAt?: string;
}

export interface FinanceSummary {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyBreakdown: {
    month: number;
    revenue: number;
    expenses: number;
  }[];
}

export const payrollService = {
  getSalaryStructure: async (userId: string) => {
    const response = await api.get<{ success: boolean; data: SalaryStructure }>(`/hr-payroll/salary-structure/${userId}`);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  upsertSalaryStructure: async (userId: string, data: Omit<SalaryStructure, 'userId'>) => {
    const response = await api.post<{ success: boolean; data: SalaryStructure }>(`/hr-payroll/salary-structure/${userId}`, data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  generatePayslips: async (data: { month: number; year: number }) => {
    const response = await api.post<{ success: boolean; data: any }>('/hr-payroll/payslips/generate', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getPayslips: async (filters: { month?: number; year?: number; userId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.userId) params.append('userId', filters.userId);
    
    const response = await api.get<{ success: boolean; data: Payslip[] }>(`/hr-payroll/payslips?${params}`);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  payPayslip: async (id: string, paymentMethod: string) => {
    const response = await api.post<{ success: boolean }>(`/hr-payroll/payslips/${id}/pay`, { paymentMethod });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getFinancialSummary: async (year?: string) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    const response = await api.get<{ success: boolean; data: FinanceSummary }>(`/hr-payroll/finance/summary?${params}`);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },
};




