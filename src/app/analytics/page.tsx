'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">View school performance, trends, and activity logs.</p>
        </div>
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <p className="text-gray-500">Charts and graphs will be rendered here.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
