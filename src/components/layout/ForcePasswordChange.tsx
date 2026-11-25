'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';
import { errorMessage } from '@/lib/errorMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const doneKey = (id: string) => `pwd-changed:${id}`;

/**
 * Blocking dialog shown while the signed-in user still has the temporary password
 * (GET /auth/me -> mustChangePassword). It cannot be dismissed.
 */
export default function ForcePasswordChange() {
  const user = useAuthStore((s) => s.user);
  const isMirroring = useAuthStore((s) => s.isMirroring);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  let suppressed = false;
  try {
    suppressed = !!user && sessionStorage.getItem(doneKey(user.id)) === '1';
  } catch {
    /* storage unavailable */
  }

  if (!user || !user.mustChangePassword || isMirroring || suppressed) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error('New password must be at least 8 characters.');
    if (next !== confirm) return toast.error('Passwords do not match.');
    if (next === current) return toast.error('Choose a password different from the current one.');
    setBusy(true);
    try {
      await authService.changePassword({ currentPassword: current, newPassword: next });
      try {
        // /auth/me may keep reporting the flag; remember the change for this session.
        sessionStorage.setItem(doneKey(user.id), '1');
      } catch {
        /* ignore */
      }
      useAuthStore.setState((st) => ({
        user: st.user ? { ...st.user, mustChangePassword: false } : st.user,
        activeUser:
          st.activeUser && st.activeUser.id === st.user?.id
            ? { ...st.activeUser, mustChangePassword: false }
            : st.activeUser,
      }));
      toast.success('Password changed.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#140f2d]/70 p-4 backdrop-blur-md">
      <form
        onSubmit={submit}
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-border bg-card p-7 shadow-pop"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              Set a new password
            </h2>
            <p className="text-xs text-zinc-500">
              You are using a temporary password. Choose your own to continue.
            </p>
          </div>
        </div>
        <Input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Current (temporary) password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="New password (min 8 characters)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" isLoading={busy}>
          Change password
        </Button>
      </form>
    </div>
  );
}
