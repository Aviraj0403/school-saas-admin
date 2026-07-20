'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear
} from '@/hooks/queries/useAcademics';


export default function TermsPage() {
  const [showAyDialog, setShowAyDialog] = useState(false);
  const [editingYear, setEditingYear] = useState<any | null>(null);
  const [ayForm, setAyForm] = useState<any>({ startDate: null, endDate: null, isCurrent: false });

  // Queries
  const { data: academicYears, isPending: loadingYears } = useAcademicYears();

  // Mutations
  const createAyMutation = useCreateAcademicYear();
  const updateAyMutation = useUpdateAcademicYear();
  const savingAy = createAyMutation.isPending || updateAyMutation.isPending;

  const ayList = academicYears || [];

  const closeAyDialog = () => {
    setShowAyDialog(false);
    setEditingYear(null);
    setAyForm({ startDate: null, endDate: null, isCurrent: false });
  };

  const openEditAy = (year: any) => {
    setEditingYear(year);
    setAyForm({
      startDate: year.startDate ? new Date(year.startDate) : null,
      endDate: year.endDate ? new Date(year.endDate) : null,
      isCurrent: !!year.isCurrent
    });
    setShowAyDialog(true);
  };

  const handleSaveAy = () => {
    if (!ayForm.startDate || !ayForm.endDate) return;
    const data = {
      startDate: (ayForm.startDate as Date).toISOString(),
      endDate: (ayForm.endDate as Date).toISOString(),
      isCurrent: ayForm.isCurrent
    };
    if (editingYear) {
      updateAyMutation.mutate({ id: editingYear.id, data }, { onSuccess: closeAyDialog });
    } else {
      createAyMutation.mutate(data, { onSuccess: closeAyDialog });
    }
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
      <PageBreadcrumb title="Terms" subtitle="Academics" />
<div className="flex flex-col gap-4 pb-10 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Academic Years & Terms</h1>
            <p className="text-slate-400 mt-1.5 text-sm md:text-base">
              Define the active school calendars, academic year timelines, and active term sessions.
            </p>
          </div> */}

          <button
            onClick={() => { setEditingYear(null); setAyForm({ startDate: null, endDate: null, isCurrent: false }); setShowAyDialog(true); }}
            className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-extrabold shadow-md border-0 ring-1 ring-black/5 dark:ring-white/10 uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="pi pi-plus text-xs"></i>
            Create Academic Year
          </button>
        </div>

        {/* Directory Layout Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Onboarding Academic Terms</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Manage active academic years and session calendars for this school.</p>
          </div>
          
          <DataTable
            value={ayList}
            loading={loadingYears}
            emptyMessage="No academic years configured yet."
            className="p-datatable-sm"
          >
            <Column field="name" header="Academic Term" sortable className="font-semibold text-zinc-900 dark:text-zinc-100" />
            <Column header="Start Date" body={(d) => dateTemplate(d.startDate)} className="text-zinc-700 dark:text-zinc-300" />
            <Column header="End Date" body={(d) => dateTemplate(d.endDate)} className="text-zinc-700 dark:text-zinc-300" />
            <Column header="Status" body={(d) => d.isCurrent ? <Tag value="Active Term" severity="success" className="bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border border-emerald-200/50" /> : <Tag value="Archived" severity="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border border-zinc-200 dark:border-zinc-700" />} />
            <Column
              header="Actions"
              body={(d) => (
                <button
                  onClick={() => openEditAy(d)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                >
                  Edit
                </button>
              )}
            />
          </DataTable>
        </div>

      </div>

      {/* Dialog: Add/Edit Academic Year */}
      <Dialog
        header={editingYear ? "Edit Academic Term" : "Add New Academic Term"}
        visible={showAyDialog}
        style={{ width: '400px' }}
        modal
        onHide={closeAyDialog}
        className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        contentClassName="p-6"
        headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-900 dark:text-white"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-zinc-500" onClick={closeAyDialog} />
            <Button
              label={editingYear ? "Save Changes" : "Create Term"}
              icon="pi pi-check"
              loading={savingAy}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm"
              onClick={handleSaveAy}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <p className="text-xs text-zinc-500 -mt-1">The term name (e.g. 2026-2027) is generated automatically from the start and end dates.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Start Date *</label>
              <Calendar value={ayForm.startDate} onChange={(e) => setAyForm({ ...ayForm, startDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md w-full" inputClassName="p-2 rounded-md outline-none w-full text-sm dark:bg-zinc-950" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">End Date *</label>
              <Calendar value={ayForm.endDate} onChange={(e) => setAyForm({ ...ayForm, endDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md w-full" inputClassName="p-2 rounded-md outline-none w-full text-sm dark:bg-zinc-950" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Checkbox id="isCurrentAy" checked={ayForm.isCurrent} onChange={(e) => setAyForm({ ...ayForm, isCurrent: e.checked || false })} />
            <label htmlFor="isCurrentAy" className="font-medium text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">Set as Current Active Term</label>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
