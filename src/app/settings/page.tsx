'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-500 mt-1">Manage API Keys, Webhooks, and School Profile.</p>
        </div>
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <p className="text-gray-500">Settings forms and API key generation will be loaded here.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
