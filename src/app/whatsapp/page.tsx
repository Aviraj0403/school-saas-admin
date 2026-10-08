'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useWhatsAppConfig,
  useUpdateWhatsAppConfig,
  useWhatsAppTemplates,
  useWhatsAppSessions,
  useWhatsAppBroadcasts,
  useCreateBroadcast,
  useSendBroadcast,
} from '@/hooks/queries/useWhatsApp';
import { whatsappService } from '@/services/whatsapp.service';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import {
  MessageSquare,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function WhatsAppPage() {
  const [activeTab, setTab] = useState<'templates' | 'conversations' | 'broadcasts'>('templates');
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [showMetaConfigDialog, setShowMetaConfigDialog] = useState(false);

  const [testQuery, setTestQuery] = useState({ phone: '+91 99999 88888', question: '' });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your school AI assistant. Ask me anything about students, grades, fees, or events.',
      timestamp: 'Just now',
    },
  ]);
  const [testingRag, setTestingRag] = useState(false);

  const [newBroadcast, setNewBroadcast] = useState({ name: '', templateId: 'fee_reminder' });
  const [metaConfigForm, setMetaConfigForm] = useState({
    phoneNumberId: '',
    businessId: '',
    wabaId: '',
    accessToken: '',
  });

  const [sessionPage, setSessionPage] = useState(1);
  const [broadcastPage, setBroadcastPage] = useState(1);
  const limit = 10;

  const { data: config, refetch: reloadConfig } = useWhatsAppConfig();
  const { data: templates, refetch: reloadTemplates } = useWhatsAppTemplates();
  const { data: sessions } = useWhatsAppSessions(sessionPage, limit);
  const { data: broadcasts } = useWhatsAppBroadcasts(broadcastPage, limit);

  const updateConfigMutation = useUpdateWhatsAppConfig();
  const createBroadcastMutation = useCreateBroadcast();
  const sendBroadcastMutation = useSendBroadcast();

  const handleUpdateConfig = (updatedData: any) => {
    updateConfigMutation.mutate(updatedData, {
      onSuccess: () => {
        reloadConfig();
        setShowMetaConfigDialog(false);
        toast.success('WhatsApp API credentials updated.');
      },
    });
  };

  const openMetaConfigDialog = () => {
    const currentConfig = (config as any)?.data || config;
    setMetaConfigForm({
      phoneNumberId: currentConfig?.phoneNumberId || '',
      businessId: currentConfig?.businessId || '',
      wabaId: currentConfig?.wabaId || '',
      accessToken: currentConfig?.accessToken || '',
    });
    setShowMetaConfigDialog(true);
  };

  const handleSeedTemplates = async () => {
    if (confirm('Sync Meta system templates now?')) {
      await whatsappService.seedTemplates();
      reloadTemplates();
      toast.success('Synced WhatsApp message templates.');
    }
  };

  const handleTestRag = async () => {
    if (!testQuery.question.trim()) return;

    const userMsg = testQuery.question;
    setChatHistory((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTestQuery((prev) => ({ ...prev, question: '' }));
    setTestingRag(true);

    try {
      await whatsappService.testRagChatbot(testQuery.phone, userMsg);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Response processed successfully by RAG model. Auto-notification dispatched to parent WhatsApp number.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `RAG System Error: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setTestingRag(false);
    }
  };

  const handleCreateBroadcast = () => {
    createBroadcastMutation.mutate(newBroadcast, {
      onSuccess: () => {
        setShowBroadcastDialog(false);
        setNewBroadcast({ name: '', templateId: 'fee_reminder' });
        toast.success('Broadcast campaign created.');
      },
    });
  };

  const handleSendBroadcast = (id: string) => {
    if (confirm('Send this campaign to target audiences now?')) {
      sendBroadcastMutation.mutate(id, {
        onSuccess: () => toast.success('Broadcast campaign sent!'),
      });
    }
  };

  const activeTemplates = (templates as any)?.data || templates || [];
  const activeSessions = sessions?.data?.items || [];
  const activeBroadcasts = broadcasts?.data?.items || [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="WhatsApp Automation & RAG Bot" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-500" /> WhatsApp & RAG AI Hub
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Manage Meta API integration, broadcast notifications, and test live AI parent inquiry
              responses.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeedTemplates}>
              <RefreshCw className="w-4 h-4 mr-2" /> Sync Templates
            </Button>
            <Button onClick={() => setShowBroadcastDialog(true)}>
              <Send className="w-4 h-4 mr-2" /> Create Campaign
            </Button>
          </div>
        </div>

        {/* Credentials & Chatbot Console */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credentials Card */}
          <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-5 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Credentials & Agent Settings
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Meta API parameters & RAG AI switch.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-zinc-500">Phone Number ID</span>
                  <button
                    onClick={openMetaConfigDialog}
                    className="text-[10px] text-brand font-bold uppercase hover:underline"
                  >
                    Configure
                  </button>
                </div>
                <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 truncate">
                  {((config as any)?.data || config)?.phoneNumberId || 'Masked (Not Seeded)'}
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                    RAG Chatbot Agent
                  </span>
                  <span className="text-[10px] text-zinc-500">Automated AI WhatsApp Replies</span>
                </div>
                <Badge
                  variant={((config as any)?.data || config)?.enableRag ? 'success' : 'secondary'}
                >
                  {((config as any)?.data || config)?.enableRag ? 'ENABLED' : 'DISABLED'}
                </Badge>
              </div>
            </div>

            <Button variant="outline" onClick={openMetaConfigDialog} className="w-full">
              <Settings className="w-4 h-4 mr-2" /> Meta API Credentials
            </Button>
          </div>

          {/* Interactive RAG Simulator */}
          <div className="lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-950 p-5 shadow-lg flex flex-col justify-between gap-4 text-zinc-200 min-h-[380px]">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  RAG AI Chatbot Console
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Target Phone:</span>
                <input
                  type="text"
                  value={testQuery.phone}
                  onChange={(e) => setTestQuery({ ...testQuery, phone: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-xs text-emerald-400 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto max-h-56 flex flex-col gap-3 py-2">
              {chatHistory.map((msg, index) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 text-xs ${
                        isBot
                          ? 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                          : 'bg-brand text-white'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="block text-[8px] mt-1 text-zinc-500 text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              {testingRag && (
                <p className="text-xs text-zinc-500 italic">RAG AI model thinking...</p>
              )}
            </div>

            {/* Chat Input Console */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg">
              <input
                type="text"
                value={testQuery.question}
                onChange={(e) => setTestQuery({ ...testQuery, question: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleTestRag()}
                placeholder="Ask query, e.g. 'What is the fee due date for Class 10?'"
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none placeholder:text-zinc-600"
              />
              <Button
                onClick={handleTestRag}
                isLoading={testingRag}
                disabled={!testQuery.question.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Data Tables */}
        <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-5 shadow-sm space-y-4">
          <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 gap-1 w-max">
            <button
              onClick={() => setTab('templates')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Meta Templates ({activeTemplates.length})
            </button>
            <button
              onClick={() => setTab('conversations')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'conversations'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Parent Conversations
            </button>
            <button
              onClick={() => setTab('broadcasts')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'broadcasts'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Broadcast Campaigns
            </button>
          </div>

          {activeTab === 'templates' && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Template Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {activeTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                        No templates found. Click 'Sync Templates' to pull defaults.
                      </td>
                    </tr>
                  ) : (
                    activeTemplates.map((t: any, i: number) => (
                      <tr key={t.id || i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.name}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{t.category}</td>
                        <td className="px-4 py-3 font-mono text-zinc-500">{t.language}</td>
                        <td className="px-4 py-3">
                          <Badge variant={t.status === 'APPROVED' ? 'success' : 'warning'}>
                            {t.status || 'APPROVED'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Contact Name</th>
                    <th className="px-4 py-3">WhatsApp Number</th>
                    <th className="px-4 py-3">Last Message Received</th>
                    <th className="px-4 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                        No active parent conversation sessions logged.
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((s: any, i: number) => (
                      <tr key={s.id || i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {s.contactName}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-500">{s.phoneNumber}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {s.lastMessage}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'broadcasts' && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Campaign Name</th>
                    <th className="px-4 py-3">Applied Template</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {activeBroadcasts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                        No broadcast campaigns created yet.
                      </td>
                    </tr>
                  ) : (
                    activeBroadcasts.map((b: any, i: number) => (
                      <tr key={b.id || i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {b.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500">{b.templateName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={b.status === 'SENT' ? 'success' : 'warning'}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {b.status === 'DRAFT' ? (
                            <Button onClick={() => handleSendBroadcast(b.id)}>
                              <Send className="w-3.5 h-3.5 mr-1" /> Send Now
                            </Button>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-400">DISPATCHED</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Dialog */}
      <Dialog
        isOpen={showBroadcastDialog}
        onClose={() => setShowBroadcastDialog(false)}
        title="Create Broadcast Campaign"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Campaign Name *
            </label>
            <Input
              value={newBroadcast.name}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, name: e.target.value })}
              placeholder="e.g. Q1 Fee Pending Alert"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Select Template *
            </label>
            <Select
              value={newBroadcast.templateId}
              options={
                activeTemplates.map((t: any) => ({ label: t.name, value: t.name })) || [
                  { label: 'fee_reminder', value: 'fee_reminder' },
                  { label: 'attendance_alert', value: 'attendance_alert' },
                ]
              }
              onChange={(e) => setNewBroadcast({ ...newBroadcast, templateId: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateBroadcast} isLoading={createBroadcastMutation.isPending}>
            Create Campaign
          </Button>
        </div>
      </Dialog>

      {/* Meta API Config Dialog */}
      <Dialog
        isOpen={showMetaConfigDialog}
        onClose={() => setShowMetaConfigDialog(false)}
        title="Configure Meta API Credentials"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Phone Number ID
            </label>
            <Input
              value={metaConfigForm.phoneNumberId}
              onChange={(e) =>
                setMetaConfigForm({ ...metaConfigForm, phoneNumberId: e.target.value })
              }
              placeholder="e.g. 102938475610293"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Business Account ID
            </label>
            <Input
              value={metaConfigForm.businessId}
              onChange={(e) => setMetaConfigForm({ ...metaConfigForm, businessId: e.target.value })}
              placeholder="e.g. 102938475610294"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Permanent Access Token
            </label>
            <textarea
              value={metaConfigForm.accessToken}
              onChange={(e) =>
                setMetaConfigForm({ ...metaConfigForm, accessToken: e.target.value })
              }
              placeholder="EAAGm0..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowMetaConfigDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleUpdateConfig(metaConfigForm)}
            isLoading={updateConfigMutation.isPending}
          >
            Save Credentials
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
