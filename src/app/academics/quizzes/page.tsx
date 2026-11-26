'use client';

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
  useQuizzes,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useQuizQuestions,
  useSaveQuizQuestion,
  useDeleteQuizQuestion,
  useQuizAttempts,
  useGradeQuizAttempt,
  useSubjects,
} from '@/hooks/queries/useAcademics';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { apiMessage } from '@/lib/apiMessage';
import { toast } from 'sonner';
import { HelpCircle, Plus, Search, Pencil, List, Trash2, Users } from 'lucide-react';

interface OptionDraft {
  id: string;
  text: string;
  isCorrect: boolean;
}

const QUESTION_TYPES = [
  { label: 'Multiple choice', value: 'MCQ' },
  { label: 'True / False', value: 'TRUE_FALSE' },
  { label: 'Short answer', value: 'SHORT_ANSWER' },
];

const optionId = (i: number) => String.fromCharCode(97 + i);
const blankOptions = (): OptionDraft[] =>
  [0, 1, 2, 3].map((i) => ({ id: optionId(i), text: '', isCorrect: i === 0 }));
const trueFalseOptions = (): OptionDraft[] => [
  { id: 'true', text: 'True', isCorrect: true },
  { id: 'false', text: 'False', isCorrect: false },
];

const blankQuestion = () => ({
  questionText: '',
  questionType: 'MCQ',
  marks: '1',
  options: blankOptions(),
});

const labelCls = 'text-xs font-semibold text-zinc-700 dark:text-zinc-300';

