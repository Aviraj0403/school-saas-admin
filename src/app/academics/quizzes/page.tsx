'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

const MOCK_QUIZZES = [
  { id: '1', title: 'Mid-Term Algebra Review', class: '10A', subject: 'Mathematics', questions: 15, duration: 30, status: 'PUBLISHED' },
  { id: '2', title: 'Basic Physics Quiz', class: '9B', subject: 'Science', questions: 10, duration: 15, status: 'DRAFT' }
];

export default function QuizzesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [quizzes, setQuizzes] = useState(MOCK_QUIZZES);
  
  const [formData, setFormData] = useState({
    title: '',
    duration: 30,
    status: 'DRAFT'
  });

  const statusTemplate = (rowData: any) => {
    return (
      <Tag 
        value={rowData.status} 
        severity={rowData.status === 'PUBLISHED' ? 'success' : 'warning'} 
        className="text-[10px] font-bold"
      />
    );
  };

  const handleSave = () => {
    const newQuiz = {
      id: Math.random().toString(),
      title: formData.title,
      class: 'Selected Class',
      subject: 'Selected Subject',
      questions: 0,
      duration: formData.duration,
      status: formData.status
    };
    setQuizzes([newQuiz, ...quizzes]);
    setShowDialog(false);
    
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'success', summary: 'Success', detail: 'Quiz created successfully.', life: 3000 }
    }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">LMS Quizzes & Assessments</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Create interactive online quizzes and track student performance.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDialog(true)}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <i className="pi pi-plus text-xs"></i>
              Create Quiz
            </button>
          </div>
        </div>

        {/* Stats / Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search quizzes..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end bg-slate-100 dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800">
             <button className="p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
               <i className="pi pi-list text-sm"></i> List
             </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <DataTable 
            value={quizzes} 
            className="p-datatable-sm" 
            emptyMessage="No quizzes found."
            paginator rows={10}
            rowHover
          >
            <Column field="title" header="Quiz Title" sortable className="text-sm font-semibold text-slate-900 dark:text-white" />
            <Column field="class" header="Class" sortable className="text-sm" />
            <Column field="subject" header="Subject" sortable className="text-sm" />
            <Column field="questions" header="Questions" sortable className="text-sm" />
            <Column field="duration" header="Duration (mins)" sortable className="text-sm" />
            <Column field="status" header="Status" body={statusTemplate} sortable className="w-32" />
            <Column 
              body={() => (
                <div className="flex gap-2 justify-end">
                  <button className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors flex items-center justify-center">
                    <i className="pi pi-pencil text-xs"></i>
                  </button>
                  <button className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors flex items-center justify-center" title="Manage Questions">
                    <i className="pi pi-list text-xs"></i>
                  </button>
                </div>
              )} 
            />
          </DataTable>
        </div>
      </div>

      <Dialog 
        header="Create New Quiz" 
        visible={showDialog} 
        style={{ width: '450px' }} 
        modal 
        onHide={() => setShowDialog(false)}
        className="rounded-xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-5 font-bold text-slate-800 dark:text-white"
        contentClassName="p-6"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-slate-600 dark:text-slate-400" onClick={() => setShowDialog(false)} />
            <Button 
              label="Save Quiz" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleSave} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Quiz Title</label>
            <InputText 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Algebra Chapter 1 Test"
              className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
              <InputNumber 
                value={formData.duration} 
                onValueChange={(e) => setFormData({...formData, duration: e.value || 30})} 
                min={1} max={180}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md" 
                inputClassName="p-2 text-sm outline-none w-full dark:bg-slate-950" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <Dropdown 
                value={formData.status} 
                options={[{label: 'Draft', value: 'DRAFT'}, {label: 'Published', value: 'PUBLISHED'}]} 
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
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
