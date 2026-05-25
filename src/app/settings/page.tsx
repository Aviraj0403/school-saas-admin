'use client';

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { MultiSelect } from 'primereact/multiselect';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';

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

const PLAN_OPTIONS = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Enterprise', value: 'ENTERPRISE' },
];

export default function SettingsPage() {
  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({
    name: '',
    slug: '',
    adminEmail: '',
    plan: 'BASIC',
    activeModules: [],
  });

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getTenantDetails,
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: (tenant as any).name || '',
        slug: (tenant as any).slug || '',
        adminEmail: (tenant as any).adminEmail || '',
        plan: (tenant as any).plan || 'BASIC',
        activeModules: (tenant as any).activeModules || [],
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: settingsService.updateTenantDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Settings updated successfully', life: 3000 });
    },
    onError: () => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update settings', life: 3000 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toast ref={toast} />
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">School Settings</h1>
          <p className="text-gray-500 mt-1">Update your school profile, plan, and active module configuration.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* School Info */}
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="School Information">
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">School / Tenant Name</label>
                <InputText
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="p-2 border border-gray-200 rounded-md"
                  placeholder="e.g. Kendriya Vidyalaya No. 1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Subdomain Slug</label>
                <InputText
                  value={formData.slug}
                  disabled
                  className="p-2 border border-gray-200 rounded-md bg-gray-50 dark:bg-slate-800 cursor-not-allowed"
                />
                <small className="text-xs text-gray-400">Slug cannot be changed after onboarding.</small>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Admin Email</label>
                <InputText
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="p-2 border border-gray-200 rounded-md"
                  placeholder="admin@school.com"
                />
              </div>
            </div>
          </Card>

          {/* Plan & Modules */}
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="Subscription & Modules">
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Current Plan</label>
                <Dropdown
                  value={formData.plan}
                  options={PLAN_OPTIONS}
                  onChange={(e) => setFormData({ ...formData, plan: e.value })}
                  className="border border-gray-200 rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Active Modules</label>
                <MultiSelect
                  value={formData.activeModules}
                  options={ALL_MODULES}
                  onChange={(e) => setFormData({ ...formData, activeModules: e.value })}
                  placeholder="Select modules to enable"
                  display="chip"
                  className="border border-gray-200 rounded-md"
                />
                <small className="text-xs text-gray-400">Only enabled modules will appear in the sidebar for this school.</small>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              label="Save Settings"
              icon="pi pi-save"
              loading={mutation.isPending}
              className="bg-primary text-white p-2 px-6"
            />
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
