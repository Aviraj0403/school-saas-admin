'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useStudentDetails, useDeleteStudent } from '@/hooks/queries/useStudents';

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'personal' | 'guardian'>('personal');

  const { data: student, isPending, isError } = useStudentDetails(id);
  const deleteMutation = useDeleteStudent();

  const handleDelete = () => {
    if (confirm('Soft-delete this student? Their records will be archived.')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          router.push('/students');
        },
      });
    }
  };

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="p-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-4xl mx-auto mt-10">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Loading student details profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !student) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-4xl mx-auto mt-10">
          <i className="pi pi-exclamation-triangle text-4xl text-rose-500 mb-3"></i>
          <p className="text-slate-500 font-bold text-lg">Failed to Load Profile</p>
          <p className="text-slate-400 text-sm mt-1">Student details could not be found or retrieved.</p>
          <Button label="Back to Directory" className="mt-4 bg-primary text-white p-2.5 px-5 rounded-xl font-bold" onClick={() => router.push('/students')} />
        </div>
      </DashboardLayout>
    );
  }

  const fullName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto p-1 pb-10">
        
        {/* Back Link */}
        <div className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" onClick={() => router.push('/students')}>
          <i className="pi pi-arrow-left text-xs"></i>
          <span className="text-xs font-bold uppercase tracking-wider">Back to Directory</span>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-black border border-indigo-150/30">
              {student.firstName ? student.firstName[0] : student.name ? student.name[0] : '?'}
              {student.lastName ? student.lastName[0] : ''}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
                <span className="text-xs text-slate-400 font-medium">
                  Admission No: <span className="font-mono font-bold text-slate-600 dark:text-slate-350">{student.admissionNo}</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline-block"></span>
                <span className="text-xs text-slate-400 font-medium">
                  Class: <span className="font-bold text-indigo-600 dark:text-indigo-400">{student.className || 'Not Assigned'}</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline-block"></span>
                <span className="text-xs text-slate-400 font-medium">
                  Academic Year: <span className="font-bold text-slate-500">{student.academicYear}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 self-stretch md:self-auto justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
            <Tag 
              value={student.status || 'ACTIVE'} 
              severity={student.status === 'ACTIVE' || !student.status ? 'success' : 'warning'} 
              className="px-3 py-1 font-bold rounded-full text-xs shadow-sm"
            />
            <Button 
              icon="pi pi-trash" 
              className="p-button-rounded p-button-text p-button-danger hover:bg-rose-500/10 p-2"
              tooltip="Remove Student" 
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            />
          </div>
        </div>

        {/* Tab switch navigation */}
        <div className="flex border-b border-slate-150 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('personal')}
            className={`p-3 px-6 font-bold text-xs uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
              activeTab === 'personal'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Personal Profile
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`p-3 px-6 font-bold text-xs uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
              activeTab === 'guardian'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Parent & Guardian info
          </button>
        </div>

        {/* Dynamic tab contents */}
        {activeTab === 'personal' ? (
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date of Birth</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.dob ? new Date(student.dob).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 capitalize">{student.gender || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 uppercase">{student.bloodGroup || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Aadhar / National ID</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.aadharNo || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mother Tongue</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 capitalize">{student.motherTongue || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous School Attended</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.previousSchool || '—'}</p>
              </div>
              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800/80 pt-5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Permanent Residential Address</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">
                  {student.address || ''} {student.city ? `, ${student.city}` : ''} {student.pincode ? ` - ${student.pincode}` : ''}
                  {!student.address && !student.city && '—'}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent / Guardian Name</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.parentName || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary contact Phone</label>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-1">{student.parentPhone || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Guardian Email Address</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 truncate">{student.parentEmail || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Alternate Phone</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.alternatePhone || '—'}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
