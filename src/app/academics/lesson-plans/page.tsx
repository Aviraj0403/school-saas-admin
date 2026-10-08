'use client';

import React, { useState } from 'react';
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
  useClasses,
  useAllSubjects,
} from '@/hooks/queries/useAcademics';
import { useStaffList } from '@/hooks/queries/useStaff';
import { toast } from 'sonner';
import { BookOpen, Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function LessonPlansPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');

  const { data: plansData, isPending } = useLessonPlans();
  const { data: classesData } = useClasses(1, 100);
  const { data: subjectsData } = useAllSubjects();
  const { data: staffData } = useStaffList(1, 100);

  const createMutation = useCreateLessonPlan();

  const plans = plansData || [];

  const classOptions = (classesData?.items || classesData?.data?.items || []).map((c: any) => ({
    label: `${c.name} — ${c.section}`,
    value: c.id,
  }));

  const subjectOptions = Array.isArray(subjectsData)
    ? subjectsData.map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.id }))
    : [];

  const teacherOptions = (staffData?.items || []).map((t: any) => ({
    label: `${t.name} — ${t.designation || 'Teacher'}`,
    value: t.id,
  }));

  const filteredPlans = plans.filter(
    (p: any) =>
      p.topic?.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.topic?.subject?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    classId: '',
    subjectId: '',
    teacherId: '',
    topic: '',
    content: '',
    homework: '',
    status: 'PLANNED',
  });

  const handleSave = () => {
    if (!formData.classId || !formData.subjectId || !formData.topic || !formData.teacherId) {
      toast.error('Class, Subject, Teacher, and Topic are required.');
      return;
    }

    createMutation.mutate(
      {
        date: formData.date,
        classId: formData.classId,
        subjectId: formData.subjectId,
        topicName: formData.topic,
        teacherId: formData.teacherId,
        content: formData.content,
        homework: formData.homework,
        status: formData.status,
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          setFormData({
            date: new Date().toISOString().split('T')[0],
            classId: '',
            subjectId: '',
            teacherId: '',
            topic: '',
            content: '',
            homework: '',
            status: 'PLANNED',
          });
          toast.success('Lesson plan saved successfully.');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to save lesson plan.');
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Lesson Plans" subtitle="Academics" />
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        {/* Header Block */}
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
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Lesson Plan
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, subjects..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Table View */}
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
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                      <p>Loading lesson plans...</p>
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
                        {plan.topic?.class?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {plan.topic?.subject?.name || '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {plan.topic?.title || plan.topicName || '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {plan.teacher?.name || plan.teacher?.fullName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={plan.status === 'COMPLETED' ? 'success' : 'info'}>
                          {plan.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog for New Lesson Plan */}
      <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} title="Create Lesson Plan">
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
                options={[
                  { label: 'Planned', value: 'PLANNED' },
                  { label: 'Completed', value: 'COMPLETED' },
                ]}
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
                options={[{ label: 'Select Class', value: '' }, ...classOptions]}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Subject *
              </label>
              <Select
                value={formData.subjectId}
                options={[{ label: 'Select Subject', value: '' }, ...subjectOptions]}
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
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g. Trigonometric Ratios"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Teaching Content (Log)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe what will be taught..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
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
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={createMutation.isPending}>
            Save Plan
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
