'use client';

import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { useStudentsList, useCreateStudent } from '@/hooks/queries/useStudents';
import { useClasses, useCurrentAcademicYear } from '@/hooks/queries/useAcademics';
import { useHostels, useHostelRooms } from '@/hooks/queries/useHostel';
import { useAuthStore } from '@/store/useAuthStore';
import { hostelService } from '@/services/hostel.service';
import { transportService } from '@/services/transport.service';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

// ── Step configuration ──────────────────────────────────────────────
const ALL_STEPS = [
  { id: 'basic',     icon: 'pi-user',           label: 'Basic Info',      module: null },
  { id: 'academic',  icon: 'pi-graduation-cap',  label: 'Academics',       module: null },
  { id: 'parent',    icon: 'pi-users',           label: 'Parent / Guardian', module: null },
  { id: 'hostel',    icon: 'pi-building',        label: 'Hostel',          module: 'hostel' },
  { id: 'transport', icon: 'pi-car',             label: 'Transport',       module: 'transport' },
  { id: 'library',   icon: 'pi-book',            label: 'Library',         module: 'library' },
  { id: 'review',    icon: 'pi-check-circle',    label: 'Review & Submit', module: null },
];

const GENDER_OPTIONS = [
  { label: 'Male',   value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other',  value: 'other' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => ({ label: b, value: b }));

const CATEGORY_OPTIONS = [
  { label: 'General',  value: 'General' },
  { label: 'OBC',      value: 'OBC' },
  { label: 'SC',       value: 'SC' },
  { label: 'ST',       value: 'ST' },
  { label: 'EWS',      value: 'EWS' },
];

const RELIGION_OPTIONS = [
  { label: 'Hindu', value: 'Hindu' },
  { label: 'Muslim', value: 'Muslim' },
  { label: 'Christian', value: 'Christian' },
  { label: 'Sikh', value: 'Sikh' },
  { label: 'Buddhist', value: 'Buddhist' },
  { label: 'Jain', value: 'Jain' },
  { label: 'Other', value: 'Other' },
];

const INITIAL_FORM = {
  // Basic
  firstName: '', lastName: '', dob: null as Date | null, gender: 'male',
  bloodGroup: '', aadharNo: '', category: 'General', religion: '',
  motherTongue: '', nationality: 'Indian',
  // Academic
  classId: '', rollNo: '', academicYear: '', previousSchool: '',
  // Parent
  parentName: '', parentPhone: '', parentEmail: '', alternatePhone: '',
  address: '', city: '', pincode: '',
  // Hostel
  hostelId: '', hostelRoomId: '', hostelEnabled: false,
  // Transport
  routeId: '', stopName: '', transportEnabled: false,
  // Library
  libraryEnabled: false,
};

// ── Reusable FieldRow ────────────────────────────────────────────────
function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Step Indicator ───────────────────────────────────────────────────
function StepIndicator({ steps, current }: { steps: typeof ALL_STEPS; current: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isDone    = idx < current;
        const isActive  = idx === current;
        const isLast    = idx === steps.length - 1;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                isDone   ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-300 dark:ring-indigo-700' :
                           'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}>
                {isDone ? <i className="pi pi-check text-[10px]"></i> : <i className={`pi ${step.icon} text-[10px]`}></i>}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider hidden md:block ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}>{step.label}</span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Module Badge ─────────────────────────────────────────────────────
function ModuleBadge({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
      active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'
    }`}>
      <i className={`pi ${icon} text-[9px]`}></i>
      {label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function AdmissionsPage() {
  const { activeTenant } = useAuthStore();
  const activeModules = activeTenant?.activeModules || [];

  // Compute which steps are enabled
  const enabledSteps = ALL_STEPS.filter(s => !s.module || activeModules.includes(s.module));

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState<any>(null);
  const [view, setView] = useState<'wizard' | 'list'>('list');
  const [listPage, setListPage] = useState(1);

  // Queries
  const { data: studentsData, isPending: loadingStudents } = useStudentsList(listPage, 12);
  const { data: classes } = useClasses(1, 100);
  const { data: currentYear } = useCurrentAcademicYear();
  const { data: hostelsRaw } = useHostels();
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const { data: hostelRoomsRaw } = useHostelRooms(selectedHostelId);

  const { data: routesRaw } = useQuery({
    queryKey: ['transport-routes'],
    queryFn: () => transportService.getRoutes(),
    enabled: activeModules.includes('transport'),
    retry: false,
  });

  // Mutations
  const createMutation = useCreateStudent();

  // Helpers
  const upd = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const stepId = enabledSteps[currentStep]?.id;

  const classOptions = (classes?.items || classes?.data?.items || []).map((c: any) => ({
    label: `${c.name} — ${c.section}`,
    value: c.id,
  }));

  const hostelOptions = ((hostelsRaw as any)?.data || []).map((h: any) => ({
    label: `${h.name} (${h.type})`,
    value: h.id,
  }));

  const roomOptions = ((hostelRoomsRaw as any)?.data || [])
    .filter((r: any) => r.occupied < r.capacity)
    .map((r: any) => ({
      label: `Room ${r.roomNo} — ${r.type} (${r.capacity - r.occupied} free)`,
      value: r.id,
    }));

  const routeOptions = Array.isArray(routesRaw)
    ? routesRaw.map((r: any) => ({ label: r.name, value: r.id }))
    : [];

  const studentsList = studentsData?.items || studentsData?.data?.items || [];
  const totalStudents = studentsData?.meta?.total || studentsData?.data?.meta?.total || 0;

  const canProceed = useCallback((): boolean => {
    if (stepId === 'basic')    return !!(form.firstName.trim() && form.lastName.trim() && form.gender);
    if (stepId === 'academic') return !!(form.classId && (form.academicYear || currentYear?.name));
    return true;
  }, [stepId, form, currentYear]);

  const handleSubmit = async () => {
    const yearLabel = form.academicYear || currentYear?.name || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    createMutation.mutate(
      {
        name: `${form.firstName} ${form.lastName}`.trim(),
        academicYear: yearLabel,
        classId: form.classId || undefined,
        dob: form.dob ? form.dob.toISOString().split('T')[0] : undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        rollNo: form.rollNo || undefined,
        aadharNo: form.aadharNo || undefined,
        category: form.category || undefined,
        religion: form.religion || undefined,
        motherTongue: form.motherTongue || undefined,
        parentName: form.parentName || undefined,
        parentPhone: form.parentPhone || undefined,
        parentEmail: form.parentEmail || undefined,
        alternatePhone: form.alternatePhone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        pincode: form.pincode || undefined,
        previousSchool: form.previousSchool || undefined,
      },
      {
        onSuccess: async (student: any) => {
          // Post-admission: conditional module enrollments
          const enrollments: string[] = [];
          try {
            if (form.hostelEnabled && form.hostelRoomId && student?.id) {
              await hostelService.admitBoarder({
                studentId: student.id,
                hostelRoomId: form.hostelRoomId,
                academicYear: yearLabel,
              });
              enrollments.push('Hostel');
            }
          } catch {}

          try {
            if (form.transportEnabled && form.routeId && student?.id) {
              await transportService.assignStudentToRoute({
                studentId: student.id,
                routeId: form.routeId,
                stopId: undefined,
                academicYear: yearLabel,
              });
              enrollments.push('Transport');
            }
          } catch {}

          setSubmitted({ student, enrollments });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
              severity: 'success',
              summary: '🎓 Student Admitted!',
              detail: `${form.firstName} ${form.lastName} successfully enrolled.${enrollments.length ? ` Also registered for: ${enrollments.join(', ')}.` : ''}`,
              life: 5000,
            }
          }));
        },
        onError: (err: any) => {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'error', summary: 'Admission Failed', detail: err?.response?.data?.message || 'Could not create student record.', life: 5000 }
          }));
        }
      }
    );
  };

  const resetWizard = () => {
    setForm(INITIAL_FORM);
    setCurrentStep(0);
    setSubmitted(null);
    setView('list');
  };

  // ── Success Screen ────────────────────────────────────────────
  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 max-w-lg mx-auto p-4">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 rounded-full flex items-center justify-center">
            <i className="pi pi-check text-4xl text-emerald-500"></i>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Admission Successful!</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              <strong>{form.firstName} {form.lastName}</strong> has been admitted and their record is now active.
            </p>
          </div>
          {submitted.enrollments?.length > 0 && (
            <div className="w-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-2xl p-4">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Also Enrolled In</p>
              <div className="flex flex-wrap gap-2">
                {submitted.enrollments.map((e: string) => (
                  <span key={e} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">{e}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={resetWizard}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95"
            >
              <i className="pi pi-user-plus mr-2"></i>New Admission
            </button>
            <Link href="/students">
              <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all active:scale-95">
                View All Students
              </button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── List View ────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-8 pb-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Student Admissions</h1>
              <p className="text-violet-100 mt-1.5 text-xs md:text-sm">
                Register new students with full academic, hostel, transport & library enrollment.
              </p>
            </div>
            <button
              onClick={() => setView('wizard')}
              className="px-5 py-2.5 bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <i className="pi pi-user-plus"></i>
              New Admission
            </button>
          </div>

          {/* Active module indicators */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Enrollment Modules:</span>
            <ModuleBadge icon="pi-building" label="Hostel"    active={activeModules.includes('hostel')} />
            <ModuleBadge icon="pi-car"      label="Transport" active={activeModules.includes('transport')} />
            <ModuleBadge icon="pi-book"     label="Library"   active={activeModules.includes('library')} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Enrolled', val: totalStudents, color: 'indigo' },
              { label: 'Active Students', val: studentsList.filter((s: any) => s.status === 'ACTIVE').length, color: 'emerald' },
              { label: 'Inactive', val: studentsList.filter((s: any) => s.status !== 'ACTIVE').length, color: 'amber' },
              { label: 'Academic Year', val: currentYear?.name || '—', color: 'violet' },
            ].map(stat => (
              <div key={stat.label} className={`bg-${stat.color}-50/50 dark:bg-${stat.color}-950/10 border border-${stat.color}-100/50 dark:border-${stat.color}-900/20 p-5 rounded-2xl shadow-sm`}>
                <span className={`text-xs font-semibold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.label}</span>
                <h2 className={`text-2xl font-extrabold text-${stat.color}-700 dark:text-${stat.color}-400 mt-1`}>
                  {loadingStudents ? '...' : stat.val}
                </h2>
              </div>
            ))}
          </div>

          {/* Student table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <DataTable
              value={studentsList}
              loading={loadingStudents}
              paginator
              rows={12}
              totalRecords={totalStudents}
              lazy
              first={(listPage - 1) * 12}
              onPage={(e) => setListPage((e.page || 0) + 1)}
              emptyMessage="No students yet. Click 'New Admission' to get started."
              className="p-datatable-sm"
            >
              <Column field="admissionNo" header="Adm. No." className="font-mono text-xs font-semibold" />
              <Column
                header="Student Name"
                body={(d) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                      {(d.name || d.firstName || '?')[0]}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                      {d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim()}
                    </span>
                  </div>
                )}
              />
              <Column field="className" header="Class" body={(d) => d.className || d.class?.name || '—'} className="text-xs" />
              <Column field="academicYear" header="Year" className="text-xs" />
              <Column
                field="status"
                header="Status"
                body={(d) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    d.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                  }`}>{d.status}</span>
                )}
              />
              <Column
                header="Actions"
                align="center"
                body={(d) => (
                  <Link href={`/students/${d.id}`}>
                    <button className="px-3 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all">
                      View
                    </button>
                  </Link>
                )}
              />
            </DataTable>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Wizard View ──────────────────────────────────────────────────
  const inputCls = "p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm w-full transition-all";
  const dropCls  = "border border-gray-200 dark:border-slate-700 rounded-xl text-sm w-full";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">

        {/* Wizard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">New Student Admission</h1>
            <p className="text-slate-400 text-xs mt-0.5">Step {currentStep + 1} of {enabledSteps.length} — {enabledSteps[currentStep]?.label}</p>
          </div>
          <button
            onClick={() => setView('list')}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <i className="pi pi-times mr-1"></i> Cancel
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <StepIndicator steps={enabledSteps} current={currentStep} />
        </div>

        {/* Step Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Step Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
              <i className={`pi ${enabledSteps[currentStep]?.icon} text-indigo-600 dark:text-indigo-400`}></i>
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 dark:text-white text-base">{enabledSteps[currentStep]?.label}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stepId === 'basic'     && 'Student personal and identification details'}
                {stepId === 'academic'  && 'Academic class placement and roll number assignment'}
                {stepId === 'parent'    && 'Parent or guardian contact information'}
                {stepId === 'hostel'    && 'Hostel room assignment for boarding students'}
                {stepId === 'transport' && 'School bus route and stop assignment'}
                {stepId === 'library'   && 'Library membership registration for student'}
                {stepId === 'review'    && 'Review all details before final submission'}
              </p>
            </div>
            {enabledSteps[currentStep]?.module && (
              <span className="ml-auto px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider rounded-full border border-indigo-200/50">
                MODULE ACTIVE
              </span>
            )}
          </div>

          <div className="p-6">

            {/* ── STEP 1: Basic Info ───────────────────────────────── */}
            {stepId === 'basic' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="First Name" required>
                    <InputText value={form.firstName} onChange={e => upd('firstName', e.target.value)} className={inputCls} placeholder="e.g. Rahul" />
                  </FieldRow>
                  <FieldRow label="Last Name" required>
                    <InputText value={form.lastName} onChange={e => upd('lastName', e.target.value)} className={inputCls} placeholder="e.g. Sharma" />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldRow label="Date of Birth">
                    <Calendar
                      value={form.dob}
                      onChange={e => upd('dob', e.value)}
                      dateFormat="dd/mm/yy"
                      showIcon
                      maxDate={new Date()}
                      inputClassName={inputCls}
                      className="w-full"
                      placeholder="DD/MM/YYYY"
                    />
                  </FieldRow>
                  <FieldRow label="Gender" required>
                    <Dropdown value={form.gender} options={GENDER_OPTIONS} onChange={e => upd('gender', e.value)} className={dropCls} />
                  </FieldRow>
                  <FieldRow label="Blood Group">
                    <Dropdown value={form.bloodGroup} options={[{ label: '— Select —', value: '' }, ...BLOOD_GROUPS]} onChange={e => upd('bloodGroup', e.value)} className={dropCls} />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldRow label="Category">
                    <Dropdown value={form.category} options={CATEGORY_OPTIONS} onChange={e => upd('category', e.value)} className={dropCls} />
                  </FieldRow>
                  <FieldRow label="Religion">
                    <Dropdown value={form.religion} options={[{ label: '— Select —', value: '' }, ...RELIGION_OPTIONS]} onChange={e => upd('religion', e.value)} className={dropCls} />
                  </FieldRow>
                  <FieldRow label="Mother Tongue">
                    <InputText value={form.motherTongue} onChange={e => upd('motherTongue', e.target.value)} className={inputCls} placeholder="e.g. Hindi" />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Aadhar Card No.">
                    <InputText value={form.aadharNo} onChange={e => upd('aadharNo', e.target.value)} className={`${inputCls} font-mono`} placeholder="xxxx xxxx xxxx" maxLength={14} />
                  </FieldRow>
                  <FieldRow label="Nationality">
                    <InputText value={form.nationality} onChange={e => upd('nationality', e.target.value)} className={inputCls} placeholder="Indian" />
                  </FieldRow>
                </div>
              </div>
            )}

            {/* ── STEP 2: Academic Assignment ──────────────────────── */}
            {stepId === 'academic' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Assign to Class" required>
                    <Dropdown
                      value={form.classId}
                      options={[{ label: '— Select Class —', value: '' }, ...classOptions]}
                      onChange={e => upd('classId', e.value)}
                      className={dropCls}
                      filter
                      filterPlaceholder="Search class..."
                      placeholder="Select Class"
                    />
                  </FieldRow>
                  <FieldRow label="Roll Number">
                    <InputText value={form.rollNo} onChange={e => upd('rollNo', e.target.value)} className={inputCls} placeholder="e.g. 01, A-12" />
                  </FieldRow>
                </div>
                <FieldRow label="Academic Year" required>
                  <InputText
                    value={form.academicYear || currentYear?.name || ''}
                    onChange={e => upd('academicYear', e.target.value)}
                    className={inputCls}
                    placeholder={currentYear?.name || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
                  />
                  {currentYear && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      <i className="pi pi-check-circle mr-1"></i> Current active year: {currentYear.name}
                    </p>
                  )}
                </FieldRow>
                <FieldRow label="Previous School">
                  <InputText value={form.previousSchool} onChange={e => upd('previousSchool', e.target.value)} className={inputCls} placeholder="e.g. Green Valley Public School, Delhi" />
                </FieldRow>
              </div>
            )}

            {/* ── STEP 3: Parent / Guardian ────────────────────────── */}
            {stepId === 'parent' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Parent / Guardian Name">
                    <InputText value={form.parentName} onChange={e => upd('parentName', e.target.value)} className={inputCls} placeholder="Full name" />
                  </FieldRow>
                  <FieldRow label="WhatsApp Phone (Primary)">
                    <InputText value={form.parentPhone} onChange={e => upd('parentPhone', e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Email Address">
                    <InputText value={form.parentEmail} onChange={e => upd('parentEmail', e.target.value)} className={inputCls} placeholder="parent@email.com" type="email" />
                  </FieldRow>
                  <FieldRow label="Alternate Phone">
                    <InputText value={form.alternatePhone} onChange={e => upd('alternatePhone', e.target.value)} className={inputCls} placeholder="Emergency contact" />
                  </FieldRow>
                </div>
                <FieldRow label="Home Address">
                  <InputTextarea value={form.address} onChange={e => upd('address', e.target.value)} className={`${inputCls} resize-none`} rows={2} placeholder="Street, Colony, Area..." />
                </FieldRow>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="City">
                    <InputText value={form.city} onChange={e => upd('city', e.target.value)} className={inputCls} placeholder="e.g. Delhi" />
                  </FieldRow>
                  <FieldRow label="Pincode">
                    <InputText value={form.pincode} onChange={e => upd('pincode', e.target.value)} className={inputCls} placeholder="e.g. 110001" maxLength={6} />
                  </FieldRow>
                </div>
              </div>
            )}

            {/* ── STEP 4: Hostel (conditional) ─────────────────────── */}
            {stepId === 'hostel' && (
              <div className="flex flex-col gap-5">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/30 rounded-xl text-blue-700 dark:text-blue-400 text-xs font-medium flex items-start gap-2">
                  <i className="pi pi-info-circle mt-0.5"></i>
                  <span>Only required for boarding students. Skip if student is a day scholar.</span>
                </div>

                {/* Toggle */}
                <div
                  onClick={() => upd('hostelEnabled', !form.hostelEnabled)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.hostelEnabled
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className="pi pi-building text-indigo-500 text-lg"></i>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">Enroll in School Hostel</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Student will be a boarder and assigned a hostel room.</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${form.hostelEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.hostelEnabled ? 'left-6' : 'left-1'} shadow-sm`} />
                  </div>
                </div>

                {form.hostelEnabled && (
                  <div className="flex flex-col gap-4">
                    <FieldRow label="Select Hostel">
                      <Dropdown
                        value={selectedHostelId}
                        options={[{ label: '— Choose Hostel —', value: '' }, ...hostelOptions]}
                        onChange={e => { setSelectedHostelId(e.value); upd('hostelId', e.value); upd('hostelRoomId', ''); }}
                        className={dropCls}
                        placeholder="Select Hostel Building"
                      />
                    </FieldRow>
                    {selectedHostelId && (
                      <FieldRow label="Assign Room">
                        <Dropdown
                          value={form.hostelRoomId}
                          options={[{ label: '— Choose Room —', value: '' }, ...roomOptions]}
                          onChange={e => upd('hostelRoomId', e.value)}
                          className={dropCls}
                          placeholder="Select Available Room"
                          emptyMessage="No available rooms in this hostel."
                        />
                      </FieldRow>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: Transport (conditional) ──────────────────── */}
            {stepId === 'transport' && (
              <div className="flex flex-col gap-5">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-medium flex items-start gap-2">
                  <i className="pi pi-info-circle mt-0.5"></i>
                  <span>Assign a bus route for students who use school transport.</span>
                </div>

                <div
                  onClick={() => upd('transportEnabled', !form.transportEnabled)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.transportEnabled
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-600'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className="pi pi-car text-amber-500 text-lg"></i>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">Enroll in School Transport</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Student will use school bus service for commuting.</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${form.transportEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.transportEnabled ? 'left-6' : 'left-1'} shadow-sm`} />
                  </div>
                </div>

                {form.transportEnabled && (
                  <div className="flex flex-col gap-4">
                    <FieldRow label="Bus Route">
                      <Dropdown
                        value={form.routeId}
                        options={[{ label: '— Select Route —', value: '' }, ...routeOptions]}
                        onChange={e => upd('routeId', e.value)}
                        className={dropCls}
                        placeholder="Select Bus Route"
                        emptyMessage="No routes configured yet."
                      />
                    </FieldRow>
                    <FieldRow label="Boarding Stop">
                      <InputText value={form.stopName} onChange={e => upd('stopName', e.target.value)} className={inputCls} placeholder="e.g. Market Chowk, Main Gate" />
                    </FieldRow>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 6: Library (conditional) ────────────────────── */}
            {stepId === 'library' && (
              <div className="flex flex-col gap-5">
                <div
                  onClick={() => upd('libraryEnabled', !form.libraryEnabled)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.libraryEnabled
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-600'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className="pi pi-book text-emerald-500 text-lg"></i>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">Register Library Membership</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Student will be eligible to borrow books from the school library.</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${form.libraryEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.libraryEnabled ? 'left-6' : 'left-1'} shadow-sm`} />
                  </div>
                </div>

                {form.libraryEnabled && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/30 rounded-xl">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <i className="pi pi-check-circle mr-1.5"></i>
                      Library membership will be activated once the student is admitted. They can borrow books as per school policy.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 7: Review & Submit ───────────────────────────── */}
            {stepId === 'review' && (
              <div className="flex flex-col gap-5">
                {/* Student Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <i className="pi pi-user text-indigo-500"></i> Basic Info
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {[
                        ['Name',     `${form.firstName} ${form.lastName}`.trim()],
                        ['Gender',   form.gender],
                        ['DOB',      form.dob ? new Date(form.dob).toLocaleDateString('en-IN') : '—'],
                        ['Blood Grp',form.bloodGroup || '—'],
                        ['Category', form.category],
                        ['Aadhar',   form.aadharNo || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-400 font-medium">{k}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Academic */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <i className="pi pi-graduation-cap text-indigo-500"></i> Academic
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {[
                        ['Class',       classOptions.find((c: {label: string; value: string}) => c.value === form.classId)?.label || '—'],
                        ['Roll No.',    form.rollNo || '—'],
                        ['Year',        form.academicYear || currentYear?.name || '—'],
                        ['Prev. School',form.previousSchool || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-400 font-medium">{k}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parent */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <i className="pi pi-users text-indigo-500"></i> Parent / Guardian
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {[
                        ['Name',   form.parentName || '—'],
                        ['Phone',  form.parentPhone || '—'],
                        ['Email',  form.parentEmail || '—'],
                        ['City',   form.city || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-400 font-medium">{k}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enrollments */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <i className="pi pi-briefcase text-indigo-500"></i> Module Enrollments
                    </h3>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'Hostel',    enabled: form.hostelEnabled,    icon: 'pi-building', detail: hostelOptions.find((h: {label: string; value: string}) => h.value === form.hostelId)?.label },
                        { label: 'Transport', enabled: form.transportEnabled, icon: 'pi-car',      detail: routeOptions.find(r => r.value === form.routeId)?.label },
                        { label: 'Library',   enabled: form.libraryEnabled,   icon: 'pi-book',     detail: 'Membership activated' },
                      ].map(e => (
                        <div key={e.label} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${e.enabled ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'opacity-40'}`}>
                          <i className={`pi ${e.icon} ${e.enabled ? 'text-emerald-500' : 'text-slate-400'}`}></i>
                          <span className={`font-semibold ${e.enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {e.label}
                          </span>
                          {e.enabled && e.detail && (
                            <span className="ml-auto text-slate-500 dark:text-slate-400 font-medium">{e.detail}</span>
                          )}
                          {!e.enabled && <span className="ml-auto text-slate-400 font-medium">Skipped</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-95 flex items-center gap-2"
          >
            <i className="pi pi-chevron-left text-xs"></i> Previous
          </button>

          <div className="flex gap-1">
            {enabledSteps.map((_, idx) => (
              <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-indigo-600 w-6' : idx < currentStep ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>

          {currentStep < enabledSteps.length - 1 ? (
            <button
              onClick={() => {
                if (!canProceed()) {
                  window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { severity: 'warn', summary: 'Required Fields', detail: 'Please fill all required fields before proceeding.', life: 3000 }
                  }));
                  return;
                }
                setCurrentStep(s => s + 1);
              }}
              className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              Next <i className="pi pi-chevron-right text-xs"></i>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <><i className="pi pi-spin pi-spinner text-xs"></i> Submitting...</>
              ) : (
                <><i className="pi pi-check text-xs"></i> Confirm Admission</>
              )}
            </button>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
