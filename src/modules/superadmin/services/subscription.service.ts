import { api } from '@/services/api';
import { unwrap, asList } from '@/lib/utils';

export interface PlanLimits {
  students?: number;
  staff?: number;
  storage_mb?: number;
  whatsapp_month?: number;
  [k: string]: number | undefined;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number | string;
  billingCycle: string;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  trialDays?: number;
  graceDays?: number;
  modules: string[];
  limits: PlanLimits;
  features: string[];
}

export interface PlanInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  billingCycle?: string;
  modules: string[];
  limits: Record<string, number>;
  features: string[];
  isPublic?: boolean;
  sortOrder?: number;
}

export interface ModuleDef {
  key: string;
  label: string;
  description: string;
  group: string;
  core?: boolean;
  tier?: string;
  dependsOn?: string[];
}

export interface ModuleRegistry {
  groups: Record<string, string>;
  modules: ModuleDef[];
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  plan?: Plan;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED' | string;
  billingCycle: string;
  amount: number | string;
  currency?: string;
  customModules: string[];
  customLimits: Record<string, number>;
  customFeatures: string[];
  trialEndsAt?: string | null;
  currentPeriodStart?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  nextBillingAt?: string | null;
  notes?: string | null;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNo: string;
  amount: number | string;
  currency?: string;
  status: string;
  dueDate: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface SchoolRow {
  id: string;
  name: string;
  subdomain: string;
  projectCode?: string;
  adminEmail?: string;
  plan?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  activeModules?: string[];
  createdAt: string;
  theme?: any;
  subscription?: Subscription | null;
  _count?: { students?: number; users?: number; classes?: number };
}

export interface SuperDashboard {
  totals: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
  };
  planBreakdown: Array<{ plan: string; count: number }>;
  recentSignups: SchoolRow[];
  pendingInvoices: number;
}

const paged = <T>(res: any): { items: T[]; meta: any } => {
  const d = unwrap(res);
  return {
    items: asList<T>(d),
    meta: d?.meta ?? { total: asList(d).length, page: 1, limit: 20, totalPages: 1 },
  };
};

export const subscriptionService = {
  dashboard: async (): Promise<SuperDashboard> => unwrap(await api.get('/superadmin/dashboard')),

  moduleRegistry: async (): Promise<ModuleRegistry> => unwrap(await api.get('/modules/registry')),

  // Plans
  listPlans: async (): Promise<Plan[]> => asList<Plan>(unwrap(await api.get('/superadmin/plans'))),
  createPlan: async (body: PlanInput) => unwrap(await api.post('/superadmin/plans', body)),
  updatePlan: async (id: string, body: Partial<PlanInput> & { isActive?: boolean }) =>
    unwrap(await api.patch(`/superadmin/plans/${id}`, body)),

  // Schools
  listSchools: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && v !== '' && q.append(k, String(v)));
    return paged<SchoolRow>(await api.get(`/superadmin/schools?${q}`));
  },
  schoolDetail: async (id: string): Promise<SchoolRow> =>
    unwrap(await api.get(`/superadmin/schools/${id}`)),
  subscription: async (id: string): Promise<Subscription | null> => {
    try {
      return unwrap(await api.get(`/superadmin/schools/${id}/subscription`));
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },
  assignPlan: async (
    id: string,
    body: {
      planId: string;
      billingCycle?: string;
      customPrice?: number;
      trialDays?: number;
      notes?: string;
    }
  ) => unwrap(await api.post(`/superadmin/schools/${id}/assign-plan`, body)),
  toggleModule: async (id: string, module: string, enabled: boolean) =>
    unwrap(await api.patch(`/superadmin/schools/${id}/modules/toggle`, { module, enabled })),
  overrideLimits: async (id: string, limits: Record<string, number>) =>
    unwrap(await api.patch(`/superadmin/schools/${id}/limits`, { limits })),
  suspend: async (id: string, reason: string) =>
    unwrap(await api.patch(`/superadmin/schools/${id}/suspend`, { reason })),
  reactivate: async (id: string) => unwrap(await api.patch(`/superadmin/schools/${id}/reactivate`)),
  cancel: async (id: string, immediately: boolean) =>
    unwrap(await api.patch(`/superadmin/schools/${id}/cancel?immediately=${immediately}`)),

  // Invoices / logs
  listInvoices: async (id: string, page = 1, limit = 20) =>
    paged<Invoice>(await api.get(`/superadmin/schools/${id}/invoices?page=${page}&limit=${limit}`)),
  createInvoice: async (
    id: string,
    body: { amount: number; dueDate: string; description?: string; paymentMethod?: string }
  ) => unwrap(await api.post(`/superadmin/schools/${id}/invoices`, body)),
  markInvoicePaid: async (invoiceId: string, body: { paymentMethod?: string } = {}) =>
    unwrap(await api.patch(`/superadmin/invoices/${invoiceId}/mark-paid`, body)),
  activityLogs: async (id: string, page = 1, limit = 20) =>
    paged<any>(
      await api.get(`/superadmin/schools/${id}/activity-logs?page=${page}&limit=${limit}`)
    ),
};
