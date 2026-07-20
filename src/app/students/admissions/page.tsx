'use client';

import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcademicYearSelect } from '@/components/academics/AcademicYearSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import { useStudentsList, useCreateStudent } from '@/hooks/queries/useStudents';
import { useClasses, useCurrentAcademicYear } from '@/hooks/queries/useAcademics';
import { useHostels, useHostelRooms } from '@/hooks/queries/useHostel';
import { useAuthStore } from '@/store/useAuthStore';
import { hostelService } from '@/services/hostel.service';
import { transportService } from '@/services/transport.service';
import { studentsService } from '@/services/students.service';
import { compressImageForProfile } from '@/lib/media';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

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
  firstName: '', lastName: '', dob: undefined as Date | undefined, gender: 'male',
  bloodGroup: '', aadharNo: '', category: 'General', religion: '',
  motherTongue: '', nationality: 'Indian',
  classId: '', rollNo: '', academicYearId: '', previousSchool: '',
  parentName: '', parentPhone: '', parentEmail: '', alternatePhone: '',
  address: '', city: '', pincode: '',
  hostelId: '', hostelRoomId: '', hostelEnabled: false,
  routeId: '', stopName: '', transportEnabled: false,
  libraryEnabled: false,
};

// ── Reusable FieldRow ────────────────────────────────────────────────
function FieldRow({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-bold text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>}
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
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-300 dark:ring-blue-700' :
                           'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
              }`}>
                {isDone ? <i className="pi pi-check text-[10px]"></i> : <i className={`pi ${step.icon} text-[10px]`}></i>}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider hidden md:block ${
                isActive ? 'text-blue-600 dark:text-blue-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
              }`}>{step.label}</span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
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
              : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 line-through'
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

  const enabledSteps = ALL_STEPS.filter(s => !s.module || activeModules.includes(s.module));

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<any>(null);
  const [view, setView] = useState<'wizard' | 'list'>('list');
  const [listPage, setListPage] = useState(1);

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

  const createMutation = useCreateStudent();

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
    if (stepId === 'academic') return !!(form.classId && (form.academicYearId || currentYear?.id));
    return true;
  }, [stepId, form, currentYear]);

  const handleSubmit = async () => {
    const yearId = form.academicYearId || currentYear?.id || '';

    createMutation.mutate(
      {
        name: `${form.firstName} ${form.lastName}`.trim(),
        academicYearId: yearId,
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
          const enrollments: string[] = [];

          // Profile photo — compressed to the server's 100 KB cap
          try {
            if (photoFile && student?.id) {
              const blob = await compressImageForProfile(photoFile);
              if (blob) await studentsService.uploadPhoto(student.id, blob);
            }
          } catch {}

          try {
            if (form.hostelEnabled && form.hostelRoomId && student?.id) {
              await hostelService.admitBoarder({
                studentId: student.id,
                hostelRoomId: form.hostelRoomId,
                academicYearId: yearId,
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
                academicYearId: yearId,
              });
              enrollments.push('Transport');
            }
          } catch {}

          setSubmitted({ student, enrollments });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
              severity: 'success',
              summary: '🎓 Student Admitted!',
              detail: `${form.firstName} ${form.lastName} successfully enrolled.`,
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
    setPhotoFile(null);
    setPhotoPreview(null);
    setCurrentStep(0);
    setSubmitted(null);
    setView('list');
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <PageBreadcrumb title="Admissions" subtitle="Students" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 max-w-lg mx-auto p-4">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 rounded-full flex items-center justify-center">
            <i className="pi pi-check text-4xl text-emerald-500"></i>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-zinc-800 dark:text-white">Admission Successful!</h1>
          </div>
          {submitted.enrollments?.length > 0 && (
            <div className="w-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-md p-4">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Also Enrolled In</p>
              <div className="flex flex-wrap gap-2">
                {submitted.enrollments.map((e: string) => (
                  <span key={e} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">{e}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={resetWizard} variant="default" className="w-full md:w-auto">
              <i className="pi pi-user-plus mr-2"></i>New Admission
            </Button>
            <Link href="/students">
              <Button variant="outline">View All Students</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (view === 'list') {
    return (
      <DashboardLayout>
        <PageBreadcrumb title="Admissions" subtitle="Students" />
        <div className="flex flex-col gap-4 pb-10">
          <div className="flex flex-col items-start gap-4 pb-4">
            <Button onClick={() => setView('wizard')} className="shadow-md">
              <i className="pi pi-user-plus mr-2"></i> New Admission
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Active Enrollment Modules:</span>
            <ModuleBadge icon="pi-building" label="Hostel" active={activeModules.includes('hostel')} />
            <ModuleBadge icon="pi-car" label="Transport" active={activeModules.includes('transport')} />
            <ModuleBadge icon="pi-book" label="Library" active={activeModules.includes('library')} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Enrolled', val: totalStudents, color: 'indigo' },
              { label: 'Active Students', val: studentsList.filter((s: any) => s.status === 'ACTIVE').length, color: 'emerald' },
              { label: 'Inactive', val: studentsList.filter((s: any) => s.status !== 'ACTIVE').length, color: 'amber' },
              { label: 'Academic Year', val: currentYear?.name || '—', color: 'violet' },
            ].map(stat => (
              <div key={stat.label} className={`bg-${stat.color}-50/50 border border-${stat.color}-100/50 p-5 rounded-md shadow-sm`}>
                <span className={`text-xs font-semibold text-${stat.color}-600`}>{stat.label}</span>
                <h2 className={`text-2xl font-extrabold text-${stat.color}-700 mt-1`}>{loadingStudents ? '...' : stat.val}</h2>
              </div>
            ))}
          </div>

          <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                <TableRow>
                  <TableHead>Adm. No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingStudents ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                ) : studentsList.length === 0 ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">No students found.</TableCell></TableRow>
                ) : (
                  studentsList.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.admissionNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-xs">
                            {(d.name || d.firstName || '?')[0]}
                          </div>
                          <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-100">
                            {d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{d.className || d.class?.name || '—'}</TableCell>
                      <TableCell className="text-xs">{d.academicYear?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'ACTIVE' ? 'default' : 'secondary'} className={d.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/students/${d.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-[10px]">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4 px-4 bg-zinc-50 dark:bg-zinc-900 border-t">
              <Button variant="outline" size="sm" onClick={() => setListPage(p => Math.max(1, p - 1))} disabled={listPage === 1 || loadingStudents}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="text-xs font-semibold text-zinc-500">Page {listPage}</div>
              <Button variant="outline" size="sm" onClick={() => setListPage(p => p + 1)} disabled={studentsList.length < 12 || loadingStudents}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Admissions" subtitle="Students" />
      <div className="flex flex-col gap-4 pb-10">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <Button onClick={() => setView('list')} variant="ghost" size="sm" className="text-zinc-500">
            <i className="pi pi-times mr-1"></i> Cancel
          </Button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-5 shadow-sm">
          <StepIndicator steps={enabledSteps} current={currentStep} />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-md shadow-sm overflow-hidden">
          <div className="bg-zinc-50 dark:bg-zinc-800/80 border-b px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
              <i className={`pi ${enabledSteps[currentStep]?.icon} text-blue-600`}></i>
            </div>
            <div>
              <h2 className="font-extrabold text-base">{enabledSteps[currentStep]?.label}</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Please provide accurate information for this step.</p>
            </div>
          </div>

          <div className="p-6">
            {stepId === 'basic' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xl">
                      {(form.firstName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <FieldRow label="Profile Photo" hint="JPEG/PNG — compressed to ≤100 KB automatically">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const f = e.target.files?.[0] ?? null;
                        setPhotoFile(f);
                        setPhotoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                    />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="First Name" required>
                    <Input value={form.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="e.g. Rahul" />
                  </FieldRow>
                  <FieldRow label="Last Name" required>
                    <Input value={form.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="e.g. Sharma" />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldRow label="Date of Birth">
                    <Popover>
                      <PopoverTrigger className={`flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal ${!form.dob && "text-muted-foreground"}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.dob ? format(form.dob, "PPP") : <span>Pick a date</span>}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={form.dob} onSelect={e => upd('dob', e)} />
                      </PopoverContent>
                    </Popover>
                  </FieldRow>
                  <FieldRow label="Gender" required>
                    <Select value={form.gender} onValueChange={e => upd('gender', e)}>
                      <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Blood Group">
                    <Select value={form.bloodGroup} onValueChange={e => upd('bloodGroup', e)}>
                      <SelectTrigger><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldRow label="Category">
                    <Select value={form.category} onValueChange={e => upd('category', e)}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Religion">
                    <Select value={form.religion} onValueChange={e => upd('religion', e)}>
                      <SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger>
                      <SelectContent>
                        {RELIGION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Mother Tongue">
                    <Input value={form.motherTongue} onChange={e => upd('motherTongue', e.target.value)} placeholder="e.g. Hindi" />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Aadhar Card No.">
                    <Input value={form.aadharNo} onChange={e => upd('aadharNo', e.target.value)} className="font-mono" placeholder="xxxx xxxx xxxx" maxLength={14} />
                  </FieldRow>
                  <FieldRow label="Nationality">
                    <Input value={form.nationality} onChange={e => upd('nationality', e.target.value)} placeholder="Indian" />
                  </FieldRow>
                </div>
              </div>
            )}

            {stepId === 'academic' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Assign to Class" required>
                    <Select value={form.classId} onValueChange={e => upd('classId', e)}>
                      <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                      <SelectContent>
                        {classOptions.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="Roll Number" hint="Auto-assigned per class section if left blank">
                    <Input value={form.rollNo} onChange={e => upd('rollNo', e.target.value)} placeholder="Auto-assigned if blank" />
                  </FieldRow>
                </div>
                <FieldRow label="Academic Year" required>
                  <AcademicYearSelect
                    value={form.academicYearId || currentYear?.id || ''}
                    onChange={id => upd('academicYearId', id)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm w-full"
                  />
                </FieldRow>
                <FieldRow label="Previous School">
                  <Input value={form.previousSchool} onChange={e => upd('previousSchool', e.target.value)} placeholder="e.g. Green Valley Public School, Delhi" />
                </FieldRow>
              </div>
            )}

            {stepId === 'parent' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Parent / Guardian Name">
                    <Input value={form.parentName} onChange={e => upd('parentName', e.target.value)} placeholder="Full name" />
                  </FieldRow>
                  <FieldRow label="WhatsApp Phone (Primary)">
                    <Input value={form.parentPhone} onChange={e => upd('parentPhone', e.target.value)} placeholder="+91 98765 43210" />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="Email Address">
                    <Input value={form.parentEmail} onChange={e => upd('parentEmail', e.target.value)} placeholder="parent@email.com" type="email" />
                  </FieldRow>
                  <FieldRow label="Alternate Phone">
                    <Input value={form.alternatePhone} onChange={e => upd('alternatePhone', e.target.value)} placeholder="Emergency contact" />
                  </FieldRow>
                </div>
                <FieldRow label="Home Address">
                  <Textarea value={form.address} onChange={e => upd('address', e.target.value)} className="resize-none" rows={2} placeholder="Street, Colony, Area..." />
                </FieldRow>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldRow label="City">
                    <Input value={form.city} onChange={e => upd('city', e.target.value)} placeholder="e.g. Delhi" />
                  </FieldRow>
                  <FieldRow label="Pincode">
                    <Input value={form.pincode} onChange={e => upd('pincode', e.target.value)} placeholder="e.g. 110001" maxLength={6} />
                  </FieldRow>
                </div>
              </div>
            )}

            {stepId === 'hostel' && (
              <div className="flex flex-col gap-5">
                <div onClick={() => upd('hostelEnabled', !form.hostelEnabled)} className={`flex items-center justify-between p-4 rounded-md border-2 cursor-pointer transition-all ${form.hostelEnabled ? 'border-blue-400 bg-blue-50' : 'border-zinc-200'}`}>
                  <div className="flex items-center gap-3">
                    <i className="pi pi-building text-blue-500 text-lg"></i>
                    <div>
                      <p className="font-bold text-sm text-zinc-800 dark:text-white">Enroll in School Hostel</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Student will be a boarder and assigned a hostel room.</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${form.hostelEnabled ? 'bg-blue-600' : 'bg-zinc-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.hostelEnabled ? 'left-6' : 'left-1'} shadow-sm`} />
                  </div>
                </div>

                {form.hostelEnabled && (
                  <div className="flex flex-col gap-4">
                    <FieldRow label="Select Hostel">
                      <Select value={selectedHostelId} onValueChange={e => { setSelectedHostelId(e || ''); upd('hostelId', e); upd('hostelRoomId', ''); }}>
                        <SelectTrigger><SelectValue placeholder="Select Hostel Building" /></SelectTrigger>
                        <SelectContent>
                          {hostelOptions.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    {selectedHostelId && (
                      <FieldRow label="Assign Room">
                        <Select value={form.hostelRoomId} onValueChange={e => upd('hostelRoomId', e)}>
                          <SelectTrigger><SelectValue placeholder="Select Available Room" /></SelectTrigger>
                          <SelectContent>
                            {roomOptions.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FieldRow>
                    )}
                  </div>
                )}
              </div>
            )}

            {stepId === 'transport' && (
              <div className="flex flex-col gap-5">
                <div onClick={() => upd('transportEnabled', !form.transportEnabled)} className={`flex items-center justify-between p-4 rounded-md border-2 cursor-pointer transition-all ${form.transportEnabled ? 'border-amber-400 bg-amber-50' : 'border-zinc-200'}`}>
                  <div className="flex items-center gap-3">
                    <i className="pi pi-car text-amber-500 text-lg"></i>
                    <div>
                      <p className="font-bold text-sm text-zinc-800 dark:text-white">Enroll in School Transport</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${form.transportEnabled ? 'bg-amber-500' : 'bg-zinc-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.transportEnabled ? 'left-6' : 'left-1'} shadow-sm`} />
                  </div>
                </div>

                {form.transportEnabled && (
                  <div className="flex flex-col gap-4">
                    <FieldRow label="Bus Route">
                      <Select value={form.routeId} onValueChange={e => upd('routeId', e)}>
                        <SelectTrigger><SelectValue placeholder="Select Bus Route" /></SelectTrigger>
                        <SelectContent>
                          {routeOptions.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="Boarding Stop">
                      <Input value={form.stopName} onChange={e => upd('stopName', e.target.value)} placeholder="e.g. Market Chowk, Main Gate" />
                    </FieldRow>
                  </div>
                )}
              </div>
            )}

            {stepId === 'library' && (
              <div className="flex flex-col gap-5">
                <div onClick={() => upd('libraryEnabled', !form.libraryEnabled)} className={`flex items-center justify-between p-4 rounded-md border-2 cursor-pointer transition-all ${form.libraryEnabled ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200'}`}>
                  <div className="flex items-center gap-3">
                    <i className="pi pi-book text-emerald-500 text-lg"></i>
                    <div>
                      <p className="font-bold text-sm text-zinc-800">Register Library Membership</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${form.libraryEnabled ? 'bg-emerald-600' : 'bg-zinc-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.libraryEnabled ? 'left-6' : 'left-1'} shadow-sm`} />
                  </div>
                </div>
              </div>
            )}

            {stepId === 'review' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-50 rounded-md p-4 border border-zinc-100">
                    <h3 className="font-extrabold text-xs text-zinc-500 uppercase mb-3">Basic Info</h3>
                    <div className="space-y-1.5 text-xs">
                      <div>Name: {form.firstName} {form.lastName}</div>
                      <div>Gender: {form.gender}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-100 rounded-md p-4 shadow-sm">
          <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>

          {currentStep < enabledSteps.length - 1 ? (
            <Button onClick={() => setCurrentStep(s => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {createMutation.isPending ? 'Submitting...' : 'Confirm Admission'}
            </Button>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
