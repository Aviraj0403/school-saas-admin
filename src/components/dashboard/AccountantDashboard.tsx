'use client';

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useFullDashboard, useFeeCollectionTrend } from '@/hooks/queries/useAnalytics';

export function AccountantDashboard() {
  const { activeUser } = useAuthStore();
  const { data: dashboard, isPending: adminPending } = useFullDashboard();
  const { data: feeTrendData } = useFeeCollectionTrend();

  const coreStats = dashboard?.core || {};
  const feeStats = coreStats.fees || {};

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-7 md:gap-8 pb-6 md:pb-10 mt-1">
      {/* Welcome Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'Accountant'} 👋
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Here is your financial collection overview and ledger operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold">
            Role: Finance & Accounts Officer
          </span>
        </div>
      </div>

      {/* Accountant Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Monthly Fee Revenue"
          value={
            feeStats.monthlyRevenue
              ? `₹${Number(feeStats.monthlyRevenue).toLocaleString('en-IN')}`
              : '₹0'
          }
          icon="pi pi-wallet"
          gradientClass="from-emerald-500 to-teal-500"
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          footerText="Current month collections"
          loading={adminPending}
        />
        <StatCard
          label="Outstanding Dues"
          value={
            feeStats.outstandingDues
              ? `₹${Number(feeStats.outstandingDues).toLocaleString('en-IN')}`
              : '₹0'
          }
          icon="pi pi-money-bill"
          gradientClass="from-amber-500 to-yellow-500"
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-600 dark:text-amber-400"
          footerText="Total pending student fees"
          loading={adminPending}
        />
        <StatCard
          label="Pending Transactions"
          value={feeStats.pendingTransactions ?? '0'}
          icon="pi pi-exclamation-circle"
          gradientClass="from-rose-500 to-red-500"
          iconBgClass="bg-rose-500/10"
          iconColorClass="text-rose-600 dark:text-rose-400"
          footerText="Invoices awaiting verification"
          loading={adminPending}
        />
        <StatCard
          label="Payroll Status"
          value="Disbursed"
          icon="pi pi-id-card"
          gradientClass="from-blue-500 to-indigo-500"
          iconBgClass="bg-blue-500/10"
          iconColorClass="text-blue-600 dark:text-blue-400"
          footerText="Monthly staff salary logs clear"
          loading={adminPending}
        />
      </div>

      {/* Fee Collection Trend Chart */}
      <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
        <div className="mb-4 sm:mb-6">
          <h3 className="font-bold text-zinc-800 dark:text-white text-lg">
            Monthly Fee Revenue Trend
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Institution fee inflow log (₹)</p>
        </div>
        <div className="flex items-end justify-between h-48 px-2">
          {feeTrendData && feeTrendData.length > 0 ? (
            feeTrendData.map((item: any) => {
              const monthName = new Date(item.month + '-01').toLocaleString('default', {
                month: 'short',
              });
              const maxVal = Math.max(...feeTrendData.map((d: any) => d.amount), 10000);
              const pct = (item.amount / maxVal) * 100;
              return (
                <div key={item.month} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[10px] text-zinc-400 font-bold group-hover:text-zinc-650 transition-colors">
                    {item.amount >= 1000
                      ? `₹${(item.amount / 1000).toFixed(0)}k`
                      : `₹${item.amount}`}
                  </span>
                  <div className="w-full flex items-end justify-center h-36">
                    <div
                      className="w-10 bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-lg transition-all duration-300 group-hover:opacity-85 shadow-sm"
                      style={{ height: `${pct}%`, minHeight: '4px' }}
                      title={`₹${item.amount.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-500">{monthName}</span>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs w-full py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-md">
              No fee collection revenue data found.
            </div>
          )}
        </div>
      </div>

      {/* Financial Quick Tools */}
      <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
        <h3 className="font-bold text-zinc-800 dark:text-white text-lg mb-4 sm:mb-6">
          Financial Management Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {[
            {
              label: 'Fee Slabs',
              icon: 'pi pi-ticket',
              href: '/fee/slabs',
              color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Online Ledgers',
              icon: 'pi pi-credit-card',
              href: '/fee/ledgers',
              color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Payroll & Salary',
              icon: 'pi pi-money-bill',
              href: '/fee/payroll',
              color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            },
            {
              label: 'Library Fines',
              icon: 'pi pi-bookmark',
              href: '/library/fines',
              color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            },
            {
              label: 'Financial Analytics',
              icon: 'pi pi-chart-bar',
              href: '/analytics',
              color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
            },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl ${action.color} hover:opacity-90 hover:scale-[1.03] hover:shadow-md transition-all duration-300 cursor-pointer no-underline border border-zinc-100 dark:border-zinc-800`}
            >
              <i className={`${action.icon} text-2xl`}></i>
              <span className="text-xs font-bold text-center leading-tight">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
