'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

import { Card } from 'primereact/card';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useFullDashboard,
  useFeeCollectionTrend,
  useAttendanceTrend,
} from '@/hooks/queries/useAnalytics';
import { Skeleton } from 'primereact/skeleton';
import {
  useCurrentAcademicYear,
  useClasses,
  useDepartmentsList,
} from '@/hooks/queries/useAcademics';
import { useStaffList } from '@/hooks/queries/useStaff';
import { useStudentsList } from '@/hooks/queries/useStudents';

import { StatCard } from '@/components/ui/StatCard';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

export default function DashboardPage() {
  const { activeUser, activeTenant } = useAuthStore();
  const isStudentOrParent = activeUser?.role === 'student' || activeUser?.role === 'parent';

  const { data: dashboard, isPending: adminPending } = useFullDashboard();
  const { data: feeTrendData } = useFeeCollectionTrend();
  const { data: attendanceTrendData } = useAttendanceTrend();

  // Current active term check
  const { data: currentAY, isPending: ayPending } = useCurrentAcademicYear();
  const { data: classesData, isPending: classesPending } = useClasses(1, 1);

  React.useEffect(() => {
    // If not super admin, and data is loaded, and no classes exist, redirect to setup
    if (!ayPending && !classesPending && activeTenant?.id !== 'superadmin') {
      if (!currentAY?.id || !classesData?.items?.length) {
        window.location.href = '/setup';
      }
    }
  }, [currentAY, classesData, ayPending, classesPending, activeTenant]);

  // Extract core stats
  const coreStats = dashboard?.core || {};
  const hostelStats = dashboard?.hostel?.stats || {};
  const leaveStats = dashboard?.leave?.stats || {};

  const [isChecklistCollapsed, setIsChecklistCollapsed] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('school_onboarding_collapsed');
    if (saved === 'true') {
      setIsChecklistCollapsed(true);
    }
  }, []);

  const toggleChecklist = () => {
    const nextState = !isChecklistCollapsed;
    setIsChecklistCollapsed(nextState);
    localStorage.setItem('school_onboarding_collapsed', String(nextState));
  };

  const totalSteps = 6;
  const completedSteps = [
    !!currentAY?.id,
    coreStats.staff?.total > 0,
    classesData?.items?.length > 0,
    coreStats.students?.total > 0,
    !!coreStats.fees,
    dashboard?.whatsapp?.isConfigured,
  ].filter(Boolean).length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isStudentOrParent) {
    return (
      <DashboardLayout>
        <PageBreadcrumb title="Dashboard" />
        <div className="flex flex-col gap-5 sm:gap-7 md:gap-8 pb-6 md:pb-10 mt-1">
          {/* Welcome Section */}
          <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                {greeting()}, {activeUser?.name?.split(' ')[0] || 'Student'} 👋
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                Here is what is happening with your academics today.
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm">
              Term: {currentAY?.name || 'Not Configured ⚠️'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
            <StatCard
              label="Pending Assignments"
              value="2"
              icon="pi pi-file-edit"
              gradientClass="from-blue-500 to-blue-500"
              iconBgClass="bg-blue-500/10"
              iconColorClass="text-blue-600 dark:text-blue-400"
              footerText="Due this week"
              loading={false}
            />
            <StatCard
              label="Recent Attendance"
              value="98%"
              icon="pi pi-check-square"
              gradientClass="from-emerald-500 to-teal-500"
              iconBgClass="bg-emerald-500/10"
              iconColorClass="text-emerald-600 dark:text-emerald-400"
              footerText="Present 48/49 days"
              loading={false}
            />
            <StatCard
              label="Unpaid Dues"
              value="₹0"
              icon="pi pi-wallet"
              gradientClass="from-orange-500 to-amber-500"
              iconBgClass="bg-orange-500/10"
              iconColorClass="text-orange-600 dark:text-orange-400"
              footerText="All clear"
              loading={false}
            />
            <StatCard
              label="Upcoming Exams"
              value="1"
              icon="pi pi-calendar"
              gradientClass="from-purple-500 to-violet-500"
              iconBgClass="bg-purple-500/10"
              iconColorClass="text-purple-650 dark:text-purple-400"
              footerText="Mid-terms starting soon"
              loading={false}
            />
          </div>

          <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden mt-4">
            <h3 className="font-bold text-zinc-800 dark:text-white text-lg mb-4 sm:mb-6">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              {[
                {
                  label: 'View Timetable',
                  icon: 'pi pi-clock',
                  href: '/academics/timetable',
                  color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'My Attendance',
                  icon: 'pi pi-check-square',
                  href: '/attendance',
                  color: 'bg-green-500/10 text-green-600 dark:text-green-400',
                },
                {
                  label: 'Pay Fees',
                  icon: 'pi pi-money-bill',
                  href: '/fee/slabs',
                  color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold',
                },
                {
                  label: 'Assignments',
                  icon: 'pi pi-upload',
                  href: '/assignments',
                  color: 'bg-purple-500/10 text-purple-650 dark:text-purple-400',
                },
                {
                  label: 'Library Books',
                  icon: 'pi pi-bookmark',
                  href: '/library/books',
                  color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
                },
                {
                  label: 'Exam Results',
                  icon: 'pi pi-chart-bar',
                  href: '/exams',
                  color: 'bg-blue-500/10 text-blue-650 dark:text-blue-400',
                },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl ${action.color} hover:opacity-90 hover:scale-[1.03] hover:shadow-md transition-all duration-300 cursor-pointer no-underline border border-zinc-100 dark:border-zinc-800`}
                >
                  <i className={`${action.icon} text-2xl`}></i>
                  <span className="text-xs font-bold text-center leading-tight">
                    {action.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Dashboard" />
      <div className="flex flex-col gap-5 sm:gap-7 md:gap-8 pb-6 md:pb-10 mt-1">
        {/* Welcome Section */}
        <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {greeting()}, {activeUser?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
              Here is an overview of your institution's operations today.
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm">
            Term: {currentAY?.name || 'Not Configured ⚠️'}
          </span>
        </div>

        {/* Onboarding Checklist Card */}
        {activeUser?.role !== 'student' && activeUser?.role !== 'parent' && (
          <div className="premium-glow-effect border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-all duration-300">
            {/* Header */}
            <div
              className="flex justify-between items-center p-5 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer select-none"
              onClick={toggleChecklist}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-650 dark:text-blue-400 flex items-center justify-center font-black">
                  <i className="pi pi-compass text-sm animate-pulse"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 tracking-tight">
                    School Setup & Onboarding Progress
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                    Follow this structured checklist to fully configure your institution
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Progress bar pill */}
                <div className="hidden sm:flex items-center gap-2 bg-blue-500/10 dark:bg-blue-500/5 text-blue-650 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-black tracking-wide">
                  <span>{progressPct}% Ready</span>
                  <div className="w-16 bg-blue-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-650 dark:bg-blue-400 h-full"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350 transition-colors p-1">
                  <i
                    className={`pi pi-chevron-${isChecklistCollapsed ? 'down' : 'up'} text-xs font-bold`}
                  ></i>
                </div>
              </div>
            </div>

            {/* Steps (Collapsible Content) */}
            {!isChecklistCollapsed && (
              <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: '1. Academic Year Setup',
                    desc: 'Define active school terms & session boundaries.',
                    link: '/academics/terms',
                    completed: !!currentAY?.id,
                    icon: 'pi pi-calendar',
                  },
                  {
                    title: '2. Register School Staff',
                    desc: 'Onboard administrators, teachers, and operators.',
                    link: '/staff/directory',
                    completed: coreStats.staff?.total > 0,
                    icon: 'pi pi-id-card',
                  },
                  {
                    title: '3. Create Classes & Sections',
                    desc: 'Configure grade slabs and assign class teachers.',
                    link: '/academics/classes',
                    completed: classesData?.items?.length > 0,
                    icon: 'pi pi-sitemap',
                  },
                  {
                    title: '4. Admit Students',
                    desc: 'Enroll pupils and link them to parent/guardian profiles.',
                    link: '/students',
                    completed: coreStats.students?.total > 0,
                    icon: 'pi pi-user-plus',
                  },
                  {
                    title: '5. Define Fee Slabs',
                    desc: 'Set up tuition, transport, or custom term collections.',
                    link: '/fee/slabs',
                    completed: !!coreStats.fees,
                    icon: 'pi pi-wallet',
                  },
                  {
                    title: '6. Configure Integrations',
                    desc: 'Setup the dynamic WhatsApp webhook endpoint & Meta API.',
                    link: '/settings/integrations',
                    completed: dashboard?.whatsapp?.isConfigured,
                    icon: 'pi pi-cog',
                  },
                ].map((step, idx) => (
                  <a
                    key={idx}
                    href={step.link}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all no-underline ${
                      step.completed
                        ? 'bg-emerald-50/10 border-emerald-500/20 hover:bg-emerald-50/20 dark:bg-emerald-950/5 dark:border-emerald-900/20'
                        : 'bg-zinc-50/30 border-zinc-150/40 hover:bg-zinc-50/50 hover:border-zinc-250 dark:bg-zinc-950/10 dark:border-zinc-800/60 dark:hover:border-zinc-700/80'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        step.completed
                          ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                      }`}
                    >
                      <i
                        className={
                          step.completed ? 'pi pi-check text-xs font-black' : `${step.icon} text-xs`
                        }
                      ></i>
                    </div>

                    <div className="flex-1">
                      <div
                        className={`text-xs font-bold leading-tight tracking-tight flex items-center gap-1.5 ${
                          step.completed
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {step.title}
                        {step.completed && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-650 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed font-semibold">
                        {step.desc}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Primary KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Students"
            value={coreStats.students?.total ?? '—'}
            icon="pi pi-users"
            gradientClass="from-blue-500 to-blue-500"
            iconBgClass="bg-blue-500/10"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText={`Active: ${coreStats.students?.active ?? '0'} Students`}
            loading={adminPending}
          />
          <StatCard
            label="Active Staff"
            value={coreStats.staff?.total ?? '—'}
            icon="pi pi-id-card"
            gradientClass="from-orange-500 to-amber-500"
            iconBgClass="bg-orange-500/10"
            iconColorClass="text-orange-600 dark:text-orange-400"
            footerText="Enrolled instructors & admins"
            loading={adminPending}
          />
          <StatCard
            label="Fee Collected (Month)"
            value={
              coreStats.fees?.monthlyRevenue
                ? `₹${Number(coreStats.fees.monthlyRevenue).toLocaleString('en-IN')}`
                : '₹0'
            }
            icon="pi pi-wallet"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText={`Outstanding dues: ₹${Number(coreStats.fees?.outstandingDues ?? 0).toLocaleString('en-IN')}`}
            loading={adminPending}
          />
          <StatCard
            label="Attendance Rate"
            value={
              coreStats.attendance?.percentage ? `${coreStats.attendance.percentage}%` : '96.2%'
            }
            icon="pi pi-check-square"
            gradientClass="from-purple-500 to-violet-500"
            iconBgClass="bg-purple-500/10"
            iconColorClass="text-purple-650 dark:text-purple-400"
            footerText={`Present: ${coreStats.attendance?.today?.present ?? '5'} Students`}
            loading={adminPending}
          />
        </div>

        {/* Secondary KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Pending Transactions"
            value={coreStats.fees?.pendingTransactions ?? '—'}
            icon="pi pi-exclamation-circle"
            gradientClass="from-rose-500 to-red-500"
            iconBgClass="bg-rose-500/10"
            iconColorClass="text-rose-600 dark:text-rose-455"
            footerText="Pending invoice reminders"
            loading={adminPending}
          />
          <StatCard
            label="Hostel Occupancy"
            value={hostelStats.occupancyPct ? `${hostelStats.occupancyPct}%` : '—'}
            icon="pi pi-home"
            gradientClass="from-blue-500 to-violet-500"
            iconBgClass="bg-blue-500/10"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText={`Boarders: ${hostelStats.totalBoarders ?? '0'} / ${hostelStats.totalCapacity ?? '0'}`}
            loading={adminPending}
          />
          <StatCard
            label="Pending Leaves"
            value={leaveStats.pending ?? '—'}
            icon="pi pi-calendar-minus"
            gradientClass="from-amber-500 to-yellow-500"
            iconBgClass="bg-amber-500/10"
            iconColorClass="text-amber-600 dark:text-amber-500"
            footerText="Awaiting admin approval"
            loading={adminPending}
          />
          <StatCard
            label="Overdue Books"
            value={coreStats.library?.overdueBooks ?? '—'}
            icon="pi pi-book"
            gradientClass="from-teal-500 to-cyan-500"
            iconBgClass="bg-teal-500/10"
            iconColorClass="text-teal-650 dark:text-teal-400"
            footerText={`Total Library Books: ${coreStats.library?.totalBooks ?? '0'}`}
            loading={adminPending}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Fee Collection Bar Chart */}
          <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
            <div className="mb-4 sm:mb-6">
              <h3 className="font-bold text-zinc-800 dark:text-white text-lg">
                Fee Collection Trend
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Monthly school revenue inflow (₹)</p>
            </div>
            <div className="flex items-end justify-between h-44 px-2">
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
                        {item.amount >= 1000 ? `${(item.amount / 1000).toFixed(0)}k` : item.amount}
                      </span>
                      <div className="w-full flex items-end justify-center h-32">
                        <div
                          className="w-8 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-300 group-hover:opacity-85 shadow-sm"
                          style={{ height: `${pct}%`, minHeight: '4px' }}
                          title={`₹${item.amount.toLocaleString('en-IN')}`}
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-500">{monthName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs w-full py-10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-md">
                  No fee collection revenue data found.
                </div>
              )}
            </div>
          </div>

          {/* Attendance Trend */}
          <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
            <div className="mb-4 sm:mb-6">
              <h3 className="font-bold text-zinc-800 dark:text-white text-lg">
                Daily Attendance Rate
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Active student participation index (%)</p>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              {attendanceTrendData && attendanceTrendData.length > 0 ? (
                attendanceTrendData.slice(-5).map((item: any) => {
                  const dayName = new Date(item.date).toLocaleString('default', {
                    weekday: 'short',
                  });
                  const total = item.PRESENT + item.ABSENT + item.LATE + item.LEAVE;
                  const rate =
                    total > 0 ? Math.round(((item.PRESENT + item.LATE) / total) * 100) : 0;
                  return (
                    <div key={item.date} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-zinc-500 w-8">{dayName}</span>
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-zinc-200/40 dark:border-zinc-800">
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
                      <span className="text-xs font-extrabold text-zinc-600 dark:text-zinc-350 w-10 text-right">
                        {rate}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs w-full py-10 mt-4 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-md">
                  No attendance data recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
          <h3 className="font-bold text-zinc-800 dark:text-white text-lg mb-4 sm:mb-6">
            Operations Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {[
              {
                label: 'Add Student',
                icon: 'pi pi-user-plus',
                href: '/students',
                color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Mark Attendance',
                icon: 'pi pi-check-square',
                href: '/attendance',
                color: 'bg-green-500/10 text-green-600 dark:text-green-400',
              },
              {
                label: 'Collect Fee',
                icon: 'pi pi-money-bill',
                href: '/fee',
                color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold',
              },
              {
                label: 'Post Notice',
                icon: 'pi pi-megaphone',
                href: '/communication',
                color: 'bg-purple-500/10 text-purple-650 dark:text-purple-400',
              },
              {
                label: 'Issue Book',
                icon: 'pi pi-bookmark',
                href: '/library',
                color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
              },
              {
                label: 'View Analytics',
                icon: 'pi pi-chart-bar',
                href: '/analytics',
                color: 'bg-blue-500/10 text-blue-650 dark:text-blue-400',
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
    </DashboardLayout>
  );
}
