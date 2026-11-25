'use client';

import { asList } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { api } from '@/services/api';
import { unwrap } from '@/lib/utils';
import { useStaffList, useResetStaffPassword } from '@/hooks/queries/useStaff';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { errorMessage } from '@/lib/errorMessage';
import { formatDate } from '@/lib/format';
import { statusVariant } from '@/modules/superadmin/statusUi';
import { toast } from 'sonner';
import { Building, Sliders, ShieldCheck, Check, LockKeyhole, CreditCard } from 'lucide-react';

interface ModuleInfo {
  key: string;
  label: string;
  description: string;
  group: string;
  enabled: boolean;
}

const PROFILE_FIELDS: Array<{ key: string; label: string; required?: boolean; type?: string }> = [
  { key: 'name', label: 'School name', required: true },
  { key: 'adminEmail', label: 'Administrative contact email', required: true, type: 'email' },
  { key: 'adminPhone', label: 'Contact phone' },
  { key: 'billingEmail', label: 'Billing email', type: 'email' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'modules' | 'users'>('profile');
  const [baseDomain, setBaseDomain] = useState('.jdinfotechsolutions.in');
  const { isAdmin } = usePermissions();
  const subscription = useAuthStore((s) => s.subscription);
  const [now] = useState(() => Date.now());

  const [form, setForm] = useState<Record<string, string>>({});

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getTenantDetails,
  });

  // Effective module list for this school (definitions + enabled flag)
  const { data: moduleData } = useQuery({
    queryKey: ['settings', 'modules'],
    queryFn: async () =>
      unwrap<{ groups: Record<string, string>; modules: ModuleInfo[] }>(await api.get('/modules')),
  });

  const { data: staffData, isPending: loadingStaff } = useStaffList(1, 40);
  const resetPasswordMutation = useResetStaffPassword();
  const staffItems = asList(staffData);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2 && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      setBaseDomain(`.${parts.slice(1).join('.')}`);
    }
  }, []);

  useEffect(() => {
    if (tenant) {
      const t = tenant as any;
      const next: Record<string, string> = {};
      PROFILE_FIELDS.forEach((f) => (next[f.key] = t[f.key] ?? ''));
      next.slug = t.subdomain || t.slug || '';
      setForm(next);
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: () => {
      // Only fields the backend UpdateOwnTenantDto accepts; blanks omitted.
      const body: Record<string, string> = {};
      PROFILE_FIELDS.forEach((f) => {
        const v = (form[f.key] ?? '').trim();
        if (v) body[f.key] = v;
      });
      return settingsService.updateTenantDetails(body as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('School profile updated.');
    },
    onError: (e) => toast.error(errorMessage(e, 'Failed to update school profile.')),
  });

  const handleResetPassword = (id: string, name: string) => {
    if (confirm(`Reset login password to a secure temporary password for ${name}?`)) {
      resetPasswordMutation.mutate(id, {
        onSuccess: () => toast.success(`Successfully reset password for ${name}.`),
        onError: (e) => toast.error(errorMessage(e, 'Failed to reset password.')),
      });
    }
  };

  const trialDaysLeft =
    subscription?.status === 'TRIAL' && subscription.trialEndsAt
      ? Math.max(0, Math.ceil((+new Date(subscription.trialEndsAt) - now) / 86_400_000))
      : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageBreadcrumb title="Settings" />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-400">Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }

  const tabBtn = (id: typeof activeTab) =>
    `px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
      activeTab === id
        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
    }`;

  const modulesByGroup = (moduleData?.modules ?? []).reduce<Record<string, ModuleInfo[]>>(
    (acc, m) => {
      (acc[m.group] ??= []).push(m);
      return acc;
    },
    {}
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Settings" />

      <div className="flex flex-col gap-6 pb-10 w-full animate-fade-in">
        <PageHeader
          title="Settings"
          description="Your school profile, subscription, enabled modules and sign-in options."
        />
        <div className="flex bg-white dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl w-max overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={tabBtn('profile')}
          >
            <Building className="w-3.5 h-3.5" /> Profile & Subscription
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={tabBtn('modules')}
          >
            <Sliders className="w-3.5 h-3.5" /> Enabled Modules
          </button>
          {isAdmin && (
            <button type="button" onClick={() => setActiveTab('users')} className={tabBtn('users')}>
              <ShieldCheck className="w-3.5 h-3.5" /> Login Credentials
            </button>
          )}
        </div>

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-6 backdrop-blur-xl">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    School Profile
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Contact and address details for this school.
                    {!isAdmin && ' Only the school admin can edit these.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {PROFILE_FIELDS.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                        {f.label}
                        {f.required ? ' *' : ''}
                      </label>
                      <Input
                        type={f.type}
                        value={form[f.key] ?? ''}
                        required={f.required}
                        disabled={!isAdmin}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                      Subdomain
                    </label>
                    <div className="relative">
                      <Input
                        value={form.slug ?? ''}
                        disabled
                        className="pr-32 font-mono text-zinc-400"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-brand bg-brand/10 px-2 py-1 rounded">
                        {baseDomain}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end gap-3">
                  <Button type="submit" isLoading={mutation.isPending}>
                    <Check className="w-4 h-4 mr-2" /> Save Profile
                  </Button>
                </div>
              )}
            </form>

            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Subscription
                </h2>
              </div>
              {subscription ? (
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">Plan</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {subscription.planName ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">Status</p>
                    <Badge variant={statusVariant(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                  {trialDaysLeft !== null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">Trial</p>
                      <p className="font-semibold">{trialDaysLeft} days left</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                      Current period ends
                    </p>
                    <p className="font-semibold">
                      {subscription.currentPeriodEnd
                        ? formatDate(subscription.currentPeriodEnd)
                        : '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  No subscription information is available for this school.
                </p>
              )}
              <p className="text-[11px] text-zinc-400">
                Plan, modules and limits are managed by the platform owner. Contact support to
                change your plan.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-6 backdrop-blur-xl">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Enabled Modules
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Modules included in your subscription. The platform owner controls this list.
              </p>
            </div>
            {!moduleData && <p className="text-xs text-zinc-500">Loading modules...</p>}
            {Object.entries(modulesByGroup).map(([group, mods]) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {moduleData?.groups?.[group] ?? group}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mods.map((m) => (
                    <div
                      key={m.key}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                        m.enabled
                          ? 'border-brand/50 bg-brand/5 dark:bg-brand/10'
                          : 'border-zinc-200/80 dark:border-zinc-800/80 opacity-60'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {m.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                          {m.description}
                        </p>
                      </div>
                      <Badge variant={m.enabled ? 'success' : 'secondary'}>
                        {m.enabled ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 backdrop-blur-xl">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Active Login Credentials
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Staff with login access to this school.</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Login Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loadingStaff ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                        Loading user credentials...
                      </td>
                    </tr>
                  ) : staffItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                        No login users registered yet.
                      </td>
                    </tr>
                  ) : (
                    staffItems.map((d: any) => {
                      // Backend returns roles as [{ role: { slug, name } }]
                      const primary = d.roles?.[0]?.role?.name || d.designation || 'Staff';
                      return (
                        <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {d.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-brand">{d.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant="info">{primary}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={d.isActive ? 'success' : 'secondary'}>
                              {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              onClick={() => handleResetPassword(d.id, d.name)}
                              className="text-xs"
                            >
                              <LockKeyhole className="w-3.5 h-3.5 mr-1" /> Reset Password
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
