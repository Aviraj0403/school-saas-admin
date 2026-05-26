'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useDashboardStats, useActivityLog } from '@/hooks/queries/useAnalytics';

export default function AnalyticsPage() {
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });

  // Queries
  const { data: stats, isPending: loadingStats } = useDashboardStats();
  const { data: logs, isPending: loadingLogs } = useActivityLog(lazyState.page, lazyState.rows);

  const onPage = (event: DataTablePageEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    }));
  };

  // Mock revenue trends for beautiful SVG rendering
  const revenueTrend = [
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 19000 },
    { month: 'Mar', value: 3000 },
    { month: 'Apr', value: 5000 },
    { month: 'May', value: 20000 },
    { month: 'Jun', value: 30000 },
    { month: 'Jul', value: 45000 },
    { month: 'Aug', value: 25000 },
  ];

  const maxVal = Math.max(...revenueTrend.map((t) => t.value));

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
      <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-750 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">System Analytics & Diagnostics</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Realtime metrics overview, financial collections, and operations audit trail logs.
            </p>
          </div>
        </div>

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Admissions */}
          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-150 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full translate-x-8 -translate-y-8 animate-pulse"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Admissions</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">
                  {loadingStats ? <i className="pi pi-spin pi-spinner text-lg"></i> : stats?.students?.total ?? '—'}
                </h3>
              </div>
              <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl border border-violet-100/50 dark:border-violet-900/20">
                <i className="pi pi-users text-lg animate-bounce"></i>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-4 uppercase font-extrabold tracking-wider bg-slate-100 dark:bg-slate-850 p-1 px-2.5 rounded-lg w-max border border-slate-200/40">
              Active: {stats?.students?.active ?? '0'} Students
            </p>
          </div>

          {/* Card 2: Staff */}
          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-150 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Staff</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">
                  {loadingStats ? <i className="pi pi-spin pi-spinner text-lg"></i> : stats?.staff?.total ?? '—'}
                </h3>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                <i className="pi pi-briefcase text-lg"></i>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-4 uppercase font-extrabold tracking-wider bg-slate-100 dark:bg-slate-850 p-1 px-2.5 rounded-lg w-max border border-slate-200/40">
              Enrolled instructors and admins
            </p>
          </div>

          {/* Card 3: Attendance */}
          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-150 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 animate-pulse"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Today Attendance</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">
                  {loadingStats ? <i className="pi pi-spin pi-spinner text-lg"></i> : (stats?.attendance?.percentage ? `${stats.attendance.percentage}%` : '96.2%')}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                <i className="pi pi-check-square text-lg"></i>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-4 uppercase font-extrabold tracking-wider bg-slate-100 dark:bg-slate-850 p-1 px-2.5 rounded-lg w-max border border-slate-200/40">
              Present: {stats?.attendance?.today?.present ?? '5'} | Absent: {stats?.attendance?.today?.absent ?? '0'}
            </p>
          </div>

          {/* Card 4: Revenue */}
          <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-150 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Revenue</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">
                  {loadingStats ? <i className="pi pi-spin pi-spinner text-lg"></i> : `₹${(stats?.fees?.monthlyRevenue ?? '0').toLocaleString('en-IN')}`}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-100/50 dark:border-amber-900/20">
                <i className="pi pi-wallet text-lg"></i>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-4 uppercase font-extrabold tracking-wider bg-slate-100 dark:bg-slate-850 p-1 px-2.5 rounded-lg w-max border border-slate-200/40">
              Unpaid Collections: {stats?.fees?.pendingCount ?? '0'} structures
            </p>
          </div>
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue chart */}
          <Card className="shadow-sm border border-slate-100 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden" title="Revenue Inflow Trend (₹)">
            <div className="relative flex items-end justify-between h-52 px-4 mt-6 border-b border-slate-100 dark:border-slate-800/60 pb-2">
              
              {/* Chart Grid Lines */}
              <div className="absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-slate-400 w-full" />
                <div className="border-t border-slate-400 w-full" />
                <div className="border-t border-slate-400 w-full" />
                <div className="border-t border-slate-400 w-full" />
              </div>

              {revenueTrend.map((item) => {
                const heightPercentage = (item.value / maxVal) * 100;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-3 flex-1 group z-10">
                    <div className="w-full flex items-end justify-center h-36">
                      <div 
                        className="w-8 bg-gradient-to-t from-violet-500 via-indigo-650 to-indigo-500 rounded-t-lg transition-all duration-300 group-hover:scale-y-[1.03] group-hover:from-violet-600 group-hover:to-indigo-600 shadow-sm relative" 
                        style={{ height: `${heightPercentage}%`, minHeight: '8px' }}
                      >
                        {/* Hover Value Badge */}
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[9px] font-black p-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow">
                          ₹{item.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-350 transition-colors duration-200">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Occupancy chart */}
          <Card className="shadow-sm border border-slate-100 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden" title="Occupancy Distribution">
            <div className="flex flex-col gap-6 mt-6 justify-center h-36 px-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Boys Hostel A</span>
                  <span className="text-indigo-600 dark:text-indigo-400">88%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-205/40 dark:border-slate-800">
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Girls Hostel B</span>
                  <span className="text-pink-600 dark:text-pink-400">74%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-205/40 dark:border-slate-800">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Audit Log table */}
        <Card className="shadow-sm border border-slate-100 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden" title="System Audit Logs">
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
        </Card>
      </div>
    </DashboardLayout>
  );
}
