'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  useCurrentAcademicYear,
  useClasses,
  useDepartmentsList 
} from '@/hooks/queries/useAcademics';
import { useStaffList } from '@/hooks/queries/useStaff';
import { useStudentsList } from '@/hooks/queries/useStudents';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';


export default function OnboardingGuidePage() {
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

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Guide" subtitle="Academics" />
<div className="flex flex-col gap-4 pb-10 animate-fade-in">
        
        {/* Welcome Section */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              School Setup Guide & Helper Cockpit
            </h1>
            
          </div>
          <span className="px-4 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-xs font-bold uppercase tracking-wider border border-blue-500/20">
            Active Term: {currentAY?.name || 'Not Configured ⚠️'}
          </span>
        </div>

        {/* Guided Roadmap Card (Stunning SVG Flow Graph) */}
        <div className="shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-gradient-to-br from-zinc-900 via-zinc-950 to-blue-950/80 p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl translate-y-16 -translate-x-16 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-6 z-10 relative mb-8">
            <div>
              <span className="px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-widest uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                School Launch Pipeline
              </span>
              <h2 className="text-2xl font-black mt-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                System Setup Roadmap
              </h2>
            </div>
            
            <div className="flex flex-col items-end gap-1.5 bg-zinc-900/80 border border-zinc-800 p-4 rounded-md min-w-[200px] text-center backdrop-blur-md shadow-inner">
              <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest block w-full">Onboarding Progress</span>
              <span className="text-3xl font-black text-white">{progressPct}%</span>
              <div className="w-full bg-zinc-800 h-2 rounded-full mt-1.5 overflow-hidden p-0.5 border border-zinc-700/30">
                <div className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>
          </div>

          {/* Interactive Flow Graph Map (SVG Vector representation for Large screens) */}
          <div className="hidden lg:block relative w-full h-[220px] bg-zinc-950/80 rounded-md border border-zinc-900 shadow-inner overflow-hidden mb-6 z-10">
            {/* Grid Tech Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:30px_30px] opacity-25"></div>
            
            <svg className="w-full h-full p-6" viewBox="0 0 1000 160" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="gPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <linearGradient id="gActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              
              {/* Connector Pipelines */}
              <path d="M 100 80 L 300 80" stroke={hasAY ? "url(#gActiveGrad)" : "url(#gPipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY ? "" : "opacity-40"} />
              <path d="M 300 80 L 500 80" stroke={hasAY && hasDepts ? "url(#gActiveGrad)" : "url(#gPipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY && hasDepts ? "" : "opacity-40"} />
              <path d="M 500 80 L 700 80" stroke={hasAY && hasDepts && hasClasses ? "url(#gActiveGrad)" : "url(#gPipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY && hasDepts && hasClasses ? "" : "opacity-40"} />
              <path d="M 700 80 L 900 80" stroke={hasAY && hasDepts && hasClasses && hasStaff ? "url(#gActiveGrad)" : "url(#gPipeGrad)"} strokeWidth="6" strokeLinecap="round" fill="none" className={hasAY && hasDepts && hasClasses && hasStaff ? "" : "opacity-40"} />

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
                <circle r={hasAY ? "26" : "22"} fill="#18181b" stroke={hasAY ? "#10b981" : "#52525b"} strokeWidth="4" />
                <circle r={hasAY ? "26" : "22"} fill={hasAY ? "#10b981" : "#3b82f6"} opacity={hasAY ? "0.15" : "0.05"} className={hasAY ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasAY && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasAY ? 'pi-check-circle text-emerald-400' : 'pi-calendar text-blue-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">1. Term Setup</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-blue-300 font-sans">{hasAY ? "Active" : "Pending ⚠️"}</text>
              </g>

              {/* Node 2: Department */}
              <g transform="translate(300, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/academics/departments'}>
                <circle r={hasDepts ? "26" : "22"} fill="#18181b" stroke={hasDepts ? "#10b981" : "#52525b"} strokeWidth="4" />
                <circle r={hasDepts ? "26" : "22"} fill={hasDepts ? "#10b981" : "#3b82f6"} opacity={hasDepts ? "0.15" : "0.05"} className={hasDepts ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasDepts && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasDepts ? 'pi-check-circle text-emerald-400' : 'pi-sitemap text-blue-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">2. Departments</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-blue-300 font-sans">{hasDepts ? "Configured" : "Pending ⚠️"}</text>
              </g>

              {/* Node 3: Classes */}
              <g transform="translate(500, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/academics/classes'}>
                <circle r={hasClasses ? "26" : "22"} fill="#18181b" stroke={hasClasses ? "#10b981" : "#52525b"} strokeWidth="4" />
                <circle r={hasClasses ? "26" : "22"} fill={hasClasses ? "#10b981" : "#3b82f6"} opacity={hasClasses ? "0.15" : "0.05"} className={hasClasses ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasClasses && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasClasses ? 'pi-check-circle text-emerald-400' : 'pi-home text-blue-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">3. Class & Syllabus</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-blue-300 font-sans">{hasClasses ? "Active" : "Pending ⚠️"}</text>
              </g>

              {/* Node 4: Faculty */}
              <g transform="translate(700, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/staff'}>
                <circle r={hasStaff ? "26" : "22"} fill="#18181b" stroke={hasStaff ? "#10b981" : "#52525b"} strokeWidth="4" />
                <circle r={hasStaff ? "26" : "22"} fill={hasStaff ? "#10b981" : "#3b82f6"} opacity={hasStaff ? "0.15" : "0.05"} className={hasStaff ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasStaff && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasStaff ? 'pi-check-circle text-emerald-400' : 'pi-id-card text-blue-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">4. Faculty Directory</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-blue-300 font-sans">{hasStaff ? "Enrolled" : "Pending ⚠️"}</text>
              </g>

              {/* Node 5: Students */}
              <g transform="translate(900, 80)" className="cursor-pointer group/node" onClick={() => window.location.href = '/students/admissions'}>
                <circle r={hasStudents ? "26" : "22"} fill="#18181b" stroke={hasStudents ? "#10b981" : "#52525b"} strokeWidth="4" />
                <circle r={hasStudents ? "26" : "22"} fill={hasStudents ? "#10b981" : "#3b82f6"} opacity={hasStudents ? "0.15" : "0.05"} className={hasStudents ? "" : "group-hover/node:scale-125 transition-transform"} />
                {hasStudents && <circle r="36" fill="#10b981" opacity="0.1" className="animate-ping" />}
                <i className={`pi ${hasStudents ? 'pi-check-circle text-emerald-400' : 'pi-users text-blue-400'} text-lg`} style={{ transform: 'translate(-9px, -9px)', position: 'absolute' }}></i>
                <text y="50" textAnchor="middle" className="text-[11px] font-black fill-white font-sans tracking-wide">5. Admissions</text>
                <text y="64" textAnchor="middle" className="text-[9px] font-bold fill-blue-300 font-sans">{hasStudents ? "Registered" : "Pending ⚠️"}</text>
              </g>
            </svg>
          </div>

          {/* Grid Checklist panel - Responsive viewports */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2 z-10 relative">
            
            {/* Step 1: Academic Years */}
            <div className={`p-4.5 rounded-md border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasAY ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-blue-400">STEP 1</span>
                {hasAY ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Configure Terms</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed min-h-[36px]">Setup active academic terms to run school admissions.</p>
              <a 
                href="/academics/terms" 
                className={`mt-4 px-3 py-2 rounded-md text-[10px] font-bold text-center block no-underline transition-all ${
                  hasAY 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95 border-0'
                }`}
              >
                {hasAY ? 'Setup Completed ✓' : 'Add Term'}
              </a>
            </div>

            {/* Step 2: Departments */}
            <div className={`p-4.5 rounded-md border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasDepts ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-blue-400">STEP 2</span>
                {hasDepts ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Add Departments</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed min-h-[36px]">Group curriculum branches and course hierarchies.</p>
              <a 
                href="/academics/departments" 
                className={`mt-4 px-3 py-2 rounded-md text-[10px] font-bold text-center block no-underline transition-all ${
                  hasDepts 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95 border-0'
                }`}
              >
                {hasDepts ? 'Setup Completed ✓' : 'Add Department'}
              </a>
            </div>

            {/* Step 3: Classrooms */}
            <div className={`p-4.5 rounded-md border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasClasses ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-blue-400">STEP 3</span>
                {hasClasses ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Active Classrooms</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed min-h-[36px]">Establish school class grades, sections and assign study syllabus.</p>
              <a 
                href="/academics/classes" 
                className={`mt-4 px-3 py-2 rounded-md text-[10px] font-bold text-center block no-underline transition-all ${
                  hasClasses 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95 border-0'
                }`}
              >
                {hasClasses ? 'Setup Completed ✓' : 'Add Class'}
              </a>
            </div>

            {/* Step 4: Teachers & Staff */}
            <div className={`p-4.5 rounded-md border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasStaff ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-blue-400">STEP 4</span>
                {hasStaff ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Register Faculty</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed min-h-[36px]">Onboard instructors, assign roles, and setup credentials.</p>
              <a 
                href="/staff" 
                className={`mt-4 px-3 py-2 rounded-md text-[10px] font-bold text-center block no-underline transition-all ${
                  hasStaff 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95 border-0'
                }`}
              >
                {hasStaff ? 'Setup Completed ✓' : 'Register Faculty'}
              </a>
            </div>

            {/* Step 5: Student Admissions */}
            <div className={`p-4.5 rounded-md border backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${hasStudents ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold text-blue-400">STEP 5</span>
                {hasStudents ? (
                  <i className="pi pi-check-circle text-emerald-400 text-base" title="Completed"></i>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Pending"></span>
                )}
              </div>
              <h4 className="font-bold text-sm mt-3">Admit Students</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed min-h-[36px]">Register students profile into classes and billing systems.</p>
              <a 
                href="/students/admissions" 
                className={`mt-4 px-3 py-2 rounded-md text-[10px] font-bold text-center block no-underline transition-all ${
                  hasStudents 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95 border-0'
                }`}
              >
                {hasStudents ? 'Setup Completed ✓' : 'Admit Students'}
              </a>
            </div>

          </div>
        </div>

        {/* Detailed Operational Guidelines */}
        <div className="shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 p-6 flex flex-col gap-6 mt-4">
          <div>
            <h3 className="font-bold text-zinc-800 dark:text-white text-lg">System Alignment Guidelines & Best Practices</h3>
            <p className="text-xs text-zinc-500 mt-1">Understand the logical relational dependencies between modules to guarantee error-free setups.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            
            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md flex gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center shrink-0">
                <i className="pi pi-calendar text-blue-600 dark:text-blue-400 text-lg"></i>
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">1. Term Calendar Dependency</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Before creating any classrooms or enrolling students, you MUST configure an active Academic Term. The backend uses this UUID to query valid admissions and billing ranges dynamically.
                </p>
              </div>
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md flex gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center shrink-0">
                <i className="pi pi-sitemap text-blue-600 dark:text-blue-400 text-lg"></i>
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">2. Staff Roles & Departments</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  When adding faculty or staff, specify valid Role database UUIDs (automatically queried from the RBAC schemas) rather than raw string names. Aligning departments beforehand enables proper curriculum branch assignments.
                </p>
              </div>
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md flex gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center shrink-0">
                <i className="pi pi-home text-blue-600 dark:text-blue-400 text-lg"></i>
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">3. Class Capacity Limit</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Active classrooms require specifying class capacity under the `maxStrength` schema property. Setting limits prevents over-enrollment when admitting students or assigning seat grids during exams.
                </p>
              </div>
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md flex gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center shrink-0">
                <i className="pi pi-wallet text-blue-600 dark:text-blue-400 text-lg"></i>
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">4. Cascading Fee Matrix</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  The financial collections suite dynamically pulls class-specific student directories and queries their real-time outstanding dues dynamically based on active fee slab configurations.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
