import { api } from './api';
import { asList, unwrap } from '@/lib/utils';

export interface FeeStructureInput {
  name: string;
  description?: string;
  amount: number;
  lateFee?: number;
  dueDate: string;
  academicYearId: string;
  applicableTo?: 'all' | 'class' | 'category';
  classIds?: string[];
  categories?: string[];
  isActive?: boolean;
}

export interface CollectFeeInput {
  studentId: string;
  feeStructureId?: string;
  amount: number;
  lateFeeAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CHEQUE' | 'DD' | 'NEFT' | 'ONLINE';
  note?: string;
}

export interface PendingClassRow {
  classId: string;
  className: string;
  section: string;
  pendingCount: number;
  pendingAmount: number;
}

export interface PendingStudentRow {
  studentId: string;
  name: string;
  admissionNo: string;
  rollNo: string | null;
  classId: string;
  className: string;
  section: string;
  totalDue: number;
}

export interface RazorpayConfigView {
  keyId?: string | null;
  keySecret?: string | null; // always masked by the backend
  webhookSecret?: string | null; // always masked by the backend
  displayName?: string | null;
  isActive?: boolean;
}

export const feeService = {
  getStructures: async (academicYearId?: string) => {
    const res = await api.get('/fee/structures', {
      params: academicYearId ? { academicYearId } : {},
    });
    return asList(unwrap(res));
  },

  createStructure: async (data: FeeStructureInput) =>
    unwrap(await api.post('/fee/structures', data)),

  updateStructure: async (id: string, data: Partial<FeeStructureInput>) =>
    unwrap(await api.patch(`/fee/structures/${id}`, data)),

  deleteStructure: async (id: string) => unwrap(await api.delete(`/fee/structures/${id}`)),

  collectFee: async (data: CollectFeeInput) => unwrap(await api.post('/fee/collect', data)),

  getCollections: async (
    page = 1,
    limit = 10,
    filters?: { studentId?: string; status?: string; startDate?: string; endDate?: string }
  ) => {
    const res = await api.get('/fee/collections', { params: { page, limit, ...filters } });
    const body = unwrap<any>(res);
    const items = asList(body);
    const meta = body?.meta ??
      body?.data?.meta ?? { total: items.length, page, limit, totalPages: 1 };
    return { items, meta, data: { items, meta } };
  },

  reconcileCollection: async (id: string) =>
    unwrap(await api.post(`/fee/collections/${id}/reconcile`)),

  getStudentDues: async (studentId: string) =>
    unwrap<any>(await api.get(`/fee/student/${studentId}/dues`)),

  getRevenueSummary: async (academicYearId?: string) =>
    unwrap<any>(
      await api.get('/fee/revenue/summary', { params: academicYearId ? { academicYearId } : {} })
    ),

  getPendingSummary: async (academicYearId?: string): Promise<PendingClassRow[]> =>
    asList<PendingClassRow>(
      unwrap(
        await api.get('/fee/pending/summary', { params: academicYearId ? { academicYearId } : {} })
      )
    ),

  getPendingByClass: async (
    classId: string,
    academicYearId?: string
  ): Promise<PendingStudentRow[]> =>
    asList<PendingStudentRow>(
      unwrap(
        await api.get(`/fee/pending/class/${classId}`, {
          params: academicYearId ? { academicYearId } : {},
        })
      )
    ),

  getRazorpayConfig: async (): Promise<RazorpayConfigView | null> =>
    (unwrap<any>(await api.get('/fee/razorpay-config')) as RazorpayConfigView | null) ?? null,

  saveRazorpayConfig: async (data: {
    keyId?: string;
    keySecret?: string;
    webhookSecret?: string;
    displayName?: string;
    isActive?: boolean;
  }) => unwrap<RazorpayConfigView>(await api.patch('/fee/razorpay-config', data)),

  sendFeeReminders: async (daysAhead = 3) =>
    unwrap<any>(await api.post('/whatsapp/notify/fee-reminders', null, { params: { daysAhead } })),
};
