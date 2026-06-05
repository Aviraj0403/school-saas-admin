'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useFullDashboard, useFeeCollectionTrend, useAttendanceTrend } from '@/hooks/queries/useAnalytics';
import { Skeleton } from 'primereact/skeleton';
import { 
  useCurrentAcademicYear,
  useClasses,
  useDepartmentsList 
} from '@/hooks/queries/useAcademics';
import { useStaffList } from '@/hooks/queries/useStaff';
import { useStudentsList } from '@/hooks/queries/useStudents';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  gradientClass: string;
  iconBgClass: string;
  iconColorClass: string;
  footerText: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, footerText, loading }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <i className={`${icon} text-slate-400 dark:text-slate-500`}></i>
      </div>
      <div>
        {loading ? (
          <Skeleton width="6rem" height="2rem" />
        ) : (
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{footerText}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { activeUser, activeTenant } = useAuthStore();
  const { data: dashboard, isPending } = useFullDashboard();
  const { data: feeTrendData } = useFeeCollectionTrend();
  const { data: attendanceTrendData } = useAttendanceTrend();

  // Current active term check
  const { data: currentAY } = useCurrentAcademicYear();

  // Extract core stats
  const coreStats = dashboard?.core || {};
  const hostelStats = dashboard?.hostel?.stats || {};
  const leaveStats = dashboard?.leave?.stats || {};

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Welcome Section */}
        <div className="flex justify-between items-end flex-wrap gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {greeting()}, {activeUser?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Here is what's happening at <span className="font-medium text-slate-700 dark:text-slate-300">{activeTenant?.name || 'Demo School'}</span> today.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700">
            Term: {currentAY?.name || 'Not Configured'}
          </span>
        </div>

        {/* Primary KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={coreStats.students?.total ?? '—'}
            icon="pi pi-users"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText={`Active: ${coreStats.students?.active ?? '0'}`}
            loading={isPending}
          />
          <StatCard
            label="Active Staff"
            value={coreStats.staff?.total ?? '—'}
            icon="pi pi-id-card"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText="Enrolled instructors"
            loading={isPending}
          />
          <StatCard
            label="Fee Collected"
            value={coreStats.fees?.monthlyRevenue ? `₹${Number(coreStats.fees.monthlyRevenue).toLocaleString('en-IN')}` : '₹0'}
            icon="pi pi-wallet"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText="Monthly collections"
            loading={isPending}
          />
          <StatCard
            label="Attendance Rate"
            value={coreStats.attendance?.percentage ? `${coreStats.attendance.percentage}%` : '96.2%'}
            icon="pi pi-check-square"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText={`Present today: ${coreStats.attendance?.today?.present ?? '0'}`}
            loading={isPending}
          />
        </div>

        {/* Secondary KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pending Fees"
            value={coreStats.fees?.pendingCount ?? '—'}
            icon="pi pi-exclamation-circle"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText="Pending invoices"
            loading={isPending}
          />
          <StatCard
            label="Hostel Occupancy"
            value={hostelStats.occupancyPct ? `${hostelStats.occupancyPct}%` : '—'}
            icon="pi pi-home"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText={`${hostelStats.totalBoarders ?? '0'} / ${hostelStats.totalCapacity ?? '0'} Boarders`}
            loading={isPending}
          />
          <StatCard
            label="Pending Leaves"
            value={leaveStats.pending ?? '—'}
            icon="pi pi-calendar-minus"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText="Awaiting approval"
            loading={isPending}
          />
          <StatCard
            label="Library Status"
            value={coreStats.library?.overdueBooks ?? '—'}
            icon="pi pi-book"
            gradientClass="" iconBgClass="" iconColorClass=""
            footerText={`${coreStats.library?.totalBooks ?? '0'} total books`}
            loading={isPending}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fee Collection Bar Chart */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-hidden">
            <div className="mb-6 flex flex-col gap-1">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Revenue</h3>
              <p className="text-sm text-slate-500">Monthly collections trend</p>
            </div>
            <div className="flex items-end justify-between h-44 px-2">
              {feeTrendData && feeTrendData.length > 0 ? (
                feeTrendData.map((item: any) => {
                  const monthName = new Date(item.month + '-01').toLocaleString('default', { month: 'short' });
                  const maxVal = Math.max(...feeTrendData.map((d:any) => d.amount), 10000);
                  const pct = (item.amount / maxVal) * 100;
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-2 flex-1 group">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.amount >= 1000 ? `${(item.amount / 1000).toFixed(0)}k` : item.amount}
                      </span>
                      <div className="w-full flex items-end justify-center h-32">
                        <div
                          className="w-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-t-sm transition-colors"
                          style={{ height: `${pct}%`, minHeight: '4px' }}
                          title={`₹${item.amount.toLocaleString('en-IN')}`}
                        />
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{monthName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm w-full py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No revenue data
                </div>
              )}
            </div>
          </div>

          {/* Attendance Trend */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-hidden">
            <div className="mb-6 flex flex-col gap-1">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Attendance Rate</h3>
              <p className="text-sm text-slate-500">Daily student participation</p>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              {attendanceTrendData && attendanceTrendData.length > 0 ? (
                attendanceTrendData.slice(-5).map((item: any) => {
                  const dayName = new Date(item.date).toLocaleString('default', { weekday: 'short' });
                  const total = item.PRESENT + item.ABSENT + item.LATE + item.LEAVE;
                  const rate = total > 0 ? Math.round(((item.PRESENT + item.LATE) / total) * 100) : 0;
                  return (
                    <div key={item.date} className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 w-8">{dayName}</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-400 dark:bg-slate-600"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{rate}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm w-full py-10 mt-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No attendance data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-hidden">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Students', icon: 'pi pi-users', href: '/students' },
              { label: 'Attendance', icon: 'pi pi-check-square', href: '/attendance' },
              { label: 'Fees', icon: 'pi pi-wallet', href: '/fee' },
              { label: 'Notice Board', icon: 'pi pi-megaphone', href: '/communication' },
              { label: 'Library', icon: 'pi pi-book', href: '/library' },
              { label: 'Reports', icon: 'pi pi-chart-line', href: '/analytics' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800/50 no-underline"
              >
                <i className={`${action.icon} text-lg text-slate-500 dark:text-slate-400`}></i>
                <span className="text-sm font-medium">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
