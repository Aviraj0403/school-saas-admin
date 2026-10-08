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
  useQuizzes,
  useCreateQuiz,
  useClasses,
  useAllSubjects,
} from '@/hooks/queries/useAcademics';
import { toast } from 'sonner';
import { HelpCircle, Plus, Search, Pencil, List } from 'lucide-react';

export default function QuizzesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');

  const { data: quizzesData, isLoading } = useQuizzes();
  const { data: classesData } = useClasses(1, 100);
  const { data: subjectsData } = useAllSubjects();

  const createMutation = useCreateQuiz();

  const quizzes = quizzesData || [];

  const classOptions = (classesData?.items || classesData?.data?.items || []).map((c: any) => ({
    label: `${c.name} — ${c.section}`,
    value: c.id,
  }));

  const subjectOptions = Array.isArray(subjectsData)
    ? subjectsData.map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.id }))
    : [];

  const filteredQuizzes = quizzes.filter(
    (q: any) =>
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.class?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const [formData, setFormData] = useState({
    title: '',
    duration: 30,
    status: 'DRAFT',
    classId: '',
    subjectId: '',
  });

  const handleSave = () => {
    if (!formData.title || !formData.classId || !formData.subjectId) {
      toast.error('Title, Class, and Subject are required.');
      return;
    }
    createMutation.mutate(
      {
        title: formData.title,
        duration: formData.duration,
        status: formData.status,
        classId: formData.classId,
        subjectId: formData.subjectId,
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          setFormData({ title: '', duration: 30, status: 'DRAFT', classId: '', subjectId: '' });
          toast.success('Quiz created successfully.');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to create quiz.');
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Quizzes" subtitle="Academics" />
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-brand" />
              Online Quizzes
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Create tests, manage question banks, and evaluate responses
            </p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
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
              placeholder="Search quizzes..."
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
                  <th className="px-6 py-4">Quiz Title</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Questions</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                      <p>Loading quizzes...</p>
                    </td>
                  </tr>
                ) : filteredQuizzes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No quizzes found.
                    </td>
                  </tr>
                ) : (
                  filteredQuizzes.map((quiz: any) => (
                    <tr
                      key={quiz.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {quiz.title}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {quiz.class?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {quiz.subject?.name || '-'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {quiz._count?.questions || 0}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {quiz.duration} mins
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={quiz.isPublished ? 'success' : 'warning'}>
                          {quiz.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                            title="Manage Questions"
                          >
                            <List className="w-4 h-4" />
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

      <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} title="Create New Quiz">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Quiz Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Algebra Chapter 1 Test"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Duration (Mins) *
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) || 30 })
                }
                min={1}
                max={180}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Status
              </label>
              <Select
                value={formData.status}
                options={[
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Published', value: 'PUBLISHED' },
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
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={createMutation.isPending}>
            Save Quiz
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
