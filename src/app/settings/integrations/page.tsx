'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiKeyService,
  webhookService,
  ApiKeySummary,
  WebhookSummary,
} from '@/services/platform.service';
import { Plus, Key, Webhook, Copy, ShieldAlert } from 'lucide-react';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');

  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', expiresInDays: '' });
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const [showHookDialog, setShowHookDialog] = useState(false);
  const [hookForm, setHookForm] = useState<{ url: string; events: string[] }>({
    url: '',
    events: [],
  });

  const { data: keys = [], isPending: loadingKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeyService.list,
  });
  const { data: hooks = [], isPending: loadingHooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: webhookService.list,
  });
  const { data: events = [] } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: webhookService.listEvents,
  });

  const createKey = useMutation({
    mutationFn: () =>
      apiKeyService.create({
        name: keyForm.name,
        expiresInDays: keyForm.expiresInDays ? Number(keyForm.expiresInDays) : undefined,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowKeyDialog(false);
      setKeyForm({ name: '', expiresInDays: '' });
      setIssuedKey(data?.key ?? data?.apiKey ?? data?.rawKey ?? null);
    },
    onError: () => toast.error('Could not create the API key.'),
  });

  const revokeKey = useMutation({
    mutationFn: (prefix: string) => apiKeyService.revoke(prefix),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked.');
    },
    onError: () => toast.error('Could not revoke the key.'),
  });

  const createHook = useMutation({
    mutationFn: () => webhookService.register(hookForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setShowHookDialog(false);
      setHookForm({ url: '', events: [] });
      toast.success('Webhook registered successfully.');
    },
    onError: () => toast.error('Could not register the webhook.'),
  });

  const deactivateHook = useMutation({
    mutationFn: (id: string) => webhookService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.info('Webhook deactivated.');
    },
    onError: () => toast.error('Could not deactivate webhook.'),
  });

  const toggleEvent = (evt: string) =>
    setHookForm((f) => ({
      ...f,
      events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
    }));

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Integrations" subtitle="Settings" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Navigation Tabs */}
        <div className="flex bg-white dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl w-max">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'keys'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> API Secret Keys
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'webhooks'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" /> Event Webhooks
          </button>
        </div>

        {/* Tab Content: API Keys */}
        {activeTab === 'keys' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-zinc-500 max-w-2xl">
                Keys authenticate server-to-server calls. Full values are displayed once on
                creation.
              </p>
              <Button onClick={() => setShowKeyDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> New API Key
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3.5">Key Name</th>
                    <th className="px-4 py-3.5">Prefix Token</th>
                    <th className="px-4 py-3.5">Expires</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loadingKeys ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                        <p className="text-xs">Loading API keys...</p>
                      </td>
                    </tr>
                  ) : keys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                        No API keys generated yet.
                      </td>
                    </tr>
                  ) : (
                    keys.map((k: ApiKeySummary) => (
                      <tr key={k.prefix} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {k.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500">{k.prefix}…</td>
                        <td className="px-4 py-3 text-zinc-500 font-mono">
                          {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'never'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            onClick={() =>
                              confirm(
                                `Revoke "${k.name}"? Calls using it will fail immediately.`
                              ) && revokeKey.mutate(k.prefix)
                            }
                            className="text-rose-600 border-rose-200/80 hover:bg-rose-50"
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-zinc-500 max-w-2xl">
                Register an endpoint URL to receive real-time webhook event dispatches.
              </p>
              <Button onClick={() => setShowHookDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Webhook
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3.5">Endpoint URL</th>
                    <th className="px-4 py-3.5">Subscribed Events</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loadingHooks ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-zinc-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                        <p className="text-xs">Loading webhooks...</p>
                      </td>
                    </tr>
                  ) : hooks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-zinc-400">
                        No webhooks registered.
                      </td>
                    </tr>
                  ) : (
                    hooks.map((h: WebhookSummary) => (
                      <tr key={h.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono text-brand font-semibold break-all">
                          {h.url}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(h.events ?? []).map((e) => (
                              <Badge key={e} variant="secondary">
                                {e}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            onClick={() => deactivateHook.mutate(h.id)}
                            className="text-rose-600 border-rose-200/80 hover:bg-rose-50"
                          >
                            Deactivate
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Key Dialog */}
      <Dialog
        isOpen={showKeyDialog}
        onClose={() => setShowKeyDialog(false)}
        title="Generate API Secret Key"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Key Name *
            </label>
            <Input
              value={keyForm.name}
              onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
              placeholder="e.g. Attendance Sync Server"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Expires in (Days)
            </label>
            <Input
              type="number"
              value={keyForm.expiresInDays}
              onChange={(e) => setKeyForm({ ...keyForm, expiresInDays: e.target.value })}
              placeholder="Leave blank for no expiration"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowKeyDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createKey.mutate()}
            isLoading={createKey.isPending}
            disabled={!keyForm.name}
          >
            Generate Key
          </Button>
        </div>
      </Dialog>

      {/* Secret Key Display Dialog */}
      <Dialog
        isOpen={!!issuedKey}
        onClose={() => setIssuedKey(null)}
        title="API Secret Key (Shown Once)"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Store this secret key safely. It will never be displayed again after closing this
              modal.
            </p>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-xs text-emerald-400 break-all select-all">
            {issuedKey}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            onClick={() => {
              if (issuedKey) {
                navigator.clipboard?.writeText(issuedKey);
                toast.success('API Secret Key copied to clipboard.');
              }
            }}
          >
            <Copy className="w-4 h-4 mr-2" /> Copy Secret Key
          </Button>
        </div>
      </Dialog>

      {/* Webhook Register Dialog */}
      <Dialog
        isOpen={showHookDialog}
        onClose={() => setShowHookDialog(false)}
        title="Register Event Webhook"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Endpoint URL *
            </label>
            <Input
              value={hookForm.url}
              onChange={(e) => setHookForm({ ...hookForm, url: e.target.value })}
              placeholder="https://example.com/api/webhooks"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Subscribed Events *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/30">
              {(events as string[]).length === 0 ? (
                <span className="text-xs text-zinc-400 col-span-2">
                  No event definitions advertised by server.
                </span>
              ) : (
                (events as string[]).map((e) => (
                  <label
                    key={e}
                    className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={hookForm.events.includes(e)}
                      onChange={() => toggleEvent(e)}
                      className="rounded border-zinc-300 text-brand focus:ring-brand"
                    />
                    <span className="font-mono">{e}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowHookDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createHook.mutate()}
            isLoading={createHook.isPending}
            disabled={!hookForm.url || hookForm.events.length === 0}
          >
            Register Webhook
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
