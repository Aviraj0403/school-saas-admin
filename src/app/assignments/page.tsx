'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAssignments, useStudentAssignments, useCreateAssignment, useSubmitAssignment, useGradeSubmission } from '@/hooks/queries/useHomework';
import { useAuthStore } from '@/store/useAuthStore';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';


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
  const studentIdForDemo = user?.id || 'demo-student-1'; // Ideally fetched from context

  const { data: assignmentsData, isPending: loadingAssignments } = useAssignments();
  const { data: studentHomeworkData, isPending: loadingStudentHw } = useStudentAssignments(studentIdForDemo);

  const createAssignmentMutation = useCreateAssignment();
  const submitAssignmentMutation = useSubmitAssignment();
  const gradeSubmissionMutation = useGradeSubmission();

  const assignments: Assignment[] = assignmentsData || [];
  const submissionsList: Submission[] = []; // Submissions are nested inside the assignments from backend, we will map them when selecting one
  const studentHomework: any[] = studentHomeworkData || [];

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    className: '',
    dueDate: '',
  });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Social Studies'];
  const classes = ['Grade 9-A', 'Grade 9-B', 'Grade 9-C', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate({
      title: formData.title,
      subjectId: formData.subject, // Map to DB ID in real app
      classId: formData.className,
      dueDate: new Date(formData.dueDate).toISOString(),
    }, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setFormData({ title: '', subject: '', className: '', dueDate: '' });
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Assignment Posted', detail: 'Successfully created and published.', life: 4000 }
        }));
      }
    });
  };

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    gradeSubmissionMutation.mutate({
      submissionId: selectedSubmission.id,
      payload: { marksAwarded: gradeValue, feedback: 'Graded via UI' }
    }, {
      onSuccess: () => {
        setShowGradeDialog(false);
        setGradeValue('');
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Homework Graded', detail: `Graded homework for ${selectedSubmission.studentName}.`, life: 3000 }
        }));
      }
    });
  };

  const handleStudentUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    
    submitAssignmentMutation.mutate({
      assignmentId: selectedAssignment.id,
      payload: { studentId: studentIdForDemo, notes: submittedFileName }
    }, {
      onSuccess: () => {
        setShowSubmitDialog(false);
        setSubmittedFileName('');
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Homework Submitted', detail: 'Your assignment solution was uploaded successfully.', life: 3000 }
        }));
      }
    });
  };

  const filteredAssignments = filterStatus 
    ? assignments.filter(a => a.status === filterStatus)
    : assignments;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Assignments" />
