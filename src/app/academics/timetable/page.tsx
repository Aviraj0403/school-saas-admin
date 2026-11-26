'use client';

import { asList } from '@/lib/utils';
import { localDateISO } from '@/lib/format';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useTimetable,
  useCreateTimetableEntry,
  useUpdateTimetableSlot,
  useBulkCreateTimetable,
  useAllSubjects,
  useDeleteTimetableSlot,
  useTeacherTimetable,
  useEffectiveTimetable,
  useTimetableOverrides,
  useCreateTimetableOverride,
  useDeleteTimetableOverride,
} from '@/hooks/queries/useAcademics';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { useStaffDirectory } from '@/hooks/queries/useStaffDirectory';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore';
import { apiMessage } from '@/lib/apiMessage';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Clock,
  Trash2,
  User,
  BookOpen,
  AlertTriangle,
  Pencil,
  Copy,
  CalendarOff,
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MAP: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const blankForm = () => ({
  subjectId: '',
  teacherId: '',
  days: [1] as number[],
  startTime: '09:00',
  endTime: '10:00',
  periodNumber: '',
  roomNo: '',
});

const labelCls = 'font-semibold text-xs text-zinc-700 dark:text-zinc-300';

const toSlotDto = (s: any) => ({
  classId: s.classId,
  subjectId: s.subjectId,
  teacherId: s.teacherId,
  dayOfWeek: s.dayOfWeek,
  startTime: s.startTime,
  endTime: s.endTime,
  ...(s.periodNumber ? { periodNumber: s.periodNumber } : {}),
  ...(s.roomNo ? { roomNo: s.roomNo } : {}),
});

