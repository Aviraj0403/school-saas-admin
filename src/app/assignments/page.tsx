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
  useAssignments,
  useStudentAssignments,
  useCreateAssignment,
  useSubmitAssignment,
  useGradeSubmission,
} from '@/hooks/queries/useHomework';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  User,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  Upload,
  Edit3,
  Search,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  status: 'ACTIVE' | 'DRAFT' | 'GRADED';
  submissions: number;
  totalStudents: number;
}

interface Submission {
  id: string;
  studentName: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'PENDING' | 'GRADED';
  fileName: string;
  grade: string;
}

export default function AssignmentsPage() {
  const [roleMode, setRoleMode] = useState<'TEACHER' | 'STUDENT'>('TEACHER');

  // Dialog controls
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);

  // Active selections
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Form values
  const [gradeValue, setGradeValue] = useState('');
  const [submittedFileName, setSubmittedFileName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { user } = useAuthStore();
  const studentIdForDemo = user?.id || 'demo-student-1';

  const { data: assignmentsData, isPending: loadingAssignments } = useAssignments();
  const { data: studentHomeworkData, isPending: loadingStudentHw } =
    useStudentAssignments(studentIdForDemo);

  const createAssignmentMutation = useCreateAssignment();
  const submitAssignmentMutation = useSubmitAssignment();
  const gradeSubmissionMutation = useGradeSubmission();

  const assignments: Assignment[] = assignmentsData || [];
  const submissionsList: Submission[] = [];
  const studentHomework: any[] = studentHomeworkData || [];

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    className: '',
    dueDate: '',
  });

  const subjects = [
    { label: 'Mathematics', value: 'Mathematics' },
    { label: 'Physics', value: 'Physics' },
    { label: 'Chemistry', value: 'Chemistry' },
    { label: 'Biology', value: 'Biology' },
    { label: 'English Literature', value: 'English Literature' },
    { label: 'Social Studies', value: 'Social Studies' },
  ];

  const classes = [
    { label: 'Grade 9-A', value: 'Grade 9-A' },
    { label: 'Grade 9-B', value: 'Grade 9-B' },
    { label: 'Grade 9-C', value: 'Grade 9-C' },
    { label: 'Grade 10-A', value: 'Grade 10-A' },
    { label: 'Grade 10-B', value: 'Grade 10-B' },
    { label: 'Grade 11-A', value: 'Grade 11-A' },
    { label: 'Grade 11-B', value: 'Grade 11-B' },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate(
      {
        title: formData.title,
        subjectId: formData.subject,
        classId: formData.className,
        dueDate: new Date(formData.dueDate).toISOString(),
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setFormData({ title: '', subject: '', className: '', dueDate: '' });
          toast.success('Assignment created and published successfully.');
        },
        onError: () => toast.error('Failed to post assignment.'),
      }
    );
  };

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    gradeSubmissionMutation.mutate(
      {
        submissionId: selectedSubmission.id,
        payload: { marksAwarded: gradeValue, feedback: 'Graded via UI' },
      },
      {
        onSuccess: () => {
          setShowGradeDialog(false);
          setGradeValue('');
          toast.success(`Graded homework for ${selectedSubmission.studentName}.`);
        },
        onError: () => toast.error('Failed to submit evaluation.'),
      }
    );
  };

  const handleStudentUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    submitAssignmentMutation.mutate(
      {
        assignmentId: selectedAssignment.id,
        payload: { studentId: studentIdForDemo, notes: submittedFileName },
      },
      {
        onSuccess: () => {
          setShowSubmitDialog(false);
          setSubmittedFileName('');
          toast.success('Your assignment solution was uploaded successfully.');
        },
        onError: () => toast.error('Failed to submit homework.'),
      }
    );
  };

  const filteredAssignments = filterStatus
    ? assignments.filter((a) => a.status === filterStatus)
    : assignments;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Assignments" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header with Role Toggle */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand" />
              Assignments & Homework
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Post tasks, manage submissions, and evaluate student work
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50">
              <button
                onClick={() => setRoleMode('TEACHER')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${roleMode === 'TEACHER' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                <User className="w-3.5 h-3.5" /> Teacher Mode
              </button>
              <button
                onClick={() => setRoleMode('STUDENT')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${roleMode === 'STUDENT' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Student Mode
              </button>
            </div>

            {roleMode === 'TEACHER' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Post Assignment
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {roleMode === 'TEACHER' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">Active Tasks</span>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {assignments.filter((a) => a.status === 'ACTIVE').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">Total Submissions</span>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {assignments.reduce((sum, a) => sum + a.submissions, 0)}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">Pending Evaluation</span>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {submissionsList.filter((s) => s.status === 'SUBMITTED').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">Submission Rate</span>
              <h3 className="text-2xl font-bold text-brand mt-1">82.5%</h3>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">Pending Solutions</span>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {studentHomework.filter((h) => h.status === 'PENDING_SUBMISSION').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">Submitted Homework</span>
              <h3 className="text-2xl font-bold text-brand mt-1">
                {studentHomework.filter((h) => h.status === 'SUBMITTED').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">Graded Tasks</span>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {studentHomework.filter((h) => h.status === 'GRADED').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-zinc-500">GPA Average Grade</span>
              <h3 className="text-2xl font-bold text-brand mt-1">A-</h3>
            </div>
          </div>
        )}

        {/* TEACHER MODE DISPLAY */}
        {roleMode === 'TEACHER' && (
          <div className="flex flex-col gap-4">
            {/* Filter Toolbar */}
            <div className="flex gap-2 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 w-max">
              {['All', 'ACTIVE', 'GRADED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st === 'All' ? null : st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    (st === 'All' && !filterStatus) || filterStatus === st
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {st === 'All' ? 'All Tasks' : st}
                </button>
              ))}
            </div>

            {/* Assignments list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((assignment) => {
                const submissionPercent = Math.round(
                  (assignment.submissions / assignment.totalStudents) * 100
                );
                return (
                  <div
                    key={assignment.id}
                    className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary">{assignment.subject}</Badge>
                        <Badge
                          variant={
                            assignment.status === 'ACTIVE'
                              ? 'success'
                              : assignment.status === 'GRADED'
                                ? 'info'
                                : 'warning'
                          }
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" /> {assignment.className}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Due:{' '}
                          {assignment.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 pt-3 mt-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                          Submissions Logged
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {assignment.submissions} / {assignment.totalStudents} ({submissionPercent}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${assignment.status === 'GRADED' ? 'bg-brand' : 'bg-emerald-500'}`}
                          style={{ width: `${submissionPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowSubmissionsDialog(true);
                          }}
                          className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                        >
                          <Search className="w-3.5 h-3.5" /> View Submissions & Grade
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STUDENT MODE DISPLAY */}
        {roleMode === 'STUDENT' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Your Assigned Tasks
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentHomework.map((hw) => {
                const globalAssignment = assignments.find((a) => a.title === hw.title);
                return (
                  <div
                    key={hw.id}
                    className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary">{hw.subject}</Badge>
                        <Badge
                          variant={
                            hw.status === 'GRADED'
                              ? 'success'
                              : hw.status === 'SUBMITTED'
                                ? 'info'
                                : 'danger'
                          }
                        >
                          {hw.status === 'PENDING_SUBMISSION' ? 'PENDING' : hw.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                        {hw.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Due: {hw.dueDate}
                      </p>
                    </div>

                    <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 pt-3 mt-1 flex flex-col gap-2 text-xs">
                      {hw.status === 'PENDING_SUBMISSION' ? (
                        <div className="flex justify-between items-center">
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            Not submitted yet
                          </span>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(globalAssignment || null);
                              setShowSubmitDialog(true);
                            }}
                          >
                            <Upload className="w-3.5 h-3.5 mr-1" /> Submit Homework
                          </Button>
                        </div>
                      ) : hw.status === 'SUBMITTED' ? (
                        <div className="flex flex-col gap-1 text-zinc-500 dark:text-zinc-400">
                          <div className="flex justify-between">
                            <span>Uploaded Solution:</span>
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {hw.fileName}
                            </span>
                          </div>
                          <span className="text-brand font-medium mt-1">
                            Awaiting evaluation by teacher...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                              Uploaded File:
                            </span>
                            <span className="font-mono text-zinc-900 dark:text-zinc-100">
                              {hw.fileName}
                            </span>
                          </div>
                          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg flex justify-between items-center font-semibold">
                            <span>Grade Awarded:</span>
                            <span className="text-base font-bold">{hw.grade}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dialog: Create Assignment (Teacher Only) */}
        <Dialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          title="Post New Assignment"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Assignment Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g. Periodic Table Worksheet"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subject Category *
              </label>
              <Select
                value={formData.subject}
                options={[{ label: 'Select Subject', value: '' }, ...subjects]}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Target Class *
              </label>
              <Select
                value={formData.className}
                options={[{ label: 'Select Class', value: '' }, ...classes]}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Due Date *
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createAssignmentMutation.isPending}>
                Publish Assignment
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Dialog: View Submissions & Grade (Teacher Only) */}
        <Dialog
          isOpen={showSubmissionsDialog}
          onClose={() => setShowSubmissionsDialog(false)}
          title={`Submissions Log — ${selectedAssignment?.title || 'Assignment'}`}
        >
          <div className="py-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {submissionsList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        No student submissions logged.
                      </td>
                    </tr>
                  ) : (
                    submissionsList.map((sub) => (
                      <tr key={sub.id}>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {sub.studentName}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                          {sub.submittedAt}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {sub.fileName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              sub.status === 'GRADED'
                                ? 'success'
                                : sub.status === 'SUBMITTED'
                                  ? 'info'
                                  : 'warning'
                            }
                          >
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-bold">{sub.grade || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {sub.status === 'SUBMITTED' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setShowGradeDialog(true);
                              }}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" /> Grade
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Dialog>

        {/* Dialog: Grade Submission (Teacher Only) */}
        <Dialog
          isOpen={showGradeDialog}
          onClose={() => setShowGradeDialog(false)}
          title={`Evaluate — ${selectedSubmission?.studentName || 'Student'}`}
        >
          <form onSubmit={handleGradeSubmission} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Document Submitted
              </label>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-zinc-700 dark:text-zinc-300">
                {selectedSubmission?.fileName}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Grade / Score (e.g. A+, 95/100) *
              </label>
              <Input
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                required
                placeholder="e.g. 95/100 or A+"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setShowGradeDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={gradeSubmissionMutation.isPending}>
                Save Evaluation
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Dialog: Submit Homework (Student Only) */}
        <Dialog
          isOpen={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
          title={`Submit Homework — ${selectedAssignment?.title || 'Task'}`}
        >
          <form onSubmit={handleStudentUpload} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Document Filename to Submit *
              </label>
              <Input
                value={submittedFileName}
                onChange={(e) => setSubmittedFileName(e.target.value)}
                required
                placeholder="e.g. maths_hw_solution_aditya.pdf"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitAssignmentMutation.isPending}>
                Upload & Submit
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
