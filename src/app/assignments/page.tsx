'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

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

export default function AssignmentsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: '1', title: 'Quadratic Equations Practice Set', subject: 'Mathematics', className: 'Grade 10-A', dueDate: '2026-06-05', status: 'ACTIVE', submissions: 18, totalStudents: 25 },
    { id: '2', title: 'Newton\'s Laws of Motion Lab Report', subject: 'Physics', className: 'Grade 11-B', dueDate: '2026-06-02', status: 'ACTIVE', submissions: 12, totalStudents: 22 },
    { id: '3', title: 'Cell Structure and Functions Diagram', subject: 'Biology', className: 'Grade 9-C', dueDate: '2026-05-24', status: 'GRADED', submissions: 28, totalStudents: 28 },
    { id: '4', title: 'Modern History Renaissance Essay', subject: 'Social Studies', className: 'Grade 10-B', dueDate: '2026-06-10', status: 'DRAFT', submissions: 0, totalStudents: 24 },
  ]);

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
    const newAssignment: Assignment = {
      id: String(assignments.length + 1),
      title: formData.title,
      subject: formData.subject,
      className: formData.className,
      dueDate: formData.dueDate,
      status: 'ACTIVE',
      submissions: 0,
      totalStudents: 25,
    };
    setAssignments([newAssignment, ...assignments]);
    setShowDialog(false);
    setFormData({ title: '', subject: '', className: '', dueDate: '' });

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        severity: 'success',
        summary: 'Assignment Posted',
        detail: `Successfully created and published "${newAssignment.title}" for ${newAssignment.className}.`,
        life: 4000
      }
    }));
  };

  const filteredAssignments = filterStatus 
    ? assignments.filter(a => a.status === filterStatus)
    : assignments;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-10 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 dark:border-slate-900 pb-5">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Assignments & Homework
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Publish student curriculum tasks, track live online uploads, and manage evaluations seamlessly.
            </p>
          </div>
          <Button
            label="Create New Assignment"
            icon="pi pi-plus"
            className="bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold p-3 px-5 border-0 rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all"
            onClick={() => setShowDialog(true)}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Active Tasks</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {assignments.filter(a => a.status === 'ACTIVE').length}
                </h3>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <i className="pi pi-list text-lg"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Submissions</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {assignments.reduce((sum, a) => sum + a.submissions, 0)}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <i className="pi pi-cloud-upload text-lg"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Pending Evaluation</p>
                <h3 className="text-2xl font-black text-amber-500 mt-1">
                  {assignments.filter(a => a.status === 'ACTIVE' && a.submissions > 0).length}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <i className="pi pi-pencil text-lg"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Submission Rate</p>
                <h3 className="text-2xl font-black text-purple-500 mt-1">82.5%</h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                <i className="pi pi-percentage text-lg"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex gap-2 bg-slate-100/50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800 w-max">
          <button
            onClick={() => setFilterStatus(null)}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all ${!filterStatus ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all ${filterStatus === 'ACTIVE' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('GRADED')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all ${filterStatus === 'GRADED' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            Graded
          </button>
          <button
            onClick={() => setFilterStatus('DRAFT')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all ${filterStatus === 'DRAFT' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            Drafts
          </button>
        </div>

        {/* Assignments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => {
            const submissionPercent = Math.round((assignment.submissions / assignment.totalStudents) * 100);
            return (
              <div 
                key={assignment.id}
                className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 hover:border-indigo-500/80 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-900">
                      {assignment.subject}
                    </span>
                    <Tag 
                      value={assignment.status} 
                      severity={
                        assignment.status === 'ACTIVE' ? 'success' :
                        assignment.status === 'GRADED' ? 'info' : 'warning'
                      }
                      className="text-[9px] font-bold"
                    />
                  </div>
                  <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mt-2 hover:text-indigo-500 transition-colors cursor-pointer">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-3 font-semibold">
                    <span className="flex items-center gap-1"><i className="pi pi-users text-[10px]"></i> {assignment.className}</span>
                    <span className="flex items-center gap-1"><i className="pi pi-calendar text-[10px]"></i> Due: {assignment.dueDate}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Submissions Logged</span>
                    <span className="font-bold text-slate-800 dark:text-white">{assignment.submissions} / {assignment.totalStudents} ({submissionPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        assignment.status === 'GRADED' ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${submissionPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Post Modal Dialog */}
        <Dialog
          header="Post New Assignment"
          visible={showDialog}
          style={{ width: '480px' }}
          modal
          onHide={() => setShowDialog(false)}
          className="rounded-2xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          contentClassName="p-5"
          headerClassName="border-b border-slate-100 dark:border-slate-800 p-5 font-bold text-slate-800 dark:text-white"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Assignment Title *</label>
              <InputText
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g. Periodic Table Worksheet"
                className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Subject Category *</label>
              <Dropdown
                value={formData.subject}
                options={subjects}
                onChange={(e) => setFormData({ ...formData, subject: e.value })}
                placeholder="Select Subject"
                className="border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Target Class *</label>
              <Dropdown
                value={formData.className}
                options={classes}
                onChange={(e) => setFormData({ ...formData, className: e.value })}
                placeholder="Select Class Roster"
                className="border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Due Date *</label>
              <InputText
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-3">
              <Button type="button" label="Discard" className="p-button-text p-2.5 px-4 rounded-xl text-xs font-bold" onClick={() => setShowDialog(false)} />
              <Button type="submit" label="Post Task" icon="pi pi-check" className="bg-indigo-500 text-white p-2.5 px-5 rounded-xl text-xs font-bold border-0 shadow-md shadow-indigo-500/10 hover:opacity-95" />
            </div>
          </form>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
