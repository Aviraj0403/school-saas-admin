'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useStudentsList, useCreateStudent } from '@/hooks/queries/useStudents';
import { useClasses } from '@/hooks/queries/useAcademics';
import { CreateStudentDto } from '@/types/api.types';

export default function AdmissionsPage() {
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<any>({
    firstName: '',
    lastName: '',
    admissionNo: '',
    classId: '',
    section: '',
    gender: 'MALE',
    phone: '',
    parentName: '',
    parentPhone: '',
  });

  const { data, isPending } = useStudentsList(lazyState.page, lazyState.rows);
  const { data: classes } = useClasses(1, 100);
  const createMutation = useCreateStudent();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState({ first: event.first, rows: event.rows, page: (event.page || 0) + 1 });
  };

  const handleCreate = () => {
    const payload: CreateStudentDto = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      academicYear: new Date().getFullYear().toString(),
      classId: form.classId || undefined,
      gender: form.gender?.toLowerCase(), // backend enum is lowercase 'male'/'female'/'other'
      parentName: form.parentName || undefined,
      parentPhone: form.parentPhone || undefined,
    };

    createMutation.mutate(
      payload,
      {
        onSuccess: () => {
          setShowDialog(false);
          setForm({ firstName: '', lastName: '', admissionNo: '', classId: '', section: '', gender: 'MALE', phone: '', parentName: '', parentPhone: '' });
        },
      }
    );
  };

  const classOptions = classes?.data?.items?.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })) || [];

  const statusTemplate = (rowData: any) => (
    <Tag value={rowData.status} severity={rowData.status === 'ACTIVE' ? 'success' : 'warning'} />
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Admissions</h1>
            <p className="text-gray-500 mt-1">Register new students and manage admission records.</p>
          </div>
          <Button label="New Admission" icon="pi pi-user-plus" className="bg-primary text-white p-2 px-4" onClick={() => setShowDialog(true)} />
        </div>

        <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          <style>{`
            .p-datatable, .p-datatable-wrapper, .p-paginator {
              background: transparent !important;
            }
            .p-datatable-thead > tr > th, .p-datatable-tbody > tr, .p-datatable-tbody > tr > td {
              background: transparent !important;
            }
          `}</style>
          <DataTable
            value={data?.data?.items || []}
            lazy
            paginator
            first={lazyState.first}
            rows={lazyState.rows}
            totalRecords={data?.data?.meta.total || 0}
            onPage={onPage}
            loading={isPending}
            className="p-datatable-sm"
            emptyMessage="No admissions found."
          >
            <Column field="admissionNo" header="Admission No." sortable />
            <Column field="firstName" header="First Name" sortable />
            <Column field="lastName" header="Last Name" sortable />
            <Column field="className" header="Class" />
            <Column field="status" header="Status" body={statusTemplate} />
            <Column field="createdAt" header="Admitted On" body={(d) => d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '—'} />
          </DataTable>
        </div>
      </div>

      <Dialog header="New Student Admission" visible={showDialog} style={{ width: '520px' }} modal onHide={() => setShowDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">First Name *</label>
              <InputText value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. Rahul" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Last Name *</label>
              <InputText value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. Sharma" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Admission Number *</label>
            <InputText value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. 2025-001" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Class *</label>
            <Dropdown value={form.classId} options={classOptions} onChange={(e) => setForm({ ...form, classId: e.value })} placeholder="Select Class" className="border border-gray-200 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Gender</label>
              <Dropdown value={form.gender} options={[{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' }]} onChange={(e) => setForm({ ...form, gender: e.value })} className="border border-gray-200 rounded-md" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Student Phone</label>
              <InputText value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Parent / Guardian Name</label>
              <InputText value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="Parent full name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Parent Phone (WhatsApp)</label>
              <InputText value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowDialog(false)} />
            <Button label="Register Student" icon="pi pi-check" loading={createMutation.isPending} className="bg-primary text-white p-2 px-4" onClick={handleCreate} />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
