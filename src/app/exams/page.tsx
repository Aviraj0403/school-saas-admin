'use client';

import { asList } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useExamsList,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  usePublishExam,
  useAddExamSubject,
  useExamDetails,
  useEnterExamResults,
  useExamHalls,
  useCreateHall,
  useAutoAssignSeating,
  useSeatingChart,
  useExamResults,
} from '@/hooks/queries/useExams';
import { useSubjects, useTeacherTimetable } from '@/hooks/queries/useAcademics';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { useStaffDirectory } from '@/hooks/queries/useStaffDirectory';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore';
import { apiMessage } from '@/lib/apiMessage';
import { toast } from 'sonner';
import {
  Award,
  Plus,
  Network,
  Printer,
  FileText,
  Edit3,
  Trash2,
  Send,
  BookPlus,
  Building2,
  PencilLine,
} from 'lucide-react';

type Tab = 'schedules' | 'marks' | 'seating' | 'admit-cards' | 'reports';

const EXAM_TYPES = [
  { label: 'Term exam', value: 'term' },
  { label: 'Unit test', value: 'unit' },
  { label: 'Weekly test', value: 'weekly' },
  { label: 'Practical', value: 'practical' },
];

const emptyExam = { name: '', type: 'term', startDate: '', endDate: '' };
const emptySubject = {
  classId: '',
  subjectId: '',
  date: '',
  startTime: '09:00',
  duration: '60',
  maxMarks: '100',
  passMarks: '33',
};

const labelCls = 'font-semibold text-xs text-zinc-700 dark:text-zinc-300';

