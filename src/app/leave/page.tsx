'use client';

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { useLeavesList, useApplyLeave, useApproveLeave, useRejectLeave } from '@/hooks/queries/useLeave';

export default function LeavePage() {
  const toast = useRef<Toast>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: leavesData, isLoading } = useLeavesList(page, limit, statusFilter ? { status: statusFilter } : undefined);
  const applyMutation = useApplyLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState<any>({
    applicantId: '',
    applicantType: 'STUDENT',
    startDate: null,
    endDate: null,
    reason: '',
  });

  const applicantTypes = [
    { label: 'Student', value: 'STUDENT' },
    { label: 'Staff', value: 'STAFF' },
  ];

  const statusOptions = [
    { label: 'All', value: '' },
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
          setApplyForm({ applicantId: '', applicantType: 'STUDENT', startDate: null, endDate: null, reason: '' });
          toast.current?.show({ severity: 'success', summary: 'Submitted', detail: 'Leave application submitted', life: 3000 });
        },
        onError: () => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to submit leave', life: 3000 }),
      }
    );
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast.current?.show({ severity: 'success', summary: 'Approved', detail: 'Leave approved', life: 3000 }),
    });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(
      { id, reason: 'Rejected by admin' },
      { onSuccess: () => toast.current?.show({ severity: 'warn', summary: 'Rejected', detail: 'Leave rejected', life: 3000 }) }
    );
  };

  const statusTemplate = (rowData: any) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      APPROVED: 'success',
      PENDING: 'warning',
      REJECTED: 'danger',
      CANCELLED: 'info',
    };
    return <Tag value={rowData.status} severity={map[rowData.status] || 'info'} />;
  };

  const actionsTemplate = (rowData: any) => {
    if (rowData.status !== 'PENDING') return null;
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-check"
          rounded
          text
          severity="success"
          onClick={() => handleApprove(rowData.id)}
          tooltip="Approve"
          loading={approveMutation.isPending}
        />
        <Button
          icon="pi pi-times"
          rounded
          text
          severity="danger"
          onClick={() => handleReject(rowData.id)}
          tooltip="Reject"
          loading={rejectMutation.isPending}
        />
      </div>
    );
  };

  const dateTemplate = (rowData: any, field: string) => {
    try {
      return new Date(rowData[field]).toLocaleDateString('en-IN');
    } catch {
      return rowData[field];
    }
  };

  return (
    <DashboardLayout>
      <Toast ref={toast} />
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
            <p className="text-gray-500 mt-1">Review and approve student & staff leave applications.</p>
          </div>
          <Button label="Apply Leave" icon="pi pi-plus" className="bg-primary text-white p-2 px-4" onClick={() => setShowApplyDialog(true)} />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by status:</span>
          <Dropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(e) => { setStatusFilter(e.value); setPage(1); }}
            className="border border-gray-200 rounded-md text-sm"
          />
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <DataTable
            value={leavesData?.data?.items || []}
            loading={isLoading}
            paginator
            rows={limit}
            totalRecords={leavesData?.data?.meta?.total || 0}
            lazy
            first={(page - 1) * limit}
            onPage={(e) => setPage((e.page ?? 0) + 1)}
            emptyMessage="No leave applications found."
            stripedRows
            className="p-datatable-sm"
          >
            <Column field="applicantName" header="Applicant" sortable />
            <Column field="applicantType" header="Type" sortable />
            <Column body={(data) => dateTemplate(data, 'startDate')} header="Start Date" />
            <Column body={(data) => dateTemplate(data, 'endDate')} header="End Date" />
            <Column field="reason" header="Reason" />
            <Column body={statusTemplate} header="Status" />
            <Column body={actionsTemplate} header="Actions" align="center" />
          </DataTable>
        </Card>
      </div>

      {/* Dialog: Apply Leave */}
      <Dialog header="Apply for Leave" visible={showApplyDialog} style={{ width: '450px' }} modal onHide={() => setShowApplyDialog(false)}>
        <form onSubmit={handleApply} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Applicant Type</label>
            <Dropdown value={applyForm.applicantType} options={applicantTypes} onChange={(e) => setApplyForm({ ...applyForm, applicantType: e.value })} className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Student / Staff ID</label>
            <InputText value={applyForm.applicantId} onChange={(e) => setApplyForm({ ...applyForm, applicantId: e.target.value })} required className="p-2 border border-gray-200 rounded-md" placeholder="UUID or Admission No" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
              <Calendar value={applyForm.startDate} onChange={(e) => setApplyForm({ ...applyForm, startDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 rounded-md" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">End Date</label>
              <Calendar value={applyForm.endDate} onChange={(e) => setApplyForm({ ...applyForm, endDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Reason</label>
            <InputTextarea value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} required rows={3} className="p-2 border border-gray-200 rounded-md" placeholder="Reason for leave..." />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowApplyDialog(false)} />
            <Button type="submit" label="Submit Application" icon="pi pi-send" loading={applyMutation.isPending} className="bg-primary text-white p-2 px-4" />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
