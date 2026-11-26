'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roleAccessService } from '@/services/roleAccess.service';
import { apiMessage } from '@/lib/apiMessage';
import { Check, Minus } from 'lucide-react';

const GROUP_LABEL: Record<string, string> = {
  core: 'Core',
  academics: 'Academics',
  finance: 'Finance & HR',
  operations: 'Operations',
  engagement: 'Engagement',
  insights: 'Insights',
};

export default function RoleAccessPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['role-access'],
    queryFn: roleAccessService.get,
  });

  const toggle = useMutation({
    mutationFn: (v: { role: string; module: string; enabled: boolean }) =>
      roleAccessService.set(v.role, v.module, v.enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-access'] });
      toast.success('Saved. People with that role see the change the next time they open the app.');
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const groups = React.useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>['modules']>();
    for (const m of data?.modules ?? []) map.set(m.group, [...(map.get(m.group) ?? []), m]);
    return [...map.entries()];
  }, [data]);

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Role Access" subtitle="Settings" />
      <PageHeader
        title="Role Access"
        description="Choose which features each role can use in your school. Switching a feature off hides it and blocks it for that role everywhere, including the mobile app."
      />

      <div className="surface-card mt-5 overflow-x-auto">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading…</p>}
        {isError && <p className="p-6 text-sm text-rose-600">Could not load role access.</p>}
        {data && data.roles.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No configurable roles found.</p>
        )}
        {data && data.roles.length > 0 && (
          <table className="modern-table min-w-[720px]">
            <thead>
              <tr>
                <th className="w-[260px]">Feature</th>
                {data.roles.map((r) => (
                  <th key={r.slug} className="text-center">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(([group, mods]) => (
                <React.Fragment key={group}>
                  <tr>
                    <td colSpan={data.roles.length + 1} className="!h-9 bg-muted/60 !py-1">
                      <span className="text-eyebrow">{GROUP_LABEL[group] ?? group}</span>
                    </td>
                  </tr>
                  {mods.map((m) => (
                    <tr key={m.key}>
                      <td className="font-medium text-foreground">{m.label}</td>
                      {data.roles.map((r) => {
                        const applicable = r.defaults.includes(m.key);
                        const on = data.access[r.slug]?.[m.key] !== false;
                        return (
                          <td key={r.slug} className="text-center">
                            {!applicable ? (
                              <Minus
                                className="mx-auto size-4 text-zinc-300"
                                aria-label="Not used by this role"
                              />
                            ) : (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={on}
                                aria-label={`${m.label} for ${r.name}`}
                                disabled={toggle.isPending}
                                onClick={() =>
                                  toggle.mutate({ role: r.slug, module: m.key, enabled: !on })
                                }
                                className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                                  on ? 'bg-brand' : 'bg-zinc-300 dark:bg-white/20'
                                }`}
                              >
                                <span
                                  className={`flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
                                    on ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                >
                                  {on && <Check className="size-3 text-brand" />}
                                </span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-caption mt-3">
        A dash means the role does not use that feature. School admins always keep full access.
        Features your plan does not include are not listed.
      </p>
    </DashboardLayout>
  );
}
