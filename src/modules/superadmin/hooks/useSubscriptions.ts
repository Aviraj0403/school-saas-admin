import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { subscriptionService, type PlanInput } from '../services/subscription.service';

const useIsSuper = () => useAuthStore((s) => !!s.user?.isSuperAdmin);

export const useSuperDashboard = () => {
  const enabled = useIsSuper();
  return useQuery({
    queryKey: ['superadmin', 'dashboard'],
    queryFn: subscriptionService.dashboard,
    enabled,
  });
};

export const useModuleRegistry = () => {
  const enabled = useIsSuper();
  return useQuery({
    queryKey: ['superadmin', 'module-registry'],
    queryFn: subscriptionService.moduleRegistry,
    enabled,
    staleTime: 10 * 60_000,
  });
};

export const usePlans = () => {
  const enabled = useIsSuper();
  return useQuery({
    queryKey: ['superadmin', 'plans'],
    queryFn: subscriptionService.listPlans,
    enabled,
  });
};

export const useSchools = (params: { page?: number; limit?: number; status?: string } = {}) => {
  const enabled = useIsSuper();
  return useQuery({
    queryKey: ['superadmin', 'schools', params],
    queryFn: () => subscriptionService.listSchools(params),
    enabled,
    placeholderData: (prev) => prev,
  });
};

export const useSchoolDetail = (id?: string) =>
  useQuery({
    queryKey: ['superadmin', 'school', id],
    queryFn: () => subscriptionService.schoolDetail(id!),
    enabled: !!id,
  });

export const useSchoolSubscription = (id?: string) =>
  useQuery({
    queryKey: ['superadmin', 'school', id, 'subscription'],
    queryFn: () => subscriptionService.subscription(id!),
    enabled: !!id,
  });

export const useSchoolInvoices = (id?: string, page = 1) =>
  useQuery({
    queryKey: ['superadmin', 'school', id, 'invoices', page],
    queryFn: () => subscriptionService.listInvoices(id!, page),
    enabled: !!id,
  });

export const useSchoolActivity = (id?: string, page = 1) =>
  useQuery({
    queryKey: ['superadmin', 'school', id, 'activity', page],
    queryFn: () => subscriptionService.activityLogs(id!, page),
    enabled: !!id,
  });

/** Every change to a school can alter plan, modules, status — refresh all superadmin views. */
function useSuperMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin'] }),
  });
}

export const useCreatePlan = () =>
  useSuperMutation((b: PlanInput) => subscriptionService.createPlan(b));
export const useUpdatePlan = () =>
  useSuperMutation((v: { id: string; body: Partial<PlanInput> & { isActive?: boolean } }) =>
    subscriptionService.updatePlan(v.id, v.body)
  );
export const useAssignPlan = () =>
  useSuperMutation(
    (v: { id: string; body: Parameters<typeof subscriptionService.assignPlan>[1] }) =>
      subscriptionService.assignPlan(v.id, v.body)
  );
export const useToggleSchoolModule = () =>
  useSuperMutation((v: { id: string; module: string; enabled: boolean }) =>
    subscriptionService.toggleModule(v.id, v.module, v.enabled)
  );
export const useOverrideLimits = () =>
  useSuperMutation((v: { id: string; limits: Record<string, number> }) =>
    subscriptionService.overrideLimits(v.id, v.limits)
  );
export const useSuspendSchool = () =>
  useSuperMutation((v: { id: string; reason: string }) =>
    subscriptionService.suspend(v.id, v.reason)
  );
export const useReactivateSchool = () =>
  useSuperMutation((id: string) => subscriptionService.reactivate(id));
export const useCancelSchool = () =>
  useSuperMutation((v: { id: string; immediately: boolean }) =>
    subscriptionService.cancel(v.id, v.immediately)
  );
export const useCreateInvoice = () =>
  useSuperMutation(
    (v: { id: string; body: Parameters<typeof subscriptionService.createInvoice>[1] }) =>
      subscriptionService.createInvoice(v.id, v.body)
  );
export const useMarkInvoicePaid = () =>
  useSuperMutation((v: { invoiceId: string; paymentMethod?: string }) =>
    subscriptionService.markInvoicePaid(v.invoiceId, { paymentMethod: v.paymentMethod })
  );
