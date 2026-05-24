'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import { useWhatsAppConfig, useUpdateWhatsAppConfig, useWhatsAppTemplates, useWhatsAppSessions, useWhatsAppBroadcasts, useCreateBroadcast, useSendBroadcast } from '@/hooks/queries/useWhatsApp';
import { whatsappService } from '@/services/whatsapp.service';

export default function WhatsAppPage() {
  const [activeTab, setTab] = useState(0);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);

  // Testing RAG
  const [testQuery, setTestQuery] = useState({ phone: '', question: '' });
  const [ragOutput, setRagOutput] = useState('');
  const [testingRag, setTestingRag] = useState(false);

  // Form configs
  const [newBroadcast, setNewBroadcast] = useState({ name: '', templateName: 'fee_reminder' });

  // Pagination states
  const [sessionLazy, setSessionLazy] = useState({ first: 0, rows: 10, page: 1 });
  const [broadcastLazy, setBroadcastLazy] = useState({ first: 0, rows: 10, page: 1 });

  // Queries
  const { data: config, refetch: reloadConfig } = useWhatsAppConfig();
  const { data: templates, refetch: reloadTemplates } = useWhatsAppTemplates();
  const { data: sessions } = useWhatsAppSessions(sessionLazy.page, sessionLazy.rows);
  const { data: broadcasts } = useWhatsAppBroadcasts(broadcastLazy.page, broadcastLazy.rows);

  const updateConfigMutation = useUpdateWhatsAppConfig();
  const createBroadcastMutation = useCreateBroadcast();
  const sendBroadcastMutation = useSendBroadcast();

  const handleUpdateConfig = (updatedData: any) => {
    updateConfigMutation.mutate(updatedData, {
      onSuccess: () => reloadConfig()
    });
  };

  const handleSeedTemplates = async () => {
    if (confirm('Do you want to sync meta system templates?')) {
      await whatsappService.seedTemplates();
      reloadTemplates();
    }
  };

  const handleTestRag = async () => {
    setTestingRag(true);
    setRagOutput('RAG Bot processing parent query...');
    try {
      await whatsappService.testRagChatbot(testQuery.phone, testQuery.question);
      setRagOutput('Processed query successfully. Reply dispatched to Parent.');
    } catch (e: any) {
      setRagOutput(`RAG Error: ${e.message}`);
    } finally {
      setTestingRag(false);
    }
  };

  const handleCreateBroadcast = () => {
    createBroadcastMutation.mutate(newBroadcast, {
      onSuccess: () => {
        setShowBroadcastDialog(false);
        setNewBroadcast({ name: '', templateName: 'fee_reminder' });
      }
    });
  };

  const handleSendBroadcast = (id: string) => {
    if (confirm('Send this campaign to target audiences now?')) {
      sendBroadcastMutation.mutate(id);
    }
  };

  const onSessionPage = (e: DataTablePageEvent) => {
    setSessionLazy({ first: e.first, rows: e.rows, page: (e.page || 0) + 1 });
  };

  const onBroadcastPage = (e: DataTablePageEvent) => {
    setBroadcastLazy({ first: e.first, rows: e.rows, page: (e.page || 0) + 1 });
  };

  const statusTemplate = (rowData: any) => {
    return <Tag value={rowData.status || 'ACTIVE'} severity={rowData.status === 'APPROVED' || rowData.status === 'SENT' ? 'success' : 'warning'} />;
  };

  const broadcastActions = (rowData: any) => {
    if (rowData.status === 'DRAFT') {
      return (
        <Button 
          label="Send Now" 
          icon="pi pi-send" 
          size="small" 
          className="bg-primary text-white p-1 px-2 text-xs"
          onClick={() => handleSendBroadcast(rowData.id)}
        />
      );
    }
    return <span>Dispatched</span>;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Integration</h1>
            <p className="text-gray-500 mt-1">Configure automated notifications (RAG engine) and meta broadcast lists.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              label="Sync Templates" 
              icon="pi pi-sync" 
              className="p-button-secondary bg-slate-700 text-white p-2 px-4" 
              onClick={handleSeedTemplates} 
            />
            <Button 
              label="Create Campaign" 
              icon="pi pi-megaphone" 
              className="bg-primary text-white p-2 px-4" 
              onClick={() => setShowBroadcastDialog(true)} 
            />
          </div>
        </div>

        {/* Config Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border border-gray-100 dark:border-slate-800" title="Meta Credentials & Settings">
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Meta Phone Number ID:</span>
                <span className="text-gray-500">{config?.data?.phoneNumberId || 'Masked (Not Seeded)'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">RAG AI Chatbot Enabled:</span>
                <InputSwitch 
                  checked={config?.data?.enableRag || false} 
                  onChange={(e) => handleUpdateConfig({ enableRag: e.value })} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Welcome Message Copy:</span>
                <InputTextarea 
                  value={config?.data?.welcomeMessage || 'Hello! I am your school assistant...'} 
                  onChange={(e) => handleUpdateConfig({ welcomeMessage: e.target.value })} 
                  rows={2}
                  className="border border-gray-200 rounded-md p-2 mt-1"
                />
              </div>
            </div>
          </Card>

          <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="Simulate RAG Chatbot">
            <div className="flex flex-col gap-3 mt-1">
              <InputText 
                value={testQuery.phone} 
                onChange={(e) => setTestQuery({ ...testQuery, phone: e.target.value })} 
                placeholder="Parent Phone (e.g. +91 999...)" 
                className="p-2 border border-gray-200 rounded-md"
              />
              <InputText 
                value={testQuery.question} 
                onChange={(e) => setTestQuery({ ...testQuery, question: e.target.value })} 
                placeholder="Query: 'Rahul is absent today?'" 
                className="p-2 border border-gray-200 rounded-md"
              />
              <Button label="Submit Test Question" loading={testingRag} onClick={handleTestRag} className="bg-primary text-white p-2" />
              {ragOutput && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border text-xs text-slate-600 dark:text-slate-300 font-mono">
                  {ragOutput}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Tab logs */}
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <TabView activeIndex={activeTab} onTabChange={(e) => setTab(e.index)}>
            
            <TabPanel header="Seeded Templates">
              <DataTable 
                value={templates?.data || []} 
                className="p-datatable-sm mt-3" 
                emptyMessage="No templates found. Click 'Sync Templates' to pull defaults."
              >
                <Column field="name" header="Template Name"></Column>
                <Column field="category" header="Category"></Column>
                <Column field="language" header="Language"></Column>
                <Column field="status" header="Approval Status" body={statusTemplate}></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Active Chats (Sessions)">
              <DataTable 
                value={sessions?.data?.items || []} 
                lazy 
                paginator 
                first={sessionLazy.first}
                rows={sessionLazy.rows}
                totalRecords={sessions?.data?.meta.total || 0}
                onPage={onSessionPage}
                className="p-datatable-sm mt-3" 
                emptyMessage="No parents conversations logged."
              >
                <Column field="contactName" header="Contact Name"></Column>
                <Column field="phoneNumber" header="Phone"></Column>
                <Column field="lastMessage" header="Last Message Received"></Column>
                <Column field="updatedAt" header="Last Active"></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Broadcast Campaigns">
              <DataTable 
                value={broadcasts?.data?.items || []} 
                lazy 
                paginator 
                first={broadcastLazy.first}
                rows={broadcastLazy.rows}
                totalRecords={broadcasts?.data?.meta.total || 0}
                onPage={onBroadcastPage}
                className="p-datatable-sm mt-3" 
                emptyMessage="No broadcast campaigns created yet."
              >
                <Column field="name" header="Campaign Name"></Column>
                <Column field="templateName" header="Applied Template"></Column>
                <Column field="status" header="Status" body={statusTemplate}></Column>
                <Column header="Actions" body={broadcastActions}></Column>
              </DataTable>
            </TabPanel>

          </TabView>
        </Card>

        {/* Dialog: Create Campaign */}
        <Dialog 
          header="Create Broadcast Campaign" 
          visible={showBroadcastDialog} 
          style={{ width: '400px' }} 
          modal 
          onHide={() => setShowBroadcastDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowBroadcastDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Create Campaign" 
                icon="pi pi-check" 
                onClick={handleCreateBroadcast} 
                loading={createBroadcastMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Campaign Name</label>
              <InputText 
                value={newBroadcast.name} 
                onChange={(e) => setNewBroadcast({ ...newBroadcast, name: e.target.value })} 
                placeholder="e.g. Q1 Fee Pending Alert"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Select Template</label>
              <Dropdown 
                value={newBroadcast.templateName} 
                options={templates?.data?.map((t: any) => ({ label: t.name, value: t.name })) || [
                  { label: 'fee_reminder', value: 'fee_reminder' },
                  { label: 'attendance_alert', value: 'attendance_alert' }
                ]} 
                onChange={(e) => setNewBroadcast({ ...newBroadcast, templateName: e.value })} 
                className="border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
