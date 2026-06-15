'use client';

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useLeavesList, useApplyLeave, useApproveLeave, useRejectLeave } from '@/hooks/queries/useLeave';

export default function LeavePage() {
  const toast = useRef<Toast>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { data: leavesData, isLoading } = useLeavesList(page, limit, statusFilter ? { status: statusFilter } : undefined);
  const applyMutation = useApplyLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState<any>({
    applicantId: '',
    applicantType: 'STUDENT',
    leaveType: 'sick',
    startDate: null,
    endDate: null,
    reason: '',
  });

  const applicantTypes = [
    { label: 'Student', value: 'STUDENT' },
    { label: 'Staff', value: 'STAFF' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate) return;
    applyMutation.mutate(
      {
        ...applyForm,
        startDate: (applyForm.startDate as Date).toISOString(),
        endDate: (applyForm.endDate as Date).toISOString(),
      },
      {
        onSuccess: () => {
          setShowApplyDialog(false);
          setApplyForm({ applicantId: '', applicantType: 'STUDENT', leaveType: 'sick', startDate: null, endDate: null, reason: '' });
          toast.current?.show({ severity: 'success', summary: 'Submitted', detail: 'Leave application submitted', life: 3000 });
        },
        onError: () => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to submit leave', life: 3000 }),
      }
    );
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast.current?.show({ severity: 'success', summary: 'Approved', detail: 'Leave approved successfully', life: 3000 }),
    });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(
      { id, reason: 'Rejected by admin' },
      { onSuccess: () => toast.current?.show({ severity: 'warn', summary: 'Rejected', detail: 'Leave rejected', life: 3000 }) }
    );
  };

  const statusTemplate = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
      PENDING: 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
      REJECTED: 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400',
    };
    return (
      <Tag 
        value={status} 
        className={`px-2.5 py-1 text-xs font-bold rounded-full ${map[status] || 'bg-slate-100 text-slate-500'}`} 
      />
    );
  };

  const dateTemplate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr;
    }
  };

  const activeLeaves = leavesData?.items || leavesData?.data?.items || [];
  const totalRecords = leavesData?.meta?.total || leavesData?.data?.meta?.total || 0;

  return (
    <DashboardLayout>
      <Toast ref={toast} />
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Leave Requests</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Process student and faculty leave applications, review reasons, and dispatch status updates.
            </p>
          </div>
          <button 
            onClick={() => setShowApplyDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <i className="pi pi-plus"></i>
            Apply Leave
          </button>
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => { setStatusFilter(e.value); setPage(1); }}
              className="border border-slate-200 dark:border-slate-800 dark:bg-slate-905 rounded-xl text-xs min-w-48"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
              }`}
              title="Visual Cards"
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
        </div>

        {/* Dynamic Display Section */}
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-400">Loading leave inbox...</span>
          </div>
        ) : activeLeaves.length === 0 ? (
          <div className="p-20 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400 font-medium">No leave applications found.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeLeaves.map((leave: any) => (
              <div 
                key={leave.id} 
                className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-sm border border-indigo-100 dark:border-indigo-900/30">
                      {leave.applicantName ? leave.applicantName[0].toUpperCase() : 'L'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-850 dark:text-white text-sm leading-snug">{leave.applicantName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{leave.applicantType}</p>
                    </div>
                  </div>
                  {statusTemplate(leave.status)}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex flex-col gap-1 text-slate-400 border border-slate-100/50 dark:border-slate-800/50">
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span className="text-slate-850 dark:text-slate-350">{dateTemplate(leave.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Until:</span>
                    <span className="text-slate-850 dark:text-slate-350">{dateTemplate(leave.endDate)}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                  <span className="font-semibold text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Reason:</span>
                  {leave.reason}
                </div>

                {leave.status === 'PENDING' && (
                  <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                    <button 
                      onClick={() => handleReject(leave.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-455 dark:hover:bg-rose-950/20 rounded-xl transition-all active:scale-95 flex items-center gap-1"
                    >
                      <i className="pi pi-times text-[10px]"></i>
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(leave.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl transition-all active:scale-95 flex items-center gap-1"
                    >
                      <i className="pi pi-check text-[10px]"></i>
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <DataTable
              value={activeLeaves}
              loading={isLoading}
              paginator
              rows={limit}
              totalRecords={totalRecords}
              lazy
              first={(page - 1) * limit}
              onPage={(e) => setPage((e.page ?? 0) + 1)}
              emptyMessage="No leave applications found."
              className="p-datatable-sm"
            >
              <Column field="applicantName" header="Applicant" sortable className="font-semibold text-slate-800 dark:text-white" />
              <Column field="applicantType" header="Type" sortable body={(d) => <Tag value={d.applicantType} className="bg-slate-105 text-slate-500 font-bold text-[9px] rounded-full px-2" />} />
              <Column body={(d) => dateTemplate(d.startDate)} header="Start Date" />
              <Column body={(d) => dateTemplate(d.endDate)} header="End Date" />
              <Column field="reason" header="Reason" />
              <Column body={(d) => statusTemplate(d.status)} header="Status" />
              <Column body={(d) => (
                d.status === 'PENDING' && (
                  <div className="flex gap-1 justify-center">
                    <Button icon="pi pi-check" rounded text severity="success" onClick={() => handleApprove(d.id)} />
                    <Button icon="pi pi-times" rounded text severity="danger" onClick={() => handleReject(d.id)} />
                  </div>
                )
              )} header="Actions" align="center" />
            </DataTable>
          </div>
        )}
      </div>

      {/* Dialog: Apply Leave */}
      <Dialog header="Apply for Leave" visible={showApplyDialog} style={{ width: '450px' }} modal onHide={() => setShowApplyDialog(false)} className="dialog-custom rounded-3xl">
        <form onSubmit={handleApply} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Applicant Type *</label>
            <Dropdown value={applyForm.applicantType} options={applicantTypes} onChange={(e) => setApplyForm({ ...applyForm, applicantType: e.value })} className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Leave Type *</label>
            <Dropdown 
              value={applyForm.leaveType} 
              options={[
                { label: 'Sick Leave', value: 'sick' },
                { label: 'Casual Leave', value: 'casual' },
                { label: 'Earned Leave', value: 'earned' },
                { label: 'Maternity Leave', value: 'maternity' },
                { label: 'Other', value: 'other' }
              ]} 
              onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.value })} 
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Student / Staff ID *</label>
            <InputText value={applyForm.applicantId} onChange={(e) => setApplyForm({ ...applyForm, applicantId: e.target.value })} required className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="UUID or Admission No" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Start Date *</label>
              <Calendar value={applyForm.startDate} onChange={(e) => setApplyForm({ ...applyForm, startDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">End Date *</label>
              <Calendar value={applyForm.endDate} onChange={(e) => setApplyForm({ ...applyForm, endDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Reason *</label>
            <InputTextarea value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} required rows={3} className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full outline-none focus:border-indigo-500" placeholder="Reason for leave..." />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowApplyDialog(false)} />
            <Button type="submit" label="Submit Request" icon="pi pi-send" loading={applyMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
