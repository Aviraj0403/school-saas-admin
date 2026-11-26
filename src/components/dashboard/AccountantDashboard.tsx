'use client';

import React from 'react';
import {
  BadgeIndianRupee,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  AlertCircle,
  IndianRupee,
  Layers,
  Receipt,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useFullDashboard, useFeeCollectionTrend } from '@/hooks/queries/useAnalytics';
import { useFeeCollections, usePendingSummary, useRevenueSummary } from '@/hooks/queries/useFee';
import { usePermissions } from '@/hooks/usePermissions';
import { asList } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { AreaTrend, Donut } from './charts';
import {
  HeroCard,
  HeroButton,
  Panel,
  PanelLink,
  EmptyState,
  QuickActions,
  greeting,
  todayLabel,
  inr,
  lastMonthsSeries,
} from './kit';

const METHOD_COLORS = ['var(--brand)', '#ffb547', '#10c38e', '#38bdf8', '#f472b6'];

export function AccountantDashboard() {
  const { activeUser } = useAuthStore();
  const { data: dashboard, isPending } = useFullDashboard();
  const { data: feeTrendData } = useFeeCollectionTrend();
  const { data: summary, isPending: summaryPending } = useRevenueSummary();
  const { data: collectionsData, isPending: collectionsPending } = useFeeCollections(1, 6);
  const { hasModule } = usePermissions();
  // Everything collected since midnight (PAID rows only count towards the total).
  const [todayStart] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  });
  const { data: todayData, isPending: todayPending } = useFeeCollections(1, 100, {
    startDate: todayStart,
  });
  const { data: pendingByClass, isPending: pendingPending } = usePendingSummary();
  const todayTotal = asList(todayData)
    .filter((c: any) => c.status === 'PAID')
    .reduce((a: number, c: any) => a + Number(c.totalAmount || 0), 0);
  const pendingTotal = (pendingByClass ?? []).reduce((a, r) => a + Number(r.pendingAmount || 0), 0);
  const defaulters = (pendingByClass ?? []).reduce((a, r) => a + Number(r.pendingCount || 0), 0);

  const fees = dashboard?.core?.fees || {};
  const collected = Number(fees.monthlyRevenue ?? 0);
  const outstanding = Number(fees.outstandingDues ?? 0);
  const totalRevenue = Number(summary?.totalRevenue ?? 0);
  const recent = asList(collectionsData);

  const feeSeries = lastMonthsSeries(feeTrendData);

  const byMethod = Object.entries(summary?.byMethod || {}).map(([name, value], i) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value: Number(value) || 0,
    color: METHOD_COLORS[i % METHOD_COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-6">
      <HeroCard
        eyebrow={
          <>
            <BadgeIndianRupee className="size-3.5" /> {todayLabel()}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'there'} 👋
          </>
        }
        subtitle="Collections, dues and receipts — your finance desk for the day."
        actions={
          <>
            <HeroButton href="/fee/ledgers">
              <IndianRupee className="size-4" /> Collect fee
            </HeroButton>
            <HeroButton href="/fee/dues" variant="glass">
              <FileSpreadsheet className="size-4" /> Dues &amp; defaulters
            </HeroButton>
          </>
        }
        aside={
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <p className="text-xs text-white/70">Collected all time</p>
            <p className="tabular mt-1 text-2xl sm:text-3xl font-semibold">{inr(totalRevenue)}</p>
            <p className="mt-1 text-xs text-white/70">
              {summary?.transactionCount ?? 0} receipts issued
            </p>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected today"
          value={inr(todayTotal)}
          icon={IndianRupee}
          gradientClass="from-emerald-400 to-teal-500"
          footerText="Receipts since midnight"
          loading={todayPending}
        />
        <StatCard
          label="Collected this month"
          value={inr(collected)}
          icon={Wallet}
          gradientClass="from-violet-500 to-indigo-500"
          footerText="Fees received since the 1st"
          loading={isPending}
        />
        <StatCard
          label="Pending dues"
          value={inr(pendingTotal || outstanding)}
          icon={Receipt}
          gradientClass="from-amber-400 to-orange-500"
          footerText="Yet to be collected"
          loading={pendingPending}
        />
        <StatCard
          label="Students with dues"
          value={defaulters}
          icon={AlertCircle}
          gradientClass="from-pink-500 to-rose-500"
          footerText={`${fees.pendingTransactions ?? 0} online payments awaiting confirmation`}
          loading={pendingPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Collection trend"
          subtitle="Fees received each month"
          action={<PanelLink href="/analytics">Reports</PanelLink>}
        >
          {feeSeries.some((d) => d.amount > 0) ? (
            <AreaTrend data={feeSeries} xKey="month" yKey="amount" format={inr} />
          ) : (
            <EmptyState
              icon={BarChart3}
              text="No collections yet — they’ll chart here month by month."
              className="h-[200px] sm:h-[260px]"
            />
          )}
        </Panel>
        <Panel title="Payment methods" subtitle="How families are paying">
          <Donut data={byMethod} center={inr(totalRevenue)} caption="total" size={190} />
          <div className="mt-5 space-y-2">
            {byMethod.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">No payments recorded yet.</p>
            )}
            {byMethod.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                <span className="flex-1 min-w-0 truncate text-muted-foreground">{m.name}</span>
                <span className="tabular font-semibold">{inr(m.value)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <Panel title="Finance desk" subtitle="Shortcuts">
          <QuickActions
            columns={2}
            actions={[
              {
                label: 'Collect fee',
                href: '/fee',
                icon: IndianRupee,
                gradient: 'from-violet-500 to-indigo-500',
              },
              {
                label: 'Fee structure',
                href: '/fee/slabs',
                icon: Layers,
                gradient: 'from-amber-400 to-orange-500',
              },
              {
                label: 'Ledgers',
                href: '/fee/ledgers',
                icon: FileSpreadsheet,
                gradient: 'from-sky-400 to-cyan-500',
              },
              {
                label: 'Dues & defaulters',
                href: '/fee/dues',
                icon: AlertCircle,
                gradient: 'from-pink-500 to-rose-500',
              },
              ...(hasModule('hr_payroll')
                ? [
                    {
                      label: 'Expenses',
                      href: '/fee/expenses',
                      icon: CreditCard,
                      gradient: 'from-fuchsia-500 to-purple-500',
                    },
                    {
                      label: 'Payroll',
                      href: '/fee/payroll',
                      icon: Wallet,
                      gradient: 'from-emerald-400 to-teal-500',
                    },
                    {
                      label: 'My payslips',
                      href: '/my-pay',
                      icon: BadgeIndianRupee,
                      gradient: 'from-indigo-500 to-blue-500',
                    },
                  ]
                : []),
            ]}
          />
        </Panel>
        <Panel
          className="xl:col-span-2"
          title="Recent receipts"
          subtitle="Latest fee payments"
          action={<PanelLink href="/fee/ledgers">All receipts</PanelLink>}
        >
          {recent.length > 0 ? (
            <div className="divide-y divide-border">
              {recent.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 py-3 min-w-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {c.student?.name || 'Student'}{' '}
                      <span className="font-normal text-zinc-400">
                        · {c.feeStructure?.name || 'Fee'}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.receiptNo} · {formatDate(c.paidAt || c.createdAt)} ·{' '}
                      {String(c.paymentMethod || '').toLowerCase()}
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-[15px] font-semibold text-foreground">
                    {inr(c.totalAmount ?? c.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              text={collectionsPending ? 'Loading receipts…' : 'No fee payments recorded yet.'}
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
