'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Building2,
  CircleCheck,
  CirclePause,
  Cpu,
  Eye,
  Layers,
  Plus,
  ScrollText,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantsList } from '@/modules/superadmin/hooks/useTenants';
import { observabilityService } from '@/services/platform.service';
import { rbacService } from '@/services/rbac.service';
import { asList } from '@/lib/utils';
import { formatDate, initials } from '@/lib/format';
import type { Tenant } from '@/types/api.types';
import { Donut } from './charts';
import {
  HeroCard,
  HeroButton,
  Panel,
  PanelLink,
  EmptyState,
  QuickActions,
  GlanceRow,
  greeting,
  todayLabel,
} from './kit';

const PLAN_COLORS: Record<string, string> = {
  BASIC: '#38bdf8',
  STANDARD: 'var(--brand)',
  PREMIUM: '#ffb547',
  ENTERPRISE: '#f472b6',
};

function fmtUptime(sec?: number) {
  if (!sec) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((sec % 3600) / 60)}m`;
}

function fmtBytes(b?: number) {
  if (!b) return '—';
  return `${(b / 1024 / 1024).toFixed(0)} MB`;
}

export function SuperAdminDashboard() {
  const router = useRouter();
  const { activeUser, mirrorUser } = useAuthStore();
  const { data: tenantsData, isPending: tenantsPending } = useTenantsList(1, 100);
  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: observabilityService.metrics,
    retry: false,
  });
  const { data: roles } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: rbacService.getRoles,
    retry: false,
  });

  const tenants = asList<Tenant>(tenantsData);
  const total = Number((tenantsData as any)?.meta?.total ?? tenants.length);
  const suspended = tenants.filter((t) => t.isSuspended).length;
  const active = tenants.filter((t) => t.isActive && !t.isSuspended).length;

  const planCounts = tenants.reduce<Record<string, number>>((acc, t) => {
    acc[t.plan || 'BASIC'] = (acc[t.plan || 'BASIC'] ?? 0) + 1;
    return acc;
  }, {});
  const planData = Object.entries(planCounts).map(([name, value]) => ({
    name,
    value,
    color: PLAN_COLORS[name] ?? '#a78bfa',
  }));

  const recent = [...tenants]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);

  const m: any = metrics ?? {};

  const preview = (t: Tenant) => {
    mirrorUser({
      id: `admin-${t.id}`,
      email: t.adminEmail,
      name: `${t.name} admin`,
      role: 'school_admin',
    });
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      <HeroCard
        eyebrow={
          <>
            <ShieldCheck className="size-3.5" /> Platform control · {todayLabel()}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'there'} 👋
          </>
        }
        subtitle="Every school on EduNexus — subscriptions, health and activity in one place."
        actions={
          <>
            <HeroButton href="/superadmin/tenants">
              <Plus className="size-4" /> Add a school
            </HeroButton>
            <HeroButton href="/superadmin/observability" variant="glass">
              <Activity className="size-4" /> System health
            </HeroButton>
          </>
        }
        aside={
          <div className="glass grid grid-cols-2 gap-4 rounded-3xl p-5">
            <div>
              <p className="text-xs text-white/70">Uptime</p>
              <p className="font-display text-2xl font-semibold">
                {fmtUptime(m.uptime ?? m.process?.uptime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Memory</p>
              <p className="font-display text-2xl font-semibold">
                {fmtBytes(m.memory?.heapUsed ?? m.process?.memory?.heapUsed)}
              </p>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Schools"
          value={total}
          icon={Building2}
          gradientClass="from-violet-500 to-indigo-500"
          footerText="On the platform"
          loading={tenantsPending}
        />
        <StatCard
          label="Active"
          value={active}
          icon={CircleCheck}
          gradientClass="from-emerald-400 to-teal-500"
          footerText="Running normally"
          loading={tenantsPending}
        />
        <StatCard
          label="Suspended"
          value={suspended}
          icon={CirclePause}
          gradientClass="from-pink-500 to-rose-500"
          footerText="Access paused"
          loading={tenantsPending}
        />
        <StatCard
          label="Roles defined"
          value={Array.isArray(roles) ? roles.length : '—'}
          icon={ShieldCheck}
          gradientClass="from-amber-400 to-orange-500"
          footerText="Across the permission system"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Newest schools"
          subtitle="Recently onboarded tenants"
          action={<PanelLink href="/superadmin/tenants">All schools</PanelLink>}
        >
          {recent.length > 0 ? (
            <div className="divide-y divide-border">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white">
                    {initials(t.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                      {t.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {t.subdomain} · joined {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-zinc-600 dark:bg-white/5 dark:text-zinc-300 sm:inline">
                    {String(t.plan || 'basic').toLowerCase()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      t.isSuspended
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    {t.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                  <button
                    onClick={() => preview(t)}
                    title="Preview this school’s admin layout"
                    className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-white/5"
                  >
                    <Eye className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              text={tenantsPending ? 'Loading schools…' : 'No schools yet — add the first one.'}
            />
          )}
        </Panel>

        <Panel title="Plans" subtitle="Schools by subscription">
          <Donut data={planData} center={total} caption="schools" />
          <div className="mt-5 space-y-2">
            {planData.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                <span className="flex-1 capitalize text-zinc-600 dark:text-zinc-300">
                  {p.name.toLowerCase()}
                </span>
                <span className="font-display font-semibold">{p.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Control plane" subtitle="Shortcuts">
          <QuickActions
            columns={2}
            actions={[
              {
                label: 'Schools',
                href: '/superadmin/tenants',
                icon: Building2,
                gradient: 'from-violet-500 to-indigo-500',
              },
              {
                label: 'Plans',
                href: '/superadmin/plans',
                icon: Layers,
                gradient: 'from-amber-400 to-orange-500',
              },
              {
                label: 'Health & logs',
                href: '/superadmin/observability',
                icon: Activity,
                gradient: 'from-emerald-400 to-teal-500',
              },
              {
                label: 'Roadmap',
                href: '/superadmin/roadmap',
                icon: ScrollText,
                gradient: 'from-pink-500 to-rose-500',
              },
            ]}
          />
        </Panel>
        <Panel
          className="xl:col-span-2"
          title="Server"
          subtitle="Live process metrics from the API"
        >
          <div className="divide-y divide-border">
            <GlanceRow
              icon={Timer}
              label="Uptime"
              value={fmtUptime(m.uptime ?? m.process?.uptime)}
              tone="bg-emerald-500/10 text-emerald-600"
            />
            <GlanceRow
              icon={Cpu}
              label="Heap memory in use"
              value={fmtBytes(m.memory?.heapUsed ?? m.process?.memory?.heapUsed)}
              tone="bg-violet-500/10 text-violet-600"
            />
            <GlanceRow
              icon={Cpu}
              label="Resident memory"
              value={fmtBytes(m.memory?.rss ?? m.process?.memory?.rss)}
              tone="bg-sky-500/10 text-sky-600"
            />
            <GlanceRow
              icon={Activity}
              label="Detailed logs & request metrics"
              value="Open"
              href="/superadmin/observability"
              tone="bg-amber-500/10 text-amber-600"
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
