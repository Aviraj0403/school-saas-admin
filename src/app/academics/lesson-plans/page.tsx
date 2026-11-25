'use client';

import { localDateISO } from '@/lib/format';
import { asList } from '@/lib/utils';
import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useLessonPlans,
  useCreateLessonPlan,
  useUpdateLessonPlan,
  useDeleteLessonPlan,
  useLessonTopics,
  useDeleteLessonTopic,
  useSubjects,
} from '@/hooks/queries/useAcademics';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { useStaffDirectory } from '@/hooks/queries/useStaffDirectory';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore';
import { apiMessage } from '@/lib/apiMessage';
import { toast } from 'sonner';
import { BookOpen, Plus, Search, Pencil, Trash2, ListTree } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const textareaCls =
  'w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none';

const blankForm = () => ({
  date: localDateISO(),
  classId: '',
  subjectId: '',
  teacherId: '',
  topic: '',
  content: '',
  homework: '',
  status: 'PLANNED',
});

export default function LessonPlansPage() {
  const { isAdmin } = usePermissions();
  const activeUser = useAuthStore((s) => s.activeUser);
  const myId = activeUser?.id ?? '';

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(blankForm());

  const { data: plansData, isPending, isError, error } = useLessonPlans();
  const { classes, isTeacher } = useScopedClasses();
  const { data: staffDir = [] } = useStaffDirectory();
  const { data: classSubjects = [], isLoading: loadingSubjects } = useSubjects(formData.classId);
  const { data: orphanTopics = [], isLoading: loadingTopics } = useLessonTopics(
    { orphansOnly: true },
    showTopics
  );

  const createMutation = useCreateLessonPlan();
  const updateMutation = useUpdateLessonPlan();
  const deleteMutation = useDeleteLessonPlan();
  const deleteTopicMutation = useDeleteLessonTopic();

  const allowedClassIds = useMemo(() => new Set(classes.map((c) => c.id)), [classes]);
  const plans = useMemo(
    () =>
      asList<any>(plansData).filter((p) => {
        // Teachers see the plans of their own classes.
        if (isTeacher && p.topic?.classId && !allowedClassIds.has(p.topic.classId)) return false;
        return true;
      }),
    [plansData, isTeacher, allowedClassIds]
  );

  const classOptions = classes.map((c) => ({ label: c.label, value: c.id }));
  const subjectOptions = (classSubjects as any[]).map((s) => ({
    label: s.code ? `${s.name} (${s.code})` : s.name,
    value: s.id,
  }));
  // Teachers can only plan as themselves; admins pick from the staff directory.
  const teacherOptions = isAdmin
    ? staffDir.map((t) => ({
        label: t.designation ? `${t.name} — ${t.designation}` : t.name,
        value: t.id,
      }))
    : [{ label: activeUser?.name ?? 'Me', value: myId }];

  const filteredPlans = plans.filter((p: any) => {
    const q = search.toLowerCase();
    return (
      p.topic?.title?.toLowerCase().includes(q) ||
      p.topic?.subject?.name?.toLowerCase().includes(q) ||
      p.topic?.class?.name?.toLowerCase().includes(q)
    );
  });

  const canModify = (p: any) => isAdmin || p.teacherId === myId;

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...blankForm(), teacherId: isAdmin ? '' : myId });
    setShowDialog(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setFormData({
      date: String(p.date).slice(0, 10),
      classId: p.topic?.classId ?? '',
      subjectId: p.topic?.subjectId ?? '',
      teacherId: p.teacherId,
      topic: p.topic?.title ?? '',
      content: p.content ?? '',
      homework: p.homework ?? '',
      status: p.status ?? 'PLANNED',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) {
      if (!formData.date || !formData.content.trim()) {
        toast.error('Date and teaching content are required.');
        return;
      }
      updateMutation.mutate(
        {
          id: editing.id,
          data: {
            date: formData.date,
            content: formData.content,
            homework: formData.homework,
            status: formData.status,
            ...(isAdmin ? { teacherId: formData.teacherId } : {}),
          },
        },
        {
          onSuccess: () => {
            setShowDialog(false);
            toast.success('Lesson plan updated.');
          },
          onError: (err) => toast.error(apiMessage(err, 'Failed to update lesson plan.')),
        }
      );
      return;
    }
    if (!formData.classId || !formData.subjectId || !formData.topic.trim() || !formData.teacherId) {
      toast.error('Class, Subject, Teacher, and Topic are required.');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Teaching content is required.');
      return;
    }
    createMutation.mutate(
      {
        date: formData.date,
        classId: formData.classId,
        subjectId: formData.subjectId,
        topicName: formData.topic.trim(),
        teacherId: formData.teacherId,
        content: formData.content,
        homework: formData.homework || undefined,
        status: formData.status,
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          toast.success('Lesson plan saved successfully.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to save lesson plan.')),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Lesson plan deleted.');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(apiMessage(err, 'Failed to delete lesson plan.')),
    });
  };

  const statusVariant = (s: string) =>
    s === 'DELIVERED' ? 'success' : s === 'CANCELLED' ? 'secondary' : 'info';

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Lesson Plans" subtitle="Academics" />
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand" />
              Lesson Plans
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Track and plan curriculum topics, teaching logs, and homework
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTopics(true)}>
              <ListTree className="w-4 h-4 mr-2" />
              Unused Topics
            </Button>
            <Button onClick={openCreate} disabled={classes.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Create Lesson Plan
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, subjects, classes..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Topic / Chapter</th>
                  <th className="px-6 py-4">Teacher</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {isPending ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      Loading lesson plans...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-rose-600">
                      {apiMessage(error, 'Could not load lesson plans.')}
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No lesson plans found.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan: any) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {new Date(plan.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {plan.topic?.class
                          ? `${plan.topic.class.name} ${plan.topic.class.section ?? ''}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {plan.topic?.subject?.name || '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {plan.topic?.title || '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {plan.teacher?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant(plan.status)}>{plan.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canModify(plan) && (
                          <div className="flex justify-end gap-2">
                            <button
                              aria-label="Edit lesson plan"
                              onClick={() => openEdit(plan)}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              aria-label="Delete lesson plan"
                              onClick={() => setDeleteTarget(plan)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / edit */}
      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={editing ? 'Edit Lesson Plan' : 'Create Lesson Plan'}
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Status
              </label>
              <Select
                value={formData.status}
                options={STATUS_OPTIONS}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Class *
              </label>
              <Select
                value={formData.classId}
                disabled={!!editing}
                options={[{ label: 'Select Class', value: '' }, ...classOptions]}
                onChange={(e) =>
                  setFormData({ ...formData, classId: e.target.value, subjectId: '' })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Subject *
              </label>
              <Select
                value={formData.subjectId}
                disabled={!!editing || !formData.classId || loadingSubjects}
                options={[
                  { label: !formData.classId ? 'Pick a class first' : 'Select Subject', value: '' },
                  ...(editing && editing.topic?.subject
                    ? [{ label: editing.topic.subject.name, value: editing.topic.subjectId }]
                    : subjectOptions),
                ]}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Teacher *
            </label>
            <Select
              value={formData.teacherId}
              disabled={!isAdmin}
              options={[{ label: 'Select Teacher', value: '' }, ...teacherOptions]}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Topic / Chapter *
            </label>
            <Input
              value={formData.topic}
              disabled={!!editing}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g. Trigonometric Ratios"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Teaching Content (Log) *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe what will be taught..."
              rows={3}
              className={textareaCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Homework Assigned
            </label>
            <textarea
              value={formData.homework}
              onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
              placeholder="e.g. Exercise 4.1 Q1-5"
              rows={2}
              className={textareaCls}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? 'Save Changes' : 'Save Plan'}
          </Button>
        </div>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Lesson Plan"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Delete the plan for <b>{deleteTarget?.topic?.title}</b> on{' '}
            {deleteTarget ? new Date(deleteTarget.date).toLocaleDateString() : ''}?
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

      {/* Orphan topics */}
      <Dialog
        isOpen={showTopics}
        onClose={() => setShowTopics(false)}
        title="Syllabus Topics With No Plans"
      >
        <div className="flex flex-col gap-3">
          {loadingTopics ? (
            <p className="text-sm text-zinc-500">Loading topics...</p>
          ) : (orphanTopics as any[]).length === 0 ? (
            <p className="text-sm text-zinc-500">No unused topics. Nothing to clean up.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
              {(orphanTopics as any[]).map((t) => (
                <li key={t.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <span>
                    <b>{t.title}</b>
                    <span className="block text-xs text-zinc-500">
                      {t.class?.name} {t.class?.section} · {t.subject?.name}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 border-rose-200"
                    isLoading={
                      deleteTopicMutation.isPending && deleteTopicMutation.variables === t.id
                    }
                    onClick={() =>
                      deleteTopicMutation.mutate(t.id, {
                        onSuccess: () => toast.success('Topic deleted.'),
                        onError: (err) => toast.error(apiMessage(err, 'Failed to delete topic.')),
                      })
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
