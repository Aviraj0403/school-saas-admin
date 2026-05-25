'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ALL_MODULES = [
  { label: 'Students', value: 'students' },
  { label: 'Staff', value: 'staff' },
  { label: 'Academics', value: 'academics' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Fee Management', value: 'fee' },
  { label: 'Exams', value: 'exams' },
  { label: 'Library', value: 'library' },
  { label: 'Communication', value: 'communication' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'WhatsApp Bot', value: 'whatsapp' },
  { label: 'Hostel', value: 'hostel' },
  { label: 'Leave', value: 'leave' },
  { label: 'Transport', value: 'transport' },
  { label: 'Homework', value: 'homework' },
  { label: 'Website CMS', value: 'website' },
];

// Default plan definitions (shown as reference cards)
const DEFAULT_PLANS = [
  {
    name: 'BASIC',
    price: '₹999/mo',
    color: 'border-gray-300',
    badge: 'secondary' as const,
    modules: ['students', 'staff', 'academics', 'attendance', 'fee'],
    description: 'Core school management for small institutions.',
  },
  {
    name: 'STANDARD',
    price: '₹2,499/mo',
    color: 'border-blue-400',
    badge: 'info' as const,
    modules: ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication'],
    description: 'Full academic suite with exams and library.',
  },
  {
    name: 'PREMIUM',
    price: '₹4,999/mo',
    color: 'border-purple-500',
    badge: 'warning' as const,
    modules: ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'analytics', 'whatsapp', 'hostel', 'leave'],
    description: 'Everything in Standard + WhatsApp, Hostel, Leave & Analytics.',
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    color: 'border-green-500',
    badge: 'success' as const,
    modules: ALL_MODULES.map((m) => m.value),
    description: 'All modules including Transport, Homework, and Website CMS.',
  },
];

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({ tenantId: '', modules: [] as string[], plan: 'BASIC' });

  const { data: tenants } = useQuery({
    queryKey: ['superadmin', 'tenants', { page: 1, limit: 100 }],
    queryFn: async () => {
      const res = await api.get('/tenants?page=1&limit=100');
      return res.data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { tenantId: string; modules: string[]; plan: string }) => {
      await api.patch(`/tenants/${data.tenantId}/modules`, { modules: data.modules });
      await api.patch(`/tenants/${data.tenantId}/plan`, { plan: data.plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
      setShowAssignDialog(false);
      setAssignForm({ tenantId: '', modules: [], plan: 'BASIC' });
    },
  });

  const tenantOptions = tenants?.data?.items?.map((t: any) => ({ label: `${t.name} (${t.slug})`, value: t.id })) || [];

  const handlePlanSelect = (planName: string) => {
    const plan = DEFAULT_PLANS.find((p) => p.name === planName);
    if (plan) {
      setAssignForm((prev) => ({ ...prev, plan: planName, modules: plan.modules }));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SaaS Plans & Module Control</h1>
            <p className="text-gray-500 mt-1">Manage subscription plans and assign modules to tenant schools.</p>
          </div>
          <Button label="Assign Modules to School" icon="pi pi-cog" className="bg-primary text-white p-2 px-4" onClick={() => setShowAssignDialog(true)} />
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {DEFAULT_PLANS.map((plan) => (
            <Card key={plan.name} className={`shadow-sm border-2 ${plan.color} dark:border-opacity-50`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Tag value={plan.name} severity={plan.badge} />
                  <span className="font-bold text-lg text-gray-800 dark:text-white">{plan.price}</span>
                </div>
                <p className="text-sm text-gray-500">{plan.description}</p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Included Modules</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {plan.modules.map((m) => (
                      <span key={m} className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tenant plan overview */}
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="Tenant Plan Overview">
          <DataTable
            value={tenants?.data?.items || []}
            className="p-datatable-sm mt-2"
            emptyMessage="No tenants found."
            stripedRows
          >
            <Column field="name" header="School Name" sortable />
            <Column field="slug" header="Slug" />
            <Column field="plan" header="Plan" body={(d) => <Tag value={d.plan} severity={d.plan === 'ENTERPRISE' ? 'success' : d.plan === 'PREMIUM' ? 'warning' : 'info'} />} />
            <Column
              field="activeModules"
              header="Active Modules"
              body={(d) => (
                <div className="flex flex-wrap gap-1">
                  {(d.activeModules || []).slice(0, 5).map((m: string) => (
                    <span key={m} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{m}</span>
                  ))}
                  {(d.activeModules || []).length > 5 && (
                    <span className="text-xs text-gray-400">+{d.activeModules.length - 5} more</span>
                  )}
                </div>
              )}
            />
            <Column
              header="Actions"
              body={(d) => (
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  size="small"
                  text
                  onClick={() => {
                    setAssignForm({ tenantId: d.id, modules: d.activeModules || [], plan: d.plan || 'BASIC' });
                    setShowAssignDialog(true);
                  }}
                />
              )}
            />
          </DataTable>
        </Card>
      </div>

      {/* Dialog: Assign Modules */}
      <Dialog header="Assign Plan & Modules to School" visible={showAssignDialog} style={{ width: '560px' }} modal onHide={() => setShowAssignDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Select School *</label>
            <select
              value={assignForm.tenantId}
              onChange={(e) => setAssignForm({ ...assignForm, tenantId: e.target.value })}
              className="p-2 border border-gray-200 rounded-md bg-white dark:bg-slate-800 dark:text-white"
            >
              <option value="">-- Select a school --</option>
              {tenantOptions.map((t: any) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Quick Plan Preset</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_PLANS.map((p) => (
                <Button
                  key={p.name}
                  label={p.name}
                  size="small"
                  outlined={assignForm.plan !== p.name}
                  className={assignForm.plan === p.name ? 'bg-primary text-white p-1 px-3' : 'p-1 px-3'}
                  onClick={() => handlePlanSelect(p.name)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Active Modules (customize)</label>
            <MultiSelect
              value={assignForm.modules}
              options={ALL_MODULES}
              onChange={(e) => setAssignForm({ ...assignForm, modules: e.value })}
              placeholder="Select modules to enable"
              display="chip"
              className="border border-gray-200 rounded-md"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAssignDialog(false)} />
            <Button
              label="Save Assignment"
              icon="pi pi-check"
              loading={assignMutation.isPending}
              className="bg-primary text-white p-2 px-4"
              onClick={() => assignMutation.mutate(assignForm)}
              disabled={!assignForm.tenantId}
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
