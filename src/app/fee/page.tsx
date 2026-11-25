'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Plus, Wallet } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState, Panel, TabBar, inr, tabFromLocation } from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import { useFinanceSummary } from '@/hooks/queries/usePayroll';
import { usePendingSummary, useRevenueSummary } from '@/hooks/queries/useFee';
import { SlabsTab } from './_components/SlabsTab';
import { LedgersTab } from './_components/LedgersTab';
import { PayrollTab } from './_components/PayrollTab';
import { CollectDialog } from './_components/CollectDialog';

type TabKey = 'slabs' | 'ledgers' | 'payroll';

export default function FeePage() {
  const { can, isAdmin, isRole, hasModule } = usePermissions();
  // Collections, dues and revenue are admin/accountant only on the backend (clerk gets fee:read for structures only).
  const canFinance = isAdmin || isRole('accountant');
  const showPayroll = canFinance && hasModule('hr_payroll');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'slabs', label: 'Fee Slabs & Structures' },
    ...(canFinance ? [{ key: 'ledgers' as TabKey, label: 'Collections & Ledgers' }] : []),
    ...(showPayroll ? [{ key: 'payroll' as TabKey, label: 'Teacher & Staff Payroll' }] : []),
  ];

  const [tabKey, setTabKey] = useState<TabKey>('slabs');
  useEffect(() => {
    const idx = tabFromLocation({ slabs: 0, ledgers: 1, payroll: 2 });
    setTabKey((['slabs', 'ledgers', 'payroll'] as TabKey[])[idx]);
  }, []);
  const activeKey = tabs.some((t) => t.key === tabKey) ? tabKey : 'slabs';

  const [addOpen, setAddOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);

  const { data: revenue } = useRevenueSummary(undefined, canFinance);
  const { data: pending } = usePendingSummary(canFinance);
  const { data: finance } = useFinanceSummary(undefined, isAdmin && hasModule('hr_payroll'));

  const totalRevenue = Number(revenue?.totalRevenue ?? 0);
  const pendingTotal = (pending ?? []).reduce((a, r) => a + Number(r.pendingAmount || 0), 0);

  const switchTab = (i: number) => {
    const t = tabs[i];
    setTabKey(t.key);
    window.history.pushState({}, '', `/fee/${t.key}`);
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Fee & Finance" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-brand" /> School Finance Console
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Fee structures, collections and staff payroll
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canFinance && (
              <Link href="/fee/dues">
                <Button variant="outline">Fee Dues &amp; Defaulters</Button>
              </Link>
            )}
            {activeKey === 'slabs' && can('fee:create') && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Structure Slab
              </Button>
            )}
            {activeKey === 'ledgers' && can('fee:create') && (
              <Button onClick={() => setCollectOpen(true)}>
                <DollarSign className="w-4 h-4 mr-2" /> Record Fee Receipt
              </Button>
            )}
          </div>
        </div>

        {canFinance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              label="Total Revenue Collected"
              value={inr(totalRevenue)}
              icon="pi pi-wallet"
              gradientClass="from-emerald-500 to-teal-500"
              iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
              iconColorClass="text-emerald-600 dark:text-emerald-400"
              footerText={`${revenue?.transactionCount ?? 0} paid receipts`}
            />
            <StatCard
              label="Pending Dues"
              value={inr(pendingTotal)}
              icon="pi pi-credit-card"
              gradientClass="from-rose-500 to-red-500"
              iconBgClass="bg-rose-500/10 dark:bg-rose-500/20"
              iconColorClass="text-rose-600 dark:text-rose-400"
              footerText="Across all classes"
            />
            {finance ? (
              <StatCard
                label={`Net Cashflow ${finance.year}`}
                value={inr(finance.totals.netProfit)}
                icon="pi pi-chart-line"
                gradientClass="from-blue-500 to-blue-500"
                iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
                iconColorClass="text-blue-600 dark:text-blue-400"
                footerText={`Expenses ${inr(finance.totals.totalExpense)}`}
              />
            ) : (
              <StatCard
                label="Classes with dues"
                value={String((pending ?? []).length)}
                icon="pi pi-chart-line"
                gradientClass="from-blue-500 to-blue-500"
                iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
                iconColorClass="text-blue-600 dark:text-blue-400"
                footerText="Open the dues page for the list"
              />
            )}
          </div>
        )}

        <TabBar
          tabs={tabs.map((t) => t.label)}
          active={tabs.findIndex((t) => t.key === activeKey)}
          onChange={switchTab}
        />

        <Panel>
          {activeKey === 'slabs' && (
            <SlabsTab addOpen={addOpen} onAddClose={() => setAddOpen(false)} />
          )}
          {activeKey === 'ledgers' &&
            (canFinance ? (
              <LedgersTab />
            ) : (
              <EmptyState title="Ledgers are available to the accountant and school admin." />
            ))}
          {activeKey === 'payroll' && <PayrollTab />}
        </Panel>
      </div>

      <CollectDialog open={collectOpen} onClose={() => setCollectOpen(false)} />
    </DashboardLayout>
  );
}
