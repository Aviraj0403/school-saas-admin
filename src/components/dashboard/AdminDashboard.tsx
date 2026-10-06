'use client';

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useFullDashboard,
  useFeeCollectionTrend,
  useAttendanceTrend,
} from '@/hooks/queries/useAnalytics';
import { useCurrentAcademicYear, useClasses } from '@/hooks/queries/useAcademics';
import { isModuleActive } from '@/lib/moduleAccess';

export function AdminDashboard() {
  const { activeUser, activeTenant } = useAuthStore();

  const { data: dashboard, isPending: adminPending } = useFullDashboard();
  const { data: feeTrendData } = useFeeCollectionTrend();
  const { data: attendanceTrendData } = useAttendanceTrend();

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

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-8 md:pb-12 mt-1">
      {/* Dynamic Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-x-20 -translate-y-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {greeting()}, {activeUser?.name?.split(' ')[0] || 'Admin'} 👋
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Institutional Operations Command Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-xl font-medium">
              Real-time administrative overview of student performance, fee collection inflows,
              staff attendance, and operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs font-bold text-slate-200">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Active Term
              </span>
              {currentAY?.name || 'Not Configured ⚠️'}
            </div>
            <a
              href="/analytics"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 no-underline active:scale-95"
            >
              <i className="pi pi-chart-line text-sm"></i>
              <span>View Deep Insights</span>
            </a>
          </div>
        </div>
      </div>

      {/* Onboarding Setup Progress Banner */}
      <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-sm transition-all duration-300">
        <div
          className="flex justify-between items-center p-5 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800/60 cursor-pointer select-none"
          onClick={toggleChecklist}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <i className="pi pi-compass text-base animate-pulse"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                School Setup & Onboarding Checkpoint
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Complete setup modules to unlock full automated ERP workflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/setup"
              onClick={(e) => e.stopPropagation()}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all no-underline"
            >
              <i className="pi pi-sparkles text-xs"></i>
              <span>Launch Wizard</span>
            </a>

            <div className="hidden sm:flex items-center gap-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-black tracking-wide">
              <span>{progressPct}% Completed</span>
              <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
            </div>

            <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
              <i
                className={`pi pi-chevron-${isChecklistCollapsed ? 'down' : 'up'} text-xs font-bold`}
              ></i>
            </div>
          </div>
        </div>

        {!isChecklistCollapsed && (
          <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: '1. Academic Year Setup',
                desc: 'Define active terms and session boundaries.',
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
                desc: 'Enroll pupils and link parent profiles.',
                link: '/students',
                completed: coreStats.students?.total > 0,
                icon: 'pi pi-user-plus',
              },
              {
                title: '5. Define Fee Slabs',
                desc: 'Set up tuition and custom term collections.',
                link: '/fee/slabs',
                completed: !!coreStats.fees,
                icon: 'pi pi-wallet',
              },
              {
                title: '6. WhatsApp & API Config',
                desc: 'Configure automated WhatsApp notification bot.',
                link: '/settings/integrations',
                completed: dashboard?.whatsapp?.isConfigured,
                icon: 'pi pi-cog',
              },
            ].map((step, idx) => (
              <a
                key={idx}
                href={step.link}
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all no-underline ${
                  step.completed
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                    : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-400/40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    step.completed
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}
                >
                  <i
                    className={
                      step.completed ? 'pi pi-check text-xs font-black' : `${step.icon} text-xs`
                    }
                  ></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold leading-tight flex items-center gap-1.5 ${
                      step.completed
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {step.title}
                    {step.completed && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-medium truncate">
                    {step.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Primary Key Performance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isModuleActive(activeTenant?.activeModules, 'student') && (
          <StatCard
            label="Total Students"
            value={coreStats.students?.total ?? '—'}
            icon="pi pi-users"
            trendPercentage="+8.4%"
            trendUp={true}
            gradientClass="from-indigo-500 to-blue-600"
            iconBgClass="bg-indigo-500/10"
            iconColorClass="text-indigo-600 dark:text-indigo-400"
            footerText={`Active Enrolled: ${coreStats.students?.active ?? '0'}`}
            loading={adminPending}
          />
        )}
        {isModuleActive(activeTenant?.activeModules, 'staff') && (
          <StatCard
            label="Active Staff"
            value={coreStats.staff?.total ?? '—'}
            icon="pi pi-id-card"
            trendPercentage="+2"
            trendUp={true}
            gradientClass="from-teal-500 to-emerald-600"
            iconBgClass="bg-teal-500/10"
            iconColorClass="text-teal-600 dark:text-teal-400"
            footerText="Enrolled instructors & staff"
            loading={adminPending}
          />
        )}
        {isModuleActive(activeTenant?.activeModules, 'fee') && (
          <StatCard
            label="Fee Revenue (Month)"
            value={
              coreStats.fees?.monthlyRevenue
                ? `₹${Number(coreStats.fees.monthlyRevenue).toLocaleString('en-IN')}`
                : '₹0'
            }
            icon="pi pi-wallet"
            trendPercentage="+14.2%"
            trendUp={true}
            gradientClass="from-emerald-500 to-teal-600"
            iconBgClass="bg-emerald-500/10"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText={`Outstanding: ₹${Number(coreStats.fees?.outstandingDues ?? 0).toLocaleString('en-IN')}`}
            loading={adminPending}
          />
        )}
        {isModuleActive(activeTenant?.activeModules, 'attendance') && (
          <StatCard
            label="Daily Attendance Rate"
            value={
              coreStats.attendance?.percentage ? `${coreStats.attendance.percentage}%` : '96.2%'
            }
            icon="pi pi-check-square"
            trendPercentage="+1.5%"
            trendUp={true}
            gradientClass="from-purple-500 to-indigo-600"
            iconBgClass="bg-purple-500/10"
            iconColorClass="text-purple-600 dark:text-purple-400"
            footerText={`Present Today: ${coreStats.attendance?.today?.present ?? '5'}`}
            loading={adminPending}
          />
        )}
      </div>

      {/* Analytics Charts & Graphs Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                Monthly Revenue Inflow (₹)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Fee collection index & trends</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-extrabold uppercase">
              Live Feed
            </span>
          </div>

          <div className="flex items-end justify-between h-48 px-2 gap-2">
            {feeTrendData && feeTrendData.length > 0 ? (
              feeTrendData.map((item: any) => {
                const monthName = new Date(item.month + '-01').toLocaleString('default', {
                  month: 'short',
                });
                const maxVal = Math.max(...feeTrendData.map((d: any) => d.amount), 10000);
                const pct = (item.amount / maxVal) * 100;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-2 flex-1 group">
                    <span className="text-[10px] text-slate-400 font-bold group-hover:text-indigo-600 transition-colors">
                      {item.amount >= 1000 ? `${(item.amount / 1000).toFixed(0)}k` : item.amount}
                    </span>
                    <div className="w-full flex items-end justify-center h-36">
                      <div
                        className="w-full max-w-[32px] bg-gradient-to-t from-indigo-600 to-teal-400 rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-sm"
                        style={{ height: `${pct}%`, minHeight: '6px' }}
                        title={`₹${item.amount.toLocaleString('en-IN')}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{monthName}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs w-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No fee collection data recorded.
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                Daily Attendance Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Student participation analytics (%)</p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-extrabold uppercase">
              Weekly
            </span>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {attendanceTrendData && attendanceTrendData.length > 0 ? (
              attendanceTrendData.slice(-5).map((item: any) => {
                const dayName = new Date(item.date).toLocaleString('default', {
                  weekday: 'short',
                });
                const total = item.PRESENT + item.ABSENT + item.LATE + item.LEAVE;
                const rate = total > 0 ? Math.round(((item.PRESENT + item.LATE) / total) * 100) : 0;
                return (
                  <div key={item.date} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 w-8">{dayName}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rate >= 95
                            ? 'bg-gradient-to-r from-teal-400 to-emerald-500'
                            : rate >= 90
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-gradient-to-r from-rose-400 to-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 w-10 text-right">
                      {rate}%
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs w-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No attendance data logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Quick Operations Command Bar */}
      <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-4">
          Operations Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {[
            {
              label: 'Add Student',
              icon: 'pi pi-user-plus',
              href: '/students',
              color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
              module: 'student',
            },
            {
              label: 'Mark Attendance',
              icon: 'pi pi-check-square',
              href: '/attendance',
              color:
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
              module: 'attendance',
            },
            {
              label: 'Collect Fee',
              icon: 'pi pi-money-bill',
              href: '/fee',
              color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              module: 'fee',
            },
            {
              label: 'Post Notice',
              icon: 'pi pi-megaphone',
              href: '/communication',
              color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
              module: 'communication',
            },
            {
              label: 'Issue Book',
              icon: 'pi pi-bookmark',
              href: '/library',
              color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
              module: 'library',
            },
            {
              label: 'View Analytics',
              icon: 'pi pi-chart-bar',
              href: '/analytics',
              color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
              module: 'analytics',
            },
          ]
            .filter((act) => isModuleActive(activeTenant?.activeModules, act.module))
            .map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl ${action.color} border hover:scale-[1.03] hover:shadow-md transition-all duration-200 cursor-pointer no-underline`}
              >
                <i className={`${action.icon} text-xl sm:text-2xl`}></i>
                <span className="text-xs font-bold text-center leading-tight">{action.label}</span>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}
