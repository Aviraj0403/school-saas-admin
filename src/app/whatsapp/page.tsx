'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';

export default function WhatsAppPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-500"><i className="pi pi-whatsapp mr-2"></i>WhatsApp Integration</h1>
          <p className="text-gray-500 mt-1">Configure Meta Cloud API, message templates, and RAG Chatbot.</p>
        </div>
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <p className="text-gray-500">WhatsApp config and broadcast UI will be loaded here.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
