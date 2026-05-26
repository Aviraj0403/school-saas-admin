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
import { useTenantsList, useCreateTenant, useSuspendTenant, useActivateTenant } from '@/modules/superadmin/hooks/useTenants';
import { CreateTenantDto, Tenant } from '@/types/api.types';

const PLANS = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Enterprise', value: 'ENTERPRISE' },
];

const PLAN_THEMES: Record<string, { bg: string, text: string, border: string, badge: string }> = {
  BASIC: { bg: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800', badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
  STANDARD: { bg: 'from-blue-50 to-indigo-100 dark:from-indigo-950/40 dark:to-blue-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-100 dark:border-indigo-950', badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  PREMIUM: { bg: 'from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-100 dark:border-amber-950', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  ENTERPRISE: { bg: 'from-purple-50 to-fuchsia-100 dark:from-purple-950/40 dark:to-fuchsia-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-100 dark:border-purple-950', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300' },
};

export default function TenantsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
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
  const activateMutation = useActivateTenant();

  const tenants: Tenant[] = data?.data?.items || [];
  const totalRecords = data?.data?.meta?.total || 0;

  // Stats calculation
  const totalCount = totalRecords;
  const activeCount = tenants.filter(t => t.isActive && !t.isSuspended).length;
  const suspendedCount = tenants.filter(t => t.isSuspended).length;
  const premiumPlansCount = tenants.filter(t => t.plan === 'PREMIUM' || t.plan === 'ENTERPRISE').length;

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
    if (rowData.isSuspended) return <Tag value="SUSPENDED" severity="danger" className="font-semibold text-xs" />;
    if (rowData.isActive) return <Tag value="ACTIVE" severity="success" className="font-semibold text-xs" />;
    return <Tag value="INACTIVE" severity="warning" className="font-semibold text-xs" />;
  };

  const planTemplate = (rowData: any) => {
    const theme = PLAN_THEMES[rowData.plan] || PLAN_THEMES.BASIC;
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badge}`}>{rowData.plan}</span>;
  };

  const actionsTemplate = (rowData: any) => (
    <div className="flex gap-2 justify-center">
      {!rowData.isSuspended ? (
        <Button
          icon="pi pi-ban"
          rounded text severity="danger" size="small"
          tooltip="Suspend School"
          tooltipOptions={{ position: 'bottom' }}
          onClick={() => {
            if (confirm(`Suspend ${rowData.name}?`)) suspendMutation.mutate(rowData.id);
          }}
        />
      ) : (
        <Button
          icon="pi pi-check-circle"
          rounded text severity="success" size="small"
          tooltip="Activate School"
          tooltipOptions={{ position: 'bottom' }}
          onClick={() => {
            if (confirm(`Reactivate ${rowData.name}?`)) activateMutation.mutate(rowData.id);
          }}
        />
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Section */}
        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Tenant Schools Portal
            </h1>
            <p className="text-slate-500 mt-2 text-md">
              SaaS Control Center — Onboard schools, manage features, and track subscription lifecycle.
            </p>
          </div>
          <Button 
            label="Onboard New School" 
            icon="pi pi-plus" 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md shadow-indigo-500/10 border-0 p-3 px-5 transition-all duration-300 rounded-xl" 
            onClick={() => setShowDialog(true)} 
          />
        </div>

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Schools</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{totalCount}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <i className="pi pi-building text-xl"></i>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-4">Across all subscription plan types</p>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Schools</p>
                <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{activeCount}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <i className="pi pi-check-circle text-xl"></i>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-4">Actively generating SaaS revenue</p>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full translate-x-8 -translate-y-8"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Suspended</p>
                <h3 className="text-3xl font-black text-rose-500 dark:text-rose-400 mt-2">{suspendedCount}</h3>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl">
                <i className="pi pi-ban text-xl"></i>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-4">Pending invoice or SLA resolution</p>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Premium / Enterprise</p>
                <h3 className="text-3xl font-black text-amber-500 mt-2">{premiumPlansCount}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <i className="pi pi-star text-xl"></i>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-4">High tier subscription plans</p>
          </div>
        </div>

        {/* View Switcher & Toolbar */}
        <div className="flex justify-between items-center bg-slate-100/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 flex-wrap gap-4">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 pl-2">Showing onboarding database records</p>
          <div className="flex bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 px-4 rounded-lg flex items-center gap-2 font-medium text-xs transition-all duration-300 ${viewMode === 'grid' ? 'bg-indigo-550 bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <i className="pi pi-grid"></i>
              Grid Cards
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 px-4 rounded-lg flex items-center gap-2 font-medium text-xs transition-all duration-300 ${viewMode === 'table' ? 'bg-indigo-550 bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <i className="pi pi-list"></i>
              Table View
            </button>
          </div>
        </div>

        {/* Content Render Area */}
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
            <span className="text-slate-500 font-semibold">Loading tenant directory data...</span>
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
            <i className="pi pi-building-columns text-5xl text-slate-300 dark:text-slate-700 mb-4"></i>
            <span className="text-slate-500 dark:text-slate-400 font-bold text-lg">No Schools Onboarded</span>
            <p className="text-slate-400 text-sm mt-1">Get started by clicking the "Onboard New School" button.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Premium Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => {
              const theme = PLAN_THEMES[tenant.plan] || PLAN_THEMES.BASIC;
              return (
                <div 
                  key={tenant.id}
                  className={`bg-white dark:bg-slate-900/90 border ${tenant.isSuspended ? 'border-rose-200 dark:border-rose-950/40 bg-rose-50/10' : 'border-slate-250 dark:border-slate-800/80'} rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between overflow-hidden relative group`}
                >
                  {/* Card Header Gradient banner */}
                  <div className={`h-24 bg-gradient-to-r ${theme.bg} p-6 flex justify-between items-start relative`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 w-max shadow-sm">
                        {tenant.projectCode || 'No Code'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${theme.badge} bg-white dark:bg-slate-950`}>
                      {tenant.plan}
                    </span>
                  </div>

                  {/* School Profile Image placeholder / Avatar */}
                  <div className="absolute top-12 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-950 shadow-md flex items-center justify-center border-2 border-white dark:border-slate-900 text-2xl font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                      {tenant.prefix || tenant.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-10 flex-grow flex flex-col justify-between gap-6">
                    <div>
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors duration-300">
                        {tenant.name}
                      </h4>
                      <p className="text-xs text-indigo-600/85 dark:text-indigo-400 mt-1 font-semibold flex items-center gap-1.5">
                        <i className="pi pi-link text-[10px]"></i>
                        {tenant.subdomain}.aviraj.com
                      </p>
                      
                      <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <i className="pi pi-envelope text-slate-400 text-sm"></i>
                          <span className="truncate">{tenant.adminEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <i className="pi pi-calendar text-slate-400 text-sm"></i>
                          <span>Onboarded: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <i className="pi pi-cog text-slate-400 text-sm"></i>
                          <span>{tenant.activeModules?.length || 0} Modules enabled</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${tenant.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {tenant.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                      
                      <div className="flex gap-1.5">
                        {!tenant.isSuspended ? (
                          <Button
                            icon="pi pi-ban"
                            className="p-button-rounded p-button-text p-button-danger hover:bg-rose-500/10 p-2"
                            tooltip="Suspend Tenant"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => {
                              if (confirm(`Suspend ${tenant.name}?`)) suspendMutation.mutate(tenant.id);
                            }}
                          />
                        ) : (
                          <Button
                            icon="pi pi-check-circle"
                            className="p-button-rounded p-button-text p-button-success hover:bg-emerald-500/10 p-2"
                            tooltip="Reactivate Tenant"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => {
                              if (confirm(`Reactivate ${tenant.name}?`)) activateMutation.mutate(tenant.id);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Modern Table View */
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
            <DataTable
              value={tenants}
              lazy
              paginator
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={totalRecords}
              onPage={onPage}
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No schools onboarded yet."
              stripedRows
            >
              <Column field="projectCode" header="Code" body={(d) => d.projectCode || '—'} className="font-bold text-xs" />
              <Column field="prefix" header="Prefix" body={(d) => d.prefix || '—'} className="font-semibold text-xs text-slate-500" />
              <Column field="name" header="School Name" sortable className="font-bold" />
              <Column field="subdomain" header="Subdomain" body={(d) => <span className="text-primary font-semibold">{d.subdomain}.aviraj.com</span>} />
              <Column field="adminEmail" header="Admin Email" />
              <Column field="plan" header="Plan" body={planTemplate} align="center" />
              <Column header="Status" body={statusTemplate} align="center" />
              <Column header="Actions" body={actionsTemplate} align="center" />
            </DataTable>
          </Card>
        )}

        {/* Dialog Modal */}
        <Dialog 
          header="Onboard New School" 
          visible={showDialog} 
          style={{ width: '520px' }} 
          modal 
          onHide={() => setShowDialog(false)}
          className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          contentClassName="p-6"
          headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-bold"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-6 mt-3">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">School Name *</label>
              <InputText
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950"
                placeholder="e.g. Oakridge International School"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Subdomain *</label>
              <InputText
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                required
                className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 font-semibold text-primary"
                placeholder="e.g. oakridge (lowercase, hyphens only)"
              />
              <small className="text-xs text-slate-400">School portal URL: <span className="text-primary font-bold">{formData.subdomain || 'subdomain'}.aviraj.com</span></small>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Admin Email *</label>
              <InputText
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                required
                className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950"
                placeholder="admin@school.com"
              />
              <small className="text-xs text-slate-400">Credentials will be generated. Default password: <span className="font-bold">School@123</span></small>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Subscription Plan</label>
              <Dropdown 
                value={formData.plan} 
                options={PLANS} 
                onChange={(e) => setFormData({ ...formData, plan: e.value })} 
                className="border border-slate-200 dark:border-slate-850 rounded-xl dark:bg-slate-950" 
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-4">
              <Button type="button" label="Cancel" className="p-button-text p-3 px-5 rounded-xl font-semibold" onClick={() => setShowDialog(false)} />
              <Button type="submit" label="Onboard School" icon="pi pi-check" loading={createMutation.isPending} className="bg-primary text-white p-3 px-6 rounded-xl font-semibold shadow-md shadow-indigo-500/10 border-0 hover:opacity-95" />
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
