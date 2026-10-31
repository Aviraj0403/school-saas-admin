'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { academicsService } from '@/services/academics.service';
import { staffService } from '@/services/staff.service';
import { useAuthStore } from '@/store/useAuthStore';
import LoginScreen from '@/components/layout/LoginScreen';
import { toast } from 'sonner';
import {
  BookOpen,
  CalendarDays,
  Check,
  GraduationCap,
  PartyPopper,
  School,
  Users,
} from 'lucide-react';

const STEPS = [
  { title: 'Academic year', desc: 'Your session dates', icon: CalendarDays },
  { title: 'Subjects', desc: 'What your school teaches', icon: BookOpen },
  { title: 'Teachers', desc: 'Invite your staff', icon: Users },
  { title: 'Classes', desc: 'Sections & class teachers', icon: School },
  { title: 'All set', desc: 'Start using EduNexus', icon: PartyPopper },
];

function defaultSessionName() {
  // Indian academic sessions start in April
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

export default function SetupPage() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return isAuthenticated ? <SetupWizard /> : <LoginScreen />;
}

function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Data States
  const [academicYear, setAcademicYear] = useState({
    name: defaultSessionName(),
    startDate: '',
    endDate: '',
  });
  const [subjects, setSubjects] = useState([{ name: '', code: '' }]);
  const [teachers, setTeachers] = useState([{ name: '', email: '', phone: '' }]);
  const [classes, setClasses] = useState([{ name: '', section: '', classTeacherId: '' }]);

  // Fetched data for dropdowns
  const [savedTeachers, setSavedTeachers] = useState<any[]>([]);
  const [savedSubjects, setSavedSubjects] = useState<any[]>([]);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      if (currentStep === 1) {
        // Create Academic Year
        await academicsService.createAcademicYear({ ...academicYear, isCurrent: true });
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Create Subjects
        const validSubjects = subjects.filter((s) => s.name && s.code);
        for (const sub of validSubjects) {
          await academicsService.createSubject({ name: sub.name, code: sub.code });
        }
        const fetchedSubjects = await academicsService.getSubjects();
        setSavedSubjects(fetchedSubjects);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Create Teachers
        const validTeachers = teachers.filter((t) => t.name && t.email);
        for (const t of validTeachers) {
          await staffService.createStaff({
            name: t.name,
            email: t.email,
            phone: t.phone || '',
            role: 'TEACHER',
            designation: 'Teacher',
            departmentId: null,
          } as any);
        }
        const fetchedTeachers = await staffService.getStaffList(1, 100);
        setSavedTeachers(fetchedTeachers.items || []);
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Create Classes
        const validClasses = classes.filter((c) => c.name && c.section);
        const activeYear = await academicsService.getCurrentAcademicYear();
        if (!activeYear) throw new Error('No active academic year found. Please create one first.');

        for (const c of validClasses) {
          const newClass = await academicsService.createClass({
            name: c.name,
            section: c.section,
            classTeacherId: c.classTeacherId || undefined,
            academicYearId: activeYear.id,
          });
          // Assign all created subjects to this class
          if (savedSubjects.length > 0) {
            await academicsService.assignSubjectsToClass(
              newClass.id,
              savedSubjects.map((s) => s.id)
            );
          }
        }
        setCurrentStep(5);
      } else if (currentStep === 5) {
        // Finish
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong while saving. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Academic Year Name</Label>
        <Input
          value={academicYear.name}
          onChange={(e) => setAcademicYear({ ...academicYear, name: e.target.value })}
          placeholder="e.g. 2026-2027"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={academicYear.startDate}
            onChange={(e) => setAcademicYear({ ...academicYear, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={academicYear.endDate}
            onChange={(e) => setAcademicYear({ ...academicYear, endDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add the core subjects taught at your school.</p>
      {subjects.map((sub, idx) => (
        <div key={idx} className="flex gap-2">
          <Input
            placeholder="Subject Name (e.g. Math)"
            value={sub.name}
            onChange={(e) => {
              const newS = [...subjects];
              newS[idx].name = e.target.value;
              setSubjects(newS);
            }}
          />
          <Input
            placeholder="Code (e.g. MAT101)"
            value={sub.code}
            onChange={(e) => {
              const newS = [...subjects];
              newS[idx].code = e.target.value;
              setSubjects(newS);
            }}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSubjects([...subjects, { name: '', code: '' }])}
      >
        + Add subject
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add your first teachers. You can invite the rest from the Staff page later.
      </p>
      {teachers.map((t, idx) => (
        <div key={idx} className="flex gap-2">
          <Input
            placeholder="Name"
            value={t.name}
            onChange={(e) => {
              const newT = [...teachers];
              newT[idx].name = e.target.value;
              setTeachers(newT);
            }}
          />
          <Input
            placeholder="Email"
            type="email"
            value={t.email}
            onChange={(e) => {
              const newT = [...teachers];
              newT[idx].email = e.target.value;
              setTeachers(newT);
            }}
          />
          <Input
            placeholder="Phone (optional)"
            value={t.phone}
            onChange={(e) => {
              const newT = [...teachers];
              newT[idx].phone = e.target.value;
              setTeachers(newT);
            }}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTeachers([...teachers, { name: '', email: '', phone: '' }])}
      >
        + Add teacher
      </Button>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create your first classes and assign class teachers.
      </p>
      {classes.map((c, idx) => (
        <div key={idx} className="flex gap-2">
          <Input
            placeholder="Class (e.g. Class 1)"
            value={c.name}
            onChange={(e) => {
              const newC = [...classes];
              newC[idx].name = e.target.value;
              setClasses(newC);
            }}
          />
          <Input
            placeholder="Section (e.g. A)"
            value={c.section}
            onChange={(e) => {
              const newC = [...classes];
              newC[idx].section = e.target.value;
              setClasses(newC);
            }}
          />
          <select
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-xs outline-none focus:border-brand focus:ring-4 focus:ring-brand/12 dark:border-white/10 dark:bg-white/5"
            value={c.classTeacherId}
            onChange={(e) => {
              const newC = [...classes];
              newC[idx].classTeacherId = e.target.value;
              setClasses(newC);
            }}
          >
            <option value="">No Class Teacher</option>
            {savedTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setClasses([...classes, { name: '', section: '', classTeacherId: '' }])}
      >
        + Add class
      </Button>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4 py-8 text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
        <Check className="size-9" />
      </div>
      <h2 className="font-display text-3xl font-semibold">Your school is ready 🎉</h2>
      <p className="mx-auto max-w-md text-zinc-500">
        Start admitting students, setting homework and building timetables — everything else is one
        click away on your dashboard.
      </p>
    </div>
  );

  const step = STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-background p-3 lg:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-border bg-card shadow-pop lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[320px_1fr]">
        {/* Step rail */}
        <aside className="relative overflow-hidden bg-sidebar p-7 text-white">
          <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-brand/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 size-64 rounded-full bg-brand-2/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold">EduNexus</span>
          </div>
          <p className="relative mt-8 font-display text-2xl font-semibold leading-tight">
            Let’s set up your school
          </p>
          <p className="relative mt-1 text-sm text-white/60">
            Takes about five minutes. You can change everything later.
          </p>

          <ol className="relative mt-8 space-y-1">
            {STEPS.map((st, i) => {
              const n = i + 1;
              const done = n < currentStep;
              const current = n === currentStep;
              const Icon = st.icon;
              return (
                <li
                  key={st.title}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${current ? 'bg-white/10' : ''}`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      done
                        ? 'bg-emerald-400 text-ink'
                        : current
                          ? 'bg-brand-gradient shadow-glow'
                          : 'bg-white/[0.06] text-white/50'
                    }`}
                  >
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <span>
                    <span
                      className={`block text-sm font-semibold ${current || done ? 'text-white' : 'text-white/55'}`}
                    >
                      {st.title}
                    </span>
                    <span className="block text-xs text-white/45">{st.desc}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Form */}
        <section className="flex flex-col p-6 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Step {currentStep} of {STEPS.length}
            </p>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
          {currentStep < 5 && (
            <>
              <h1 className="mt-4 font-display text-3xl font-semibold">{step.title}</h1>
              <p className="mt-1 text-zinc-500">{step.desc}</p>
            </>
          )}

          <div className="mt-8 flex-1">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
            <Button
              variant="ghost"
              disabled={currentStep === 1 || currentStep === 5}
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              Back
            </Button>
            <Button size="lg" onClick={handleNext} isLoading={isLoading}>
              {isLoading ? 'Saving…' : currentStep === 5 ? 'Go to dashboard' : 'Save & continue'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
