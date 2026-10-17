'use client';

import React from 'react';
import {
  BadgeIndianRupee,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  IndianRupee,
  Layers,
  Receipt,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useFullDashboard, useFeeCollectionTrend } from '@/hooks/queries/useAnalytics';
import { useFeeCollections, useRevenueSummary } from '@/hooks/queries/useFee';
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
    <div className="flex flex-col gap-6 pb-6">
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
            <HeroButton href="/fee">
              <IndianRupee className="size-4" /> Collect fee
            </HeroButton>
            <HeroButton href="/fee/ledgers" variant="glass">
              <FileSpreadsheet className="size-4" /> Student ledgers
            </HeroButton>
          </>
        }
        aside={
          <div className="glass rounded-3xl p-5">
            <p className="text-xs text-white/70">Collected all time</p>
            <p className="font-display tabular mt-1 text-3xl font-semibold">{inr(totalRevenue)}</p>
            <p className="mt-1 text-xs text-white/70">
              {summary?.transactionCount ?? 0} receipts issued
            </p>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected this month"
          value={inr(collected)}
          icon={Wallet}
          gradientClass="from-violet-500 to-indigo-500"
          footerText="Fees received since the 1st"
          loading={isPending}
        />
        <StatCard
          label="Outstanding dues"
          value={inr(outstanding)}
          icon={Receipt}
          gradientClass="from-amber-400 to-orange-500"
          footerText="Yet to be collected"
          loading={isPending}
        />
        <StatCard
          label="Pending payments"
          value={fees.pendingTransactions ?? 0}
          icon={CreditCard}
          gradientClass="from-pink-500 to-rose-500"
          footerText="Awaiting confirmation"
          loading={isPending}
        />
        <StatCard
          label="Receipts issued"
          value={summary?.transactionCount ?? 0}
          icon={BadgeIndianRupee}
          gradientClass="from-emerald-400 to-teal-500"
          footerText="Across all payment methods"
          loading={summaryPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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
              className="h-[260px]"
            />
          )}
        </Panel>
        <Panel title="Payment methods" subtitle="How families are paying">
          <Donut data={byMethod} center={inr(totalRevenue)} caption="total" size={190} />
          <div className="mt-5 space-y-2">
            {byMethod.length === 0 && (
              <p className="text-center text-xs text-zinc-500">No payments recorded yet.</p>
            )}
            {byMethod.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                <span className="flex-1 text-zinc-600 dark:text-zinc-300">{m.name}</span>
                <span className="font-display tabular font-semibold">{inr(m.value)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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
                label: 'Payroll',
                href: '/fee/payroll',
                icon: Wallet,
                gradient: 'from-emerald-400 to-teal-500',
              },
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
                <div key={c.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                      {c.student?.name || 'Student'}{' '}
                      <span className="font-normal text-zinc-400">
                        · {c.feeStructure?.name || 'Fee'}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {c.receiptNo} · {formatDate(c.paidAt || c.createdAt)} ·{' '}
                      {String(c.paymentMethod || '').toLowerCase()}
                    </p>
                  </div>
                  <span className="font-display tabular text-[15px] font-semibold text-zinc-900 dark:text-white">
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
