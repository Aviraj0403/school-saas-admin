'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyService, webhookService, ApiKeySummary, WebhookSummary } from '@/services/platform.service';

/**
 * API keys and webhooks.
 *
 * Both had working endpoints and no UI, so a school on a plan that includes
 * API access or webhooks could not actually set either up — the feature was
 * sold and unusable. Keys are shown once on creation because the server stores
 * only a bcrypt hash and looks them up by prefix.
 */
export default function IntegrationsPage() {
  const toast = React.useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', expiresInDays: '' });
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const [showHookDialog, setShowHookDialog] = useState(false);
  const [hookForm, setHookForm] = useState<{ url: string; events: string[] }>({ url: '', events: [] });

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

  const notify = (severity: 'success' | 'error' | 'info', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'error' ? 'Error' : 'Done', detail, life: 3000 });

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
    onError: () => notify('error', 'Could not create the key.'),
  });

  const revokeKey = useMutation({
    mutationFn: (prefix: string) => apiKeyService.revoke(prefix),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['api-keys'] }); notify('success', 'Key revoked.'); },
    onError: () => notify('error', 'Could not revoke the key.'),
  });

  const createHook = useMutation({
    mutationFn: () => webhookService.register(hookForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setShowHookDialog(false);
      setHookForm({ url: '', events: [] });
      notify('success', 'Webhook registered.');
    },
    onError: () => notify('error', 'Could not register the webhook.'),
  });

  const deactivateHook = useMutation({
    mutationFn: (id: string) => webhookService.deactivate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webhooks'] }); notify('info', 'Webhook deactivated.'); },
    onError: () => notify('error', 'Could not deactivate the webhook.'),
  });

  const toggleEvent = (evt: string) =>
    setHookForm((f) => ({
      ...f,
      events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
    }));

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Integrations" subtitle="Settings" />
      <Toast ref={toast} />

      <div className="pb-10 animate-fade-in">
        <TabView>
          <TabPanel header="API Keys">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-zinc-500 max-w-2xl">
                Keys authenticate server-to-server calls. The full value is shown once on creation —
                the server keeps only a hash and identifies keys by their prefix.
              </p>
              <Button label="New Key" icon="pi pi-plus" onClick={() => setShowKeyDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 px-5 rounded-md border-0" />
            </div>
            <DataTable value={keys} loading={loadingKeys} emptyMessage="No API keys yet." dataKey="prefix">
              <Column field="name" header="Name" />
              <Column header="Prefix" body={(k: ApiKeySummary) => <code className="text-xs font-mono text-zinc-500">{k.prefix}…</code>} />
              <Column header="Expires" body={(k: ApiKeySummary) => (
                <span className="text-xs text-zinc-500">{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'never'}</span>
              )} />
              <Column header="" body={(k: ApiKeySummary) => (
                <Button
                  label="Revoke"
                  onClick={() => confirm(`Revoke "${k.name}"? Calls using it will fail immediately.`) && revokeKey.mutate(k.prefix)}
                  className="p-2 px-3 text-xs rounded-md border border-rose-200 text-rose-600"
                />
              )} />
            </DataTable>
          </TabPanel>

          <TabPanel header="Webhooks">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-zinc-500 max-w-2xl">
                Register an endpoint to receive events as they happen. Deactivating stops delivery
                without removing the record.
              </p>
              <Button label="Add Webhook" icon="pi pi-plus" onClick={() => setShowHookDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 px-5 rounded-md border-0" />
            </div>
            <DataTable value={hooks} loading={loadingHooks} emptyMessage="No webhooks registered." dataKey="id">
              <Column header="Endpoint" body={(h: WebhookSummary) => <code className="text-xs break-all">{h.url}</code>} />
              <Column header="Events" body={(h: WebhookSummary) => (
                <div className="flex flex-wrap gap-1">
                  {(h.events ?? []).map((e) => (
                    <span key={e} className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{e}</span>
                  ))}
                </div>
              )} />
              <Column header="" body={(h: WebhookSummary) => (
                <Button label="Deactivate" onClick={() => deactivateHook.mutate(h.id)} className="p-2 px-3 text-xs rounded-md border border-rose-200 text-rose-600" />
              )} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog header="New API Key" visible={showKeyDialog} onHide={() => setShowKeyDialog(false)} style={{ width: '420px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
            <InputText value={keyForm.name} onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} placeholder="Attendance sync job" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Expires in (days)</label>
            <InputText value={keyForm.expiresInDays} onChange={(e) => setKeyForm({ ...keyForm, expiresInDays: e.target.value })} placeholder="leave blank for no expiry" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          </div>
          <Button label="Create" loading={createKey.isPending} disabled={!keyForm.name} onClick={() => createKey.mutate()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md border-0 mt-2" />
        </div>
      </Dialog>

      <Dialog header="API Key — shown once" visible={!!issuedKey} onHide={() => setIssuedKey(null)} style={{ width: '560px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Store this now. The server keeps only a hash and cannot show it again — if it is lost,
            revoke the key and create another.
          </p>
          <code className="block p-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md font-mono text-sm break-all">{issuedKey}</code>
          <Button label="Copy" icon="pi pi-copy" onClick={() => { navigator.clipboard?.writeText(issuedKey ?? ''); notify('success', 'Copied.'); }} className="bg-zinc-900 text-white font-bold p-2.5 rounded-md border-0" />
        </div>
      </Dialog>

      <Dialog header="Register Webhook" visible={showHookDialog} onHide={() => setShowHookDialog(false)} style={{ width: '520px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Endpoint URL</label>
            <InputText value={hookForm.url} onChange={(e) => setHookForm({ ...hookForm, url: e.target.value })} placeholder="https://example.com/hooks/school" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Events</label>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-zinc-150 dark:border-zinc-800 rounded-md p-3">
              {(events as string[]).length === 0 && <span className="text-xs text-zinc-400">No events advertised by the server.</span>}
              {(events as string[]).map((e) => (
                <label key={e} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Checkbox checked={hookForm.events.includes(e)} onChange={() => toggleEvent(e)} />
                  <span className="font-mono">{e}</span>
                </label>
              ))}
            </div>
          </div>
          <Button label="Register" loading={createHook.isPending} disabled={!hookForm.url || hookForm.events.length === 0} onClick={() => createHook.mutate()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md border-0 mt-2" />
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
