'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { useTenantsList, useCreateTenant } from '@/modules/superadmin/hooks/useTenants';
import { CreateTenantDto } from '@/types/api.types';

export default function TenantsPage() {
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<CreateTenantDto>({
    name: '',
    slug: '',
    adminEmail: '',
    plan: 'BASIC'
  });

  const { data, isPending } = useTenantsList(lazyState.page, lazyState.rows);
  const createMutation = useCreateTenant();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState({ first: event.first, rows: event.rows, page: (event.page || 0) + 1 });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowDialog(false);
        setFormData({ name: '', slug: '', adminEmail: '', plan: 'BASIC' });
      }
    });
  };

  const statusTemplate = (rowData: any) => {
    const severity = rowData.status === 'ACTIVE' ? 'success' : rowData.status === 'SUSPENDED' ? 'danger' : 'warning';
    return <Tag value={rowData.status} severity={severity} />;
  };

  const plans = [
    { label: 'Basic', value: 'BASIC' },
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Premium', value: 'PREMIUM' },
    { label: 'Enterprise', value: 'ENTERPRISE' }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenant Schools</h1>
            <p className="text-gray-500 mt-1">SuperAdmin control to manage onboarded schools and subscriptions.</p>
          </div>
          <Button label="Onboard New School" icon="pi pi-plus" onClick={() => setShowDialog(true)} />
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
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
          >
            <Column field="name" header="School Name"></Column>
            <Column field="slug" header="Subdomain Slug"></Column>
            <Column field="adminEmail" header="Admin Email"></Column>
            <Column field="plan" header="Current Plan"></Column>
            <Column field="status" header="Status" body={statusTemplate}></Column>
          </DataTable>
        </Card>

        <Dialog header="Onboard New School" visible={showDialog} onHide={() => setShowDialog(false)} className="w-full max-w-md">
          <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <label>School Name</label>
              <InputText value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-2">
              <label>Subdomain Slug</label>
              <InputText value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required placeholder="e.g. demo-school" />
            </div>
            <div className="flex flex-col gap-2">
              <label>Admin Email</label>
              <InputText type="email" value={formData.adminEmail} onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-2">
              <label>Initial Subscription Plan</label>
              <Dropdown value={formData.plan} options={plans} onChange={(e) => setFormData({...formData, plan: e.value})} className="w-full" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" label="Cancel" severity="secondary" onClick={() => setShowDialog(false)} />
              <Button type="submit" label="Create School" loading={createMutation.isPending} />
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