export default function TimetablePage() {
  const { isAdmin } = usePermissions();
  const myId = useAuthStore((s) => s.activeUser?.id ?? '');
  const { classes, isTeacher } = useScopedClasses();
  const { data: staffDir = [] } = useStaffDirectory();

  const [view, setView] = useState<'class' | 'teacher'>(isTeacher ? 'teacher' : 'class');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [teacherId, setTeacherId] = useState(isTeacher ? myId : '');
  const [mode, setMode] = useState<'weekly' | 'date'>('weekly');
  const [date, setDate] = useState(localDateISO());

  useEffect(() => {
    if (isTeacher && !teacherId && myId) setTeacherId(myId);
  }, [isTeacher, teacherId, myId]);

  const { data: timetableRaw, isPending, isError, error } = useTimetable(selectedClassId);
  const timetable: any[] = useMemo(
    () => asList<any>((timetableRaw as any)?.slots ?? timetableRaw),
    [timetableRaw]
  );
  const { data: teacherSlots = [], isPending: loadingTeacher } = useTeacherTimetable(
    view === 'teacher' ? teacherId : undefined
  );
  const { data: effective, isPending: loadingEffective } = useEffectiveTimetable(
    view === 'class' && mode === 'date' ? selectedClassId : undefined,
    date
  );
  const { data: subjects = [] } = useAllSubjects();

  const overrideRange = useMemo(() => {
    const from = localDateISO();
    const to = new Date();
    to.setDate(to.getDate() + 90);
    return { from, to: localDateISO(to) };
  }, []);
  const { data: overrides = [] } = useTimetableOverrides(
    { ...overrideRange, classId: selectedClassId || undefined },
    view === 'class' && !!selectedClassId
  );

  const createMutation = useCreateTimetableEntry();
  const updateMutation = useUpdateTimetableSlot();
  const bulkMutation = useBulkCreateTimetable();
  const deleteMutation = useDeleteTimetableSlot();
  const createOverrideMutation = useCreateTimetableOverride();
  const deleteOverrideMutation = useDeleteTimetableOverride();

  const [showDialog, setShowDialog] = useState(false);
  const [mobileDay, setMobileDay] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 1 : d;
  });
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [form, setForm] = useState(blankForm());
  const [deleteSlotTarget, setDeleteSlotTarget] = useState<any | null>(null);
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);
  const [copyToDays, setCopyToDays] = useState<number[]>([]);

  const [overrideDialog, setOverrideDialog] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    date: localDateISO(),
    type: 'holiday',
    description: '',
    slotId: '',
    substituteTeacherId: '',
    schoolWide: false,
  });

  const classOptions = classes.map((c) => ({ label: c.label, value: c.id }));
  const subjectOptions = (subjects as any[]).map((s) => ({
    label: s.code ? `${s.name} (${s.code})` : s.name,
    value: s.id,
  }));
  const teacherOptions = staffDir.map((t) => ({
    label: t.designation ? `${t.name} — ${t.designation}` : t.name,
    value: t.id,
  }));
  const teacherName = (id?: string) => staffDir.find((s) => s.id === id)?.name;

  const groupBy = (list: any[]) => {
    const g: Record<number, any[]> = {};
    list.forEach((e) => {
      (g[e.dayOfWeek] ||= []).push(e);
    });
    return g;
  };
  const grouped = groupBy(timetable);
  const teacherGrouped = groupBy(teacherSlots as any[]);

  const uniqueSubjects = new Set(timetable.map((e) => e.subjectId)).size;
  const uniqueTeachers = new Set(timetable.map((e) => e.teacherId)).size;

  const openCreate = (day?: number) => {
    setEditingSlot(null);
    setForm({ ...blankForm(), days: [day ?? 1] });
    setShowDialog(true);
  };

  const openEdit = (slot: any) => {
    setEditingSlot(slot);
    setForm({
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      days: [slot.dayOfWeek],
      startTime: slot.startTime,
      endTime: slot.endTime,
      periodNumber: slot.periodNumber ? String(slot.periodNumber) : '',
      roomNo: slot.roomNo ?? '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!selectedClassId) return;
    if (
      !form.teacherId ||
      !form.startTime ||
      !form.endTime ||
      (!editingSlot && (!form.subjectId || form.days.length === 0))
    ) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error('End time must be after start time.');
      return;
    }
    const period = form.periodNumber ? Number(form.periodNumber) : undefined;
    if (editingSlot) {
      updateMutation.mutate(
        {
          id: editingSlot.id,
          data: {
            teacherId: form.teacherId,
            startTime: form.startTime,
            endTime: form.endTime,
            roomNo: form.roomNo || undefined,
            periodNumber: period,
          },
        },
        {
          onSuccess: () => {
            setShowDialog(false);
            toast.success('Period updated.');
          },
          onError: (err) => toast.error(apiMessage(err, 'Failed to update period.')),
        }
      );
      return;
    }
    // One POST per selected day so the server's conflict check runs for each.
    (async () => {
      let created = 0;
      try {
        for (const day of form.days) {
          await createMutation.mutateAsync({
            classId: selectedClassId,
            subjectId: form.subjectId,
            teacherId: form.teacherId,
            dayOfWeek: day,
            startTime: form.startTime,
            endTime: form.endTime,
            ...(period ? { periodNumber: period } : {}),
            ...(form.roomNo ? { roomNo: form.roomNo } : {}),
          } as any);
          created++;
        }
        setShowDialog(false);
        toast.success(created > 1 ? `${created} periods added.` : 'Period added.');
      } catch (err) {
        toast.error(
          `${created ? `${created} added, then stopped: ` : ''}${apiMessage(err, 'Failed to add period.')}`
        );
      }
    })();
  };

  const confirmDeleteSlot = () => {
    if (!deleteSlotTarget) return;
    deleteMutation.mutate(deleteSlotTarget.id, {
      onSuccess: () => {
        toast.success('Period deleted.');
        setDeleteSlotTarget(null);
      },
      onError: (err) => toast.error(apiMessage(err, 'Failed to delete period.')),
    });
  };

  // Copy a day's periods to other days, via the bulk endpoint (replaces the class timetable with the merged set).
  const confirmCopy = () => {
    if (!copyFromDay || copyToDays.length === 0) {
      toast.error('Choose at least one day to copy to.');
      return;
    }
    const source = timetable.filter((s) => s.dayOfWeek === copyFromDay);
    const kept = timetable.filter((s) => !copyToDays.includes(s.dayOfWeek));
    const copies = copyToDays.flatMap((d) => source.map((s) => ({ ...s, dayOfWeek: d })));
    bulkMutation.mutate([...kept, ...copies].map(toSlotDto), {
      onSuccess: () => {
        toast.success('Day copied.');
        setCopyFromDay(null);
        setCopyToDays([]);
      },
      onError: (err) => toast.error(apiMessage(err, 'Failed to copy the day.')),
    });
  };

  const saveOverride = () => {
    const f = overrideForm;
    if (!f.date) return toast.error('Pick a date.');
    if (f.type === 'cancelled' && !f.slotId) return toast.error('Choose the period to cancel.');
    createOverrideMutation.mutate(
      {
        date: f.date,
        type: f.type as 'holiday' | 'cancelled' | 'special',
        description: f.description || undefined,
        classId: f.schoolWide ? undefined : selectedClassId || undefined,
        slotId: f.slotId || undefined,
        substituteTeacherId: f.substituteTeacherId || undefined,
      },
      {
        onSuccess: () => {
          setOverrideDialog(false);
          toast.success('Override saved.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to save override.')),
      }
    );
  };

  const slotCard = (entry: any, opts: { editable: boolean; showClass?: boolean }) => (
    <div
      key={entry.id}
      className="relative group/slot flex flex-col gap-1.5 rounded-xl border border-border bg-muted/40 p-3 transition-all hover:border-brand/40"
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
          {entry.subject?.name || 'Subject'}
        </span>
        {opts.editable && (
          <span className="flex shrink-0 gap-1 transition-all md:opacity-0 md:group-hover/slot:opacity-100 md:focus-within:opacity-100">
            <button
              onClick={() => openEdit(entry)}
              className="rounded p-2 text-muted-foreground hover:bg-brand/10 hover:text-brand md:p-1"
              title="Edit period"
              aria-label="Edit period"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeleteSlotTarget(entry)}
              className="rounded p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 md:p-1"
              title="Delete period"
              aria-label="Delete period"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground dark:text-zinc-400">
        <Clock className="w-3 h-3 text-brand" />
        <span className="text-xs font-mono">
          {entry.startTime} – {entry.endTime}
        </span>
        {entry.roomNo && <span className="text-[11px] text-zinc-400">· {entry.roomNo}</span>}
      </div>
      {opts.showClass ? (
        <div className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
          {entry.class?.name} {entry.class?.section}
        </div>
      ) : (
        (entry.teacher?.name || teacherName(entry.teacherId)) && (
          <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <User className="w-3 h-3 text-zinc-400" />
            <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
              {entry.teacher?.name || teacherName(entry.teacherId)}
            </span>
            {entry.substituteTeacher && <Badge variant="warning">Substitute</Badge>}
          </div>
        )
      )}
    </div>
  );

  const weekGrid = (
    g: Record<number, any[]>,
    loadingState: boolean,
    opts: { editable: boolean; showClass?: boolean; addPeriod?: boolean }
  ) => (
    <div className="flex flex-col gap-3">
      {/* Phones: day tabs, one day at a time */}
      <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 md:hidden">
        {[1, 2, 3, 4, 5, 6].map((day) => (
          <button
            key={day}
            onClick={() => setMobileDay(day)}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
              mobileDay === day
                ? 'border-transparent bg-brand-gradient text-white'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            {DAY_MAP[day].slice(0, 3)}
            <span className="ml-1.5 text-xs tabular-nums opacity-80">{g[day]?.length || 0}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((day) => (
          <div
            key={day}
            className={`surface-card flex-col overflow-hidden ${day === mobileDay ? 'flex' : 'hidden md:flex'}`}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 p-4">
              <h3 className="text-card-title">{DAY_MAP[day]}</h3>
              <Badge variant="secondary">{g[day]?.length || 0} slots</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-3 md:min-h-[200px]">
              {loadingState ? (
                <div className="flex items-center justify-center h-full py-10 text-xs text-zinc-400">
                  Loading...
                </div>
              ) : g[day]?.length ? (
                [...g[day]]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((e) => slotCard(e, opts))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                  <Calendar className="w-8 h-8 mb-1" />
                  <span className="text-xs font-medium">Free Day</span>
                </div>
              )}
            </div>
            {opts.addPeriod && isAdmin && (
              <div className="flex gap-2 border-t border-border bg-muted/30 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openCreate(day)}
                  className="flex-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
                {g[day]?.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCopyFromDay(day);
                      setCopyToDays([]);
                    }}
                    className="text-xs"
                    title="Copy this day to other days"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Timetable" subtitle="Academics" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <PageHeader
          title="Timetable"
          description={
            isAdmin
              ? 'Structure weekly class schedules and teacher allocations'
              : 'View class schedules and your own teaching periods'
          }
          actions={
            isAdmin && view === 'class' && mode === 'weekly' ? (
              <Button
                className="h-11 sm:h-10"
                disabled={!selectedClassId}
                onClick={() => openCreate()}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Period
              </Button>
            ) : undefined
          }
        />

        <div className="flex w-fit rounded-xl bg-muted p-1">
          {(['class', 'teacher'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`h-10 px-4 text-xs font-semibold rounded-lg transition-all ${
                view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {v === 'class' ? 'By Class' : 'By Teacher'}
            </button>
          ))}
        </div>

        {view === 'teacher' ? (
          <>
            <div className="surface-card flex w-full flex-col gap-1.5 p-4 sm:p-5 md:w-96">
              <label className={labelCls}>Teacher</label>
              {isTeacher ? (
                <Input value="My timetable" disabled readOnly />
              ) : (
                <Select
                  value={teacherId}
                  options={[{ label: 'Select a teacher', value: '' }, ...teacherOptions]}
                  onChange={(e) => setTeacherId(e.target.value)}
                />
              )}
            </div>
            {teacherId ? (
              weekGrid(teacherGrouped, loadingTeacher, { editable: false, showClass: true })
            ) : (
              <div className="surface-card p-10 text-center text-sm text-muted-foreground sm:p-16">
                Choose a teacher to see their weekly periods.
              </div>
            )}
          </>
        ) : (
          <>
            <div className="surface-card flex flex-col items-start justify-between gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex w-full flex-col gap-1.5 sm:w-72">
                  <label className={labelCls}>Class</label>
                  <Select
                    value={selectedClassId}
                    options={[{ label: 'Select a class', value: '' }, ...classOptions]}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  />
                </div>
                <div className="scrollbar-none flex max-w-full overflow-x-auto rounded-xl bg-muted p-1">
                  {(['weekly', 'date'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`h-10 shrink-0 px-3 text-xs font-semibold rounded-lg ${
                        mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      {m === 'weekly' ? 'Weekly' : 'On a date (with overrides)'}
                    </button>
                  ))}
                </div>
                {mode === 'date' && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Date</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => e.target.value && setDate(e.target.value)}
                      className="w-full sm:w-44"
                    />
                  </div>
                )}
              </div>

              {selectedClassId && mode === 'weekly' && (
                <div className="grid w-full grid-cols-3 gap-2 text-center sm:flex sm:w-auto sm:gap-4">
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-2 py-3 sm:flex-row sm:gap-3 sm:px-4">
                    <Calendar className="w-5 h-5 text-brand" />
                    <div>
                      <p className="text-lg font-bold leading-none">{timetable.length}</p>
                      <p className="text-xs text-muted-foreground font-medium">Weekly Periods</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-2 py-3 sm:flex-row sm:gap-3 sm:px-4">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-lg font-bold leading-none">{uniqueSubjects}</p>
                      <p className="text-xs text-muted-foreground font-medium">Subjects</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-2 py-3 sm:flex-row sm:gap-3 sm:px-4">
                    <User className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-lg font-bold leading-none">{uniqueTeachers}</p>
                      <p className="text-xs text-muted-foreground font-medium">Teachers</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!selectedClassId ? (
              <div className="surface-card p-10 text-center sm:p-16">
                <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-600 dark:text-zinc-400 font-semibold text-sm">
                  {classes.length === 0 && isTeacher
                    ? 'No classes are assigned to you yet.'
                    : 'Select a class to view its timetable.'}
                </p>
              </div>
            ) : mode === 'date' ? (
              <div className="surface-card flex flex-col gap-3 p-4 sm:p-5">
                {loadingEffective ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (effective as any)?.isHoliday ? (
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                    <CalendarOff className="w-5 h-5" /> Holiday
                    {(effective as any).description ? ` — ${(effective as any).description}` : ''}
                  </div>
                ) : (
                  <>
                    {((effective as any)?.specialNotes ?? []).map((n: string, i: number) => (
                      <div
                        key={i}
                        className="text-xs rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 px-3 py-2"
                      >
                        {n}
                      </div>
                    ))}
                    {((effective as any)?.slots ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No periods on this date.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...(effective as any).slots]
                          .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
                          .map((e: any) => slotCard(e, { editable: false }))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : isError ? (
              <div className="p-10 text-center text-sm text-rose-600">
                {apiMessage(error, 'Could not load the timetable.')}
              </div>
            ) : (
              <>
                {weekGrid(grouped, isPending, { editable: isAdmin, addPeriod: true })}

                {timetable.length > 0 && (
                  <div className="surface-card p-4 sm:p-5">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-brand" /> Teacher — Subject Allocation Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(
                        timetable.reduce((acc: Record<string, Set<string>>, entry: any) => {
                          const t =
                            entry.teacher?.name || teacherName(entry.teacherId) || 'Unknown';
                          (acc[t] ||= new Set()).add(entry.subject?.name || 'Subject');
                          return acc;
                        }, {})
                      ).map(([teacher, subs]) => (
                        <div
                          key={teacher}
                          className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80"
                        >
                          <p className="text-xs font-semibold flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-brand" /> {teacher}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {[...subs].map((sub) => (
                              <Badge key={sub} variant="secondary">
                                {sub}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overrides: holidays, cancelled and special periods */}
                <div className="surface-card p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <CalendarOff className="w-4 h-4 text-brand" /> Upcoming overrides (next 90
                      days)
                    </h3>
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => setOverrideDialog(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add override
                      </Button>
                    )}
                  </div>
                  {(overrides as any[]).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No holidays, cancellations or special periods are scheduled.
                    </p>
                  ) : (
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                      {(overrides as any[]).map((o) => (
                        <li key={o.id} className="flex items-start justify-between gap-3 py-2.5">
                          <span>
                            <b>{new Date(o.date).toLocaleDateString()}</b>{' '}
                            <Badge
                              variant={
                                o.type === 'holiday'
                                  ? 'warning'
                                  : o.type === 'cancelled'
                                    ? 'danger'
                                    : 'info'
                              }
                            >
                              {o.type}
                            </Badge>
                            <span className="ml-2 text-muted-foreground text-xs">
                              {o.description}
                              {o.class ? ` · ${o.class.name} ${o.class.section}` : ' · school-wide'}
                              {o.substituteTeacher
                                ? ` · substitute ${o.substituteTeacher.name}`
                                : ''}
                            </span>
                          </span>
                          {isAdmin && (
                            <button
                              aria-label="Delete override"
                              className="shrink-0 p-2.5 text-muted-foreground hover:text-red-500"
                              onClick={() =>
                                deleteOverrideMutation.mutate(o.id, {
                                  onSuccess: () => toast.success('Override removed.'),
                                  onError: (err) =>
                                    toast.error(apiMessage(err, 'Failed to remove override.')),
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Add / edit period */}
      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingSlot ? `Edit Period — ${DAY_MAP[editingSlot.dayOfWeek]}` : 'Add Period'}
      >
        <div className="flex flex-col gap-4 py-2">
          {!editingSlot && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Days *</label>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((d, i) => {
                  const day = i + 1;
                  return (
                    <label key={d} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={form.days.includes(day)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            days: e.target.checked
                              ? [...form.days, day]
                              : form.days.filter((x) => x !== day),
                          })
                        }
                      />
                      {d.slice(0, 3)}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Subject *</label>
            <Select
              value={form.subjectId}
              disabled={!!editingSlot}
              options={[
                { label: 'Select Subject', value: '' },
                ...(editingSlot && editingSlot.subject
                  ? [{ label: editingSlot.subject.name, value: editingSlot.subjectId }]
                  : subjectOptions),
              ]}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Assigned Teacher *</label>
            <Select
              value={form.teacherId}
              options={[{ label: 'Select Teacher', value: '' }, ...teacherOptions]}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Start Time *</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>End Time *</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Period no.</label>
              <Input
                type="number"
                min={1}
                value={form.periodNumber}
                onChange={(e) => setForm({ ...form, periodNumber: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Room</label>
              <Input
                value={form.roomNo}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                placeholder="e.g. Room 101"
              />
            </div>
          </div>

          {!editingSlot && subjectOptions.length === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No subjects yet. Add subjects first from the Subjects page.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {editingSlot ? 'Save Changes' : 'Save Period'}
          </Button>
        </div>
      </Dialog>

      {/* Delete period */}
      <Dialog
        isOpen={!!deleteSlotTarget}
        onClose={() => setDeleteSlotTarget(null)}
        title="Delete Period"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Delete {deleteSlotTarget?.subject?.name} on{' '}
            {deleteSlotTarget ? DAY_MAP[deleteSlotTarget.dayOfWeek] : ''} (
            {deleteSlotTarget?.startTime} – {deleteSlotTarget?.endTime})?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteSlotTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteSlot}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Copy day */}
      <Dialog
        isOpen={copyFromDay !== null}
        onClose={() => setCopyFromDay(null)}
        title={`Copy ${copyFromDay ? DAY_MAP[copyFromDay] : ''} to other days`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            The periods of this day are copied onto the selected days, replacing whatever those days
            contain now. This rewrites the class timetable in one step.
          </p>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d, i) => {
              const day = i + 1;
              if (day === copyFromDay) return null;
              return (
                <label key={d} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={copyToDays.includes(day)}
                    onChange={(e) =>
                      setCopyToDays(
                        e.target.checked
                          ? [...copyToDays, day]
                          : copyToDays.filter((x) => x !== day)
                      )
                    }
                  />
                  {d}
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCopyFromDay(null)}>
              Cancel
            </Button>
            <Button onClick={confirmCopy} isLoading={bulkMutation.isPending}>
              Copy
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Override */}
      <Dialog
        isOpen={overrideDialog}
        onClose={() => setOverrideDialog(false)}
        title="Add Timetable Override"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Date *</label>
              <Input
                type="date"
                value={overrideForm.date}
                onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Type *</label>
              <Select
                value={overrideForm.type}
                options={[
                  { label: 'Holiday', value: 'holiday' },
                  { label: 'Cancelled period', value: 'cancelled' },
                  { label: 'Special / substitute', value: 'special' },
                ]}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, type: e.target.value, slotId: '' })
                }
              />
            </div>
          </div>
          {overrideForm.type !== 'holiday' && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>
                Period {overrideForm.type === 'cancelled' ? '*' : ''}
              </label>
              <Select
                value={overrideForm.slotId}
                options={[
                  { label: 'Select period', value: '' },
                  ...timetable.map((s) => ({
                    label: `${DAY_MAP[s.dayOfWeek]} ${s.startTime} — ${s.subject?.name ?? 'Subject'}`,
                    value: s.id,
                  })),
                ]}
                onChange={(e) => setOverrideForm({ ...overrideForm, slotId: e.target.value })}
              />
            </div>
          )}
          {overrideForm.type === 'special' && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Substitute teacher</label>
              <Select
                value={overrideForm.substituteTeacherId}
                options={[{ label: 'None', value: '' }, ...teacherOptions]}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, substituteTeacherId: e.target.value })
                }
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Description</label>
            <Input
              value={overrideForm.description}
              onChange={(e) => setOverrideForm({ ...overrideForm, description: e.target.value })}
              placeholder="e.g. Diwali holiday"
            />
          </div>
          {overrideForm.type === 'holiday' && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={overrideForm.schoolWide}
                onChange={(e) => setOverrideForm({ ...overrideForm, schoolWide: e.target.checked })}
              />
              Applies to the whole school (otherwise only this class)
            </label>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setOverrideDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveOverride} isLoading={createOverrideMutation.isPending}>
              Save Override
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
