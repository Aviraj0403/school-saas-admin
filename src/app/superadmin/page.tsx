'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CreditCard,
  GraduationCap,
  Layers,
  Package,
  Receipt,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Clock,
  PauseCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { useSuperDashboard } from '@/modules/superadmin/hooks/useSubscriptions';
import { money, statusVariant } from '@/modules/superadmin/statusUi';
import { useAuthStore } from '@/store/useAuthStore';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  tone: string;
  href?: string;
}) {
  const body = (
    <div className="surface-card surface-lift group flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span
          className={`tone-${tone} tone-chip flex size-9 items-center justify-center rounded-xl`}
        >
          <Icon className="size-[18px]" />
        </span>
        {href && (
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <div>
        <p className="tabular text-[26px] font-semibold leading-none tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1.5 text-[13px] font-medium text-foreground/80">{label}</p>
        {hint && <p className="text-caption mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block no-underline">
      {body}
    </Link>
  ) : (
    body
  );
}

const SHORTCUTS = [
  {
    href: '/superadmin/tenants',
    label: 'Schools',
    desc: 'Onboard, suspend, switch into a school',
    icon: Building2,
    tone: 'indigo',
  },
  {
    href: '/superadmin/plans',
    label: 'Plans & pricing',
    desc: 'Tiers, limits, trial and grace days',
    icon: Star,
    tone: 'amber',
  },
  {
    href: '/superadmin/modules',
    label: 'Module catalog',
    desc: 'Add-on prices and what each module is',
    icon: Package,
    tone: 'violet',
  },
  {
    href: '/superadmin/billing',
    label: 'Billing & invoices',
    desc: 'Subscriptions, dues, trial expiries',
    icon: CreditCard,
    tone: 'emerald',
  },
  {
    href: '/users',
    label: 'School users',
    desc: 'Accounts of the active school',
    icon: Users,
    tone: 'sky',
  },
  {
    href: '/superadmin/observability',
    label: 'System health',
    desc: 'Metrics, logs and uptime',
    icon: Activity,
    tone: 'rose',
  },
];

export default function SuperAdminControlPanel() {
  const { data, isPending, error } = useSuperDashboard();
  const user = useAuthStore((s) => s.user);
  const t = data?.totals;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const totalPlans = (data?.planBreakdown ?? []).reduce((a, b) => a + b.count, 0) || 1;

  return (
    <DashboardLayout>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-white shadow-glow sm:p-7">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/25">
              <Sparkles className="size-3.5" /> Platform control panel
            </span>
            <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
              {greet}, {user?.name?.split(' ')[0] ?? 'Admin'}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/80">
              Every school, plan, module and rupee on the platform, in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/superadmin/tenants"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-semibold text-slate-900 no-underline shadow-sm transition hover:-translate-y-px"
              >
                <Building2 className="size-4" /> Manage schools
              </Link>
              <Link
                href="/superadmin/plans"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-[13px] font-semibold text-white no-underline ring-1 ring-inset ring-white/30 backdrop-blur transition hover:bg-white/25"
              >
                <Star className="size-4" /> Plans
              </Link>
              <Link
                href="/superadmin/modules"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-[13px] font-semibold text-white no-underline ring-1 ring-inset ring-white/30 backdrop-blur transition hover:bg-white/25"
              >
                <Package className="size-4" /> Modules
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { l: 'MRR', v: money(data?.revenue?.mrr ?? 0) },
              { l: 'ARR', v: money(data?.revenue?.arr ?? 0) },
              { l: 'Paying', v: data?.revenue?.payingSchools ?? 0 },
            ].map((x) => (
              <div
                key={x.l}
                className="rounded-2xl bg-white/12 p-3 ring-1 ring-inset ring-white/20 backdrop-blur"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                  {x.l}
                </p>
                <p className="tabular mt-1 truncate text-lg font-semibold sm:text-xl">
                  {isPending ? '…' : x.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600">
          Could not load platform data. Check that the API and database are up.
        </p>
      )}

      {/* ── KPIs ───────────────────────────────────────────── */}
      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Schools"
          value={t?.totalTenants ?? '—'}
          hint="on the platform"
          icon={Building2}
          tone="indigo"
          href="/superadmin/tenants"
        />
        <Kpi
          label="Active"
          value={t?.activeTenants ?? '—'}
          hint="paid & running"
          icon={TrendingUp}
          tone="emerald"
          href="/superadmin/billing"
        />
        <Kpi
          label="On trial"
          value={t?.trialTenants ?? '—'}
          hint={
            t?.trialEndingSoon ? `${t.trialEndingSoon} ending within 7 days` : 'none ending soon'
          }
          icon={Clock}
          tone="sky"
          href="/superadmin/billing"
        />
        <Kpi
          label="Past due"
          value={t?.pastDueTenants ?? '—'}
          hint="payment overdue"
          icon={AlertTriangle}
          tone="amber"
          href="/superadmin/billing"
        />
        <Kpi
          label="Suspended"
          value={t?.suspendedTenants ?? '—'}
          hint="access paused"
          icon={PauseCircle}
          tone="rose"
          href="/superadmin/tenants"
        />
        <Kpi
          label="Students"
          value={(t?.totalStudents ?? 0).toLocaleString('en-IN')}
          hint="across all schools"
          icon={GraduationCap}
          tone="violet"
        />
        <Kpi
          label="Open invoices"
          value={data?.pendingInvoices ?? '—'}
          hint="awaiting payment"
          icon={Receipt}
          tone="orange"
          href="/superadmin/billing"
        />
        <Kpi
          label="Plans in use"
          value={data?.planBreakdown?.length ?? '—'}
          hint="active plan tiers"
          icon={Layers}
          tone="teal"
          href="/superadmin/plans"
        />
      </section>

      {/* ── Attention + plan mix ───────────────────────────── */}
      <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-card-title flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-500" /> Needs attention
            </h2>
            <Link
              href="/superadmin/billing"
              className="text-[12px] font-semibold text-brand no-underline"
            >
              View all
            </Link>
          </div>
          {isPending ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : !data?.attention?.length ? (
            <p className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              All clear. No school is overdue, suspended or about to lose its trial.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.attention.map((a) => (
                <li key={a.tenantId} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-[12px] font-bold text-white">
                    {a.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{a.name}</p>
                    <p className="text-caption truncate">
                      {a.plan ?? 'No plan'} · {a.status === 'TRIAL' ? 'trial ends' : 'period ended'}{' '}
                      {fmtDate(a.endsAt)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(a.status)}>{a.status.replace('_', ' ')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card p-4 sm:p-5">
          <h2 className="text-card-title mb-3 flex items-center gap-2">
            <Layers className="size-4 text-brand" /> Plan mix
          </h2>
          {isPending ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !data?.planBreakdown?.length ? (
            <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.planBreakdown.map((p) => (
                <li key={p.plan}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-foreground">{p.plan}</span>
                    <span className="tabular text-muted-foreground">
                      {p.count} · {Math.round((p.count / totalPlans) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-gradient"
                      style={{ width: `${(p.count / totalPlans) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Control shortcuts ──────────────────────────────── */}
      <section className="mt-5">
        <p className="text-eyebrow mb-2.5">Control</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="surface-card surface-lift group flex items-center gap-3.5 p-4 no-underline"
            >
              <span
                className={`tone-${s.tone} tone-chip flex size-11 shrink-0 items-center justify-center rounded-2xl`}
              >
                <s.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-foreground">{s.label}</span>
                <span className="text-caption block truncate">{s.desc}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent schools ─────────────────────────────────── */}
      <section className="mt-5 surface-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-card-title">Recent schools</h2>
          <Link
            href="/superadmin/tenants"
            className="text-[12px] font-semibold text-brand no-underline"
          >
            All schools
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {(data?.recentSignups ?? []).slice(0, 6).map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-[12px] font-bold text-foreground/70">
                {s.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">{s.name}</p>
                <p className="text-caption truncate">
                  {s.subdomain} · joined {fmtDate(s.createdAt)}
                </p>
              </div>
              <Badge variant={statusVariant(s.subscription?.status)}>
                {s.subscription?.status ?? 'NO PLAN'}
              </Badge>
            </li>
          ))}
          {!isPending && !(data?.recentSignups ?? []).length && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No schools yet. Onboard your first one.
            </li>
          )}
        </ul>
      </section>
    </DashboardLayout>
  );
}
