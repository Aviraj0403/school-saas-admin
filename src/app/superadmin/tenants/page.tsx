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
import { useTenantsList, useCreateTenant, useSuspendTenant } from '@/modules/superadmin/hooks/useTenants';
import { CreateTenantDto } from '@/types/api.types';

const PLANS = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Enterprise', value: 'ENTERPRISE' },
];

export default function TenantsPage() {
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<CreateTenantDto>({
    name: '',
    subdomain: '',
    adminEmail: '',
    plan: 'BASIC',
  });

  const { data, isPending } = useTenantsList(lazyState.page, lazyState.rows);
  const createMutation = useCreateTenant();
  const suspendMutation = useSuspendTenant();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState({ first: event.first, rows: event.rows, page: (event.page || 0) + 1 });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowDialog(false);
        setFormData({ name: '', subdomain: '', adminEmail: '', plan: 'BASIC' });
      },
    });
  };

  const statusTemplate = (rowData: any) => {
    if (rowData.isSuspended) return <Tag value="SUSPENDED" severity="danger" />;
    if (rowData.isActive) return <Tag value="ACTIVE" severity="success" />;
    return <Tag value="INACTIVE" severity="warning" />;
  };

  const planTemplate = (rowData: any) => {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      ENTERPRISE: 'success', PREMIUM: 'warning', STANDARD: 'info', BASIC: 'secondary' as any,
    };
    return <Tag value={rowData.plan} severity={map[rowData.plan] || 'info'} />;
  };

  const actionsTemplate = (rowData: any) => (
    <div className="flex gap-1">
      {!rowData.isSuspended ? (
        <Button
          icon="pi pi-ban"
          rounded text severity="danger" size="small"
          tooltip="Suspend School"
          onClick={() => {
            if (confirm(`Suspend ${rowData.name}?`)) suspendMutation.mutate(rowData.id);
          }}
        />
      ) : (
        <Tag value="Suspended" severity="danger" />
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenant Schools</h1>
            <p className="text-gray-500 mt-1">SuperAdmin — manage onboarded schools and subscriptions.</p>
          </div>
          <Button label="Onboard New School" icon="pi pi-plus" className="bg-primary text-white p-2 px-4" onClick={() => setShowDialog(true)} />
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <DataTable
            value={data?.data?.items || []}
            lazy
            paginator
            first={lazyState.first}
            rows={lazyState.rows}
            totalRecords={data?.data?.meta?.total || 0}
            onPage={onPage}
            loading={isPending}
            className="p-datatable-sm"
            emptyMessage="No schools onboarded yet."
            stripedRows
          >
            <Column field="projectCode" header="Code" body={(d) => d.projectCode || '—'} />
            <Column field="prefix" header="Prefix" body={(d) => d.prefix || '—'} />
            <Column field="name" header="School Name" sortable />
            <Column field="subdomain" header="Subdomain" />
            <Column field="adminEmail" header="Admin Email" />
            <Column field="plan" header="Plan" body={planTemplate} />
            <Column header="Status" body={statusTemplate} />
            <Column header="Actions" body={actionsTemplate} align="center" />
          </DataTable>
        </Card>

        <Dialog header="Onboard New School" visible={showDialog} style={{ width: '500px' }} modal onHide={() => setShowDialog(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">School Name *</label>
              <InputText
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="p-2 border border-gray-200 rounded-md"
                placeholder="e.g. Kendriya Vidyalaya No. 1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Subdomain *</label>
              <InputText
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                required
                className="p-2 border border-gray-200 rounded-md"
                placeholder="e.g. kv-no1 (lowercase, hyphens only)"
              />
              <small className="text-xs text-gray-400">Will be accessible at: {formData.subdomain || 'subdomain'}.yourdomain.com</small>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Admin Email *</label>
              <InputText
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                required
                className="p-2 border border-gray-200 rounded-md"
                placeholder="admin@school.com"
              />
              <small className="text-xs text-gray-400">Default password: School@123 (admin must change on first login)</small>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Subscription Plan</label>
              <Dropdown value={formData.plan} options={PLANS} onChange={(e) => setFormData({ ...formData, plan: e.value })} className="border border-gray-200 rounded-md" />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowDialog(false)} />
              <Button type="submit" label="Create School" icon="pi pi-check" loading={createMutation.isPending} className="bg-primary text-white p-2 px-4" />
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
