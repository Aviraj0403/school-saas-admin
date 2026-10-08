'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
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
      isCurrent: !!year.isCurrent,
    });
    setShowAyDialog(true);
  };

  const handleSaveAy = () => {
    if (!ayForm.startDate || !ayForm.endDate) return;
    const data = {
      startDate: (ayForm.startDate as Date).toISOString(),
      endDate: (ayForm.endDate as Date).toISOString(),
      isCurrent: ayForm.isCurrent,
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
            onClick={() => {
              setEditingYear(null);
              setAyForm({ startDate: null, endDate: null, isCurrent: false });
              setShowAyDialog(true);
            }}
            className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-extrabold shadow-md border-0 ring-1 ring-black/5 dark:ring-white/10 uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="pi pi-plus text-xs"></i>
            Create Academic Year
          </button>
        </div>

        {/* Directory Layout Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Onboarding Academic Terms
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage active academic years and session calendars for this school.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Academic Term</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingYears ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Loading academic terms...
                    </td>
                  </tr>
                ) : ayList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No academic years configured yet.
                    </td>
                  </tr>
                ) : (
                  ayList.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        {d.name}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {dateTemplate(d.startDate)}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {dateTemplate(d.endDate)}
                      </td>
                      <td className="p-3">
                        <Badge variant={d.isCurrent ? 'success' : 'secondary'}>
                          {d.isCurrent ? 'Active Term' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openEditAy(d)}
                          className="text-xs font-semibold text-brand hover:underline uppercase tracking-wider"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog: Add/Edit Academic Year */}
      <Dialog
        isOpen={showAyDialog}
        onClose={closeAyDialog}
        title={editingYear ? 'Edit Academic Term' : 'Add New Academic Term'}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-zinc-500">
            The term name is generated automatically from start and end dates.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
                Start Date *
              </label>
              <Input
                type="date"
                value={
                  ayForm.startDate ? new Date(ayForm.startDate).toISOString().split('T')[0] : ''
                }
                onChange={(e) =>
                  setAyForm({
                    ...ayForm,
                    startDate: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
                End Date *
              </label>
              <Input
                type="date"
                value={ayForm.endDate ? new Date(ayForm.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setAyForm({
                    ...ayForm,
                    endDate: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="isCurrentAy"
              checked={ayForm.isCurrent}
              onChange={(e) => setAyForm({ ...ayForm, isCurrent: e.target.checked })}
              className="rounded text-brand focus:ring-brand"
            />
            <label
              htmlFor="isCurrentAy"
              className="font-medium text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none"
            >
              Set as Current Active Term
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={closeAyDialog}>
              Cancel
            </Button>
            <Button isLoading={savingAy} onClick={handleSaveAy}>
              {editingYear ? 'Save Changes' : 'Create Term'}
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
