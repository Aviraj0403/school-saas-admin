'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { useLessonPlans, useCreateLessonPlan } from '@/hooks/queries/useAcademics';

export default function LessonPlansPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');
  
  const { data: plansData, isPending } = useLessonPlans();
  const createMutation = useCreateLessonPlan();
  
  const plans = plansData || [];
  
  const filteredPlans = plans.filter((p: any) => 
    p.topic?.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.topic?.subject?.name?.toLowerCase().includes(search.toLowerCase())
  );
  
  const [formData, setFormData] = useState({
    date: new Date(),
    classId: '',
    subjectId: '',
    topic: '',
    content: '',
    homework: '',
    status: 'PLANNED'
  });

  const statusTemplate = (rowData: any) => {
    return (
      <Tag 
        value={rowData.status} 
        severity={rowData.status === 'COMPLETED' ? 'success' : 'info'} 
        className="text-[10px] font-bold"
      />
    );
  };

  const handleSave = () => {
    createMutation.mutate({
      date: formData.date.toISOString().split('T')[0],
      classId: formData.classId,
      subjectId: formData.subjectId,
      topicName: formData.topic,
      teacherId: 'current-user', // Handled by backend typically
      content: formData.content,
      homework: formData.homework,
      status: formData.status
    }, {
      onSuccess: () => {
        setShowDialog(false);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Success', detail: 'Lesson plan saved successfully.', life: 3000 }
        }));
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Lesson Planning</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              Manage daily syllabus progression, teaching logs, and homework assignments.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDialog(true)}
              className="px-4 py-2 bg-primary hover:opacity-95 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <i className="pi pi-plus text-xs"></i>
              Create Lesson Plan
            </button>
          </div>
        </div>

        {/* Stats / Filter Bar */}
        <div className="flex flex-col items-start gap-4">
          <div className="relative w-full md:w-80">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, subjects..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end bg-slate-100 dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800">
             <button className="p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
               <i className="pi pi-table text-sm"></i> List View
             </button>
             <button className="p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
               <i className="pi pi-calendar text-sm"></i> Calendar
             </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <DataTable 
            value={filteredPlans} 
            className="p-datatable-sm" 
            emptyMessage="No lesson plans found."
            paginator rows={10}
            rowHover
          >
            <Column field="date" header="Date" body={(rowData) => new Date(rowData.date).toLocaleDateString()} sortable className="text-sm font-medium text-slate-800 dark:text-slate-200 w-32" />
            <Column field="topic.class.name" header="Class" sortable className="text-sm" />
            <Column field="topic.subject.name" header="Subject" sortable className="text-sm" />
            <Column field="topic.title" header="Topic / Chapter" sortable className="text-sm font-semibold text-slate-900 dark:text-white" />
            <Column field="teacher.name" header="Teacher" sortable className="text-sm" />
            <Column field="status" header="Status" body={statusTemplate} sortable className="w-32" />
            <Column 
              body={() => (
                <div className="flex gap-2 justify-end">
                  <button className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors flex items-center justify-center">
                    <i className="pi pi-pencil text-xs"></i>
                  </button>
                  <button className="w-7 h-7 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors flex items-center justify-center">
                    <i className="pi pi-trash text-xs"></i>
                  </button>
                </div>
              )} 
            />
          </DataTable>
        </div>
      </div>

      {/* Dialog for New Lesson Plan */}
      <Dialog 
        header="Create Lesson Plan" 
        visible={showDialog} 
        style={{ width: '500px' }} 
        modal 
        onHide={() => setShowDialog(false)}
        className="rounded-xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-5 font-bold text-slate-800 dark:text-white"
        contentClassName="p-6"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-slate-600 dark:text-slate-400" onClick={() => setShowDialog(false)} />
            <Button 
              label="Save Plan" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleSave} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date</label>
              <Calendar 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.value as Date})} 
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md" 
                inputClassName="p-2 text-sm outline-none w-full dark:bg-slate-950"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <Dropdown 
                value={formData.status} 
                options={[{label: 'Planned', value: 'PLANNED'}, {label: 'Completed', value: 'COMPLETED'}]} 
                onChange={(e) => setFormData({...formData, status: e.value})} 
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md text-sm" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Class</label>
              <Dropdown 
                options={[{label: 'Class 10A', value: '1'}, {label: 'Class 9B', value: '2'}]} 
                placeholder="Select Class"
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md text-sm" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Subject</label>
              <Dropdown 
                options={[{label: 'Mathematics', value: '1'}, {label: 'Science', value: '2'}]} 
                placeholder="Select Subject"
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md text-sm" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Topic / Chapter</label>
            <InputText 
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              placeholder="e.g. Trigonometric Ratios"
              className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Teaching Content (Log)</label>
            <InputTextarea 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Describe what will be taught..."
              rows={3}
              className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Homework Assigned</label>
            <InputTextarea 
              value={formData.homework}
              onChange={(e) => setFormData({...formData, homework: e.target.value})}
              placeholder="e.g. Exercise 4.1 Q1-5"
              rows={2}
              className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
