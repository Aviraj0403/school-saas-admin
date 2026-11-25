'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { whatsappService } from '@/services/whatsapp.service';
import { useSaveWhatsAppTemplate } from '@/hooks/queries/useWhatsApp';
import { errorMessage } from '@/lib/errorMessage';

const CATEGORIES = [
  { label: 'Utility', value: 'UTILITY' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Authentication', value: 'AUTHENTICATION' },
];

/** Create (template === null && isOpen) or edit a template. Edit keeps the name fixed. */
export function TemplateDialog({
  isOpen,
  template,
  onClose,
}: {
  isOpen: boolean;
  template: any | null;
  onClose: () => void;
}) {
  const save = useSaveWhatsAppTemplate();
  const [f, setF] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en',
    body: '',
    header: '',
    footer: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setF({
      name: template?.name ?? '',
      category: template?.category ?? 'UTILITY',
      language: template?.language ?? 'en',
      body: template?.body ?? '',
      header: template?.header ?? '',
      footer: template?.footer ?? '',
    });
  }, [isOpen, template]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category: f.category,
      language: f.language || 'en',
      body: f.body,
      header: f.header || undefined,
      footer: f.footer || undefined,
    };
    save.mutate(
      template
        ? { name: template.name, data: payload }
        : {
            data: {
              name: f.name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_'),
              ...payload,
            },
          },
      {
        onSuccess: () => {
          toast.success(template ? 'Template updated.' : 'Template created.');
          onClose();
        },
        onError: (err) => toast.error(errorMessage(err, 'Could not save template')),
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={template ? `Edit template - ${template.name}` : 'New template'}
    >
      <form onSubmit={submit} className="flex min-h-0 flex-col gap-4 overflow-y-auto px-7 pb-6">
        {!template && (
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Template name * (letters, numbers, underscore)
            <Input
              value={f.name}
              required
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="fee_notice"
            />
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Category
            <Select
              value={f.category}
              options={CATEGORIES}
              onChange={(e) => setF({ ...f, category: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Language
            <Input value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Header (optional)
          <Input value={f.header} onChange={(e) => setF({ ...f, header: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Body * (use {'{{1}}'}, {'{{2}}'} for variables)
          <Textarea
            value={f.body}
            required
            onChange={(e) => setF({ ...f, body: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Footer (optional)
          <Input value={f.footer} onChange={(e) => setF({ ...f, footer: e.target.value })} />
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            {template ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

const statusVariant = (s?: string): 'success' | 'info' | 'danger' | 'warning' | 'secondary' => {
  switch ((s ?? '').toLowerCase()) {
    case 'delivered':
    case 'read':
      return 'success';
    case 'sent':
      return 'info';
    case 'failed':
      return 'danger';
    case 'pending':
      return 'warning';
    default:
      return 'secondary';
  }
};

/** Per-recipient delivery status for a broadcast: GET /whatsapp/broadcasts/:id/deliveries. */
export function DeliveriesDialog({
  broadcast,
  onClose,
}: {
  broadcast: any | null;
  onClose: () => void;
}) {
  const { data, isPending, error } = useQuery({
    queryKey: ['whatsapp-deliveries', broadcast?.id],
    queryFn: () => whatsappService.getDeliveries(broadcast!.id),
    enabled: !!broadcast?.id,
  });
  const rows: any[] = data ?? [];
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    const k = (r.status ?? 'unknown').toLowerCase();
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog
      isOpen={!!broadcast}
      onClose={onClose}
      title={broadcast ? `Deliveries - ${broadcast.name}` : 'Deliveries'}
      className="max-w-2xl"
    >
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-7 pb-6">
        {isPending && <p className="text-sm text-zinc-500">Loading deliveries...</p>}
        {error && <p className="text-sm text-rose-600">{errorMessage(error)}</p>}
        {!isPending && !error && rows.length === 0 && (
          <p className="text-sm text-zinc-500">No recipients recorded for this broadcast yet.</p>
        )}
        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(counts).map(([k, v]) => (
                <Badge key={k} variant={statusVariant(k)}>
                  {k}: {v}
                </Badge>
              ))}
            </div>
            <div className="divide-y divide-border rounded-xl border border-border text-xs">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 p-3">
                  <span className="font-mono">{r.phone}</span>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  <span className="flex-1 text-rose-600">{r.error || ''}</span>
                  <span className="text-zinc-400">
                    {r.readAt
                      ? `read ${new Date(r.readAt).toLocaleString()}`
                      : r.deliveredAt
                        ? `delivered ${new Date(r.deliveredAt).toLocaleString()}`
                        : r.sentAt
                          ? `sent ${new Date(r.sentAt).toLocaleString()}`
                          : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
