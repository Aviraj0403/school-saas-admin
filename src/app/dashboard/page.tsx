'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useFullDashboard, useFeeCollectionTrend, useAttendanceTrend } from '@/hooks/queries/useAnalytics';
import { Skeleton } from 'primereact/skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  colorClass: string;
  bgClass: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, colorClass, bgClass, loading }: StatCardProps) {
  return (
    <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-gray-500 font-medium mb-3 text-sm">{label}</span>
          {loading ? (
            <Skeleton width="6rem" height="2.25rem" />
          ) : (
            <div className={`font-bold text-3xl ${colorClass}`}>{value}</div>
          )}
        </div>
        <div className={`flex items-center justify-center ${bgClass} rounded-xl w-14 h-14`}>
          <i className={`${icon} ${colorClass} text-2xl`}></i>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { activeUser, activeTenant } = useAuthStore();
  const { data: dashboard, isPending } = useFullDashboard();
  const { data: feeTrend } = useFeeCollectionTrend();
  const { data: attendanceTrend } = useAttendanceTrend();

  const stats = dashboard?.overview || {};

  // Build bar chart data from fee trend or fallback
  const feeChartData: { month: string; value: number }[] = feeTrend?.monthly || [
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 19000 },
    { month: 'Mar', value: 8000 },
    { month: 'Apr', value: 22000 },
    { month: 'May', value: 30000 },
    { month: 'Jun', value: 45000 },
  ];
  const maxFee = Math.max(...feeChartData.map((d) => d.value), 1);

  // Attendance trend
  const attChartData: { day: string; rate: number }[] = attendanceTrend?.daily || [
    { day: 'Mon', rate: 94 },
    { day: 'Tue', rate: 96 },
    { day: 'Wed', rate: 91 },
    { day: 'Thu', rate: 97 },
    { day: 'Fri', rate: 89 },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here is the overview for <span className="font-semibold text-gray-700 dark:text-gray-300">{activeTenant?.name || 'your school'}</span>
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            label="Total Students"
            value={stats.totalStudents ?? '—'}
            icon="pi pi-users"
            colorClass="text-blue-600"
            bgClass="bg-blue-100 dark:bg-blue-900/40"
            loading={isPending}
          />
          <StatCard
            label="Active Staff"
            value={stats.totalStaff ?? '—'}
            icon="pi pi-id-card"
            colorClass="text-orange-500"
            bgClass="bg-orange-100 dark:bg-orange-900/40"
            loading={isPending}
          />
          <StatCard
            label="Fee Collected (Month)"
            value={stats.feeCollectedThisMonth ? `₹${Number(stats.feeCollectedThisMonth).toLocaleString('en-IN')}` : '—'}
            icon="pi pi-money-bill"
            colorClass="text-green-600"
            bgClass="bg-green-100 dark:bg-green-900/40"
            loading={isPending}
          />
          <StatCard
            label="Attendance Today"
            value={stats.attendanceToday ? `${stats.attendanceToday}%` : '—'}
            icon="pi pi-check-square"
            colorClass="text-purple-600"
            bgClass="bg-purple-100 dark:bg-purple-900/40"
            loading={isPending}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            label="Pending Fee Dues"
            value={stats.pendingDues ? `₹${Number(stats.pendingDues).toLocaleString('en-IN')}` : '—'}
            icon="pi pi-exclamation-circle"
            colorClass="text-red-500"
            bgClass="bg-red-100 dark:bg-red-900/40"
            loading={isPending}
          />
          <StatCard
            label="Hostel Occupancy"
            value={stats.hostelOccupancy ? `${stats.hostelOccupancy}%` : '—'}
            icon="pi pi-home"
            colorClass="text-indigo-600"
            bgClass="bg-indigo-100 dark:bg-indigo-900/40"
            loading={isPending}
          />
          <StatCard
            label="Pending Leaves"
            value={stats.pendingLeaves ?? '—'}
            icon="pi pi-calendar-minus"
            colorClass="text-yellow-600"
            bgClass="bg-yellow-100 dark:bg-yellow-900/40"
            loading={isPending}
          />
          <StatCard
            label="Books Issued"
            value={stats.booksIssued ?? '—'}
            icon="pi pi-bookmark"
            colorClass="text-teal-600"
            bgClass="bg-teal-100 dark:bg-teal-900/40"
            loading={isPending}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee Collection Bar Chart */}
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Fee Collection Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly revenue inflow (₹)</p>
            </div>
            <div className="flex items-end justify-between h-44 px-2">
              {feeChartData.map((item) => {
                const pct = (item.value / maxFee) * 100;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value}
                    </span>
                    <div className="w-full flex items-end justify-center h-32">
                      <div
                        className="w-8 bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t transition-all duration-500 hover:opacity-80"
                        style={{ height: `${pct}%`, minHeight: '4px' }}
                        title={`₹${item.value.toLocaleString('en-IN')}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Attendance Trend */}
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Weekly Attendance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Daily attendance rate (%)</p>
            </div>
            <div className="flex flex-col gap-3 mt-2">
              {attChartData.map((item) => (
                <div key={item.day} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-8">{item.day}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.rate >= 95 ? 'bg-green-500' : item.rate >= 85 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{item.rate}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Add Student', icon: 'pi pi-user-plus', href: '/students', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
              { label: 'Mark Attendance', icon: 'pi pi-check-square', href: '/attendance', color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
              { label: 'Collect Fee', icon: 'pi pi-money-bill', href: '/fee', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' },
              { label: 'Post Notice', icon: 'pi pi-megaphone', href: '/communication', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
              { label: 'Issue Book', icon: 'pi pi-bookmark', href: '/library', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' },
              { label: 'View Analytics', icon: 'pi pi-chart-bar', href: '/analytics', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${action.color} hover:opacity-80 transition-opacity cursor-pointer no-underline`}
              >
                <i className={`${action.icon} text-2xl`}></i>
                <span className="text-xs font-semibold text-center">{action.label}</span>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