export default function ExamsPage() {
  const { isAdmin, isRole } = usePermissions();
  const myId = useAuthStore((s) => s.activeUser?.id ?? '');
  const isTeacher = isRole('teacher') && !isAdmin;

  const [activeTab, setActiveTab] = useState<Tab>('schedules');

  // Queries
  const {
    data: exams,
    isPending: loadingExams,
    isError: examsError,
    error: examsErr,
  } = useExamsList();
  const activeExams = asList<any>(exams);
  const { classes } = useScopedClasses();
  const classLabel = (id?: string) => classes.find((c) => c.id === id)?.label ?? '';
  const classOptions = classes.map((c) => ({ label: c.label, value: c.id }));
  const { data: staffDir = [] } = useStaffDirectory();

  // Mutations
  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();
  const deleteMutation = useDeleteExam();
  const publishMutation = usePublishExam();
  const addSubjectMutation = useAddExamSubject();

  // Exam create/edit dialog
  const [examDialog, setExamDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [examForm, setExamForm] = useState({ ...emptyExam });

  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm({ ...emptyExam });
    setExamDialog(true);
  };
  const openEditExam = (exam: any) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name,
      type: exam.type || 'term',
      startDate: String(exam.startDate).slice(0, 10),
      endDate: String(exam.endDate).slice(0, 10),
    });
    setExamDialog(true);
  };
  const saveExam = () => {
    if (!examForm.name.trim() || !examForm.startDate || !examForm.endDate) {
      toast.error('Exam name, start date, and end date are required.');
      return;
    }
    if (examForm.endDate < examForm.startDate) {
      toast.error('End date cannot be before the start date.');
      return;
    }
    const payload = {
      name: examForm.name.trim(),
      type: examForm.type,
      startDate: examForm.startDate,
      endDate: examForm.endDate,
    };
    if (editingExam) {
      updateMutation.mutate(
        { id: editingExam.id, data: payload },
        {
          onSuccess: () => {
            setExamDialog(false);
            toast.success('Exam updated.');
          },
          onError: (err) => toast.error(apiMessage(err, 'Failed to update exam.')),
        }
      );
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => {
          setExamDialog(false);
          toast.success('Exam scheduled. Now add its subjects.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to schedule exam.')),
      });
    }
  };

  // Delete / publish confirms
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [publishTarget, setPublishTarget] = useState<any | null>(null);

  // Exam subjects dialog
  const [subjectExam, setSubjectExam] = useState<any | null>(null);
  const [subjectForm, setSubjectForm] = useState({ ...emptySubject });
  const { data: subjectOptionsRaw = [], isLoading: loadingSubjectOpts } = useSubjects(
    subjectForm.classId
  );
  const { data: subjectExamDetails } = useExamDetails(subjectExam?.id);
  const saveSubject = () => {
    if (!subjectExam) return;
    const f = subjectForm;
    if (!f.classId || !f.subjectId || !f.date || !f.startTime) {
      toast.error('Class, subject, date and start time are required.');
      return;
    }
    const duration = Number(f.duration);
    const maxMarks = Number(f.maxMarks);
    const passMarks = Number(f.passMarks);
    if (!(duration >= 30)) return toast.error('Duration must be at least 30 minutes.');
    if (!(maxMarks > 0)) return toast.error('Max marks must be greater than 0.');
    if (passMarks > maxMarks) return toast.error('Pass marks cannot exceed max marks.');
    addSubjectMutation.mutate(
      {
        examId: subjectExam.id,
        data: {
          classId: f.classId,
          subjectId: f.subjectId,
          date: f.date,
          startTime: f.startTime,
          duration,
          maxMarks,
          passMarks,
        },
      },
      {
        onSuccess: () => {
          toast.success('Subject added to exam.');
          setSubjectForm({ ...emptySubject, classId: f.classId, date: f.date });
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to add subject.')),
      }
    );
  };

  // ── Marks entry ────────────────────────────────────────────
  const [marksExamId, setMarksExamId] = useState('');
  const [marksClassId, setMarksClassId] = useState('');
  const [marksSubjectId, setMarksSubjectId] = useState('');
  const [marksDraft, setMarksDraft] = useState<
    Record<string, { marks: string; absent: boolean; remarks: string }>
  >({});
  const { data: marksExam } = useExamDetails(marksExamId || undefined);
  const { data: myTimetable = [] } = useTeacherTimetable(isTeacher ? myId : undefined);
  const { data: marksStudentsRaw, isPending: loadingMarksStudents } = useStudentsList(
    1,
    100,
    undefined,
    marksClassId || undefined
  );
  const { data: classResults } = useExamResults(marksExamId, marksClassId);
  const enterMutation = useEnterExamResults();

  const selectedClassObj = classes.find((c) => c.id === marksClassId);
  const marksSubjects = useMemo(() => {
    const all: any[] = ((marksExam as any)?.subjects ?? []).filter(
      (s: any) => s.classId === marksClassId
    );
    if (!isTeacher) return all;
    if (selectedClassObj?.classTeacherId === myId) return all;
    const mine = new Set(
      (myTimetable as any[])
        .filter((s) => s.classId === marksClassId)
        .map((s) => s.subjectId ?? s.subject?.id)
    );
    return all.filter((s) => mine.has(s.subjectId));
  }, [marksExam, marksClassId, isTeacher, myTimetable, selectedClassObj, myId]);
  const marksSubject = marksSubjects.find((s: any) => s.subjectId === marksSubjectId);
  const marksStudents = asList<any>(marksStudentsRaw);
  const resultRows = asList<any>(classResults);

  useEffect(() => {
    if (!marksSubjectId) {
      setMarksDraft({});
      return;
    }
    const draft: Record<string, { marks: string; absent: boolean; remarks: string }> = {};
    for (const s of marksStudents) draft[s.id] = { marks: '', absent: false, remarks: '' };
    for (const r of resultRows) {
      if (r.subjectId !== marksSubjectId || !draft[r.studentId]) continue;
      draft[r.studentId] = {
        marks: r.isAbsent ? '' : String(r.marksObtained ?? ''),
        absent: !!r.isAbsent,
        remarks: r.remarks ?? '',
      };
    }
    setMarksDraft(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    marksSubjectId,
    marksStudents.map((s) => s.id).join(','),
    JSON.stringify(resultRows.map((r) => [r.id, r.marksObtained, r.isAbsent, r.remarks])),
  ]);

  const saveMarks = () => {
    if (!marksExamId || !marksSubject) return;
    const max = marksSubject.maxMarks as number;
    const results: Array<{
      studentId: string;
      subjectId: string;
      marksObtained?: number;
      isAbsent?: boolean;
      remarks?: string;
    }> = [];
    for (const s of marksStudents) {
      const d = marksDraft[s.id];
      if (!d) continue;
      if (d.absent) {
        results.push({
          studentId: s.id,
          subjectId: marksSubjectId,
          isAbsent: true,
          marksObtained: 0,
          remarks: d.remarks || undefined,
        });
        continue;
      }
      if (d.marks === '') continue;
      const m = Number(d.marks);
      if (Number.isNaN(m) || m < 0 || m > max) {
        toast.error(`Marks for ${s.name} must be between 0 and ${max}.`);
        return;
      }
      results.push({
        studentId: s.id,
        subjectId: marksSubjectId,
        marksObtained: m,
        isAbsent: false,
        remarks: d.remarks || undefined,
      });
    }
    if (results.length === 0) {
      toast.error('Enter marks for at least one student.');
      return;
    }
    enterMutation.mutate(
      { examId: marksExamId, results },
      {
        onSuccess: () => toast.success(`${results.length} result(s) saved.`),
        onError: (err) => toast.error(apiMessage(err, 'Failed to save marks.')),
      }
    );
  };

  // ── Seating / halls ────────────────────────────────────────
  const [seatingExamId, setSeatingExamId] = useState('');
  const [showSeatingDialog, setShowSeatingDialog] = useState(false);
  const [seatingClassIds, setSeatingClassIds] = useState<string[]>([]);
  const [hallDialog, setHallDialog] = useState(false);
  const [hallForm, setHallForm] = useState({ hallName: '', capacity: '30', invigilatorId: '' });
  const { data: seatingChart, isPending: loadingSeating } = useSeatingChart(seatingExamId);
  const { data: halls = [] } = useExamHalls(seatingExamId || undefined);
  const autoAssignMutation = useAutoAssignSeating();
  const createHallMutation = useCreateHall();

  const handleAutoAssign = () => {
    if (!seatingExamId || seatingClassIds.length === 0) {
      toast.error('Select an exam and at least one class.');
      return;
    }
    autoAssignMutation.mutate(
      { examId: seatingExamId, classIds: seatingClassIds },
      {
        onSuccess: () => {
          setShowSeatingDialog(false);
          setSeatingClassIds([]);
          toast.success('Seating chart allocated.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to assign seating chart.')),
      }
    );
  };

  const saveHall = () => {
    const capacity = Number(hallForm.capacity);
    if (!seatingExamId || !hallForm.hallName.trim() || !(capacity >= 1)) {
      toast.error('Exam, hall name and a capacity of at least 1 are required.');
      return;
    }
    createHallMutation.mutate(
      {
        examId: seatingExamId,
        hallName: hallForm.hallName.trim(),
        capacity,
        invigilatorId: hallForm.invigilatorId || undefined,
      },
      {
        onSuccess: () => {
          setHallDialog(false);
          setHallForm({ hallName: '', capacity: '30', invigilatorId: '' });
          toast.success('Exam hall created.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to create hall.')),
      }
    );
  };

  // ── Admit cards ────────────────────────────────────────────
  const [admitExamId, setAdmitExamId] = useState('');
  const [admitClassId, setAdmitClassId] = useState('');
  const [admitStudentId, setAdmitStudentId] = useState('');
  const { data: admitExam } = useExamDetails(admitExamId || undefined);
  const { data: admitStudentsRaw } = useStudentsList(1, 100, undefined, admitClassId || undefined);
  const { data: admitSeating } = useSeatingChart(admitExamId);
  const admitStudents = asList<any>(admitStudentsRaw);
  const admitStudent = admitStudents.find((s) => s.id === admitStudentId);
  const admitSeat = (admitSeating as any[] | undefined)?.find(
    (s) => s.admissionNo === admitStudent?.admissionNo
  );
  const admitSubjects = ((admitExam as any)?.subjects ?? []).filter(
    (s: any) => s.classId === admitClassId
  );

  // ── Report sheets ──────────────────────────────────────────
  const [reportExamId, setReportExamId] = useState('');
  const [reportClassId, setReportClassId] = useState('');
  const {
    data: reportRowsRaw,
    isPending: loadingReport,
    isError: reportError,
    error: reportErr,
  } = useExamResults(reportExamId, reportClassId);
  const reportRows = asList<any>(reportRowsRaw);
  const reportSubjects = useMemo(() => {
    const m = new Map<string, string>();
    reportRows.forEach((r) => m.set(r.subjectId, r.subjectName ?? 'Subject'));
    return [...m.entries()];
  }, [reportRows]);
  const reportStudents = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of reportRows) {
      if (!m.has(r.studentId))
        m.set(r.studentId, {
          id: r.studentId,
          name: r.studentName,
          rollNo: r.rollNo,
          bySubject: {},
          total: 0,
          max: 0,
        });
      const s = m.get(r.studentId);
      s.bySubject[r.subjectId] = r;
      if (!r.isAbsent) s.total += r.marksObtained ?? 0;
      s.max += r.maxMarks ?? 0;
    }
    return [...m.values()];
  }, [reportRows]);

  const statusBadge = (exam: any) =>
    exam.isPublished ? (
      <Badge variant="success">PUBLISHED</Badge>
    ) : (
      <Badge variant="warning">DRAFT</Badge>
    );

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'schedules', label: 'Exam Schedules' },
    { key: 'marks', label: 'Marks Entry' },
    { key: 'seating', label: 'Seating Maps' },
    { key: 'admit-cards', label: 'Admit Cards' },
    { key: 'reports', label: 'Report Sheets' },
  ];

  const examPicker = (value: string, onChange: (v: string) => void) => (
    <Select
      value={value}
      options={[
        { label: 'Select exam', value: '' },
        ...activeExams.map((e: any) => ({ label: e.name, value: e.id })),
      ]}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Exams" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-brand" />
              Exams & Results
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Schedule exams, enter marks, arrange seating and publish results
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreateExam}>
              <Plus className="w-4 h-4 mr-2" /> Schedule Exam
            </Button>
          )}
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg flex-wrap w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === t.key
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
          {/* Schedules */}
          {activeTab === 'schedules' &&
            (loadingExams ? (
              <div className="p-12 text-center text-xs text-zinc-500">Loading schedules...</div>
            ) : examsError ? (
              <div className="p-12 text-center text-sm text-rose-600">
                {apiMessage(examsErr, 'Could not load exams.')}
              </div>
            ) : activeExams.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                No examinations configured yet.{isAdmin ? ' Use "Schedule Exam" to add one.' : ''}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeExams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                          {exam.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wide mt-0.5">
                          {exam.type}
                        </p>
                      </div>
                      {statusBadge(exam)}
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs font-medium flex flex-col gap-1.5 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                      <div className="flex justify-between">
                        <span>Academic year:</span>
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {exam.academicYear?.name ?? '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Starts:</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-300">
                          {formatDate(exam.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ends:</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-300">
                          {formatDate(exam.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subjects / results:</span>
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {exam._count?.subjects ?? 0} / {exam._count?.results ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSubjectExam(exam)}>
                        <BookPlus className="w-3.5 h-3.5 mr-1" />{' '}
                        {isAdmin ? 'Subjects' : 'View Subjects'}
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEditExam(exam)}>
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          {!exam.isPublished && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPublishTarget(exam)}
                            >
                              <Send className="w-3.5 h-3.5 mr-1" /> Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200"
                            onClick={() => setDeleteTarget(exam)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* Marks entry */}
          {activeTab === 'marks' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl">
                <div className="flex flex-col gap-1.5 w-60">
                  <label className={labelCls}>Exam *</label>
                  {examPicker(marksExamId, (v) => {
                    setMarksExamId(v);
                    setMarksSubjectId('');
                  })}
                </div>
                <div className="flex flex-col gap-1.5 w-60">
                  <label className={labelCls}>Class *</label>
                  <Select
                    value={marksClassId}
                    options={[{ label: 'Select class', value: '' }, ...classOptions]}
                    onChange={(e) => {
                      setMarksClassId(e.target.value);
                      setMarksSubjectId('');
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-60">
                  <label className={labelCls}>Subject *</label>
                  <Select
                    value={marksSubjectId}
                    options={[
                      { label: 'Select subject', value: '' },
                      ...marksSubjects.map((s: any) => ({
                        label: s.subject?.name ?? 'Subject',
                        value: s.subjectId,
                      })),
                    ]}
                    onChange={(e) => setMarksSubjectId(e.target.value)}
                    disabled={!marksExamId || !marksClassId}
                  />
                </div>
              </div>

              {marksExamId && marksClassId && marksSubjects.length === 0 && (
                <p className="text-xs text-amber-600">
                  {isTeacher
                    ? 'No subjects of this exam are scheduled for the selected class that you teach.'
                    : 'No subjects have been scheduled for this class in this exam yet. Add them under Exam Schedules.'}
                </p>
              )}

              {marksSubject && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                    <span>
                      Max marks{' '}
                      <b className="text-zinc-900 dark:text-zinc-100">{marksSubject.maxMarks}</b> ·
                      Pass marks{' '}
                      <b className="text-zinc-900 dark:text-zinc-100">{marksSubject.passMarks}</b>
                      {(marksExam as any)?.isPublished && (
                        <span className="ml-2 text-amber-600">Results already published.</span>
                      )}
                    </span>
                    <Button
                      onClick={saveMarks}
                      isLoading={enterMutation.isPending}
                      disabled={marksStudents.length === 0}
                    >
                      Save Marks
                    </Button>
                  </div>
                  {loadingMarksStudents ? (
                    <p className="text-sm text-zinc-500">Loading students...</p>
                  ) : marksStudents.length === 0 ? (
                    <p className="text-sm text-zinc-500">No students in this class.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                          <tr>
                            <th className="py-2 pr-3">Roll</th>
                            <th className="py-2 pr-3">Student</th>
                            <th className="py-2 pr-3 w-32">Marks</th>
                            <th className="py-2 pr-3">Absent</th>
                            <th className="py-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {marksStudents.map((s: any) => {
                            const d = marksDraft[s.id] ?? { marks: '', absent: false, remarks: '' };
                            const set = (patch: Partial<typeof d>) =>
                              setMarksDraft((prev) => ({ ...prev, [s.id]: { ...d, ...patch } }));
                            return (
                              <tr key={s.id}>
                                <td className="py-2 pr-3 font-mono text-zinc-500">
                                  {s.rollNo ?? '-'}
                                </td>
                                <td className="py-2 pr-3 font-semibold">{s.name}</td>
                                <td className="py-2 pr-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={marksSubject.maxMarks}
                                    value={d.marks}
                                    disabled={d.absent}
                                    onChange={(e) => set({ marks: e.target.value })}
                                    className="h-9 w-28"
                                  />
                                </td>
                                <td className="py-2 pr-3">
                                  <input
                                    type="checkbox"
                                    checked={d.absent}
                                    onChange={(e) => set({ absent: e.target.checked })}
                                  />
                                </td>
                                <td className="py-2">
                                  <Input
                                    value={d.remarks}
                                    onChange={(e) => set({ remarks: e.target.value })}
                                    className="h-9"
                                    placeholder="Optional"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Seating */}
          {activeTab === 'seating' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-end gap-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl flex-wrap">
                <div className="flex flex-col gap-1.5 w-64">
                  <label className={labelCls}>Exam</label>
                  {examPicker(seatingExamId, setSeatingExamId)}
                </div>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      disabled={!seatingExamId}
                      onClick={() => setHallDialog(true)}
                    >
                      <Building2 className="w-4 h-4 mr-2" /> Add Hall
                    </Button>
                    <Button disabled={!seatingExamId} onClick={() => setShowSeatingDialog(true)}>
                      <Network className="w-4 h-4 mr-2" /> Assign Seatings
                    </Button>
                  </>
                )}
              </div>

              {seatingExamId && (halls as any[]).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(halls as any[]).map((h) => (
                    <Badge key={h.id} variant="secondary">
                      {h.hallName} · {h._count?.seating ?? 0}/{h.capacity} seats
                    </Badge>
                  ))}
                </div>
              )}

              {!seatingExamId ? (
                <div className="p-10 text-center text-sm text-zinc-500">
                  Choose an exam to see its seating plan.
                </div>
              ) : loadingSeating ? (
                <div className="p-10 text-center text-xs text-zinc-500">Loading seating...</div>
              ) : seatingChart && seatingChart.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Adm. No.</th>
                        <th className="px-4 py-3">Hall</th>
                        <th className="px-4 py-3">Seat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {seatingChart.map((slot: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-semibold">{slot.studentName}</td>
                          <td className="px-4 py-3 font-mono text-xs">{slot.admissionNo}</td>
                          <td className="px-4 py-3">{slot.hallName}</td>
                          <td className="px-4 py-3 font-mono font-bold text-brand">
                            {slot.seatNo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Network className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No seating allocated yet.
                  </p>
                  {isAdmin && (
                    <p className="text-xs mt-1 text-zinc-500">
                      Add a hall, then run "Assign Seatings".
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admit cards */}
          {activeTab === 'admit-cards' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl">
                <div className="flex flex-col gap-1.5 w-60">
                  <label className={labelCls}>1. Exam *</label>
                  {examPicker(admitExamId, setAdmitExamId)}
                </div>
                <div className="flex flex-col gap-1.5 w-52">
                  <label className={labelCls}>2. Class *</label>
                  <Select
                    value={admitClassId}
                    options={[{ label: 'Select class', value: '' }, ...classOptions]}
                    onChange={(e) => {
                      setAdmitClassId(e.target.value);
                      setAdmitStudentId('');
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-64">
                  <label className={labelCls}>3. Student *</label>
                  <Select
                    value={admitStudentId}
                    options={[
                      { label: 'Select student', value: '' },
                      ...admitStudents.map((s: any) => ({
                        label: `${s.name} (${s.admissionNo})`,
                        value: s.id,
                      })),
                    ]}
                    onChange={(e) => setAdmitStudentId(e.target.value)}
                    disabled={!admitClassId}
                  />
                </div>
              </div>

              {admitExamId && admitStudent ? (
                <div className="max-w-xl mx-auto w-full">
                  <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-lg bg-white dark:bg-zinc-900">
                    <div className="bg-gradient-to-r from-brand to-purple-600 p-5 text-white flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                          Admit Card
                        </span>
                        <h3 className="text-lg font-bold mt-1 uppercase">
                          {(admitExam as any)?.name}
                        </h3>
                      </div>
                      <Award className="w-10 h-10 opacity-30" />
                    </div>
                    <div className="p-6 flex flex-col gap-5">
                      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {admitStudent.name}
                        </h4>
                        <div className="flex gap-4 text-xs text-zinc-500 mt-1 font-medium">
                          <span>
                            ADM:{' '}
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {admitStudent.admissionNo}
                            </span>
                          </span>
                          <span>
                            CLASS:{' '}
                            <span className="font-bold text-brand">{classLabel(admitClassId)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase block">
                            Hall
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
                            {admitSeat?.hallName ?? 'Not allotted yet'}
                          </span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase block">
                            Seat
                          </span>
                          <span className="text-xs font-bold text-brand font-mono mt-1 block">
                            {admitSeat?.seatNo ?? '-'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-2">
                          Examination Timetable
                        </span>
                        <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden divide-y divide-zinc-200/80 dark:divide-zinc-800/80 text-xs">
                          <div className="p-3 flex justify-between bg-zinc-50 dark:bg-zinc-800/40 font-semibold text-zinc-500">
                            <span>Subject</span>
                            <span>Date · Time</span>
                          </div>
                          {admitSubjects.length === 0 ? (
                            <div className="p-3 text-zinc-500">
                              No subjects scheduled for this class yet.
                            </div>
                          ) : (
                            admitSubjects.map((s: any) => (
                              <div key={s.id} className="p-3 flex justify-between">
                                <span>{s.subject?.name}</span>
                                <span className="font-mono text-zinc-500">
                                  {formatDate(s.date)} · {s.startTime}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-5">
                    <Button onClick={() => window.print()}>
                      <Printer className="w-4 h-4 mr-2" /> Print Admit Card
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg mx-auto">
                  <Printer className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Admit Card
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select an exam, class and student to build the admit card.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Report sheets */}
          {activeTab === 'reports' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl">
                <div className="flex flex-col gap-1.5 w-60">
                  <label className={labelCls}>Exam *</label>
                  {examPicker(reportExamId, setReportExamId)}
                </div>
                <div className="flex flex-col gap-1.5 w-60">
                  <label className={labelCls}>Class *</label>
                  <Select
                    value={reportClassId}
                    options={[{ label: 'Select class', value: '' }, ...classOptions]}
                    onChange={(e) => setReportClassId(e.target.value)}
                  />
                </div>
              </div>

              {!reportExamId || !reportClassId ? (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg mx-auto">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Class Result Sheet
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select an exam and class to see marks for every student.
                  </p>
                </div>
              ) : loadingReport ? (
                <p className="text-sm text-zinc-500">Loading results...</p>
              ) : reportError ? (
                <p className="text-sm text-rose-600">
                  {apiMessage(reportErr, 'Could not load results.')}
                </p>
              ) : reportStudents.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No marks have been entered for this class yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2 pr-3">Roll</th>
                        <th className="py-2 pr-3">Student</th>
                        {reportSubjects.map(([id, name]) => (
                          <th key={id} className="py-2 pr-3">
                            {name}
                          </th>
                        ))}
                        <th className="py-2 pr-3">Total</th>
                        <th className="py-2">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {reportStudents.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 pr-3 font-mono text-zinc-500">{s.rollNo ?? '-'}</td>
                          <td className="py-2 pr-3 font-semibold">{s.name}</td>
                          {reportSubjects.map(([id]) => {
                            const r = s.bySubject[id];
                            const fail =
                              r &&
                              !r.isAbsent &&
                              r.passMarks != null &&
                              r.marksObtained < r.passMarks;
                            return (
                              <td
                                key={id}
                                className={`py-2 pr-3 font-mono ${fail ? 'text-rose-600 font-bold' : ''}`}
                              >
                                {!r
                                  ? '-'
                                  : r.isAbsent
                                    ? 'AB'
                                    : `${r.marksObtained}${r.maxMarks ? `/${r.maxMarks}` : ''}`}
                              </td>
                            );
                          })}
                          <td className="py-2 pr-3 font-mono font-bold">
                            {s.total}
                            {s.max ? `/${s.max}` : ''}
                          </td>
                          <td className="py-2 font-bold text-brand">
                            {s.max ? `${Math.round((s.total / s.max) * 100)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create / edit exam */}
      <Dialog
        isOpen={examDialog}
        onClose={() => setExamDialog(false)}
        title={editingExam ? 'Edit Exam' : 'Schedule New Exam'}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Exam Name *</label>
            <Input
              value={examForm.name}
              onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
              placeholder="e.g. Mid-Term 2026"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Type</label>
            <Select
              value={examForm.type}
              options={EXAM_TYPES}
              onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Start Date *</label>
              <Input
                type="date"
                value={examForm.startDate}
                onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>End Date *</label>
              <Input
                type="date"
                value={examForm.endDate}
                onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Classes and subjects are attached to the exam afterwards using "Subjects".
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setExamDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveExam}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingExam ? 'Save Changes' : 'Schedule Exam'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Exam subjects */}
      <Dialog
        isOpen={!!subjectExam}
        onClose={() => setSubjectExam(null)}
        title={subjectExam ? `Subjects - ${subjectExam.name}` : 'Subjects'}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-5">
          {(subjectExamDetails as any)?.subjects?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2 pr-3">Class</th>
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Min</th>
                    <th className="py-2">Max / Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(subjectExamDetails as any).subjects.map((s: any) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-3">{classLabel(s.classId) || '-'}</td>
                      <td className="py-2 pr-3 font-semibold">{s.subject?.name}</td>
                      <td className="py-2 pr-3">{formatDate(s.date)}</td>
                      <td className="py-2 pr-3 font-mono">{s.startTime}</td>
                      <td className="py-2 pr-3">{s.duration}</td>
                      <td className="py-2">
                        {s.maxMarks} / {s.passMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No subjects scheduled yet.</p>
          )}

          {isAdmin && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-3">
              <h4 className="text-sm font-bold">Add subject</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Class *</label>
                  <Select
                    value={subjectForm.classId}
                    options={[{ label: 'Select class', value: '' }, ...classOptions]}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, classId: e.target.value, subjectId: '' })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Subject *</label>
                  <Select
                    value={subjectForm.subjectId}
                    disabled={!subjectForm.classId || loadingSubjectOpts}
                    options={[
                      {
                        label: !subjectForm.classId ? 'Pick a class first' : 'Select subject',
                        value: '',
                      },
                      ...(subjectOptionsRaw as any[]).map((s) => ({ label: s.name, value: s.id })),
                    ]}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectId: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Date *</label>
                  <Input
                    type="date"
                    value={subjectForm.date}
                    onChange={(e) => setSubjectForm({ ...subjectForm, date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Start time *</label>
                  <Input
                    type="time"
                    value={subjectForm.startTime}
                    onChange={(e) => setSubjectForm({ ...subjectForm, startTime: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Duration (min) *</label>
                  <Input
                    type="number"
                    min={30}
                    value={subjectForm.duration}
                    onChange={(e) => setSubjectForm({ ...subjectForm, duration: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Max marks *</label>
                    <Input
                      type="number"
                      min={1}
                      value={subjectForm.maxMarks}
                      onChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Pass marks *</label>
                    <Input
                      type="number"
                      min={0}
                      value={subjectForm.passMarks}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, passMarks: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveSubject} isLoading={addSubjectMutation.isPending}>
                  <PencilLine className="w-4 h-4 mr-2" /> Add Subject
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Hall dialog */}
      <Dialog isOpen={hallDialog} onClose={() => setHallDialog(false)} title="Add Exam Hall">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Hall name *</label>
            <Input
              value={hallForm.hallName}
              onChange={(e) => setHallForm({ ...hallForm, hallName: e.target.value })}
              placeholder="e.g. Main Hall"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Capacity *</label>
            <Input
              type="number"
              min={1}
              value={hallForm.capacity}
              onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Invigilator</label>
            <Select
              value={hallForm.invigilatorId}
              options={[
                { label: 'None', value: '' },
                ...staffDir.map((s) => ({ label: s.name, value: s.id })),
              ]}
              onChange={(e) => setHallForm({ ...hallForm, invigilatorId: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setHallDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveHall} isLoading={createHallMutation.isPending}>
              Create Hall
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Auto seating */}
      <Dialog
        isOpen={showSeatingDialog}
        onClose={() => setShowSeatingDialog(false)}
        title="Auto-Allocate Seating Chart"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-zinc-500">
            Students of the selected classes are placed into the exam's halls. Create halls first.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Classes *</label>
            <select
              multiple
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs h-32"
              value={seatingClassIds}
              onChange={(e) =>
                setSeatingClassIds(Array.from(e.target.selectedOptions, (o) => o.value))
              }
            >
              {classOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="py-1 px-2">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setShowSeatingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAutoAssign} isLoading={autoAssignMutation.isPending}>
              Run Allocation
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirm */}
      <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Exam">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Delete <b>{deleteTarget?.name}</b> with its subjects and halls? Exams that already have
            marks cannot be deleted.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success('Exam deleted.');
                    setDeleteTarget(null);
                  },
                  onError: (err) => toast.error(apiMessage(err, 'Failed to delete exam.')),
                })
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Publish confirm */}
      <Dialog
        isOpen={!!publishTarget}
        onClose={() => setPublishTarget(null)}
        title="Publish Results"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Publish results for <b>{publishTarget?.name}</b>? Students and parents will be able to
            see them and will be notified.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPublishTarget(null)}>
              Cancel
            </Button>
            <Button
              isLoading={publishMutation.isPending}
              onClick={() =>
                publishMutation.mutate(publishTarget.id, {
                  onSuccess: () => {
                    toast.success('Results published.');
                    setPublishTarget(null);
                  },
                  onError: (err) => toast.error(apiMessage(err, 'Failed to publish results.')),
                })
              }
            >
              Publish
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