export default function QuizzesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [questionsQuiz, setQuestionsQuiz] = useState<any | null>(null);
  const [attemptsQuiz, setAttemptsQuiz] = useState<any | null>(null);

  const { data: quizzesData, isLoading, isError, error } = useQuizzes();
  const { classes, isTeacher } = useScopedClasses();

  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();
  const deleteMutation = useDeleteQuiz();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    isPublished: false,
    classId: '',
    subjectId: '',
  });
  const { data: classSubjects = [], isLoading: loadingSubjects } = useSubjects(formData.classId);

  const allowedClassIds = useMemo(() => new Set(classes.map((c) => c.id)), [classes]);
  const quizzes = useMemo(
    () => asList<any>(quizzesData).filter((q) => !isTeacher || allowedClassIds.has(q.classId)),
    [quizzesData, isTeacher, allowedClassIds]
  );

  const classOptions = classes.map((c) => ({ label: c.label, value: c.id }));
  const subjectOptions = (classSubjects as any[]).map((s) => ({
    label: s.code ? `${s.name} (${s.code})` : s.name,
    value: s.id,
  }));

  const filteredQuizzes = quizzes.filter(
    (q: any) =>
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.class?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setFormData({
      title: '',
      description: '',
      duration: 30,
      isPublished: false,
      classId: '',
      subjectId: '',
    });
    setShowDialog(true);
  };

  const openEdit = (q: any) => {
    setEditing(q);
    setFormData({
      title: q.title ?? '',
      description: q.description ?? '',
      duration: q.duration ?? 30,
      isPublished: !!q.isPublished,
      classId: q.classId,
      subjectId: q.subjectId,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.classId || !formData.subjectId) {
      toast.error('Title, Class, and Subject are required.');
      return;
    }
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          data: {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            duration: formData.duration,
            isPublished: formData.isPublished,
          },
        },
        {
          onSuccess: () => {
            setShowDialog(false);
            toast.success('Quiz updated.');
          },
          onError: (err) => toast.error(apiMessage(err, 'Failed to update quiz.')),
        }
      );
      return;
    }
    createMutation.mutate(
      {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        duration: formData.duration,
        isPublished: formData.isPublished,
        classId: formData.classId,
        subjectId: formData.subjectId,
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          toast.success('Quiz created. Add questions with the list button.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to create quiz.')),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Quiz deleted.');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(apiMessage(err, 'Failed to delete quiz.')),
    });
  };

  // ── Questions manager ──────────────────────────────────────
  const { data: questions = [], isLoading: loadingQuestions } = useQuizQuestions(questionsQuiz?.id);
  const saveQuestionMutation = useSaveQuizQuestion();
  const deleteQuestionMutation = useDeleteQuizQuestion();
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [qForm, setQForm] = useState(blankQuestion());

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQForm(blankQuestion());
  };

  const startEditQuestion = (q: any) => {
    setEditingQuestion(q);
    const opts: OptionDraft[] = Array.isArray(q.options)
      ? q.options.map((o: any) => ({
          id: String(o.id),
          text: o.text ?? '',
          isCorrect: !!o.isCorrect,
        }))
      : [];
    setQForm({
      questionText: q.questionText,
      questionType: q.questionType ?? 'MCQ',
      marks: String(q.marks ?? 1),
      options: opts.length
        ? opts
        : q.questionType === 'TRUE_FALSE'
          ? trueFalseOptions()
          : blankOptions(),
    });
  };

  const changeQuestionType = (type: string) => {
    setQForm((f) => ({
      ...f,
      questionType: type,
      options: type === 'TRUE_FALSE' ? trueFalseOptions() : type === 'MCQ' ? blankOptions() : [],
    }));
  };

  const setCorrect = (id: string) =>
    setQForm((f) => ({ ...f, options: f.options.map((o) => ({ ...o, isCorrect: o.id === id })) }));

  const saveQuestion = () => {
    if (!questionsQuiz) return;
    if (!qForm.questionText.trim()) {
      toast.error('Question text is required.');
      return;
    }
    const marks = Number(qForm.marks);
    if (Number.isNaN(marks) || marks < 0 || marks > 100) {
      toast.error('Marks must be between 0 and 100.');
      return;
    }
    let options: OptionDraft[] = [];
    if (qForm.questionType === 'MCQ') {
      options = qForm.options.filter((o) => o.text.trim());
      if (options.length < 2) {
        toast.error('Add at least two answer options.');
        return;
      }
      if (!options.some((o) => o.isCorrect)) {
        toast.error('Mark one option as the correct answer.');
        return;
      }
    } else if (qForm.questionType === 'TRUE_FALSE') {
      options = qForm.options;
    }
    saveQuestionMutation.mutate(
      {
        quizId: questionsQuiz.id,
        questionId: editingQuestion?.id,
        data: {
          questionText: qForm.questionText.trim(),
          questionType: qForm.questionType,
          marks,
          options: options.map((o) => ({ id: o.id, text: o.text.trim(), isCorrect: o.isCorrect })),
        },
      },
      {
        onSuccess: () => {
          toast.success(editingQuestion ? 'Question updated.' : 'Question added.');
          resetQuestionForm();
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to save question.')),
      }
    );
  };

  const removeQuestion = (q: any) => {
    if (!questionsQuiz) return;
    if (!confirm('Delete this question?')) return;
    deleteQuestionMutation.mutate(
      { quizId: questionsQuiz.id, questionId: q.id },
      {
        onSuccess: () => toast.success('Question deleted.'),
        onError: (err) => toast.error(apiMessage(err, 'Failed to delete question.')),
      }
    );
  };

  // ── Attempts / grading ─────────────────────────────────────
  const { data: attempts = [], isLoading: loadingAttempts } = useQuizAttempts(attemptsQuiz?.id);
  const gradeMutation = useGradeQuizAttempt();
  const [scores, setScores] = useState<Record<string, string>>({});

  const gradeAttempt = (a: any) => {
    const raw = scores[a.id] ?? (a.score != null ? String(a.score) : '');
    const score = Number(raw);
    if (raw === '' || Number.isNaN(score) || score < 0 || !Number.isInteger(score)) {
      toast.error('Enter a whole-number score.');
      return;
    }
    gradeMutation.mutate(
      { quizId: attemptsQuiz.id, attemptId: a.id, score },
      {
        onSuccess: () => toast.success('Score saved.'),
        onError: (err) => toast.error(apiMessage(err, 'Failed to save score.')),
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Quizzes" subtitle="Academics" />
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-page-title flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-brand" />
              Online Quizzes
            </h1>
            <p className="text-sm text-muted-foreground">
              Create tests, manage question banks, and evaluate responses
            </p>
          </div>
          <Button onClick={openCreate} disabled={classes.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        </div>

        <div className="surface-card p-4">
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

        <div className="surface-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-muted-foreground font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
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
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      Loading quizzes...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-rose-600">
                      {apiMessage(error, 'Could not load quizzes.')}
                    </td>
                  </tr>
                ) : filteredQuizzes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No quizzes found.
                    </td>
                  </tr>
                ) : (
                  filteredQuizzes.map((quiz: any) => (
                    <tr
                      key={quiz.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-foreground">{quiz.title}</td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                        {quiz.class ? `${quiz.class.name} ${quiz.class.section ?? ''}` : '-'}
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
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label="Edit quiz"
                            title="Edit quiz"
                            onClick={() => openEdit(quiz)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            aria-label="Manage questions"
                            title="Manage Questions"
                            onClick={() => {
                              resetQuestionForm();
                              setQuestionsQuiz(quiz);
                            }}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground transition-colors"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            aria-label="View attempts"
                            title="Attempts & grading"
                            onClick={() => setAttemptsQuiz(quiz)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground transition-colors"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            aria-label="Delete quiz"
                            title="Delete quiz"
                            onClick={() => setDeleteTarget(quiz)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                          >
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

      {/* Create / edit quiz */}
      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={editing ? 'Edit Quiz' : 'Create New Quiz'}
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Quiz Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Algebra Chapter 1 Test"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Duration (Mins) *</label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) || 30 })
                }
                min={1}
                max={600}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Status</label>
              <Select
                value={formData.isPublished ? 'PUBLISHED' : 'DRAFT'}
                options={[
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Published', value: 'PUBLISHED' },
                ]}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.value === 'PUBLISHED' })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Class *</label>
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
              <label className={labelCls}>Subject *</label>
              <Select
                value={formData.subjectId}
                disabled={!!editing || !formData.classId || loadingSubjects}
                options={[
                  { label: !formData.classId ? 'Pick a class first' : 'Select Subject', value: '' },
                  ...(editing && editing.subject
                    ? [{ label: editing.subject.name, value: editing.subjectId }]
                    : subjectOptions),
                ]}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              />
            </div>
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
            {editing ? 'Save Changes' : 'Save Quiz'}
          </Button>
        </div>
      </Dialog>

      {/* Delete confirm */}
      <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Quiz">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Delete <b>{deleteTarget?.title}</b> together with its questions and attempts?
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

      {/* Questions manager */}
      <Dialog
        isOpen={!!questionsQuiz}
        onClose={() => setQuestionsQuiz(null)}
        title={questionsQuiz ? `Questions - ${questionsQuiz.title}` : 'Questions'}
        className="max-w-3xl"
      >
        <div className="flex flex-col gap-5">
          {loadingQuestions ? (
            <p className="text-sm text-muted-foreground">Loading questions...</p>
          ) : (questions as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions yet. Add the first one below.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {(questions as any[]).map((q, idx) => (
                <li
                  key={q.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {idx + 1}. {q.questionText}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {q.questionType} · {q.marks} mark(s)
                      </p>
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <ul className="mt-1 text-xs">
                          {q.options.map((o: any) => (
                            <li
                              key={o.id}
                              className={
                                o.isCorrect
                                  ? 'text-emerald-600 font-semibold'
                                  : 'text-zinc-600 dark:text-zinc-400'
                              }
                            >
                              {o.id}. {o.text} {o.isCorrect ? '(correct)' : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        aria-label="Edit question"
                        onClick={() => startEditQuestion(q)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        aria-label="Delete question"
                        onClick={() => removeQuestion(q)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-3">
            <h4 className="text-sm font-bold">
              {editingQuestion ? 'Edit question' : 'Add question'}
            </h4>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Question *</label>
              <textarea
                value={qForm.questionText}
                onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Type</label>
                <Select
                  value={qForm.questionType}
                  options={QUESTION_TYPES}
                  onChange={(e) => changeQuestionType(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Marks</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={qForm.marks}
                  onChange={(e) => setQForm({ ...qForm, marks: e.target.value })}
                />
              </div>
            </div>

            {qForm.questionType === 'MCQ' && (
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Options (select the correct one)</label>
                {qForm.options.map((o) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={o.isCorrect}
                      onChange={() => setCorrect(o.id)}
                      aria-label={`Option ${o.id} is correct`}
                    />
                    <span className="text-xs font-mono w-4">{o.id}</span>
                    <Input
                      value={o.text}
                      onChange={(e) =>
                        setQForm({
                          ...qForm,
                          options: qForm.options.map((x) =>
                            x.id === o.id ? { ...x, text: e.target.value } : x
                          ),
                        })
                      }
                      placeholder={`Option ${o.id}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {qForm.questionType === 'TRUE_FALSE' && (
              <div className="flex gap-4 text-sm">
                {qForm.options.map((o) => (
                  <label key={o.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tf-correct"
                      checked={o.isCorrect}
                      onChange={() => setCorrect(o.id)}
                    />
                    {o.text} is correct
                  </label>
                ))}
              </div>
            )}

            {qForm.questionType === 'SHORT_ANSWER' && (
              <p className="text-xs text-muted-foreground">
                Short answers are marked by you from the attempts list.
              </p>
            )}

            <div className="flex justify-end gap-2">
              {editingQuestion && (
                <Button variant="outline" onClick={resetQuestionForm}>
                  Cancel edit
                </Button>
              )}
              <Button onClick={saveQuestion} isLoading={saveQuestionMutation.isPending}>
                {editingQuestion ? 'Save Question' : 'Add Question'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Attempts */}
      <Dialog
        isOpen={!!attemptsQuiz}
        onClose={() => setAttemptsQuiz(null)}
        title={attemptsQuiz ? `Attempts - ${attemptsQuiz.title}` : 'Attempts'}
        className="max-w-3xl"
      >
        {loadingAttempts ? (
          <p className="text-sm text-muted-foreground">Loading attempts...</p>
        ) : (attempts as any[]).length === 0 ? (
          <p className="text-sm text-muted-foreground">No student has attempted this quiz yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Started</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 w-28">Score</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(attempts as any[]).map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3 font-semibold">
                      {a.student?.name ?? 'Student'}
                      {a.student?.admissionNo ? (
                        <span className="text-zinc-400 font-normal">
                          {' '}
                          ({a.student.admissionNo})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">
                      {a.startedAt ? new Date(a.startedAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant={
                          a.status === 'GRADED'
                            ? 'success'
                            : a.status === 'SUBMITTED'
                              ? 'info'
                              : 'warning'
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        type="number"
                        min={0}
                        className="h-9 w-24"
                        value={scores[a.id] ?? (a.score != null ? String(a.score) : '')}
                        onChange={(e) => setScores((s) => ({ ...s, [a.id]: e.target.value }))}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => gradeAttempt(a)}
                        isLoading={
                          gradeMutation.isPending && gradeMutation.variables?.attemptId === a.id
                        }
                      >
                        Save score
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
