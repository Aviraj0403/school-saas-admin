'use client';

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { errorMessage } from '@/lib/errorMessage';
import { formatDate } from '@/lib/format';
import { useCreateTenant } from '@/modules/superadmin/hooks/useTenants';
import {
  useSchools,
  useSchoolDetail,
  usePlans,
  useSchoolSubscription,
  useSchoolInvoices,
  useSchoolActivity,
  useAssignPlan,
  useOverrideLimits,
  useSuspendSchool,
  useReactivateSchool,
  useCancelSchool,
  useCreateInvoice,
  useMarkInvoicePaid,
} from '@/modules/superadmin/hooks/useSubscriptions';
import { SchoolModuleMatrix } from '@/modules/superadmin/components/SchoolModuleMatrix';
import type { SchoolRow } from '@/modules/superadmin/services/subscription.service';
import { statusVariant, money } from '@/modules/superadmin/statusUi';
import {
  Plus,
  Eye,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface Created {
  schoolName: string;
  adminEmail: string;
  password: string;
}

type Tab = 'overview' | 'modules' | 'limits' | 'invoices' | 'activity';

export default function TenantsPage() {
  const qc = useQueryClient();
  const { switchTenant, activeTenant } = useAuthStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 12;
  const { data, isPending, error } = useSchools({ page, limit, status: statusFilter || undefined });
  const { data: plans = [] } = usePlans();
  const createMutation = useCreateTenant();

  const [baseDomain, setBaseDomain] = useState('.jdinfotechsolutions.in');
  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2 && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      setBaseDomain(`.${parts.slice(1).join('.')}`);
    }
  }, []);

  const schools = data?.items ?? [];
  const totalPages = data?.meta?.totalPages || 1;

  // --- onboarding ---
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const blank = {
    name: '',
    subdomain: '',
    adminEmail: '',
    adminPhone: '',
    planSlug: '',
    trialDays: '14',
    city: '',
    state: '',
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (!form.planSlug && plans.length > 0) {
      const first = plans.find((p) => p.isActive) ?? plans[0];
      setForm((f) => ({ ...f, planSlug: first.slug, trialDays: String(first.trialDays ?? 14) }));
    }
  }, [plans, form.planSlug]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        name: form.name.trim(),
        subdomain: form.subdomain,
        adminEmail: form.adminEmail.trim(),
        adminPhone: form.adminPhone.trim() || undefined,
        planSlug: form.planSlug || undefined,
        trialDays: Number(form.trialDays) || 0,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
      },
      {
        onSuccess: () => {
          // The backend seeds the school admin with this password and flags mustChangePassword.
          setCreated({
            schoolName: form.name,
            adminEmail: form.adminEmail,
            password: 'School@123',
          });
          setShowCreate(false);
          setForm({ ...blank, planSlug: form.planSlug, trialDays: form.trialDays });
          qc.invalidateQueries({ queryKey: ['superadmin'] });
        },
        onError: (err) => toast.error(errorMessage(err, 'Could not onboard school')),
      }
    );
  };

  // --- drawer ---
  const [selected, setSelected] = useState<SchoolRow | null>(null);

  const switchInto = (t: SchoolRow) => {
    switchTenant({
      id: t.id,
      name: t.name,
      activeModules: t.activeModules ?? [],
      projectCode: t.projectCode,
      subdomain: t.subdomain,
      theme: t.theme,
    });
    qc.clear();
    toast.success(`Switching to ${t.name}...`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  const planLabel = (t: SchoolRow) => t.subscription?.plan?.name ?? t.plan ?? '-';
  const status = (t: SchoolRow) =>
    t.subscription?.status ?? (t.isSuspended ? 'SUSPENDED' : 'NO SUBSCRIPTION');

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Tenants Directory" subtitle="Superadmin" />

      <div className="flex min-w-0 flex-col gap-5 pb-6 animate-fade-in">
        <PageHeader
          title="Tenant Schools"
          description="Onboard schools, manage plans, modules, limits, billing and lifecycle."
          actions={
            <>
              <Select
                className="w-full sm:w-44"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: 'All statuses', value: '' },
                  { label: 'Trial', value: 'TRIAL' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Past due', value: 'PAST_DUE' },
                  { label: 'Suspended', value: 'SUSPENDED' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ]}
              />
              <Button className="w-full sm:w-auto" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Onboard New School
              </Button>
            </>
          }
        />

        {isPending && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-sm text-rose-600">{errorMessage(error, 'Could not load schools')}</p>
        )}
        {!isPending && !error && schools.length === 0 && (
          <p className="surface-card p-8 text-center text-sm text-muted-foreground">
            No schools match this filter. Try another status or onboard a new school.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((t) => (
            <div
              key={t.id}
              className={`surface-card flex min-w-0 flex-col justify-between gap-4 p-4 sm:p-5 ${
                t.isSuspended ? 'border-rose-300 dark:border-rose-900/60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-eyebrow block font-mono">{t.projectCode || 'NO CODE'}</span>
                  <h4 className="text-card-title mt-0.5 break-words">{t.name}</h4>
                  <p className="mt-1 flex items-center gap-1 break-all font-mono text-xs text-brand">
                    {t.subdomain}
                    {baseDomain} <ExternalLink className="h-3 w-3" />
                  </p>
                </div>
                <Badge className="shrink-0" variant={statusVariant(status(t))}>
                  {status(t)}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <div>
                  Plan: <span className="font-semibold text-foreground">{planLabel(t)}</span>
                  {t.subscription?.status === 'TRIAL' && t.subscription.trialEndsAt && (
                    <span> - trial ends {formatDate(t.subscription.trialEndsAt)}</span>
                  )}
                </div>
                <div>
                  Admin: <span className="break-all font-mono text-foreground">{t.adminEmail}</span>
                </div>
                <div>
                  {t._count?.students ?? 0} students - {t._count?.users ?? 0} users -{' '}
                  {t.activeModules?.length ?? 0} modules
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-border pt-3 sm:justify-end">
                <Button
                  className="flex-1 sm:flex-none"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(t)}
                >
                  <Eye className="h-3.5 w-3.5" /> Manage
                </Button>
                {activeTenant?.id !== t.id ? (
                  <Button
                    className="flex-1 sm:flex-none"
                    variant="outline"
                    size="sm"
                    onClick={() => switchInto(t)}
                    title="Switch workspace"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 text-brand" /> Switch
                  </Button>
                ) : (
                  <Badge variant="success">CURRENT</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="tabular text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Onboard */}
      <Dialog isOpen={showCreate} onClose={() => setShowCreate(false)} title="Onboard New School">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              School name *
              <Input
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Subdomain *
              <Input
                value={form.subdomain}
                required
                minLength={2}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
                placeholder="oakridge"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Admin email *
              <Input
                type="email"
                value={form.adminEmail}
                required
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Admin phone
              <Input
                value={form.adminPhone}
                onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Plan *
              <Select
                value={form.planSlug}
                required
                options={plans
                  .filter((p) => p.isActive)
                  .map((p) => ({
                    label: `${p.name} - ${money(p.price)}/${p.billingCycle}`,
                    value: p.slug,
                  }))}
                placeholder="Select plan"
                onChange={(e) => {
                  const p = plans.find((x) => x.slug === e.target.value);
                  setForm({
                    ...form,
                    planSlug: e.target.value,
                    trialDays: String(p?.trialDays ?? form.trialDays),
                  });
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Trial days (0 = start active)
              <Input
                type="number"
                min={0}
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              City
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              State
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </label>
          </div>
          {plans.length === 0 && (
            <p className="text-xs text-amber-600">No plans exist yet. Create one in Plans first.</p>
          )}
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending} disabled={!form.planSlug}>
              Onboard School
            </Button>
          </div>
        </form>
      </Dialog>

      {/* One-time credentials */}
      <Dialog isOpen={!!created} onClose={() => setCreated(null)} title="School created">
        {created && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              <b>{created.schoolName}</b> is ready. Share these temporary credentials with the
              school admin now - they are shown only once. The admin must change the password on
              first login.
            </p>
            <div className="break-all rounded-xl border border-border bg-muted/50 p-4 font-mono text-sm">
              <div>Email: {created.adminEmail}</div>
              <div>Password: {created.password}</div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(`Email: ${created.adminEmail}\nPassword: ${created.password}`)
                    .then(() => toast.success('Copied'))
                    .catch(() => toast.error('Copy failed - select and copy manually'));
                }}
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button onClick={() => setCreated(null)}>Done</Button>
            </div>
          </div>
        )}
      </Dialog>

      {selected && (
        <SchoolDrawer
          school={selected}
          baseDomain={baseDomain}
          onClose={() => setSelected(null)}
          onSwitch={() => switchInto(selected)}
        />
      )}
    </DashboardLayout>
  );
}

function SchoolDrawer({
  school,
  baseDomain,
  onClose,
  onSwitch,
}: {
  school: SchoolRow;
  baseDomain: string;
  onClose: () => void;
  onSwitch: () => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const { data: sub, isPending: subPending, error: subError } = useSchoolSubscription(school.id);
  const { data: detail } = useSchoolDetail(school.id);
  const live = detail ?? school;
  const { data: plans = [] } = usePlans();

  const assign = useAssignPlan();
  const overrideLimits = useOverrideLimits();
  const suspend = useSuspendSchool();
  const reactivate = useReactivateSchool();
  const cancel = useCancelSchool();

  const [planId, setPlanId] = useState('');
  const [trialDays, setTrialDays] = useState('0');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [limitsJson, setLimitsJson] = useState('{}');

  useEffect(() => {
    if (sub) {
      setPlanId(sub.planId);
      setLimitsJson(JSON.stringify(sub.customLimits ?? {}, null, 2));
    }
  }, [sub]);

  const effectiveLimits = { ...(sub?.plan?.limits ?? {}), ...(sub?.customLimits ?? {}) };

  const ok = (msg: string) => () => toast.success(msg);
  const fail = (fallback: string) => (err: unknown) => toast.error(errorMessage(err, fallback));

  const doAssign = () => {
    if (!planId) return toast.error('Pick a plan');
    assign.mutate(
      {
        id: school.id,
        body: { planId, trialDays: Number(trialDays) || 0, notes: notes || undefined },
      },
      { onSuccess: ok('Plan assigned'), onError: fail('Could not assign plan') }
    );
  };

  const saveLimits = () => {
    let limits: Record<string, number>;
    try {
      limits = JSON.parse(limitsJson || '{}');
      if (!limits || typeof limits !== 'object' || Array.isArray(limits)) throw new Error();
    } catch {
      return toast.error('Limits must be a JSON object like {"students": 500}');
    }
    overrideLimits.mutate(
      { id: school.id, limits },
      { onSuccess: ok('Limits updated'), onError: fail('Could not update limits') }
    );
  };

  const tabs: Array<[Tab, string]> = [
    ['overview', 'Subscription'],
    ['modules', 'Modules'],
    ['limits', 'Limits'],
    ['invoices', 'Invoices'],
    ['activity', 'Activity'],
  ];

  const isSuspended = sub?.status === 'SUSPENDED' || live.isSuspended;

  return (
    <Dialog isOpen onClose={onClose} title={school.name} className="max-w-3xl">
      <div className="flex min-h-0 min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="break-all font-mono text-xs font-bold text-brand">
            {school.subdomain}
            {baseDomain}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {sub && <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>}
            <Button size="sm" variant="outline" onClick={onSwitch}>
              <ArrowRightLeft className="h-3.5 w-3.5" /> Switch into school
            </Button>
          </div>
        </div>

        <div className="scrollbar-none -mx-5 flex gap-1 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-semibold ${
                tab === k
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {subPending && <div className="h-28 animate-pulse rounded-xl bg-muted" />}
        {subError && <p className="text-sm text-rose-600">{errorMessage(subError)}</p>}

        {tab === 'overview' && !subPending && (
          <div className="flex flex-col gap-5">
            {sub ? (
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border p-4 text-xs sm:grid-cols-3">
                <Info label="Plan" value={sub.plan?.name} />
                <Info label="Status" value={sub.status} />
                <Info label="Amount" value={`${money(sub.amount)} / ${sub.billingCycle}`} />
                <Info
                  label="Trial ends"
                  value={sub.trialEndsAt ? formatDate(sub.trialEndsAt) : '-'}
                />
                <Info
                  label="Period ends"
                  value={sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '-'}
                />
                <Info
                  label="Next billing"
                  value={sub.nextBillingAt ? formatDate(sub.nextBillingAt) : '-'}
                />
                {sub.cancelAtPeriodEnd && <Info label="Cancels" value="At period end" />}
                {sub.notes && <Info label="Notes" value={sub.notes} />}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed p-4 text-sm text-amber-600">
                This school has no subscription yet. Assign a plan below.
              </p>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold">Assign / change plan</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Select
                  value={planId}
                  placeholder="Select plan"
                  options={plans.map((p) => ({
                    label: `${p.name} - ${money(p.price)}`,
                    value: p.id,
                  }))}
                  onChange={(e) => setPlanId(e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  placeholder="Trial days"
                  title="Trial days (0 = active immediately)"
                />
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Assigning resets custom module and limit overrides to the plan defaults.
              </p>
              <div>
                <Button
                  className="w-full sm:w-auto"
                  size="sm"
                  onClick={doAssign}
                  isLoading={assign.isPending}
                >
                  Assign plan
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold">Lifecycle</p>
              <Textarea
                className="min-h-16"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required to suspend)"
              />
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                {!isSuspended ? (
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={suspend.isPending}
                    onClick={() => {
                      if (!reason.trim()) return toast.error('Enter a reason');
                      if (!confirm(`Suspend ${school.name}? Users will lose access.`)) return;
                      suspend.mutate(
                        { id: school.id, reason: reason.trim() },
                        { onSuccess: ok('School suspended'), onError: fail('Could not suspend') }
                      );
                    }}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    isLoading={reactivate.isPending}
                    onClick={() => {
                      if (!confirm(`Reactivate ${school.name}?`)) return;
                      reactivate.mutate(school.id, {
                        onSuccess: ok('School reactivated'),
                        onError: fail('Could not reactivate'),
                      });
                    }}
                  >
                    Reactivate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={cancel.isPending}
                  disabled={!sub || sub.status === 'CANCELLED'}
                  onClick={() => {
                    const now = confirm(
                      'Cancel subscription IMMEDIATELY?\n\nOK = cancel now, Cancel = choose end-of-period instead.'
                    );
                    if (!now && !confirm('Cancel at the end of the current billing period?'))
                      return;
                    cancel.mutate(
                      { id: school.id, immediately: now },
                      {
                        onSuccess: ok(now ? 'Subscription cancelled' : 'Will cancel at period end'),
                        onError: fail('Could not cancel'),
                      }
                    );
                  }}
                >
                  Cancel subscription
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'modules' && <SchoolModuleMatrix tenantId={school.id} />}

        {tab === 'limits' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border p-4 text-xs">
              <p className="mb-2 font-semibold">Effective limits (plan + override)</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(effectiveLimits).map(([k, v]) => (
                  <Badge key={k} variant="secondary">
                    {k}: {Number(v) < 0 ? 'unlimited' : String(v)}
                  </Badge>
                ))}
                {Object.keys(effectiveLimits).length === 0 && (
                  <span className="text-zinc-500">None</span>
                )}
              </div>
              <p className="mt-2 text-zinc-500">
                Usage: {live._count?.students ?? 0} students - {live._count?.users ?? 0} users
              </p>
            </div>
            <p className="text-xs font-semibold">Per-school override (JSON, -1 = unlimited)</p>
            <Textarea
              className="min-h-40 font-mono text-base sm:text-xs"
              value={limitsJson}
              onChange={(e) => setLimitsJson(e.target.value)}
            />
            <div>
              <Button
                className="w-full sm:w-auto"
                size="sm"
                onClick={saveLimits}
                isLoading={overrideLimits.isPending}
              >
                Save limits
              </Button>
            </div>
          </div>
        )}

        {tab === 'invoices' && <InvoicesTab schoolId={school.id} hasSubscription={!!sub} />}
        {tab === 'activity' && <ActivityTab schoolId={school.id} />}
      </div>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-eyebrow">{label}</p>
      <p className="break-words font-semibold text-foreground">{value || '-'}</p>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs">
      <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Prev
      </Button>
      <span>
        Page {page} / {totalPages}
      </span>
      <Button
        size="xs"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

function InvoicesTab({
  schoolId,
  hasSubscription,
}: {
  schoolId: string;
  hasSubscription: boolean;
}) {
  const [page, setPage] = useState(1);
  const { data, isPending, error } = useSchoolInvoices(schoolId, page);
  const create = useCreateInvoice();
  const markPaid = useMarkInvoicePaid();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ amount: '', dueDate: '', description: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        id: schoolId,
        body: {
          amount: Number(f.amount),
          dueDate: f.dueDate,
          description: f.description || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Invoice created');
          setShow(false);
          setF({ amount: '', dueDate: '', description: '' });
        },
        onError: (err) => toast.error(errorMessage(err, 'Could not create invoice')),
      }
    );
  };

  const invoices = data?.items ?? [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          size="sm"
          onClick={() => setShow(!show)}
          disabled={!hasSubscription}
          title={hasSubscription ? '' : 'Assign a plan first'}
        >
          <Plus className="h-3.5 w-3.5" /> New invoice
        </Button>
      </div>
      {show && (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-border p-4 sm:grid-cols-3"
        >
          <Input
            type="number"
            min={0}
            required
            placeholder="Amount"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
          />
          <Input
            type="date"
            required
            value={f.dueDate}
            onChange={(e) => setF({ ...f, dueDate: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
          <div className="sm:col-span-3">
            <Button
              className="w-full sm:w-auto"
              type="submit"
              size="sm"
              isLoading={create.isPending}
            >
              Create invoice
            </Button>
          </div>
        </form>
      )}
      {isPending && <p className="text-sm text-zinc-500">Loading invoices...</p>}
      {error && <p className="text-sm text-rose-600">{errorMessage(error)}</p>}
      {!isPending && invoices.length === 0 && (
        <p className="text-sm text-zinc-500">No invoices yet.</p>
      )}
      <div className="divide-y divide-border rounded-xl border border-border">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 text-xs">
            <span className="font-mono font-semibold">{inv.invoiceNo}</span>
            <span className="tabular ml-auto font-semibold sm:ml-0">{money(inv.amount)}</span>
            <span className="min-w-0 basis-full text-muted-foreground sm:flex-1 sm:basis-0">
              {inv.description || '-'}
            </span>
            <span className="text-muted-foreground">due {formatDate(inv.dueDate)}</span>
            <Badge
              variant={
                inv.status === 'PAID'
                  ? 'success'
                  : inv.status === 'PENDING'
                    ? 'warning'
                    : 'secondary'
              }
            >
              {inv.status}
            </Badge>
            {inv.status !== 'PAID' && (
              <Button
                size="xs"
                variant="outline"
                isLoading={markPaid.isPending && markPaid.variables?.invoiceId === inv.id}
                onClick={() => {
                  if (!confirm(`Mark ${inv.invoiceNo} as paid?`)) return;
                  markPaid.mutate(
                    { invoiceId: inv.id },
                    {
                      onSuccess: () => toast.success('Invoice marked paid'),
                      onError: (err) => toast.error(errorMessage(err, 'Could not mark paid')),
                    }
                  );
                }}
              >
                Mark paid
              </Button>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} totalPages={data?.meta?.totalPages ?? 1} setPage={setPage} />
    </div>
  );
}

function ActivityTab({ schoolId }: { schoolId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, error } = useSchoolActivity(schoolId, page);
  const logs = data?.items ?? [];
  return (
    <div className="flex flex-col gap-3">
      {isPending && <p className="text-sm text-zinc-500">Loading activity...</p>}
      {error && <p className="text-sm text-rose-600">{errorMessage(error)}</p>}
      {!isPending && logs.length === 0 && (
        <p className="text-sm text-zinc-500">No activity recorded.</p>
      )}
      <div className="divide-y divide-border rounded-xl border border-border">
        {logs.map((l: any) => (
          <div key={l.id} className="p-3 text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-semibold">{l.action}</span>
              <span className="text-zinc-400">{formatDate(l.createdAt)}</span>
            </div>
            <p className="text-zinc-500">
              {l.entity ?? l.module ?? ''} {l.user?.name ? `- ${l.user.name}` : ''}
            </p>
          </div>
        ))}
      </div>
      <Pager page={page} totalPages={data?.meta?.totalPages ?? 1} setPage={setPage} />
    </div>
  );
}
