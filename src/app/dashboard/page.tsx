'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useFullDashboard } from '@/hooks/queries/useAnalytics';
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

function StatCard({ label, value, icon, gradientClass, iconBgClass, iconColorClass, footerText, loading }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientClass} opacity-[0.03] rounded-full translate-x-8 -translate-y-8`}></div>
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{label}</span>
          {loading ? (
            <Skeleton width="6rem" height="2.25rem" className="mt-2" />
          ) : (
            <div className="font-black text-3xl text-slate-800 dark:text-slate-100 mt-2">{value}</div>
          )}
        </div>
        <div className={`flex items-center justify-center ${iconBgClass} rounded-2xl w-14 h-14 transition-transform duration-300 group-hover:scale-110`}>
          <i className={`${icon} ${iconColorClass} text-2xl`}></i>
        </div>
      </div>
      <p className="text-slate-400 text-[10px] mt-5 uppercase font-extrabold tracking-wider">{footerText}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { activeUser, activeTenant } = useAuthStore();
  const { data: dashboard, isPending } = useFullDashboard();

  // Onboarding Setup checklist dynamic status checks
  const { data: currentAY } = useCurrentAcademicYear();
  const { data: deptsData } = useDepartmentsList();
  const { data: classesData } = useClasses(1, 10);
  const { data: staffData } = useStaffList(1, 10);
  const { data: studentsData } = useStudentsList(1, 10);

  const hasAY = !!currentAY;
  const hasDepts = (deptsData && deptsData.length > 0) || false;
  const hasClasses = (classesData?.data?.items && classesData.data.items.length > 0) || false;
  const hasStaff = (staffData?.items && staffData.items.length > 0) || false;
  const hasStudents = (studentsData?.data?.items && studentsData.data.items.length > 0) || false;

  // Calculate overall setup progress percentage
  const completedSteps = [hasAY, hasDepts, hasClasses, hasStaff, hasStudents].filter(Boolean).length;
  const progressPct = Math.round((completedSteps / 5) * 100);

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
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white bg-gradient-to-r from-indigo-500 to-purple-650 bg-clip-text text-transparent">
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

        {/* School Onboarding & Setup Guided Flow */}
        <div className="shadow-2xl border border-slate-200 dark:border-slate-800 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-550/10 rounded-full blur-3xl translate-y-16 -translate-x-16 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10 relative mb-8">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Interactive Guided Onboarding
              </span>
              <h2 className="text-3xl font-black mt-3 bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                School Setup Roadmap & Telemetry
              </h2>
              <p className="text-xs text-indigo-200 mt-1.5 max-w-xl leading-relaxed">
                Configure your school ecosystem step-by-step. The connector pipeline lights up dynamically as records are configured in your database.
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-1.5 bg-slate-900/80 border border-slate-800/85 p-4 rounded-2xl min-w-[200px] text-center backdrop-blur-md shadow-inner">
              <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest block w-full">Onboarding Progress</span>
              <span className="text-3xl font-black text-white">{progressPct}%</span>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-1.5 overflow-hidden p-0.5 border border-slate-700/30">
                <div className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>
          </div>

          {/* Interactive Flow Graph Map (SVG Vector representation for Large screens) */}
          <div className="hidden lg:block relative w-full h-[220px] bg-slate-950/80 rounded-2xl border border-slate-800/50 shadow-inner overflow-hidden mb-6 z-10">
            {/* Grid Tech Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:30px_30px] opacity-25"></div>
            
            <svg className="w-full h-full p-6" viewBox="0 0 1000 160" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              
              {/* Connector Pipelines */}
              <path d="M 100 80 L 300 80" stroke={hasAY ? "url(#activeGrad)" : "url(#pipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY ? "" : "opacity-40"} />
              <path d="M 300 80 L 500 80" stroke={hasAY && hasDepts ? "url(#activeGrad)" : "url(#pipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY && hasDepts ? "" : "opacity-40"} />
              <path d="M 500 80 L 700 80" stroke={hasAY && hasDepts && hasClasses ? "url(#activeGrad)" : "url(#pipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY && hasDepts && hasClasses ? "" : "opacity-40"} />
              <path d="M 700 80 L 900 80" stroke={hasAY && hasDepts && hasClasses && hasStaff ? "url(#activeGrad)" : "url(#pipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY && hasDepts && hasClasses && hasStaff ? "" : "opacity-40"} />

              {/* Animated pulses running along the pipeline */}
              {hasAY && (
                <path d="M 100 80 L 300 80" stroke="#34d399" strokeWidth="3" fill="none" strokeDasharray="10 8" className="animate-[dash_8s_linear_infinite]" />
              )}
              {hasAY && hasDepts && (
                <path d="M 300 80 L 500 80" stroke="#34d399" strokeWidth="3" fill="none" strokeDasharray="10 8" className="animate-[dash_8s_linear_infinite]" />
              )}
              {hasAY && hasDepts && hasClasses && (
                <path d="M 500 80 L 700 80" stroke="#34d399" strokeWidth="3" fill="none" strokeDasharray="10 8" className="animate-[dash_8s_linear_infinite]" />
              )}
              {hasAY && hasDepts && hasClasses && hasStaff && (
                <path d="M 700 80 L 900 80" stroke="#34d399" strokeWidth="3" fill="none" strokeDasharray="10 8" className="animate-[dash_8s_linear_infinite]" />
              )}

              {/* Nodes and Pins */}
              {/* Node 1: Term */}
              <g transform="translate(100, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/academics/terms'}>
                <circle r={hasAY ? "26" : "22"} fill="#0f172a" stroke={hasAY ? "#10b981" : "#475569"} strokeWidth="4" />
                <circle r={hasAY ? "26" : "22"} fill={hasAY ? "#10b981" : "#4f46e5"} opacity={hasAY ? "0.15" : "0.05"} className={hasAY ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasAY && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasAY ? 'pi-check-circle text-emerald-400' : 'pi-calendar text-indigo-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">1. Term Setup</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-indigo-300 font-sans">{hasAY ? "Active" : "Pending ⚠️"}</text>
              </g>

              {/* Node 2: Department */}
              <g transform="translate(300, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/academics/departments'}>
                <circle r={hasDepts ? "26" : "22"} fill="#0f172a" stroke={hasDepts ? "#10b981" : "#475569"} strokeWidth="4" />
                <circle r={hasDepts ? "26" : "22"} fill={hasDepts ? "#10b981" : "#4f46e5"} opacity={hasDepts ? "0.15" : "0.05"} className={hasDepts ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasDepts && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasDepts ? 'pi-check-circle text-emerald-400' : 'pi-sitemap text-indigo-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">2. Departments</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-indigo-300 font-sans">{hasDepts ? "Configured" : "Pending ⚠️"}</text>
              </g>

              {/* Node 3: Classes */}
              <g transform="translate(500, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/academics/classes'}>
                <circle r={hasClasses ? "26" : "22"} fill="#0f172a" stroke={hasClasses ? "#10b981" : "#475569"} strokeWidth="4" />
                <circle r={hasClasses ? "26" : "22"} fill={hasClasses ? "#10b981" : "#4f46e5"} opacity={hasClasses ? "0.15" : "0.05"} className={hasClasses ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasClasses && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasClasses ? 'pi-check-circle text-emerald-400' : 'pi-home text-indigo-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">3. Class & Syllabus</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-indigo-300 font-sans">{hasClasses ? "Active" : "Pending ⚠️"}</text>
              </g>

              {/* Node 4: Faculty */}
              <g transform="translate(700, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/staff'}>
                <circle r={hasStaff ? "26" : "22"} fill="#0f172a" stroke={hasStaff ? "#10b981" : "#475569"} strokeWidth="4" />
                <circle r={hasStaff ? "26" : "22"} fill={hasStaff ? "#10b981" : "#4f46e5"} opacity={hasStaff ? "0.15" : "0.05"} className={hasStaff ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasStaff && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasStaff ? 'pi-check-circle text-emerald-400' : 'pi-id-card text-indigo-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">4. Faculty Directory</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-indigo-300 font-sans">{hasStaff ? "Enrolled" : "Pending ⚠️"}</text>
              </g>

              {/* Node 5: Students */}
              <g transform="translate(900, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/students/admissions'}>
                <circle r={hasStudents ? "26" : "22"} fill="#0f172a" stroke={hasStudents ? "#10b981" : "#475569"} strokeWidth="4" />
                <circle r={hasStudents ? "26" : "22"} fill={hasStudents ? "#10b981" : "#4f46e5"} opacity={hasStudents ? "0.15" : "0.05"} className={hasStudents ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasStudents && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasStudents ? 'pi-check-circle text-emerald-400' : 'pi-users text-indigo-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">5. Admissions</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-indigo-300 font-sans">{hasStudents ? "Registered" : "Pending ⚠️"}</text>
              </g>
            </svg>
          </div>

          {/* Grid Checklist panel - Responsive viewports */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2 z-10 relative">
            
            {/* Step 1: Academic Years */}
            <div className={`p-4.5 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasAY ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-indigo-300">STEP 1</span>
                {hasAY ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Configure Terms</h4>
              <p className="text-[10px] text-indigo-200 mt-1 leading-relaxed min-h-[36px]">Setup active academic terms to run school admissions.</p>
              <a 
                href="/academics/terms" 
                className={`mt-4 px-3 py-2 rounded-xl text-[10px] font-bold text-center block no-underline transition-all ${
                  hasAY 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md active:scale-95'
                }`}
              >
                {hasAY ? 'Setup Completed ✓' : 'Add Term'}
              </a>
            </div>

            {/* Step 2: Departments */}
            <div className={`p-4.5 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasDepts ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-indigo-300">STEP 2</span>
                {hasDepts ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Add Departments</h4>
              <p className="text-[10px] text-indigo-200 mt-1 leading-relaxed min-h-[36px]">Group curriculum branches and course hierarchies.</p>
              <a 
                href="/academics/departments" 
                className={`mt-4 px-3 py-2 rounded-xl text-[10px] font-bold text-center block no-underline transition-all ${
                  hasDepts 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md active:scale-95'
                }`}
              >
                {hasDepts ? 'Setup Completed ✓' : 'Add Department'}
              </a>
            </div>

            {/* Step 3: Classrooms */}
            <div className={`p-4.5 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasClasses ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-indigo-300">STEP 3</span>
                {hasClasses ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Active Classrooms</h4>
              <p className="text-[10px] text-indigo-200 mt-1 leading-relaxed min-h-[36px]">Establish school class grades, sections and assign study syllabus.</p>
              <a 
                href="/academics/classes" 
                className={`mt-4 px-3 py-2 rounded-xl text-[10px] font-bold text-center block no-underline transition-all ${
                  hasClasses 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md active:scale-95'
                }`}
              >
                {hasClasses ? 'Setup Completed ✓' : 'Add Class'}
              </a>
            </div>

            {/* Step 4: Teachers & Staff */}
            <div className={`p-4.5 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasStaff ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-indigo-300">STEP 4</span>
                {hasStaff ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Register Faculty</h4>
              <p className="text-[10px] text-indigo-200 mt-1 leading-relaxed min-h-[36px]">Onboard instructors, assign roles, and setup credentials.</p>
              <a 
                href="/staff" 
                className={`mt-4 px-3 py-2 rounded-xl text-[10px] font-bold text-center block no-underline transition-all ${
                  hasStaff 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md active:scale-95'
                }`}
              >
                {hasStaff ? 'Setup Completed ✓' : 'Register Faculty'}
              </a>
            </div>

            {/* Step 5: Student Admissions */}
            <div className={`p-4.5 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasStudents ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-indigo-300">STEP 5</span>
                {hasStudents ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Admit Students</h4>
              <p className="text-[10px] text-indigo-200 mt-1 leading-relaxed min-h-[36px]">Register students profile into classes and billing systems.</p>
              <a 
                href="/students/admissions" 
                className={`mt-4 px-3 py-2 rounded-xl text-[10px] font-bold text-center block no-underline transition-all ${
                  hasStudents 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md active:scale-95'
                }`}
              >
                {hasStudents ? 'Setup Completed ✓' : 'Admit Students'}
              </a>
            </div>

          </div>
        </div>

        {/* Primary KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              {[
                { month: 'Jan', value: 12000 },
                { month: 'Feb', value: 19000 },
                { month: 'Mar', value: 8000 },
                { month: 'Apr', value: 22000 },
                { month: 'May', value: 30000 },
                { month: 'Jun', value: 45000 },
              ].map((item) => {
                const pct = (item.value / 45000) * 100;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-2 flex-1 group">
                    <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-650 transition-colors">
                      {item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value}
                    </span>
                    <div className="w-full flex items-end justify-center h-32">
                      <div
                        className="w-8 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-300 group-hover:opacity-85 shadow-sm"
                        style={{ height: `${pct}%`, minHeight: '4px' }}
                        title={`₹${item.value.toLocaleString('en-IN')}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Trend */}
          <div className="shadow-sm border border-slate-105 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900 p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Daily Attendance Rate</h3>
              <p className="text-xs text-slate-400 mt-1">Active student participation index (%)</p>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              {[
                { day: 'Mon', rate: 94 },
                { day: 'Tue', rate: 96 },
                { day: 'Wed', rate: 91 },
                { day: 'Thu', rate: 97 },
                { day: 'Fri', rate: 89 },
              ].map((item) => (
                <div key={item.day} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500 w-8">{item.day}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-550 ${
                        item.rate >= 95 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                          : item.rate >= 90 
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                          : 'bg-gradient-to-r from-rose-400 to-red-500'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-350 w-10 text-right">{item.rate}%</span>
                </div>
              ))}
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
