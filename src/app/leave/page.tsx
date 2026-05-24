'use client';

import React, { useState, useRef } from 'react';
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
  const [limit, setLimit] = useState(10);
  
  const { data: leavesData, isLoading } = useLeavesList(page, limit);
  const applyMutation = useApplyLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState<any>({
    applicantId: '',
    applicantType: 'STUDENT',
    startDate: null,
    endDate: null,
    reason: ''
  });

  const applicantTypes = [
    { label: 'Student', value: 'STUDENT' },
    { label: 'Staff', value: 'STAFF' }
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate) return;

    applyMutation.mutate({
      ...applyForm,
      startDate: applyForm.startDate.toISOString(),
      endDate: applyForm.endDate.toISOString()
    }, {
      onSuccess: () => {
        setShowApplyDialog(false);
        setApplyForm({ applicantId: '', applicantType: 'STUDENT', startDate: null, endDate: null, reason: '' });
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Leave applied successfully', life: 3000 });
      },
      onError: () => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to apply for leave', life: 3000 });
      }
    });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => {
        toast.current?.show({ severity: 'success', summary: 'Approved', detail: 'Leave request approved', life: 3000 });
      }
    });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate({ id, reason: 'Rejected by admin' }, {
      onSuccess: () => {
        toast.current?.show({ severity: 'warn', summary: 'Rejected', detail: 'Leave request rejected', life: 3000 });
      }
    });
  };

  const statusTemplate = (rowData: any) => {
    let severity: 'success' | 'warning' | 'danger' | 'info' | null = null;
    switch (rowData.status) {
      case 'APPROVED': severity = 'success'; break;
      case 'PENDING': severity = 'warning'; break;
      case 'REJECTED': severity = 'danger'; break;
      case 'CANCELLED': severity = 'info'; break;
    }
    return <Tag value={rowData.status} severity={severity as any} />;
  };

  const actionsTemplate = (rowData: any) => {
    if (rowData.status !== 'PENDING') return null;
    return (
      <div className="flex gap-2">
        <Button icon="pi pi-check" className="p-button-rounded p-button-success p-button-text" onClick={() => handleApprove(rowData.id)} tooltip="Approve" />
        <Button icon="pi pi-times" className="p-button-rounded p-button-danger p-button-text" onClick={() => handleReject(rowData.id)} tooltip="Reject" />
      </div>
    );
  };

  const dateTemplate = (rowData: any, field: string) => {
    return new Date(rowData[field]).toLocaleDateString();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-5">
        <h1 className="text-2xl font-semibold m-0 text-gray-800">Leave Management</h1>
        <Button label="Apply Leave" icon="pi pi-plus" onClick={() => setShowApplyDialog(true)} />
      </div>

      <Card>
        <DataTable 
          value={leavesData?.data?.items || []} 
          loading={isLoading} 
          paginator 
          rows={limit} 
          totalRecords={leavesData?.data?.meta?.total || 0}
          lazy
          first={(page - 1) * limit}
          onPage={(e) => {
            setPage((e.page ?? 0) + 1);
            setLimit(e.rows);
          }}
          emptyMessage="No leave applications found." 
          stripedRows
          className="p-datatable-sm"
        >
          <Column field="applicantName" header="Applicant" sortable></Column>
          <Column field="applicantType" header="Type" sortable></Column>
          <Column body={(data) => dateTemplate(data, 'startDate')} header="Start Date" sortable></Column>
          <Column body={(data) => dateTemplate(data, 'endDate')} header="End Date" sortable></Column>
          <Column field="reason" header="Reason"></Column>
          <Column body={statusTemplate} header="Status" sortable></Column>
          <Column body={actionsTemplate} header="Actions" align="center"></Column>
        </DataTable>
      </Card>

      <Dialog header="Apply for Leave" visible={showApplyDialog} style={{ width: '450px' }} onHide={() => setShowApplyDialog(false)}>
        <form onSubmit={handleApply} className="flex flex-column gap-3 mt-3">
          <div className="field">
            <label htmlFor="applicantType">Applicant Type</label>
            <Dropdown id="applicantType" value={applyForm.applicantType} options={applicantTypes} onChange={(e) => setApplyForm({ ...applyForm, applicantType: e.value })} className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="applicantId">Applicant ID (Student/Staff ID)</label>
            <InputText id="applicantId" value={applyForm.applicantId} onChange={(e) => setApplyForm({ ...applyForm, applicantId: e.target.value })} required className="w-full" />
          </div>
          <div className="field grid">
            <div className="col-6">
              <label htmlFor="startDate">Start Date</label>
              <Calendar id="startDate" value={applyForm.startDate} onChange={(e) => setApplyForm({ ...applyForm, startDate: e.value })} required className="w-full" />
            </div>
            <div className="col-6">
              <label htmlFor="endDate">End Date</label>
              <Calendar id="endDate" value={applyForm.endDate} onChange={(e) => setApplyForm({ ...applyForm, endDate: e.value })} required className="w-full" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="reason">Reason</label>
            <InputTextarea id="reason" value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} required className="w-full" rows={3} />
          </div>
          <div className="flex justify-content-end mt-2">
            <Button type="submit" label="Submit" loading={applyMutation.isPending} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
