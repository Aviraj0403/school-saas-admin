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
  useExamsList,
  useCreateExam,
  useAutoAssignSeating,
  useSeatingChart,
  useStudentExamResults,
} from '@/hooks/queries/useExams';
import { useClasses } from '@/hooks/queries/useAcademics';
import { studentsService } from '@/services/students.service';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Award,
  Plus,
  Network,
  LayoutGrid,
  List,
  Calendar,
  Printer,
  FileText,
  CheckCircle,
  Search,
  User,
} from 'lucide-react';

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'seating' | 'admit-cards' | 'reports'>(
    'schedules'
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSeatingDialog, setShowSeatingDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Admit Card and Results States
  const [admitCardStudentId, setAdmitCardStudentId] = useState('');
  const [admitCardExamId, setAdmitCardExamId] = useState('');
  const [resultsSearchStudentId, setResultsSearchStudentId] = useState('');
  const [resultsSearchExamId, setResultsSearchExamId] = useState('');

  // States
  const [newExam, setNewExam] = useState({ name: '', classId: '', startDate: '', endDate: '' });
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Queries
  const { data: exams, isPending: loadingExams } = useExamsList();
  const { data: classes } = useClasses(1, 100);
  const { data: seatingChart, isPending: loadingSeating } = useSeatingChart(selectedExamId);
  const { data: studentResults, isPending: loadingStudentResults } = useStudentExamResults(
    resultsSearchExamId,
    resultsSearchStudentId
  );

  // Load students for admit card selection dropdown
  const { data: studentsResponse } = useQuery({
    queryKey: ['students-exams-selector'],
    queryFn: () => studentsService.getStudents(1, 100),
  });

  const createMutation = useCreateExam();
  const autoAssignMutation = useAutoAssignSeating();

  const handleCreateExam = () => {
    if (!newExam.name || !newExam.startDate || !newExam.endDate) {
      toast.error('Exam name, start date, and end date are required.');
      return;
    }
    createMutation.mutate(newExam, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewExam({ name: '', classId: '', startDate: '', endDate: '' });
        toast.success('Exam term scheduled successfully.');
      },
      onError: () => toast.error('Failed to schedule exam.'),
    });
  };

  const handleAutoAssign = () => {
    if (!selectedExamId) {
      toast.error('Please select an exam term.');
      return;
    }
    autoAssignMutation.mutate(
      { examId: selectedExamId, classIds: selectedClassIds },
      {
        onSuccess: () => {
          setShowSeatingDialog(false);
          setSelectedClassIds([]);
          toast.success('Seating chart auto-allocated successfully.');
        },
        onError: () => toast.error('Failed to assign seating chart.'),
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status || 'DRAFT';
    let variant: 'warning' | 'success' | 'info' = 'warning';
    if (s === 'COMPLETED') variant = 'success';
    if (s === 'PUBLISHED') variant = 'info';
    return <Badge variant={variant}>{s}</Badge>;
  };

  const classOptions =
    classes?.data?.items?.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })) ||
    [];
  const activeExams = exams?.data || [];
  const studentsList = studentsResponse?.items ?? [];

  const studentOptions = studentsList.map((s: any) => ({
    label: `${s.name} (Admission: ${s.admissionNo})`,
    value: s.id,
  }));

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Exams" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-brand" />
              Exams & Seat Allocations
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage terms, seating charts, admit cards, and report sheets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (activeExams.length) {
                  setSelectedExamId(activeExams[0].id);
                }
                setShowSeatingDialog(true);
              }}
            >
              <Network className="w-4 h-4 mr-2" /> Assign Seatings
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Schedule Exam
            </Button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex justify-between items-center flex-wrap gap-4 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg flex-wrap">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'schedules'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              Exam Schedules
            </button>
            <button
              onClick={() => setActiveTab('seating')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'seating'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              Seating Maps
            </button>
            <button
              onClick={() => setActiveTab('admit-cards')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'admit-cards'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              Admit Cards
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              Report Sheets
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
          {activeTab === 'schedules' && (
            <div>
              {loadingExams ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent" />
                  <span className="text-xs">Loading schedules...</span>
                </div>
              ) : activeExams.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                  No examinations configured yet.
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeExams.map((exam: any) => (
                    <div
                      key={exam.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                          {exam.name}
                        </h3>
                        {getStatusBadge(exam.status)}
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs font-medium flex flex-col gap-1.5 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                        <div className="flex justify-between">
                          <span>Class:</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                            {exam.className || 'All Classes'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Term Start:</span>
                          <span className="text-zinc-900 dark:text-zinc-300 font-mono">
                            {exam.startDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Term End:</span>
                          <span className="text-zinc-900 dark:text-zinc-300 font-mono">
                            {exam.endDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4">Exam Term</th>
                        <th className="px-6 py-4">Class Room</th>
                        <th className="px-6 py-4">Starts On</th>
                        <th className="px-6 py-4">Ends On</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeExams.map((exam: any) => (
                        <tr
                          key={exam.id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            {exam.name}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                            {exam.className || 'All Classes'}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {exam.startDate}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {exam.endDate}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(exam.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seating' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl flex-wrap">
                <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                  Inspect Scheduled Exam:
                </label>
                <div className="w-64">
                  <Select
                    value={selectedExamId}
                    options={[
                      { label: 'Select Term', value: '' },
                      ...activeExams.map((e: any) => ({ label: e.name, value: e.id })),
                    ]}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                  />
                </div>
              </div>

              {loadingSeating ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent" />
                  <span className="text-xs">Querying chart data...</span>
                </div>
              ) : selectedExamId && seatingChart && seatingChart.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {seatingChart.map((slot: any, idx: number) => (
                      <div
                        key={idx}
                        className="border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl bg-white dark:bg-zinc-900 flex flex-col gap-2 hover:border-brand/40 transition-all duration-200"
                      >
                        <div>
                          <Badge variant="secondary">{slot.hallName || 'Hall'}</Badge>
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-1.5">
                            {slot.studentName}
                          </h4>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1">
                          <span className="text-zinc-500">Seat No.</span>
                          <span className="text-brand font-mono font-bold">{slot.seatNo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                        <tr>
                          <th className="px-6 py-4">Student Name</th>
                          <th className="px-6 py-4">Roll No.</th>
                          <th className="px-6 py-4">Exam Hall</th>
                          <th className="px-6 py-4">Seat Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                        {seatingChart.map((slot: any, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                              {slot.studentName}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                              {slot.admissionNo}
                            </td>
                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                              {slot.hallName}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-brand">
                              {slot.seatNo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Network className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No allocations calculated.
                  </p>
                  <p className="text-xs mt-1 text-zinc-500">
                    Choose a term, then select assign seatings to auto allocate desk arrangements.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'admit-cards' && (
            <div className="flex flex-col gap-6">
              <div className="flex bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5 w-64">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                    1. Choose Exam Term *
                  </label>
                  <Select
                    value={admitCardExamId}
                    options={[
                      { label: 'Select Term', value: '' },
                      ...activeExams.map((e: any) => ({ label: e.name, value: e.id })),
                    ]}
                    onChange={(e) => setAdmitCardExamId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-72">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                    2. Select Student *
                  </label>
                  <Select
                    value={admitCardStudentId}
                    options={[{ label: 'Select Student', value: '' }, ...studentOptions]}
                    onChange={(e) => setAdmitCardStudentId(e.target.value)}
                  />
                </div>
              </div>

              {admitCardExamId && admitCardStudentId ? (
                (() => {
                  const selStudentObj = studentsList.find((s: any) => s.id === admitCardStudentId);
                  const selExamObj = activeExams.find((e: any) => e.id === admitCardExamId);
                  const fullName = selStudentObj
                    ? selStudentObj.name || `${selStudentObj.firstName} ${selStudentObj.lastName}`
                    : '—';

                  return (
                    <div className="max-w-xl mx-auto w-full">
                      <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-lg bg-white dark:bg-zinc-900 relative">
                        <div className="bg-gradient-to-r from-brand to-purple-600 p-5 text-white flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                              Official Admit Card
                            </span>
                            <h3 className="text-lg font-bold mt-1 uppercase">
                              {selExamObj?.name || 'TERMINAL EXAMINATION'}
                            </h3>
                          </div>
                          <Award className="w-10 h-10 opacity-30" />
                        </div>

                        <div className="p-6 flex flex-col gap-5">
                          <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                            <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center font-bold text-lg">
                              {selStudentObj?.firstName ? selStudentObj.firstName[0] : 'S'}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                {fullName}
                              </h4>
                              <div className="flex gap-4 text-xs text-zinc-500 mt-1 font-medium">
                                <span>
                                  ADM:{' '}
                                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                    {selStudentObj?.admissionNo || '—'}
                                  </span>
                                </span>
                                <span>
                                  CLASS:{' '}
                                  <span className="font-bold text-brand">
                                    {selStudentObj?.className || 'Class 10A'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                              <span className="text-[10px] font-semibold text-zinc-400 uppercase block">
                                ALLOCATED HALL
                              </span>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
                                Hall-A (North Wing)
                              </span>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                              <span className="text-[10px] font-semibold text-zinc-400 uppercase block">
                                ASSIGNED DESK
                              </span>
                              <span className="text-xs font-bold text-brand font-mono mt-1 block">
                                Desk Seat #42
                              </span>
                            </div>
                          </div>

                          <div className="mt-2">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-2">
                              Examination Timetable
                            </span>
                            <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden divide-y divide-zinc-200/80 dark:divide-zinc-800/80 text-xs">
                              <div className="p-3 flex justify-between bg-zinc-50 dark:bg-zinc-800/40 font-semibold text-zinc-500">
                                <span>Subject</span>
                                <span>Schedule Time</span>
                              </div>
                              <div className="p-3 flex justify-between">
                                <span>English Literature</span>
                                <span className="font-mono text-zinc-500">
                                  2026-06-01 · 09:00 AM
                                </span>
                              </div>
                              <div className="p-3 flex justify-between">
                                <span>Mathematics Core</span>
                                <span className="font-mono text-zinc-500">
                                  2026-06-03 · 09:00 AM
                                </span>
                              </div>
                              <div className="p-3 flex justify-between">
                                <span>Science & Physics</span>
                                <span className="font-mono text-zinc-500">
                                  2026-06-05 · 09:00 AM
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center mt-5">
                        <Button
                          onClick={() =>
                            toast.success(`Admit card printable job sent for ${fullName}.`)
                          }
                        >
                          <Printer className="w-4 h-4 mr-2" /> Print Admit Card
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg mx-auto">
                  <Printer className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Admit Card Visualizer
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select an active exam term and student to generate their printable exam hall
                    admit card.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex flex-col gap-6">
              <div className="flex bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5 w-64">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                    Select Exam Term *
                  </label>
                  <Select
                    value={resultsSearchExamId}
                    options={[
                      { label: 'Select Term', value: '' },
                      ...activeExams.map((e: any) => ({ label: e.name, value: e.id })),
                    ]}
                    onChange={(e) => setResultsSearchExamId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-72">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                    Search Student Profile *
                  </label>
                  <Select
                    value={resultsSearchStudentId}
                    options={[{ label: 'Select Student', value: '' }, ...studentOptions]}
                    onChange={(e) => setResultsSearchStudentId(e.target.value)}
                  />
                </div>
              </div>

              {resultsSearchStudentId && resultsSearchExamId ? (
                (() => {
                  const selStudentObj = studentsList.find(
                    (s: any) => s.id === resultsSearchStudentId
                  );
                  const fullName = selStudentObj
                    ? selStudentObj.name || `${selStudentObj.firstName} ${selStudentObj.lastName}`
                    : '—';

                  const totalMarks =
                    studentResults?.reduce(
                      (acc: number, curr: any) => acc + (curr.marks || 0),
                      0
                    ) || 0;
                  const maxMarks =
                    studentResults?.reduce(
                      (acc: number, curr: any) => acc + (curr.maxMarks || 100),
                      0
                    ) || 1;
                  const overallPct = studentResults?.length
                    ? Math.round((totalMarks / maxMarks) * 100)
                    : 0;
                  const overallGrade =
                    overallPct >= 90
                      ? 'A+'
                      : overallPct >= 80
                        ? 'A'
                        : overallPct >= 70
                          ? 'B'
                          : overallPct >= 60
                            ? 'C'
                            : 'F';
                  const overallStatus = overallPct >= 40 ? 'PASS' : 'FAIL';

                  return (
                    <div className="flex flex-col gap-6">
                      <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 flex justify-between items-center">
                        <div>
                          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            {fullName} Report Sheet
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            Class: {selStudentObj?.className || 'Class'} · Roll Code:{' '}
                            {selStudentObj?.admissionNo || '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-zinc-400 block">
                            Overall Grade
                          </span>
                          <span
                            className={`text-lg font-bold block mt-0.5 ${overallStatus === 'PASS' ? 'text-emerald-500' : 'text-rose-500'}`}
                          >
                            {studentResults?.length
                              ? `${overallGrade} (${overallStatus}) - ${overallPct}%`
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {loadingStudentResults ? (
                        <div className="p-8 text-center text-zinc-500">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                              <tr>
                                <th className="px-6 py-4">Subject Particulars</th>
                                <th className="px-6 py-4">Marks Obtained</th>
                                <th className="px-6 py-4">Percentage</th>
                                <th className="px-6 py-4">Grade</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                              {studentResults?.map((d: any, idx: number) => {
                                const pct = Math.round((d.marks / d.maxMarks) * 100);
                                const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : 'B';
                                return (
                                  <tr
                                    key={idx}
                                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                  >
                                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                      {d.subject?.name || d.subjectName || 'Subject'}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                      {d.marks} / {d.maxMarks}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                                          {pct}%
                                        </span>
                                        <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-brand rounded-full"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-brand">{grade}</td>
                                    <td className="px-6 py-4">
                                      <Badge variant="success">PASS</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                                      {d.remarks || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg mx-auto">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Academic Report Card
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select an active exam term and student to inspect their marks and grades.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Exam Dialog */}
      <Dialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Schedule New Exam Term"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Exam Term Name *
            </label>
            <Input
              value={newExam.name}
              onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
              placeholder="e.g. Mid-Term 2026"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Target Class *
            </label>
            <Select
              value={newExam.classId}
              options={[{ label: 'Select Class', value: '' }, ...classOptions]}
              onChange={(e) => setNewExam({ ...newExam, classId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Start Date *
              </label>
              <Input
                type="date"
                value={newExam.startDate}
                onChange={(e) => setNewExam({ ...newExam, startDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                End Date *
              </label>
              <Input
                type="date"
                value={newExam.endDate}
                onChange={(e) => setNewExam({ ...newExam, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateExam} isLoading={createMutation.isPending}>
            Schedule Term
          </Button>
        </div>
      </Dialog>

      {/* Assign Seating Dialog */}
      <Dialog
        isOpen={showSeatingDialog}
        onClose={() => setShowSeatingDialog(false)}
        title="Auto-Allocate Seating Chart"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Select Exam Term *
            </label>
            <Select
              value={selectedExamId}
              options={[
                { label: 'Select Exam Term', value: '' },
                ...activeExams.map((e: any) => ({ label: e.name, value: e.id })),
              ]}
              onChange={(e) => setSelectedExamId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Select Classroom Sections *
            </label>
            <select
              multiple
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all h-32"
              value={selectedClassIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, (option) => option.value);
                setSelectedClassIds(options);
              }}
            >
              {classOptions.map((opt: any) => (
                <option key={opt.value} value={opt.value} className="py-1 px-2">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowSeatingDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAutoAssign} isLoading={autoAssignMutation.isPending}>
            Run Allocations
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
