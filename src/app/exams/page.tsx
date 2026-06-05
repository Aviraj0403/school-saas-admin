'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { useExamsList, useCreateExam, useAutoAssignSeating, useSeatingChart, useStudentExamResults } from '@/hooks/queries/useExams';
import { useClasses } from '@/hooks/queries/useAcademics';
import { studentsService } from '@/services/students.service';
import { useQuery } from '@tanstack/react-query';

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState(0);
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
  const { data: studentResults, isPending: loadingStudentResults } = useStudentExamResults(resultsSearchExamId, resultsSearchStudentId);

  // Load students for admit card selection dropdown
  const { data: studentsResponse } = useQuery({
    queryKey: ['students-exams-selector'],
    queryFn: () => studentsService.getStudents(1, 100),
  });

  const createMutation = useCreateExam();
  const autoAssignMutation = useAutoAssignSeating();

  const handleCreateExam = () => {
    createMutation.mutate(newExam, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewExam({ name: '', classId: '', startDate: '', endDate: '' });
      }
    });
  };

  const handleAutoAssign = () => {
    autoAssignMutation.mutate({ examId: selectedExamId, classIds: selectedClassIds }, {
      onSuccess: () => {
        setShowSeatingDialog(false);
        setSelectedClassIds([]);
      }
    });
  };

  const statusBodyTemplate = (rowData: any) => {
    const status = rowData.status || 'DRAFT';
    let style = 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    if (status === 'COMPLETED') {
      style = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    } else if (status === 'PUBLISHED') {
      style = 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
    }
    return <Tag value={status} className={`px-2.5 py-1 text-xs font-bold rounded-full ${style}`} />;
  };

  const classOptions = classes?.data?.items?.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })) || [];
  const activeExams = exams?.data || [];
  const studentsList = studentsResponse?.items ?? [];

  const studentOptions = studentsList.map((s: any) => ({
    label: `${s.name} (Admission: ${s.admissionNo})`,
    value: s.id
  }));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Exams & Seat Allocations</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Establish exam dates, publish term sheets, and trigger automatic seat allocations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                if (activeExams.length) {
                  setSelectedExamId(activeExams[0].id);
                }
                setShowSeatingDialog(true);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
            >
              <i className="pi pi-sitemap"></i>
              Assign Seatings
            </button>
            <button 
              onClick={() => setShowAddDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
            >
              <i className="pi pi-calendar-plus"></i>
              Schedule Exam
            </button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Grid Mode"
          >
            <i className="pi pi-th-large text-sm"></i>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'table' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Tabular View"
          >
            <i className="pi pi-list text-sm"></i>
          </button>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <style>{`
            .p-tabview, .p-tabview-nav, .p-tabview-panels, .p-datatable, .p-datatable-wrapper, .p-paginator {
              background: transparent !important;
            }
            .p-datatable-thead > tr > th, .p-datatable-tbody > tr, .p-datatable-tbody > tr > td {
              background: transparent !important;
            }
            .p-tabview-nav li .p-tabview-nav-link {
              background: transparent !important;
            }
          `}</style>
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            {/* Active Exams Panel */}
            <TabPanel header="Exam Schedules">
              <div className="p-4">
                {loadingExams ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading schedules...</span>
                  </div>
                ) : activeExams.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No examinations configured yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {activeExams.map((exam: any) => (
                      <div 
                        key={exam.id} 
                        className="border border-slate-105 dark:border-slate-805 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-slate-850 dark:text-white text-base leading-snug">{exam.name}</h3>
                          {statusBodyTemplate(exam)}
                        </div>
                        
                        <div className="bg-slate-100/50 dark:bg-slate-850 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex flex-col gap-1.5 border border-slate-150/40 text-slate-400 mt-2">
                          <div className="flex justify-between">
                            <span>Class:</span>
                            <span className="text-slate-850 dark:text-slate-300 font-extrabold">{exam.className || 'All Classes'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Term Start:</span>
                            <span className="text-slate-850 dark:text-slate-350">{exam.startDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Term End:</span>
                            <span className="text-slate-850 dark:text-slate-350">{exam.endDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable 
                    value={activeExams} 
                    loading={loadingExams} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="name" header="Exam Term" className="font-semibold text-slate-850 dark:text-white"></Column>
                    <Column field="className" header="Class Room" body={(d) => d.className || 'All Classes'}></Column>
                    <Column field="startDate" header="Starts On" sortable></Column>
                    <Column field="endDate" header="Ends On" sortable></Column>
                    <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                  </DataTable>
                )}
              </div>
            </TabPanel>

            {/* Seating chart Panel */}
            <TabPanel header="Seating Allocation Maps">
              <div className="p-4 flex flex-col gap-5">
                <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex-wrap">
                  <label className="font-bold text-xs text-slate-500 uppercase tracking-wider">Inspect Scheduled Exam:</label>
                  <Dropdown 
                    value={selectedExamId} 
                    options={activeExams.map((e: any) => ({ label: e.name, value: e.id })) || []} 
                    onChange={(e) => setSelectedExamId(e.value)} 
                    placeholder="Select Term"
                    className="border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl min-w-60"
                  />
                </div>

                {loadingSeating ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Querying chart data...</span>
                  </div>
                ) : selectedExamId && seatingChart && seatingChart.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {seatingChart.map((slot: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="border border-indigo-100/55 dark:border-indigo-900/20 p-4 rounded-3xl bg-indigo-50/20 dark:bg-indigo-950/10 flex flex-col gap-2 hover:scale-[1.02] hover:bg-indigo-50/40 transition-all duration-200"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{slot.hallName || 'Hall'}</span>
                            <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-0.5">{slot.studentName}</h4>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100/50 dark:border-indigo-900/10 pt-2 mt-1">
                            <span>Seat No.</span>
                            <span className="text-indigo-700 dark:text-indigo-300 font-mono font-extrabold">{slot.seatNo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <DataTable 
                      value={seatingChart || []} 
                      className="p-datatable-sm" 
                    >
                      <Column field="studentName" header="Student Name" className="font-semibold" />
                      <Column field="admissionNo" header="Roll No." />
                      <Column field="hallName" header="Exam Hall" />
                      <Column field="seatNo" header="Seat Number" className="font-mono" />
                    </DataTable>
                  )
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <i className="pi pi-sitemap text-4xl mb-2"></i>
                    <p className="text-sm font-semibold">No allocations calculated.</p>
                    <p className="text-xs mt-1">Choose a term, then select assign seatings to auto allocate desk arrangements.</p>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Admit Card Generation Portal Tab */}
            <TabPanel header="Admit Card Generator">
              <div className="p-4 flex flex-col gap-6">
                <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl gap-4 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450">1. Choose Exam Term *</label>
                    <Dropdown 
                      value={admitCardExamId} 
                      options={activeExams.map((e: any) => ({ label: e.name, value: e.id }))} 
                      onChange={(e) => setAdmitCardExamId(e.value)} 
                      placeholder="Select term"
                      className="w-60 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450">2. Select Student *</label>
                    <Dropdown 
                      value={admitCardStudentId} 
                      options={studentOptions} 
                      onChange={(e) => setAdmitCardStudentId(e.value)} 
                      filter
                      placeholder="Search student by name/admission"
                      className="w-72 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl" 
                    />
                  </div>
                </div>

                {admitCardExamId && admitCardStudentId ? (
                  (() => {
                    const selStudentObj = studentsList.find((s: any) => s.id === admitCardStudentId);
                    const selExamObj = activeExams.find((e: any) => e.id === admitCardExamId);
                    const fullName = selStudentObj ? selStudentObj.name || `${selStudentObj.firstName} ${selStudentObj.lastName}` : '—';
                    
                    return (
                      <div className="max-w-xl mx-auto w-full animate-fade-in">
                        {/* Premium Printable Admit Card Visualizer */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg bg-white dark:bg-slate-950 relative">
                          {/* Card header banner */}
                          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-5 text-white flex justify-between items-center">
                            <div>
                              <span className="text-[9px] font-extrabold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">Official Admit Card</span>
                              <h3 className="text-md font-black mt-1 uppercase tracking-wide">{selExamObj?.name || 'TERMINAL EXAMINATION'}</h3>
                            </div>
                            <i className="pi pi-graduation-cap text-3xl opacity-20"></i>
                          </div>

                          {/* Student Demographics details */}
                          <div className="p-6 flex flex-col gap-5">
                            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
                              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                                {selStudentObj?.firstName ? selStudentObj.firstName[0] : '?'}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-extrabold text-slate-850 dark:text-white">{fullName}</h4>
                                <div className="flex gap-4 text-[10px] text-slate-450 mt-1 font-semibold">
                                  <span>ADM: <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{selStudentObj?.admissionNo || '—'}</span></span>
                                  <span>CLASS: <span className="font-bold text-indigo-500">{selStudentObj?.className || 'Class 10A'}</span></span>
                                </div>
                              </div>
                            </div>

                            {/* Desk allocation strips */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-150/40 dark:border-slate-800/80">
                                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">ALLOCATED HALL</span>
                                <span className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1 block">Hall-A (North Wing)</span>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-150/40 dark:border-slate-800/80">
                                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">ASSIGNED DESK / SEAT</span>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">Desk Seat #42</span>
                              </div>
                            </div>

                            {/* Timetable schedule mini logs */}
                            <div className="mt-2">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Examination Timetable</span>
                              <div className="border border-slate-100 dark:border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-900 text-[11px] font-semibold text-slate-650 dark:text-slate-350 bg-slate-50/20">
                                <div className="p-3 flex justify-between bg-slate-50 dark:bg-slate-900 font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                                  <span>Subject</span>
                                  <span>Schedule Time</span>
                                </div>
                                <div className="p-3 flex justify-between"><span>English Literature</span><span className="font-mono text-slate-500">2026-06-01 · 09:00 AM</span></div>
                                <div className="p-3 flex justify-between"><span>Mathematics Core</span><span className="font-mono text-slate-500">2026-06-03 · 09:00 AM</span></div>
                                <div className="p-3 flex justify-between"><span>Science & Physics</span><span className="font-mono text-slate-500">2026-06-05 · 09:00 AM</span></div>
                              </div>
                            </div>

                            {/* Signature / stamp blocks */}
                            <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-900 pt-5 mt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-24 border-b border-dashed border-slate-200 dark:border-slate-800"></div>
                                <span className="mt-2">Invigilator Sign</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-24 border-b border-dashed border-slate-200 dark:border-slate-800"></div>
                                <span className="mt-2">Principal Seal</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Print Action Trigger */}
                        <div className="flex justify-center mt-5">
                          <button 
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('show-toast', {
                                detail: {
                                  severity: 'success',
                                  summary: 'Admit Card Print Job Sent',
                                  detail: `Official Admit Card generated for ${fullName}. Printing queue initialized.`,
                                  life: 3500
                                }
                              }));
                            }}
                            className="p-3 px-6 bg-indigo-600 hover:bg-indigo-700 border-none text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                          >
                            <i className="pi pi-print"></i>
                            Print Admit Card
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20 max-w-lg mx-auto">
                    <i className="pi pi-id-card text-4xl mb-2 text-indigo-400"></i>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-350">Admit Card Visualizer</p>
                    <p className="text-xs text-slate-400 mt-1">Select an active exam term and student roll number to generate and review their printable exam hall admit card.</p>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Terminal Exam Results Sheets Tab */}
            <TabPanel header="Exam Report Sheets">
              <div className="p-4 flex flex-col gap-6">
                <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl gap-4 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450">Select Exam Term *</label>
                    <Dropdown 
                      value={resultsSearchExamId} 
                      options={activeExams.map((e: any) => ({ label: e.name, value: e.id }))} 
                      onChange={(e) => setResultsSearchExamId(e.value)} 
                      placeholder="Select term"
                      className="w-60 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450">Search Student Profile *</label>
                    <Dropdown 
                      value={resultsSearchStudentId} 
                      options={studentOptions} 
                      onChange={(e) => setResultsSearchStudentId(e.value)} 
                      filter
                      placeholder="Search student by name/admission"
                      className="w-72 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl" 
                    />
                  </div>
                </div>

                {resultsSearchStudentId && resultsSearchExamId ? (
                  (() => {
                    const selStudentObj = studentsList.find((s: any) => s.id === resultsSearchStudentId);
                    const fullName = selStudentObj ? selStudentObj.name || `${selStudentObj.firstName} ${selStudentObj.lastName}` : '—';
                    
                    const totalMarks = studentResults?.reduce((acc: number, curr: any) => acc + (curr.marks || 0), 0) || 0;
                    const maxMarks = studentResults?.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0) || 1;
                    const overallPct = studentResults?.length ? Math.round((totalMarks / maxMarks) * 100) : 0;
                    const overallGrade = overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B' : overallPct >= 60 ? 'C' : 'F';
                    const overallStatus = overallPct >= 40 ? 'PASS' : 'FAIL';

                    return (
                      <div className="flex flex-col gap-6 animate-fade-in">
                        {/* Report card overview banner */}
                        <div className="p-5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-150/30 flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{fullName} Report Sheet</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Class: {selStudentObj?.className || 'Class'} · Roll Code: {selStudentObj?.admissionNo || '—'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 block">Overall Grade</span>
                            <span className={`text-lg font-black block mt-0.5 ${overallStatus === 'PASS' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {studentResults?.length ? `${overallGrade} (${overallStatus}) - ${overallPct}%` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Results DataTable */}
                        {loadingStudentResults ? (
                          <div className="p-8 text-center text-slate-400"><i className="pi pi-spin pi-spinner text-2xl"></i></div>
                        ) : (
                          <DataTable
                            value={studentResults || []}
                            className="p-datatable-sm"
                            stripedRows
                            emptyMessage="No results published for this student."
                          >
                            <Column field="subject" header="Subject Particulars" body={(d) => d.subject?.name || d.subjectName || 'Subject'} className="font-semibold" />
                          <Column 
                            header="Marks Obtained" 
                            body={(d) => (
                              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                                {d.marks} / {d.maxMarks}
                              </span>
                            )} 
                          />
                          <Column 
                            header="Percentage" 
                            body={(d) => (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-600 dark:text-slate-350">{Math.round((d.marks / d.maxMarks) * 100)}%</span>
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${(d.marks / d.maxMarks) * 100}%` }}></div>
                                </div>
                              </div>
                            )}
                          />
                          <Column 
                            header="Subject Grade" 
                            body={(d) => {
                              const pct = (d.marks / d.maxMarks) * 100;
                              const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : 'B';
                              return <span className="font-extrabold text-indigo-500 font-mono">{grade}</span>;
                            }} 
                            align="center"
                          />
                          <Column 
                            header="Status" 
                            body={(d) => <Tag value={d.status} severity="success" className="font-bold text-[9px] px-2 py-0.5 rounded-full" />} 
                            align="center"
                          />
                          <Column field="remarks" header="Remarks / Feedback" className="text-xs text-slate-450" />
                          </DataTable>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20 max-w-lg mx-auto">
                    <i className="pi pi-file text-4xl mb-2 text-indigo-400"></i>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-350">Academic Report Card</p>
                    <p className="text-xs text-slate-400 mt-1">Select an active exam term and a student to pull and inspect their live subject-wise marks, grades, and PASS/FAIL metrics.</p>
                  </div>
                )}
              </div>
            </TabPanel>

          </TabView>
        </div>

      </div>

      {/* Dialog: Schedule Exam */}
      <Dialog 
        header="Schedule New Exam Term" 
        visible={showAddDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowAddDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAddDialog(false)} />
            <Button 
              label="Schedule Term" 
              icon="pi pi-check" 
              onClick={handleCreateExam} 
              loading={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Exam Term Name *</label>
            <InputText 
              value={newExam.name} 
              onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} 
              placeholder="e.g. Mid-Term 2026"
              className="p-2 border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Target Class *</label>
            <Dropdown 
              value={newExam.classId} 
              options={classOptions} 
              onChange={(e) => setNewExam({ ...newExam, classId: e.value })} 
              placeholder="Select Class"
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Start Date *</label>
            <Calendar 
              value={newExam.startDate ? new Date(newExam.startDate) : null} 
              onChange={(e) => setNewExam({ ...newExam, startDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
              dateFormat="yy-mm-dd"
              showIcon
              className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">End Date *</label>
            <Calendar 
              value={newExam.endDate ? new Date(newExam.endDate) : null} 
              onChange={(e) => setNewExam({ ...newExam, endDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
              dateFormat="yy-mm-dd"
              showIcon
              className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full"
            />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Assign Seating */}
      <Dialog 
        header="Auto-Allocate Seating Chart" 
        visible={showSeatingDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowSeatingDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowSeatingDialog(false)} />
            <Button 
              label="Run Allocations" 
              icon="pi pi-check" 
              onClick={handleAutoAssign} 
              loading={autoAssignMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Select Exam Term *</label>
            <Dropdown 
              value={selectedExamId} 
              options={activeExams.map((e: any) => ({ label: e.name, value: e.id })) || []} 
              onChange={(e) => setSelectedExamId(e.value)} 
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Select Classroom Sections * (Hold Ctrl for multi)</label>
            <select 
              multiple 
              className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-2xl h-32 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              value={selectedClassIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedClassIds(options);
              }}
            >
              {classOptions.map((opt: any) => (
                <option key={opt.value} value={opt.value} className="p-1 rounded">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
