'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';

export default function FeePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
          <p className="text-gray-500 mt-1">Manage fee structures, tracking, and collections.</p>
        </div>
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <p className="text-gray-500">Fee tracking interface will be loaded here via TanStack Query.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
