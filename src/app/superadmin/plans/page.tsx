'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { toast } from 'sonner';
import { Sliders, Check, Edit } from 'lucide-react';

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

const DEFAULT_PLANS = [
  {
    name: 'BASIC',
    price: '₹999/mo',
    modules: ['students', 'staff', 'academics', 'attendance', 'fee'],
    description: 'Core school management for small institutions.',
  },
  {
    name: 'STANDARD',
    price: '₹2,499/mo',
    modules: [
      'students',
      'staff',
      'academics',
      'attendance',
      'fee',
      'exams',
      'library',
      'communication',
    ],
    description: 'Full academic suite with exams and library.',
  },
  {
    name: 'PREMIUM',
    price: '₹4,999/mo',
    modules: [
      'students',
      'staff',
      'academics',
      'attendance',
      'fee',
      'exams',
      'library',
      'communication',
      'analytics',
      'whatsapp',
      'hostel',
      'leave',
    ],
    description: 'Everything in Standard + WhatsApp, Hostel, Leave & Analytics.',
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    modules: ALL_MODULES.map((m) => m.value),
    description: 'All modules including Transport, Homework, and Website CMS.',
  },
];

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({
    tenantId: '',
    modules: [] as string[],
    plan: 'BASIC',
  });

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
      toast.success('Tenant modules updated successfully.');
    },
    onError: () => toast.error('Failed to update tenant plan & modules.'),
  });

  const tenantOptions = [
    { label: 'Select School Domain...', value: '' },
    ...(tenants?.data?.items?.map((t: any) => ({ label: `${t.name} (${t.slug})`, value: t.id })) ||
      []),
  ];

  const handlePlanSelect = (planName: string) => {
    const plan = DEFAULT_PLANS.find((p) => p.name === planName);
    if (plan) {
      setAssignForm((prev) => ({ ...prev, plan: planName, modules: plan.modules }));
    }
  };

  const toggleModule = (modValue: string) => {
    setAssignForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(modValue)
        ? prev.modules.filter((m) => m !== modValue)
        : [...prev.modules, modValue],
    }));
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Plans & Module Matrix" subtitle="Superadmin" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="w-6 h-6 text-brand" /> SaaS Subscription Matrix
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Configure active modules and provision plan tiers across tenant school domains.
            </p>
          </div>

          <Button onClick={() => setShowAssignDialog(true)}>
            <Sliders className="w-4 h-4 mr-2" /> Assign Custom Modules
          </Button>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {DEFAULT_PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 bg-white dark:bg-zinc-900/60 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge variant="info">{plan.name}</Badge>
                  <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {plan.price}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{plan.description}</p>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Modules ({plan.modules.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plan.modules.map((m) => (
                      <Badge key={m} variant="secondary">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tenant Directory Overview */}
        <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
            Tenant Module Directory
          </h3>

          <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-3">School Name</th>
                  <th className="px-4 py-3">Subdomain Slug</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Active Modules</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {(tenants?.data?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                      No tenants onboarded.
                    </td>
                  </tr>
                ) : (
                  (tenants?.data?.items || []).map((d: any) => (
                    <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {d.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-brand">{d.slug}</td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{d.plan || 'BASIC'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(d.activeModules || []).slice(0, 5).map((m: string) => (
                            <Badge key={m} variant="secondary">
                              {m}
                            </Badge>
                          ))}
                          {(d.activeModules || []).length > 5 && (
                            <span className="text-[10px] text-zinc-400 font-mono flex items-center">
                              +{d.activeModules.length - 5} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssignForm({
                              tenantId: d.id,
                              modules: d.activeModules || [],
                              plan: d.plan || 'BASIC',
                            });
                            setShowAssignDialog(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Customize
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog: Assign Modules */}
      <Dialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        title="Assign Subscription Plan & Modules"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Select School *
            </label>
            <Select
              value={assignForm.tenantId}
              options={tenantOptions}
              onChange={(e) => setAssignForm({ ...assignForm, tenantId: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Quick Plan Preset
            </label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_PLANS.map((p) => (
                <Button
                  key={p.name}
                  variant={assignForm.plan === p.name ? 'primary' : 'outline'}
                  onClick={() => handlePlanSelect(p.name)}
                  className="text-xs"
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Active Module Matrix
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/30">
              {ALL_MODULES.map((m) => {
                const active = assignForm.modules.includes(m.value);
                return (
                  <label
                    key={m.value}
                    className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleModule(m.value)}
                      className="rounded border-zinc-300 text-brand focus:ring-brand"
                    />
                    <span>{m.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate(assignForm)}
            isLoading={assignMutation.isPending}
            disabled={!assignForm.tenantId}
          >
            <Check className="w-4 h-4 mr-1.5" /> Save Plan Settings
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
