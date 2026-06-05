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

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function WhatsAppPage() {
  const [activeTab, setTab] = useState(0);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);

  // Simulated Chat Console
  const [testQuery, setTestQuery] = useState({ phone: '+91 99999 88888', question: '' });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! I am your school AI assistant. Ask me anything about students, grades, fees, or events.', timestamp: 'Just now' }
  ]);
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
    if (!testQuery.question.trim()) return;
    
    const userMsg = testQuery.question;
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTestQuery((prev) => ({ ...prev, question: '' }));
    setTestingRag(true);

    try {
      await whatsappService.testRagChatbot(testQuery.phone, userMsg);
      // Simulate bot typing response
      setChatHistory((prev) => [
        ...prev, 
        { 
          sender: 'bot', 
          text: 'Response processed successfully. Auto-notification dispatched to the parent WhatsApp number.', 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch (e: any) {
      setChatHistory((prev) => [
        ...prev, 
        { 
          sender: 'bot', 
          text: `RAG System Error: ${e.message}`, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
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
    const isApproved = rowData.status === 'APPROVED' || rowData.status === 'SENT';
    return (
      <Tag 
        value={rowData.status || 'ACTIVE'} 
        severity={isApproved ? 'success' : 'warning'} 
        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
          isApproved 
            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
        }`}
      />
    );
  };

  const broadcastActions = (rowData: any) => {
    if (rowData.status === 'DRAFT') {
      return (
        <button 
          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
          onClick={() => handleSendBroadcast(rowData.id)}
        >
          <i className="pi pi-send text-[10px]"></i>
          Send Now
        </button>
      );
    }
    return <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">Dispatched</span>;
  };

  const activeTemplates = (templates as any)?.data || templates || [];
  const activeSessions = sessions?.data?.items || [];
  const activeBroadcasts = broadcasts?.data?.items || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">WhatsApp & RAG Integration</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Manage WhatsApp broadcasts, automated triggers, and evaluate the RAG AI chatbot live.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSeedTemplates}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <i className="pi pi-sync"></i>
              Sync Templates
            </button>
            <button 
              onClick={() => setShowBroadcastDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <i className="pi pi-megaphone"></i>
              Create Campaign
            </button>
          </div>
        </div>

        {/* Configurations & Interactive RAG Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Credentials Card */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Credentials & Agent Settings</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Configure Meta connection parameters and AI chatbot options.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Meta Phone Number ID</span>
                <span className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-150/50">
                  {((config as any)?.data || config)?.phoneNumberId || 'Masked (Not Seeded)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">RAG Chatbot Agent</span>
                  <span className="text-[10px] text-indigo-600/70">Let AI reply to queries</span>
                </div>
                <InputSwitch 
                  checked={((config as any)?.data || config)?.enableRag || false} 
                  onChange={(e) => handleUpdateConfig({ enableRag: e.value })} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Agent Welcome Message</span>
                <InputTextarea 
                  value={((config as any)?.data || config)?.welcomeMessage || 'Hello! I am your school assistant...'} 
                  onChange={(e) => handleUpdateConfig({ welcomeMessage: e.target.value })} 
                  rows={3}
                  className="border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl p-3 text-xs w-full outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Interactive Chatbot Simulator */}
          <div className="lg:col-span-2 bg-slate-950 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 border border-slate-800 text-slate-200 min-h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">RAG Chatbot Console</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Simulator Target Phone</span>
                <input 
                  type="text" 
                  value={testQuery.phone}
                  onChange={(e) => setTestQuery({ ...testQuery, phone: e.target.value })}
                  className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs text-indigo-400 font-mono outline-none"
                />
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto max-h-64 flex flex-col gap-3 py-2 scrollbar-thin">
              {chatHistory.map((msg, index) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                      isBot 
                        ? 'bg-slate-900 text-slate-300 border border-slate-800/80 rounded-tl-none' 
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="block text-[8px] mt-1 text-slate-500 text-right uppercase tracking-wider">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              {testingRag && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 text-slate-500 border border-slate-850 px-4 py-2 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Console */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-850 p-1.5 rounded-2xl">
              <input
                type="text"
                value={testQuery.question}
                onChange={(e) => setTestQuery({ ...testQuery, question: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTestRag(); }}
                placeholder="Ask simulator query, e.g. 'Rahul fee structure status?'"
                className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none border-none focus:ring-0 placeholder:text-slate-650"
              />
              <button 
                onClick={handleTestRag}
                disabled={testingRag || !testQuery.question.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all active:scale-95 disabled:opacity-40"
              >
                Send Query
              </button>
            </div>
          </div>

        </div>

        {/* Tables Board */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <TabView activeIndex={activeTab} onTabChange={(e) => setTab(e.index)}>
            
            <TabPanel header="Meta Message Templates">
              <div className="p-3">
                <DataTable 
                  value={activeTemplates} 
                  className="p-datatable-sm mt-1" 
                  emptyMessage="No templates found. Click 'Sync Templates' to pull defaults."
                >
                  <Column field="name" header="Template Name" className="font-semibold"></Column>
                  <Column field="category" header="Category"></Column>
                  <Column field="language" header="Language" className="font-mono text-xs"></Column>
                  <Column field="status" header="Approval Status" body={statusTemplate}></Column>
                </DataTable>
              </div>
            </TabPanel>

            <TabPanel header="Parent Conversations">
              <div className="p-3">
                <DataTable 
                  value={activeSessions} 
                  lazy 
                  paginator 
                  first={sessionLazy.first}
                  rows={sessionLazy.rows}
                  totalRecords={sessions?.data?.meta.total || 0}
                  onPage={onSessionPage}
                  className="p-datatable-sm mt-1" 
                  emptyMessage="No active parent conversation sessions logged."
                >
                  <Column field="contactName" header="Contact Name" className="font-semibold"></Column>
                  <Column field="phoneNumber" header="WhatsApp Number" className="font-mono text-xs"></Column>
                  <Column field="lastMessage" header="Last Message Received"></Column>
                  <Column field="updatedAt" header="Last Active" body={(d) => d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}></Column>
                </DataTable>
              </div>
            </TabPanel>

            <TabPanel header="Broadcast Campaigns">
              <div className="p-3">
                <DataTable 
                  value={activeBroadcasts} 
                  lazy 
                  paginator 
                  first={broadcastLazy.first}
                  rows={broadcastLazy.rows}
                  totalRecords={broadcasts?.data?.meta.total || 0}
                  onPage={onBroadcastPage}
                  className="p-datatable-sm mt-1" 
                  emptyMessage="No broadcast campaigns created yet."
                >
                  <Column field="name" header="Campaign Name" className="font-semibold"></Column>
                  <Column field="templateName" header="Applied Template" className="font-mono text-xs"></Column>
                  <Column field="status" header="Status" body={statusTemplate}></Column>
                  <Column header="Actions" body={broadcastActions} align="center"></Column>
                </DataTable>
              </div>
            </TabPanel>

          </TabView>
        </div>

      </div>

      {/* Dialog: Create Campaign */}
      <Dialog 
        header="Create Broadcast Campaign" 
        visible={showBroadcastDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowBroadcastDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" icon="pi pi-times" onClick={() => setShowBroadcastDialog(false)} className="p-button-text p-2" />
            <Button 
              label="Create Campaign" 
              icon="pi pi-check" 
              onClick={handleCreateBroadcast} 
              loading={createBroadcastMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-gray-500 dark:text-gray-400">Campaign Name *</label>
            <InputText 
              value={newBroadcast.name} 
              onChange={(e) => setNewBroadcast({ ...newBroadcast, name: e.target.value })} 
              placeholder="e.g. Q1 Fee Pending Alert"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-gray-500 dark:text-gray-400">Select Template *</label>
            <Dropdown 
              value={newBroadcast.templateName} 
              options={activeTemplates.map((t: any) => ({ label: t.name, value: t.name })) || [
                { label: 'fee_reminder', value: 'fee_reminder' },
                { label: 'attendance_alert', value: 'attendance_alert' }
              ]} 
              onChange={(e) => setNewBroadcast({ ...newBroadcast, templateName: e.value })} 
              className="border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
