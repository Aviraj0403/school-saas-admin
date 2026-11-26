'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorState, Field, Spinner, errMsg } from '@/components/ops/OpsKit';
import { useRazorpayConfig, useSaveRazorpayConfig } from '@/hooks/queries/useFee';

/** School-admin only. Secrets are write-only: the backend returns a mask, which is never shown or re-sent. */
export function RazorpayPanel() {
  const { data, isPending, error, refetch } = useRazorpayConfig();
  const saveM = useSaveRazorpayConfig();
  const [keyId, setKeyId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  useEffect(() => {
    setKeyId(data?.keyId ?? '');
    setDisplayName(data?.displayName ?? '');
    setIsActive(!!data?.isActive);
  }, [data]);

  if (isPending) return <Spinner label="Loading Razorpay setup..." />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const save = () => {
    if (isActive && !keyId.trim())
      return toast.error('Enter the Razorpay Key ID before enabling online payments.');
    saveM.mutate(
      {
        keyId: keyId.trim() || undefined,
        displayName: displayName.trim() || undefined,
        isActive,
        // Omitted when blank so the stored secret is kept.
        ...(keySecret ? { keySecret } : {}),
        ...(webhookSecret ? { webhookSecret } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Razorpay settings saved.');
          setKeySecret('');
          setWebhookSecret('');
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not save Razorpay settings.')),
      }
    );
  };

  return (
    <div className="max-w-xl flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Online payment gateway (Razorpay)</h3>
        <Badge variant={data?.isActive ? 'success' : 'secondary'}>
          {data?.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <Field label="Key ID">
        <Input
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          placeholder="rzp_live_..."
        />
      </Field>
      <Field label="Key secret">
        <Input
          type="password"
          autoComplete="new-password"
          value={keySecret}
          onChange={(e) => setKeySecret(e.target.value)}
          placeholder={
            data?.keySecret ? 'A secret is stored — leave blank to keep it' : 'Paste the key secret'
          }
        />
      </Field>
      <Field label="Webhook secret">
        <Input
          type="password"
          autoComplete="new-password"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder={
            data?.webhookSecret
              ? 'A secret is stored — leave blank to keep it'
              : 'Paste the webhook signing secret'
          }
        />
      </Field>
      <Field label="Name shown at checkout">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </Field>
      <label className="flex items-center gap-3 text-sm text-foreground min-h-11">
        <input
          className="size-5"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Accept online payments from parents
      </label>
      <div>
        <Button className="w-full sm:w-auto" onClick={save} isLoading={saveM.isPending}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
