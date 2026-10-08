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
import { biometricService, BiometricDevice } from '@/services/staffAttendance.service';
import { Plus, Copy, ShieldAlert, Cpu } from 'lucide-react';

const STATUS_BADGE_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  ONLINE: 'success',
  OFFLINE: 'warning',
  REVOKED: 'danger',
};

export default function BiometricDevicesPage() {
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
      setIssuedKey(data?.deviceKey ?? data?.key ?? null);
    },
    onError: () => toast.error('Could not provision the unit.'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => biometricService.revokeDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.success('The unit has been revoked and can no longer post punches.');
    },
    onError: () => toast.error('Could not revoke the unit.'),
  });

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Biometric Devices" subtitle="Attendance" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-brand" /> Biometric Hardware Terminals
            </h1>
            <p className="text-xs text-zinc-500 max-w-2xl mt-1">
              Units authenticate with a device key. Heartbeats under 15 minutes report ONLINE.
              Revoking is immediate and permanent.
            </p>
          </div>

          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-2" /> Provision Unit
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="px-4 py-3.5">Unit</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Seen</th>
                <th className="px-4 py-3.5">Last IP</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {isPending ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                    <p className="text-xs">Loading hardware units...</p>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                    No biometric units provisioned yet.
                  </td>
                </tr>
              ) : (
                devices.map((d: BiometricDevice) => (
                  <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {d.deviceId}
                        </span>
                        <span className="text-[10px] text-zinc-400">{d.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {d.location || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANTS[d.status] || 'secondary'}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono">
                      {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'never'}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-500">{d.lastIp || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {d.isActive ? (
                        <Button
                          variant="outline"
                          onClick={() =>
                            confirm(
                              `Revoke ${d.deviceId}? It will stop posting punches immediately.`
                            ) && revokeMutation.mutate(d.id)
                          }
                          className="text-rose-600 border-rose-200/80 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400">REVOKED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Dialog */}
      <Dialog isOpen={showAdd} onClose={() => setShowAdd(false)} title="Provision Biometric Unit">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Device ID *
            </label>
            <Input
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
              placeholder="e.g. BIO-01-MAIN"
            />
            <span className="text-[10px] text-zinc-400">
              The hardware identifier printed on the unit casing.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Terminal Name
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Main Gate Scanner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Physical Location
            </label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Reception Desk"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => provisionMutation.mutate()}
            isLoading={provisionMutation.isPending}
            disabled={!form.deviceId}
          >
            Provision Unit
          </Button>
        </div>
      </Dialog>

      {/* Issued Device Key Dialog */}
      <Dialog
        isOpen={!!issuedKey}
        onClose={() => setIssuedKey(null)}
        title="Device Authorization Key (Shown Once)"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Copy this key now. It is stored strictly as an encrypted hash on the server and cannot
              be viewed again.
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
                toast.success('Device key copied to clipboard.');
              }
            }}
          >
            <Copy className="w-4 h-4 mr-2" /> Copy Secret Key
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
