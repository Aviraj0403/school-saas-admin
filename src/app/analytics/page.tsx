'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useDashboardStats, useActivityLog, useFeeCollectionTrend } from '@/hooks/queries/useAnalytics';
import { StatCard } from '@/components/ui/StatCard';

export default function AnalyticsPage() {
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });

  // Queries
  const { data: stats, isPending: loadingStats } = useDashboardStats();
  const { data: logs, isPending: loadingLogs } = useActivityLog(lazyState.page, lazyState.rows);
  const { data: feeTrendData } = useFeeCollectionTrend();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    }));
  };

  const chartData = feeTrendData || [];
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map((t: any) => t.amount), 10000) : 10000;

  const severityTemplate = (rowData: any) => {
    const action = rowData.action || 'CREATE';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
        action.includes('DELETE') || action.includes('SUSPEND') 
          ? 'bg-rose-500/10 text-rose-500' 
          : action.includes('UPDATE') || action.includes('EDIT')
          ? 'bg-amber-500/10 text-amber-500' 
          : 'bg-emerald-500/10 text-emerald-500'
      }`}>
        {action}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Analytics & Diagnostics</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Realtime metrics overview, financial collections, and operations audit trail logs.
            </p>
          </div>
        </div>

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
            gradientClass="from-indigo-500 to-blue-500"
            iconBgClass="bg-indigo-500/10 dark:bg-indigo-500/20"
            iconColorClass="text-indigo-600 dark:text-indigo-400"
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
            footerText={`Present: ${stats?.attendance?.today?.present ?? '5'} | Absent: ${stats?.attendance?.today?.absent ?? '0'}`}
            loading={loadingStats}
          />
          <StatCard
            label="Monthly Revenue"
            value={stats?.fees?.monthlyRevenue ? `₹${(stats.fees.monthlyRevenue).toLocaleString('en-IN')}` : '₹0'}
            icon="pi pi-wallet"
            gradientClass="from-amber-500 to-orange-500"
            iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
            iconColorClass="text-amber-500"
            footerText={`Unpaid Collections: ${stats?.fees?.pendingCount ?? '0'} structures`}
            loading={loadingStats}
          />
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue chart */}
          <div className="shadow-sm border border-slate-105 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 p-6 overflow-hidden">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Revenue Inflow Trend (₹)</h3>
            <div className="relative flex items-end justify-between h-52 px-4 mt-6 border-b border-slate-100 dark:border-slate-800/60 pb-2">
              
              {/* Chart Grid Lines */}
              <div className="absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-slate-400 w-full" />
                <div className="border-t border-slate-400 w-full" />
                <div className="border-t border-slate-400 w-full" />
                <div className="border-t border-slate-400 w-full" />
              </div>

              {chartData.map((item: any) => {
                const heightPercentage = (item.amount / maxVal) * 100;
                const monthName = new Date(item.month + '-01').toLocaleString('default', { month: 'short' });
                return (
                  <div key={item.month} className="flex flex-col items-center gap-3 flex-1 group z-10">
                    <div className="w-full flex items-end justify-center h-36">
                      <div 
                        className="w-8 bg-gradient-to-t from-violet-500 via-indigo-650 to-indigo-500 rounded-t-lg transition-all duration-300 group-hover:scale-y-[1.03] group-hover:from-violet-600 group-hover:to-indigo-600 shadow-sm relative" 
                        style={{ height: `${heightPercentage}%`, minHeight: '8px' }}
                      >
                        {/* Hover Value Badge */}
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[9px] font-black p-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-350 transition-colors duration-200">{monthName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Occupancy chart */}
          <div className="shadow-sm border border-slate-105 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 p-6 overflow-hidden">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Occupancy Distribution</h3>
            <div className="flex flex-col gap-6 mt-6 justify-center h-36 px-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Boys Hostel A</span>
                  <span className="text-indigo-600 dark:text-indigo-400">88%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-955 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-205/40 dark:border-slate-800">
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Girls Hostel B</span>
                  <span className="text-pink-600 dark:text-pink-400">74%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-955 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-205/40 dark:border-slate-800">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log table */}
        <div className="shadow-sm border border-slate-105 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 p-6 overflow-hidden">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">System Audit Logs</h3>
          <DataTable 
            value={logs?.items || []} 
            lazy 
            paginator 
            first={lazyState.first}
            rows={lazyState.rows}
            totalRecords={logs?.meta?.total || 0}
            onPage={onPage}
            loading={loadingLogs}
            className="p-datatable-sm mt-3"
            emptyMessage="No administrative actions logged."
          >
            <Column field="user.email" header="Operator Email" body={(data) => data.user?.email || 'superadmin@aviraj.com'} className="font-semibold text-xs"></Column>
            <Column field="action" header="Action" body={severityTemplate} align="center"></Column>
            <Column field="subject" header="Subject" className="font-semibold text-xs text-slate-500"></Column>
            <Column field="createdAt" header="Timestamp" body={(data) => data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Just now'}></Column>
          </DataTable>
        </div>
      </div>
    </DashboardLayout>
  );
}
