'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  useDashboardStats,
  useActivityLog,
  useFeeCollectionTrend,
} from '@/hooks/queries/useAnalytics';
import { StatCard } from '@/components/ui/StatCard';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BarChart3, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: stats, isPending: loadingStats } = useDashboardStats();
  const { data: logs, isPending: loadingLogs } = useActivityLog(page, limit);
  const { data: feeTrendData } = useFeeCollectionTrend();

  const chartData = feeTrendData || [];
  const maxVal =
    chartData.length > 0 ? Math.max(...chartData.map((t: any) => t.amount), 10000) : 10000;

  const getActionBadgeVariant = (action: string = 'CREATE'): 'danger' | 'warning' | 'success' => {
    if (action.includes('DELETE') || action.includes('SUSPEND')) return 'danger';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'warning';
    return 'success';
  };

  const logItems = logs?.items || [];
  const totalRecords = logs?.meta?.total || 0;
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Analytics & Diagnostics" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Admissions"
            value={stats?.students?.total ?? '—'}
            icon="pi pi-users"
            gradientClass="from-violet-500 to-purple-500"
            iconBgClass="bg-violet-500/10 dark:bg-violet-500/20"
            iconColorClass="text-violet-600 dark:text-violet-400"
            footerText={`Active: ${stats?.students?.active ?? '0'} Students`}
            loading={loadingStats}
          />
          <StatCard
            label="Active Staff"
            value={stats?.staff?.total ?? '—'}
            icon="pi pi-briefcase"
            gradientClass="from-blue-500 to-blue-500"
            iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText="Enrolled instructors and admins"
            loading={loadingStats}
          />
          <StatCard
            label="Today Attendance"
            value={stats?.attendance?.percentage ? `${stats.attendance.percentage}%` : '96.2%'}
            icon="pi pi-check-square"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText={`Present: ${stats?.attendance?.today?.present ?? '0'} | Absent: ${stats?.attendance?.today?.absent ?? '0'}`}
            loading={loadingStats}
          />
          <StatCard
            label="Monthly Revenue"
            value={
              stats?.fees?.monthlyRevenue
                ? `₹${stats.fees.monthlyRevenue.toLocaleString('en-IN')}`
                : '₹0'
            }
            icon="pi pi-wallet"
            gradientClass="from-amber-500 to-orange-500"
            iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
            iconColorClass="text-amber-500"
            footerText={`Pending transactions: ${stats?.fees?.pendingTransactions ?? '0'}`}
            loading={loadingStats}
          />
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue chart */}
          <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" /> Revenue Inflow Trend (₹)
            </h3>
            <div className="relative flex items-end justify-between h-52 px-4 mt-6 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2">
              <div className="absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-zinc-400 w-full" />
                <div className="border-t border-zinc-400 w-full" />
                <div className="border-t border-zinc-400 w-full" />
                <div className="border-t border-zinc-400 w-full" />
              </div>

              {chartData.map((item: any) => {
                const heightPercentage = (item.amount / maxVal) * 100;
                const monthName = new Date(item.month + '-01').toLocaleString('default', {
                  month: 'short',
                });
                return (
                  <div
                    key={item.month}
                    className="flex flex-col items-center gap-3 flex-1 group z-10"
                  >
                    <div className="w-full flex items-end justify-center h-36">
                      <div
                        className="w-8 bg-brand rounded-t-lg transition-all duration-300 group-hover:scale-y-[1.03] relative"
                        style={{ height: `${heightPercentage}%`, minHeight: '8px' }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[9px] font-bold p-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
                      {monthName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Occupancy chart */}
          <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" /> Hostels Occupancy Rate
            </h3>
            <div className="flex flex-col gap-6 mt-6 justify-center h-36 px-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Boys Hostel Block A</span>
                  <span className="text-brand font-mono">88%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div className="bg-brand h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Girls Hostel Block B</span>
                  <span className="text-purple-500 font-mono">74%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log table */}
        <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base mb-4">
            System Operations Audit Log
          </h3>

          <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-3">Operator Email</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Subject / Resource</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                      <p className="text-xs">Loading audit logs...</p>
                    </td>
                  </tr>
                ) : logItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                      No administrative actions logged.
                    </td>
                  </tr>
                ) : (
                  logItems.map((item: any, idx: number) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.user?.email || 'system.admin'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionBadgeVariant(item.action)}>
                          {item.action || 'CREATE'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {item.subject || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-500 font-mono">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
