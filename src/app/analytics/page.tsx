'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
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
    return <Tag value={action} severity={action === 'DELETE' ? 'danger' : action === 'UPDATE' ? 'warning' : 'success'} />;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Review revenue logs, occupancy levels, and audit trail records.</p>
        </div>

        {/* Top summary row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <span className="block text-gray-500 font-medium mb-3">Total Admissions</span>
            <div className="text-900 font-bold text-3xl">{stats?.studentsCount || '1,240'}</div>
          </Card>
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <span className="block text-gray-500 font-medium mb-3">Active Teachers</span>
            <div className="text-900 font-bold text-3xl">{stats?.teachersCount || '84'}</div>
          </Card>
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <span className="block text-gray-500 font-medium mb-3">Hostel Occupancy</span>
            <div className="text-900 font-bold text-3xl">{stats?.hostelOccupancy || '82%'}</div>
          </Card>
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <span className="block text-gray-500 font-medium mb-3">Weekly Attendance</span>
            <div className="text-900 font-bold text-3xl">{stats?.attendanceRate || '96.2%'}</div>
          </Card>
        </div>

        {/* SVGs Dynamic Premium Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="Revenue Inflow Trend">
            <div className="flex items-end justify-between h-48 px-4 mt-6">
              {revenueTrend.map((item) => {
                const heightPercentage = (item.value / maxVal) * 100;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex items-end justify-center h-36">
                      <div 
                        className="w-8 bg-gradient-to-t from-primary/60 to-primary rounded-t transition-all duration-500 hover:opacity-80" 
                        style={{ height: `${heightPercentage}%` }}
                        title={`₹${item.value}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="Occupancy Distribution">
            <div className="flex flex-col gap-4 mt-6 justify-center h-36">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-sm font-semibold text-gray-700">
                  <span>Boys Hostel A</span>
                  <span>88%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-sm font-semibold text-gray-700">
                  <span>Girls Hostel B</span>
                  <span>74%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Audit Log table */}
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="System Audit Logs">
          <DataTable 
            value={logs?.data?.items || []} 
            lazy 
            paginator 
            first={lazyState.first}
            rows={lazyState.rows}
            totalRecords={logs?.data?.meta.total || 0}
            onPage={onPage}
            loading={loadingLogs}
            className="p-datatable-sm mt-3"
            emptyMessage="No administrative actions logged."
          >
            <Column field="userEmail" header="Operator Email" body={(data) => data.userEmail || 'System'}></Column>
            <Column field="action" header="Action" body={severityTemplate}></Column>
            <Column field="details" header="Audit Details"></Column>
            <Column field="timestamp" header="Timestamp" body={(data) => data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Just now'}></Column>
          </DataTable>
        </Card>
      </div>
    </DashboardLayout>
  );
}
