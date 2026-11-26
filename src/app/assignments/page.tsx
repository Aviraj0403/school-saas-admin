'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useAssignments,
  useAssignmentDetail,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useGradeSubmission,
} from '@/hooks/queries/useHomework';
import { useSubjects } from '@/hooks/queries/useAcademics';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore';
import { apiMessage } from '@/lib/apiMessage';
import { asList } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, Users, ClipboardCheck } from 'lucide-react';

const emptyForm = {
  title: '',
  description: '',
  classId: '',
  subjectId: '',
  dueDate: '',
  maxMarks: '',
};

const fmt = (d?: string) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-IN');
  } catch {
    return d;
  }
};

export default function AssignmentsPage() {
  const { isAdmin } = usePermissions();
  const myId = useAuthStore((s) => s.activeUser?.id ?? '');
  const { classes, isLoading: loadingClasses, isTeacher } = useScopedClasses();

  const [filterClassId, setFilterClassId] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const {
    data: assignmentsRaw,
    isPending,
    isError,
    error,
  } = useAssignments(filterClassId ? { classId: filterClassId } : undefined);
  const allowedClassIds = useMemo(() => new Set(classes.map((c) => c.id)), [classes]);
  const assignments = useMemo(
    () =>
      asList<any>(assignmentsRaw).filter((a) => {
        if (isTeacher && !allowedClassIds.has(a.classId)) return false;
        if (mineOnly && a.teacherId !== myId) return false;
        return true;
      }),
    [assignmentsRaw, isTeacher, allowedClassIds, mineOnly, myId]
  );

  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();
  const gradeMutation = useGradeSubmission();

  // Create / edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { data: classSubjects = [], isLoading: loadingSubjects } = useSubjects(form.classId);

  // Submissions + grading
  const [viewing, setViewing] = useState<any | null>(null);
  const { data: detail, isLoading: loadingDetail } = useAssignmentDetail(viewing?.id);
  const [gradeTarget, setGradeTarget] = useState<any | null>(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const canModify = (a: any) => isAdmin || a.teacherId === myId;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, classId: classes.length === 1 ? classes[0].id : '' });
    setFormOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({
      title: a.title ?? '',
      description: a.description ?? '',
      classId: a.classId,
      subjectId: a.subjectId,
      dueDate: a.dueDate ? String(a.dueDate).slice(0, 10) : '',
      maxMarks: a.maxMarks != null ? String(a.maxMarks) : '',
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate || (!editing && (!form.classId || !form.subjectId))) {
      toast.error('Title, class, subject and due date are required.');
      return;
    }
    const maxMarks = form.maxMarks ? Number(form.maxMarks) : undefined;
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          payload: {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            dueDate: new Date(form.dueDate).toISOString(),
            ...(maxMarks ? { maxMarks } : {}),
          },
        },
        {
          onSuccess: () => {
            setFormOpen(false);
            toast.success('Assignment updated.');
          },
          onError: (err) => toast.error(apiMessage(err, 'Failed to update assignment.')),
        }
      );
      return;
    }
    createMutation.mutate(
      {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        classId: form.classId,
        subjectId: form.subjectId,
        dueDate: new Date(form.dueDate).toISOString(),
        ...(maxMarks ? { maxMarks } : {}),
      },
      {
        onSuccess: () => {
          setFormOpen(false);
          toast.success('Assignment posted.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to post assignment.')),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Assignment deleted.');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(apiMessage(err, 'Failed to delete assignment.')),
    });
  };

  const openGrade = (s: any) => {
    setGradeTarget(s);
    setGradeMarks(s.marksAwarded != null ? String(s.marksAwarded) : '');
    setGradeFeedback(s.feedback ?? '');
  };

  const handleGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget) return;
    const marks = Number(gradeMarks);
    if (gradeMarks === '' || Number.isNaN(marks) || marks < 0) {
      toast.error('Enter valid marks.');
      return;
    }
    const max = detail?.maxMarks ?? viewing?.maxMarks;
    if (max && marks > max) {
      toast.error(`Marks cannot exceed ${max}.`);
      return;
    }
    gradeMutation.mutate(
      {
        submissionId: gradeTarget.id,
        payload: { marksAwarded: marks, feedback: gradeFeedback.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success(`Graded ${gradeTarget.student?.name ?? 'submission'}.`);
          setGradeTarget(null);
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to save grade.')),
      }
    );
  };

  const [now] = useState(() => Date.now());
  const upcoming = assignments.filter((a) => new Date(a.dueDate).getTime() >= now).length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + (a._count?.submissions ?? 0), 0);
  const submissions: any[] = detail?.submissions ?? [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Assignments" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <PageHeader
          title="Assignments & Homework"
          description="Post tasks, review submissions, and grade student work"
          actions={
            <Button
              className="h-11 w-full sm:h-10 sm:w-auto"
              onClick={openCreate}
              disabled={classes.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" /> Post Assignment
            </Button>
          }
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: 'Assignments', value: assignments.length },
            { label: 'Upcoming (not yet due)', value: upcoming },
            { label: 'Total Submissions', value: totalSubmissions },
          ].map((s) => (
            <div key={s.label} className="surface-card min-w-0 p-3 sm:p-5">
              <span className="block text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
                {s.label}
              </span>
              <h3 className="mt-1 text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                {isPending ? '...' : s.value}
              </h3>
            </div>
          ))}
        </div>

        <div className="surface-card flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <div className="flex w-full items-center gap-3 sm:w-72">
            <label className="text-xs font-semibold text-muted-foreground">Class:</label>
            <Select
              value={filterClassId}
              options={[
                { label: 'All my classes', value: '' },
                ...classes.map((c) => ({ label: c.label, value: c.id })),
              ]}
              onChange={(e) => setFilterClassId(e.target.value)}
              disabled={loadingClasses}
            />
          </div>
          <label className="flex h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
            Posted by me
          </label>
        </div>

        <div className="surface-card p-3 sm:p-6">
          {isPending ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading assignments...
            </div>
          ) : isError ? (
            <div className="p-10 text-center text-sm text-rose-600">
              {apiMessage(error, 'Could not load assignments.')}
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              {classes.length === 0 && isTeacher
                ? 'No classes are assigned to you yet.'
                : 'No assignments yet. Post the first one.'}
            </div>
          ) : (
            <>
              {/* Phones: card list */}
              <ul className="flex flex-col gap-2.5 md:hidden">
                {assignments.map((a) => {
                  const overdue = new Date(a.dueDate).getTime() < now;
                  return (
                    <li key={a.id} className="rounded-2xl border border-border bg-card p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{a.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {a.class?.name} {a.class?.section} · {a.subject?.name}
                          </p>
                        </div>
                        <Badge variant={overdue ? 'secondary' : 'warning'}>{fmt(a.dueDate)}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold tabular-nums text-foreground">
                          {a._count?.submissions ?? 0}
                        </span>{' '}
                        submissions
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 [&>button]:h-10">
                        <Button size="sm" variant="outline" onClick={() => setViewing(a)}>
                          <Users className="w-3.5 h-3.5 mr-1" /> Submissions
                        </Button>
                        {canModify(a) && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 border-rose-200"
                              onClick={() => setDeleteTarget(a)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 pr-4">Title</th>
                      <th className="py-3 pr-4">Class</th>
                      <th className="py-3 pr-4">Subject</th>
                      <th className="py-3 pr-4">Due</th>
                      <th className="py-3 pr-4 text-center">Submissions</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {assignments.map((a) => {
                      const overdue = new Date(a.dueDate).getTime() < now;
                      return (
                        <tr key={a.id}>
                          <td className="py-3 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            {a.title}
                          </td>
                          <td className="py-3 pr-4">
                            {a.class?.name} {a.class?.section}
                          </td>
                          <td className="py-3 pr-4">{a.subject?.name}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={overdue ? 'secondary' : 'warning'}>
                              {fmt(a.dueDate)}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-center">{a._count?.submissions ?? 0}</td>
                          <td className="py-3">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setViewing(a)}>
                                <Users className="w-3.5 h-3.5 mr-1" /> Submissions
                              </Button>
                              {canModify(a) && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600 border-rose-200"
                                    onClick={() => setDeleteTarget(a)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / edit */}
      <Dialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Assignment' : 'Post Assignment'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Chapter 4 exercises"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Class *
              </label>
              <Select
                value={form.classId}
                disabled={!!editing}
                options={[
                  { label: 'Select class', value: '' },
                  ...classes.map((c) => ({ label: c.label, value: c.id })),
                ]}
                onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: '' })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subject *
              </label>
              <Select
                value={form.subjectId}
                disabled={!!editing || !form.classId || loadingSubjects}
                options={[
                  {
                    label: !form.classId
                      ? 'Pick a class first'
                      : loadingSubjects
                        ? 'Loading...'
                        : 'Select subject',
                    value: '',
                  },
                  ...(editing && editing.subject
                    ? [{ label: editing.subject.name, value: editing.subjectId }]
                    : (classSubjects as any[]).map((s) => ({ label: s.name, value: s.id }))),
                ]}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              />
            </div>
          </div>
          {!editing &&
            form.classId &&
            !loadingSubjects &&
            (classSubjects as any[]).length === 0 && (
              <p className="text-xs text-amber-600">
                This class has no subjects yet. An admin must link subjects to the class (Academics
                → Classes).
              </p>
            )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Due Date *
              </label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Max Marks
              </label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={form.maxMarks}
                onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
                placeholder="e.g. 20"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Instructions
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : 'Post Assignment'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Submissions */}
      <Dialog
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Submissions - ${viewing.title}` : 'Submissions'}
        className="max-w-3xl"
      >
        {loadingDetail ? (
          <p className="text-sm text-muted-foreground">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Submitted</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Notes</th>
                  <th className="py-2 pr-3">Marks</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-3 font-semibold">
                      {s.student?.name ?? 'Student'}
                      {s.student?.rollNo ? (
                        <span className="text-zinc-400 font-normal"> #{s.student.rollNo}</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">{fmt(s.submittedAt)}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant={
                          s.status === 'graded'
                            ? 'success'
                            : s.status === 'late'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {String(s.status).toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 max-w-[200px] truncate" title={s.notes ?? ''}>
                      {s.notes ?? '-'}
                    </td>
                    <td className="py-2 pr-3">
                      {s.marksAwarded != null
                        ? `${s.marksAwarded}${detail?.maxMarks ? ` / ${detail.maxMarks}` : ''}`
                        : '-'}
                    </td>
                    <td className="py-2 text-right">
                      {canModify(viewing) && (
                        <Button size="sm" variant="outline" onClick={() => openGrade(s)}>
                          <ClipboardCheck className="w-3.5 h-3.5 mr-1" />{' '}
                          {s.status === 'graded' ? 'Regrade' : 'Grade'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>

      {/* Grade */}
      <Dialog
        isOpen={!!gradeTarget}
        onClose={() => setGradeTarget(null)}
        title={`Grade ${gradeTarget?.student?.name ?? ''}`}
      >
        <form onSubmit={handleGrade} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Marks {detail?.maxMarks ? `(out of ${detail.maxMarks})` : ''} *
            </label>
            <Input
              type="number"
              min={0}
              value={gradeMarks}
              onChange={(e) => setGradeMarks(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Feedback
            </label>
            <textarea
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setGradeTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={gradeMutation.isPending}>
              Save Grade
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Assignment"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Delete <b>{deleteTarget?.title}</b> and all of its submissions? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
