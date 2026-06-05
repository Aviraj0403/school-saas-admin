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

import { StatCard } from '@/components/ui/StatCard';

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
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-premium-gradient">
              {greeting()}, {activeUser?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p className="text-slate-500 mt-2 text-md">
              Welcome back to <span className="font-bold text-slate-700 dark:text-slate-350">{activeTenant?.name || 'Demo School'}</span> management console.
            </p>
          </div>
          <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
            Academic Term: {currentAY?.name || 'Not Configured ⚠️'}
          </span>
        </div>

        {/* Primary KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Students"
            value={coreStats.students?.total ?? '—'}
            icon="pi pi-users"
            gradientClass="from-blue-500 to-indigo-500"
            iconBgClass="bg-blue-500/10"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText={`Active: ${coreStats.students?.active ?? '0'} Students`}
            loading={isPending}
          />
          <StatCard
            label="Active Staff"
            value={coreStats.staff?.total ?? '—'}
            icon="pi pi-id-card"
            gradientClass="from-orange-500 to-amber-500"
            iconBgClass="bg-orange-500/10"
            iconColorClass="text-orange-600 dark:text-orange-400"
            footerText="Enrolled instructors & admins"
            loading={isPending}
          />
          <StatCard
            label="Fee Collected (Month)"
            value={coreStats.fees?.monthlyRevenue ? `₹${Number(coreStats.fees.monthlyRevenue).toLocaleString('en-IN')}` : '₹0'}
            icon="pi pi-wallet"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText="Successfully processed collections"
            loading={isPending}
          />
          <StatCard
            label="Attendance Rate"
            value={coreStats.attendance?.percentage ? `${coreStats.attendance.percentage}%` : '96.2%'}
            icon="pi pi-check-square"
            gradientClass="from-purple-500 to-violet-500"
            iconBgClass="bg-purple-500/10"
            iconColorClass="text-purple-650 dark:text-purple-400"
            footerText={`Present: ${coreStats.attendance?.today?.present ?? '5'} Students`}
            loading={isPending}
          />
        </div>

        {/* Secondary KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Unpaid Fee Count"
            value={coreStats.fees?.pendingCount ?? '—'}
            icon="pi pi-exclamation-circle"
            gradientClass="from-rose-500 to-red-500"
            iconBgClass="bg-rose-500/10"
            iconColorClass="text-rose-600 dark:text-rose-455"
            footerText="Pending invoice reminders"
            loading={isPending}
          />
          <StatCard
            label="Hostel Occupancy"
            value={hostelStats.occupancyPct ? `${hostelStats.occupancyPct}%` : '—'}
            icon="pi pi-home"
            gradientClass="from-indigo-500 to-violet-500"
            iconBgClass="bg-indigo-500/10"
            iconColorClass="text-indigo-600 dark:text-indigo-400"
            footerText={`Boarders: ${hostelStats.totalBoarders ?? '0'} / ${hostelStats.totalCapacity ?? '0'}`}
            loading={isPending}
          />
          <StatCard
            label="Pending Leaves"
            value={leaveStats.pending ?? '—'}
            icon="pi pi-calendar-minus"
            gradientClass="from-amber-500 to-yellow-500"
            iconBgClass="bg-amber-500/10"
            iconColorClass="text-amber-600 dark:text-amber-500"
            footerText="Awaiting admin approval"
            loading={isPending}
          />
          <StatCard
            label="Overdue Books"
            value={coreStats.library?.overdueBooks ?? '—'}
            icon="pi pi-book"
            gradientClass="from-teal-500 to-cyan-500"
            iconBgClass="bg-teal-500/10"
            iconColorClass="text-teal-650 dark:text-teal-400"
            footerText={`Total Library Books: ${coreStats.library?.totalBooks ?? '0'}`}
            loading={isPending}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fee Collection Bar Chart */}
          <div className="shadow-sm border border-slate-105 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Fee Collection Trend</h3>
              <p className="text-xs text-slate-400 mt-1">Monthly school revenue inflow (₹)</p>
            </div>
            <div className="flex items-end justify-between h-44 px-2">
              {feeTrendData && feeTrendData.length > 0 ? (
                feeTrendData.map((item: any) => {
                  const monthName = new Date(item.month + '-01').toLocaleString('default', { month: 'short' });
                  const maxVal = Math.max(...feeTrendData.map((d:any) => d.amount), 10000);
                  const pct = (item.amount / maxVal) * 100;
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-2 flex-1 group">
                      <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-650 transition-colors">
                        {item.amount >= 1000 ? `${(item.amount / 1000).toFixed(0)}k` : item.amount}
                      </span>
                      <div className="w-full flex items-end justify-center h-32">
                        <div
                          className="w-8 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-300 group-hover:opacity-85 shadow-sm"
                          style={{ height: `${pct}%`, minHeight: '4px' }}
                          title={`₹${item.amount.toLocaleString('en-IN')}`}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{monthName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs w-full py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  No fee collection revenue data found.
                </div>
              )}
            </div>
          </div>

          {/* Attendance Trend */}
          <div className="shadow-sm border border-slate-105 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Daily Attendance Rate</h3>
              <p className="text-xs text-slate-400 mt-1">Active student participation index (%)</p>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              {attendanceTrendData && attendanceTrendData.length > 0 ? (
                attendanceTrendData.slice(-5).map((item: any) => {
                  const dayName = new Date(item.date).toLocaleString('default', { weekday: 'short' });
                  const total = item.PRESENT + item.ABSENT + item.LATE + item.LEAVE;
                  const rate = total > 0 ? Math.round(((item.PRESENT + item.LATE) / total) * 100) : 0;
                  return (
                    <div key={item.date} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-500 w-8">{dayName}</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-550 ${
                            rate >= 95 
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                              : rate >= 90 
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                              : 'bg-gradient-to-r from-rose-400 to-red-500'
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-extrabold text-slate-600 dark:text-slate-350 w-10 text-right">{rate}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs w-full py-10 mt-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  No attendance data recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="shadow-sm border border-slate-105 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 p-6 overflow-hidden">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-6">Operations Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Add Student', icon: 'pi pi-user-plus', href: '/students', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
              { label: 'Mark Attendance', icon: 'pi pi-check-square', href: '/attendance', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
              { label: 'Collect Fee', icon: 'pi pi-money-bill', href: '/fee', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold' },
              { label: 'Post Notice', icon: 'pi pi-megaphone', href: '/communication', color: 'bg-purple-500/10 text-purple-650 dark:text-purple-400' },
              { label: 'Issue Book', icon: 'pi pi-bookmark', href: '/library', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
              { label: 'View Analytics', icon: 'pi pi-chart-bar', href: '/analytics', color: 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl ${action.color} hover:opacity-90 hover:scale-[1.03] transition-all duration-300 cursor-pointer no-underline border border-slate-100 dark:border-slate-800`}
              >
                <i className={`${action.icon} text-2xl`}></i>
                <span className="text-xs font-bold text-center leading-tight">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
