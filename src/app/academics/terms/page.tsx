'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { 
  useAcademicYears,
  useCreateAcademicYear
} from '@/hooks/queries/useAcademics';

export default function TermsPage() {
  const [showAyDialog, setShowAyDialog] = useState(false);
  const [ayForm, setAyForm] = useState<any>({ name: '', startDate: null, endDate: null, isCurrent: false });

  // Queries
  const { data: academicYears, isPending: loadingYears } = useAcademicYears();
  
  // Mutations
  const createAyMutation = useCreateAcademicYear();

  const ayList = academicYears || [];

  const handleCreateAy = () => {
    if (!ayForm.name || !ayForm.startDate || !ayForm.endDate) return;
    createAyMutation.mutate(
      {
        name: ayForm.name,
        startDate: (ayForm.startDate as Date).toISOString(),
        endDate: (ayForm.endDate as Date).toISOString(),
        isCurrent: ayForm.isCurrent
      },
      {
        onSuccess: () => {
          setShowAyDialog(false);
          setAyForm({ name: '', startDate: null, endDate: null, isCurrent: false });
        }
      }
    );
  };

  const dateTemplate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Academic Years & Terms</h1>
            <p className="text-slate-500 mt-1.5 text-sm">
              Define the active school calendars, academic year timelines, and active term sessions.
            </p>
          </div>
          <button 
            onClick={() => setShowAyDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs"
          >
            <i className="pi pi-plus"></i>
            Create Academic Year
          </button>
        </div>

        {/* Directory Layout Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Onboarding Academic Terms</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage active academic years and session calendars for this school.</p>
          </div>
          
          <DataTable
            value={ayList}
            loading={loadingYears}
            emptyMessage="No academic years configured yet."
            className="p-datatable-sm"
          >
            <Column field="name" header="Academic Term" sortable className="font-bold text-slate-800 dark:text-slate-100" />
            <Column header="Start Date" body={(d) => dateTemplate(d.startDate)} />
            <Column header="End Date" body={(d) => dateTemplate(d.endDate)} />
            <Column header="Status" body={(d) => d.isCurrent ? <Tag value="Active Term" severity="success" className="bg-emerald-500/10 text-emerald-650 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase" /> : <Tag value="Archived" severity="secondary" className="bg-slate-100 text-slate-500 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase" />} />
          </DataTable>
        </div>

      </div>

      {/* Dialog: Add Academic Year */}
      <Dialog 
        header="Add New Academic Term" 
        visible={showAyDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowAyDialog(false)}
        className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        contentClassName="p-6"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-bold"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button label="Cancel" className="p-button-text p-2 font-bold text-xs" onClick={() => setShowAyDialog(false)} />
            <Button 
              label="Create Term" 
              icon="pi pi-check" 
              loading={createAyMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-0 font-bold text-xs" 
              onClick={handleCreateAy} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Term Name *</label>
            <InputText value={ayForm.name} onChange={(e) => setAyForm({ ...ayForm, name: e.target.value })} className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 2026-2027, 2027" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Start Date *</label>
              <Calendar value={ayForm.startDate} onChange={(e) => setAyForm({ ...ayForm, startDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl w-full" inputClassName="p-2 rounded-xl outline-none w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">End Date *</label>
              <Calendar value={ayForm.endDate} onChange={(e) => setAyForm({ ...ayForm, endDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl w-full" inputClassName="p-2 rounded-xl outline-none w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Checkbox id="isCurrentAy" checked={ayForm.isCurrent} onChange={(e) => setAyForm({ ...ayForm, isCurrent: e.checked || false })} />
            <label htmlFor="isCurrentAy" className="font-semibold text-xs text-slate-650 dark:text-slate-350 cursor-pointer select-none">Set as Current Active Term</label>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
