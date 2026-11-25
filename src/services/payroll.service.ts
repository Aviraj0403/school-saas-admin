import { api } from './api';
import { asList, unwrap } from '@/lib/utils';

export interface SalaryStructure {
  id?: string;
  userId: string;
  baseSalary: number;
  hra: number;
  allowance: number;
  deductions: number;
  user?: { name: string; email: string };
}

export interface Payslip {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  month: number;
  year: number;
  baseSalary: number | string;
  hra: number | string;
  allowance: number | string;
  deductions: number | string;
  unpaidLeaves?: number;
  leaveDeduction?: number | string;
  netSalary: number | string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod?: string | null;
  paidAt?: string | null;
}

export interface FinanceSummary {
  year: number;
  totals: { totalRevenue: number; totalExpense: number; netProfit: number };
  monthlyBreakdown: {
    month: number;
    monthName: string;
    revenue: number;
    expense: number;
    netProfit: number;
  }[];
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number | string;
  date: string;
  description?: string | null;
  vendor?: string | null;
  referenceNo?: string | null;
}

export type ExpenseInput = {
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  vendor?: string;
  referenceNo?: string;
};

export const payrollService = {
  getSalaryStructure: async (userId: string) =>
    unwrap<SalaryStructure>(await api.get(`/hr-payroll/salary-structure/${userId}`)),

  upsertSalaryStructure: async (
    userId: string,
    data: Omit<SalaryStructure, 'userId' | 'id' | 'user'>
  ) => unwrap(await api.post(`/hr-payroll/salary-structure/${userId}`, data)),

  generatePayslips: async (data: { month: number; year: number }) =>
    unwrap<any>(await api.post('/hr-payroll/payslips/generate', data)),

  getPayslips: async (filters: { month?: number; year?: number; userId?: string } = {}) =>
    asList<Payslip>(unwrap(await api.get('/hr-payroll/payslips', { params: filters }))),

  getMyPayslips: async (year?: number) =>
    asList<Payslip>(
      unwrap(await api.get('/hr-payroll/payslips/me', { params: year ? { year } : {} }))
    ),

  payPayslip: async (id: string, paymentMethod: string) =>
    unwrap(await api.post(`/hr-payroll/payslips/${id}/pay`, { paymentMethod })),

  getFinancialSummary: async (year?: string) =>
    unwrap<FinanceSummary>(
      await api.get('/hr-payroll/finance/summary', { params: year ? { year } : {} })
    ),

  listExpenses: async (page = 1, limit = 20) => {
    const body = unwrap<any>(await api.get('/hr-payroll/expenses', { params: { page, limit } }));
    const items = asList<Expense>(body);
    const meta = body?.meta ??
      body?.data?.meta ?? { total: items.length, page, limit, totalPages: 1 };
    return { items, meta };
  },

  createExpense: async (data: ExpenseInput) => unwrap(await api.post('/hr-payroll/expenses', data)),

  updateExpense: async (id: string, data: Partial<ExpenseInput>) =>
    unwrap(await api.patch(`/hr-payroll/expenses/${id}`, data)),

  deleteExpense: async (id: string) => unwrap(await api.delete(`/hr-payroll/expenses/${id}`)),
};
