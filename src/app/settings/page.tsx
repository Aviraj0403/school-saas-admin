'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

export default function SettingsPage() {
  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({
    name: '',
    slug: '',
    adminEmail: '',
    plan: 'BASIC',
  });

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getTenantDetails,
  });

  React.useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        slug: tenant.slug || '',
        adminEmail: tenant.adminEmail || '',
        plan: tenant.plan || 'BASIC',
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: settingsService.updateTenantDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Settings updated successfully', life: 3000 });
    },
    onError: () => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update settings', life: 3000 });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const planOptions = [
    { label: 'Basic', value: 'BASIC' },
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Premium', value: 'PREMIUM' },
    { label: 'Enterprise', value: 'ENTERPRISE' }
  ];

  if (isLoading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-5">
        <h1 className="text-2xl font-semibold m-0 text-gray-800">Tenant Settings</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-column gap-4">
          <div className="field">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">School/Tenant Name</label>
            <InputText 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="w-full" 
            />
          </div>
          
          <div className="field">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
            <InputText 
              id="slug" 
              value={formData.slug} 
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
              className="w-full" 
              disabled // slug usually shouldn't be changed easily
            />
          </div>

          <div className="field">
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
            <InputText 
              id="adminEmail" 
              value={formData.adminEmail} 
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} 
              className="w-full" 
            />
          </div>

          <div className="field">
            <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <Dropdown 
              id="plan" 
              value={formData.plan} 
              options={planOptions} 
              onChange={(e) => setFormData({ ...formData, plan: e.value })} 
              className="w-full" 
            />
          </div>

          <div className="flex justify-content-end mt-4">
            <Button 
              type="submit" 
              label="Save Settings" 
              icon="pi pi-save" 
              loading={mutation.isPending} 
            />
          </div>
        </form>
      </Card>
    </div>
  );
}