<div className="flex flex-col gap-4 pb-10 font-sans">
        
        {/* Header with Role Mode Toggle Switch */}
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-5">
          
          
          <div className="flex items-center gap-3">
            {/* Toggle Role */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md border border-zinc-200/50 dark:border-zinc-800">
              <button 
                onClick={() => setRoleMode('TEACHER')}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${roleMode === 'TEACHER' ? 'bg-blue-650 text-white shadow-md' : 'text-zinc-500'}`}
              >
                Teacher Mode
              </button>
              <button 
                onClick={() => setRoleMode('STUDENT')}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${roleMode === 'STUDENT' ? 'bg-blue-650 text-white shadow-md' : 'text-zinc-500'}`}
              >
                Student Mode
              </button>
            </div>
            
            {roleMode === 'TEACHER' && (
              <Button
                label="Post Assignment"
                icon="pi pi-plus"
                className="bg-blue-600 hover:bg-blue-700 border-none text-white font-bold p-2.5 px-4 border-0 rounded-md shadow-md transition-all text-xs"
                onClick={() => setShowCreateDialog(true)}
              />
            )}
          </div>
        </div>

        {/* Stats Summary Rows depending on Selected Mode */}
        {roleMode === 'TEACHER' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Active Tasks</span>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">
                {assignments.filter(a => a.status === 'ACTIVE').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Total Submissions</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {assignments.reduce((sum, a) => sum + a.submissions, 0)}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Pending Evaluation</span>
              <h3 className="text-2xl font-black text-amber-500 mt-1">
                {submissionsList.filter(s => s.status === 'SUBMITTED').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Submission Rate</span>
              <h3 className="text-2xl font-black text-blue-500 mt-1">82.5%</h3>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Pending Solutions</span>
              <h3 className="text-2xl font-black text-rose-650 mt-1">
                {studentHomework.filter(h => h.status === 'PENDING_SUBMISSION').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Submitted Homework</span>
              <h3 className="text-2xl font-black text-blue-600 mt-1">
                {studentHomework.filter(h => h.status === 'SUBMITTED').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">Graded Tasks</span>
              <h3 className="text-2xl font-black text-emerald-650 mt-1">
                {studentHomework.filter(h => h.status === 'GRADED').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-md shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-zinc-450 tracking-wider">GPA Average Grade</span>
              <h3 className="text-2xl font-black text-blue-650 mt-1">A-</h3>
            </div>
          </div>
        )}

        {/* TEACHER MODE DISPLAY */}
        {roleMode === 'TEACHER' && (
          <div className="flex flex-col gap-4">
            {/* Filter Toolbar */}
            <div className="flex gap-2 bg-zinc-100/50 dark:bg-zinc-900/60 p-1.5 rounded-md border border-zinc-200/40 dark:border-zinc-800 w-max">
              <button onClick={() => setFilterStatus(null)} className={`p-1.5 px-3 rounded-md text-xs font-bold transition-all ${!filterStatus ? 'bg-white dark:bg-zinc-950 text-blue-500 shadow-sm' : 'text-zinc-500'}`}>All</button>
              <button onClick={() => setFilterStatus('ACTIVE')} className={`p-1.5 px-3 rounded-md text-xs font-bold transition-all ${filterStatus === 'ACTIVE' ? 'bg-white dark:bg-zinc-950 text-blue-500 shadow-sm' : 'text-zinc-500'}`}>Active</button>
              <button onClick={() => setFilterStatus('GRADED')} className={`p-1.5 px-3 rounded-md text-xs font-bold transition-all ${filterStatus === 'GRADED' ? 'bg-white dark:bg-zinc-950 text-blue-500 shadow-sm' : 'text-zinc-500'}`}>Graded</button>
              <button onClick={() => setFilterStatus('DRAFT')} className={`p-1.5 px-3 rounded-md text-xs font-bold transition-all ${filterStatus === 'DRAFT' ? 'bg-white dark:bg-zinc-950 text-blue-500 shadow-sm' : 'text-zinc-500'}`}>Drafts</button>
            </div>

            {/* Assignments list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((assignment) => {
                const submissionPercent = Math.round((assignment.submissions / assignment.totalStudents) * 100);
                return (
                  <div key={assignment.id} className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-850 p-5 rounded-md flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-100 dark:border-zinc-900">{assignment.subject}</span>
                        <Tag value={assignment.status} severity={assignment.status === 'ACTIVE' ? 'success' : assignment.status === 'GRADED' ? 'info' : 'warning'} className="text-[9px] font-bold" />
                      </div>
                      <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-100 mt-2">{assignment.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-3 font-semibold">
                        <span className="flex items-center gap-1"><i className="pi pi-users text-[10px]"></i> {assignment.className}</span>
                        <span className="flex items-center gap-1"><i className="pi pi-calendar text-[10px]"></i> Due: {assignment.dueDate}</span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 mt-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-500">Submissions Logged</span>
                        <span className="font-bold text-zinc-850 dark:text-white">{assignment.submissions} / {assignment.totalStudents} ({submissionPercent}%)</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${assignment.status === 'GRADED' ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width: `${submissionPercent}%` }} />
                      </div>
                      <div className="flex justify-end mt-1">
                        <button 
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowSubmissionsDialog(true);
                          }}
                          className="text-xs font-bold text-blue-650 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                        >
                          <i className="pi pi-search-plus"></i> View Submissions & Grade
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
            <h2 className="text-lg font-bold text-zinc-850 dark:text-white mt-1">Your Assigned Tasks</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentHomework.map((hw) => {
                const globalAssignment = assignments.find(a => a.title === hw.title);
                return (
                  <div key={hw.id} className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-850 p-5 rounded-md flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-100 dark:border-zinc-900">{hw.subject}</span>
                        <Tag 
                          value={hw.status === 'PENDING_SUBMISSION' ? 'PENDING' : hw.status} 
                          severity={hw.status === 'GRADED' ? 'success' : hw.status === 'SUBMITTED' ? 'info' : 'danger'} 
                          className="text-[9px] font-bold" 
                        />
                      </div>
                      <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-100 mt-2">{hw.title}</h3>
                      <p className="text-xs text-zinc-400 mt-2 font-semibold">Due: {hw.dueDate}</p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 mt-1 flex flex-col gap-1.5 text-xs">
                      {hw.status === 'PENDING_SUBMISSION' ? (
                        <div className="flex justify-between items-center">
                          <span className="text-rose-650 font-bold">Not submitted yet</span>
                          <button 
                            onClick={() => {
                              setSelectedAssignment(globalAssignment || null);
                              setShowSubmitDialog(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-750 text-white font-bold p-1.5 px-3 rounded-md text-[11px] border-0"
                          >
                            Submit Homework
                          </button>
                        </div>
                      ) : hw.status === 'SUBMITTED' ? (
                        <div className="flex flex-col gap-1 text-[11px] text-zinc-450">
                          <div className="flex justify-between">
                            <span>Uploaded Solution:</span>
                            <span className="font-mono font-bold text-zinc-800 dark:text-white">{hw.fileName}</span>
                          </div>
                          <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">Awaiting evaluation by teacher...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-450 font-bold">Uploaded File:</span>
                            <span className="font-mono text-zinc-800 dark:text-white">{hw.fileName}</span>
                          </div>
                          <div className="bg-emerald-500/10 text-emerald-650 p-2 rounded-md flex justify-between items-center font-bold">
                            <span>Grade Awarded:</span>
                            <span className="text-base font-black">{hw.grade}</span>
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
          header="Post New Assignment"
          visible={showCreateDialog}
          style={{ width: '450px' }}
          modal
          onHide={() => setShowCreateDialog(false)}
          className="dialog-custom rounded-md"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 uppercase">Assignment Title *</label>
              <InputText value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g. Periodic Table Worksheet" className="p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-md" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 uppercase">Subject Category *</label>
              <Dropdown value={formData.subject} options={subjects} onChange={(e) => setFormData({ ...formData, subject: e.value })} placeholder="Select Subject" className="" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 uppercase">Target Class *</label>
              <Dropdown value={formData.className} options={classes} onChange={(e) => setFormData({ ...formData, className: e.value })} placeholder="Select Class" className="" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 uppercase">Due Date *</label>
              <InputText type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required className="p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-md" />
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-2">
              <Button type="button" label="Discard" className="p-button-text p-2 text-xs" onClick={() => setShowCreateDialog(false)} />
              <Button type="submit" label="Publish Assignment" className="bg-blue-600 hover:bg-blue-750 text-white p-2 px-4 text-xs font-bold rounded-md" />
            </div>
          </form>
        </Dialog>

        {/* Dialog: View Submissions & Grade (Teacher Only) */}
        <Dialog
          header={`Submissions Log — ${selectedAssignment?.title}`}
          visible={showSubmissionsDialog}
          style={{ width: '700px' }}
          modal
          onHide={() => setShowSubmissionsDialog(false)}
          className="dialog-custom rounded-md"
        >
          <div className="mt-2">
            <DataTable value={submissionsList} className="p-datatable-sm" emptyMessage="No student submissions logged.">
              <Column field="studentName" header="Student Name" className="font-bold" />
              <Column field="submittedAt" header="Submitted Date" />
              <Column field="fileName" header="Uploaded Document" className="font-mono text-xs text-zinc-400" />
              <Column 
                field="status" 
                header="Status" 
                body={(d) => (
                  <Tag 
                    value={d.status} 
                    severity={d.status === 'GRADED' ? 'success' : d.status === 'SUBMITTED' ? 'info' : 'warning'} 
                    className="font-bold text-[9px]" 
                  />
                )} 
              />
              <Column field="grade" header="Grade" body={(d) => d.grade || '—'} className="font-bold text-center" />
              <Column 
                header="Evaluation" 
                align="center"
                body={(d) => (
                  d.status === 'SUBMITTED' && (
                    <Button 
                      label="Grade" 
                      icon="pi pi-pencil" 
                      size="small" 
                      className="bg-blue-600 text-white p-1 px-2.5 text-xs rounded-md"
                      onClick={() => {
                        setSelectedSubmission(d);
                        setShowGradeDialog(true);
                      }}
                    />
                  )
                )}
              />
            </DataTable>
          </div>
        </Dialog>

        {/* Dialog: Grade Submission (Teacher Only) */}
        <Dialog
          header={`Evaluate Homework — ${selectedSubmission?.studentName}`}
          visible={showGradeDialog}
          style={{ width: '380px' }}
          modal
          onHide={() => setShowGradeDialog(false)}
          className="dialog-custom rounded-md shadow-xl"
        >
          <form onSubmit={handleGradeSubmission} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500">Document Submitted</label>
              <span className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border p-2 rounded-md text-zinc-450">{selectedSubmission?.fileName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500">Grade / Score (e.g. A+, 95/100) *</label>
              <InputText value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} required placeholder="e.g. 95/100 or A+" className="p-2 border rounded-md dark:bg-zinc-950" />
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-2">
              <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowGradeDialog(false)} />
              <Button type="submit" label="Save Evaluation" className="bg-blue-600 text-white p-2 px-4 rounded-md text-xs font-bold" />
            </div>
          </form>
        </Dialog>

        {/* Dialog: Submit Homework (Student Only) */}
        <Dialog
          header={`Upload Assignment Solution — ${selectedAssignment?.title}`}
          visible={showSubmitDialog}
          style={{ width: '400px' }}
          modal
          onHide={() => setShowSubmitDialog(false)}
          className="dialog-custom rounded-md shadow-xl"
        >
          <form onSubmit={handleStudentUpload} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500">Document Filename to Submit *</label>
              <InputText 
                value={submittedFileName} 
                onChange={(e) => setSubmittedFileName(e.target.value)} 
                required 
                placeholder="e.g. maths_hw_solution_aditya.pdf" 
                className="p-2.5 border rounded-md dark:bg-zinc-950 text-sm" 
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-2">
              <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowSubmitDialog(false)} />
              <Button type="submit" label="Upload & Submit" className="bg-emerald-600 text-white p-2 px-4 rounded-md text-xs font-bold" />
            </div>
          </form>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
