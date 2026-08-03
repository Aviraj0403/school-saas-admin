'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { biometricService, BiometricDevice } from '@/services/staffAttendance.service';

const STATUS_STYLES: Record<string, string> = {
  ONLINE: 'bg-emerald-500/10 text-emerald-600',
  OFFLINE: 'bg-amber-500/10 text-amber-600',
  REVOKED: 'bg-rose-500/10 text-rose-600',
};

/**
 * Biometric device provisioning.
 *
 * Replaces the "Biometric Sync & Telemetry" panel on the attendance screen,
 * which rendered hardcoded terminals — BIO-01-MAIN, 192.168.1.120, a pulsing
 * ONLINE dot and a "Real-Time Ingestion Enabled" badge — with no network call
 * behind any of it, while the real provisioning endpoints went unused. Status
 * here is the server's: a unit that has not sent a heartbeat in 15 minutes is
 * reported OFFLINE.
 */
export default function BiometricDevicesPage() {
  const toast = React.useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ deviceId: '', name: '', location: '' });
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const { data: devices = [], isPending } = useQuery({
    queryKey: ['biometric-devices'],
    queryFn: biometricService.getDevices,
    refetchInterval: 60_000,
  });

  const provisionMutation = useMutation({
    mutationFn: () => biometricService.provisionDevice(form),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      setShowAdd(false);
      setForm({ deviceId: '', name: '', location: '' });
      // The server stores only a hash — this is the one and only time the key
      // is visible, so it gets its own dialog rather than a toast.
      setIssuedKey(data?.deviceKey ?? data?.key ?? null);
    },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not provision the unit.', life: 3000 }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => biometricService.revokeDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.current?.show({ severity: 'success', summary: 'Revoked', detail: 'The unit can no longer post punches.', life: 3000 });
    },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not revoke the unit.', life: 3000 }),
  });

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Biometric Devices" subtitle="Attendance" />
      <Toast ref={toast} />

      <div className="flex flex-col gap-4 pb-10 animate-fade-in">
        <div className="flex justify-between items-center">
          <p className="text-xs text-zinc-500 max-w-2xl">
            Units authenticate with a device key, not a user login. A unit that has not sent a
            heartbeat in 15 minutes shows as offline. Revoking is immediate and permanent — the
            unit must be re-provisioned to post again.
          </p>
          <Button
            label="Provision Unit"
            icon="pi pi-plus"
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 px-5 rounded-md border-0"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
          <DataTable value={devices} loading={isPending} emptyMessage="No biometric units provisioned yet." dataKey="id">
            <Column header="Unit" body={(d: BiometricDevice) => (
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{d.deviceId}</span>
                <span className="text-[10px] text-zinc-400">{d.name || '—'}</span>
              </div>
            )} />
            <Column header="Location" body={(d: BiometricDevice) => (
              <span className="text-xs text-zinc-500">{d.location || '—'}</span>
            )} />
            <Column header="Status" body={(d: BiometricDevice) => (
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${STATUS_STYLES[d.status] ?? ''}`}>
                {d.status}
              </span>
            )} />
            <Column header="Last seen" body={(d: BiometricDevice) => (
              <span className="text-xs text-zinc-500">
                {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'never'}
              </span>
            )} />
            <Column header="Last IP" body={(d: BiometricDevice) => (
              <span className="text-xs font-mono text-zinc-500">{d.lastIp || '—'}</span>
            )} />
            <Column header="" body={(d: BiometricDevice) => (
              d.isActive ? (
                <Button
                  label="Revoke"
                  onClick={() => confirm(`Revoke ${d.deviceId}? It will stop posting punches immediately.`) && revokeMutation.mutate(d.id)}
                  className="p-2 px-3 text-xs rounded-md border border-rose-200 text-rose-600"
                />
              ) : <span className="text-[10px] text-zinc-400">revoked</span>
            )} />
          </DataTable>
        </div>
      </div>

      <Dialog header="Provision Biometric Unit" visible={showAdd} onHide={() => setShowAdd(false)} style={{ width: '420px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Device ID</label>
            <InputText
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
              placeholder="BIO-01-MAIN"
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md font-mono text-sm"
            />
            <span className="text-[10px] text-zinc-400">The code printed on the unit.</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
            <InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main gate scanner" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Location</label>
            <InputText value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Reception" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          </div>
          <Button
            label="Provision"
            loading={provisionMutation.isPending}
            disabled={!form.deviceId}
            onClick={() => provisionMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md border-0 mt-2"
          />
        </div>
      </Dialog>

      {/* Shown once — the server keeps only a hash of this key. */}
      <Dialog header="Device Key — shown once" visible={!!issuedKey} onHide={() => setIssuedKey(null)} style={{ width: '520px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Copy this into the unit now. It is stored only as a hash on the server and cannot be
            shown again — if it is lost, revoke the unit and provision it afresh.
          </p>
          <code className="block p-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md font-mono text-sm break-all">
            {issuedKey}
          </code>
          <Button
            label="Copy"
            icon="pi pi-copy"
            onClick={() => { navigator.clipboard?.writeText(issuedKey ?? ''); toast.current?.show({ severity: 'success', summary: 'Copied', life: 2000 }); }}
            className="bg-zinc-900 text-white font-bold p-2.5 rounded-md border-0"
          />
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
