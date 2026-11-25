'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const COPY: Record<string, { title: string; body: string }> = {
  tenant_suspended: {
    title: 'This school account is suspended',
    body: 'Access has been paused, usually because a subscription payment is overdue. Please contact your school administrator or JD Info support to restore it.',
  },
  account_blocked: {
    title: 'Your account is disabled',
    body: 'Your login has been turned off by the school. Please contact your school administrator.',
  },
  default: {
    title: 'Access paused',
    body: 'We could not open this school right now. Please contact your school administrator.',
  },
};

export default function AccountSuspendedPage() {
  const [reason, setReason] = useState('default');
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('reason');
    if (r) setReason(r);
  }, []);

  const c = COPY[reason] ?? COPY.default;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{c.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{c.body}</p>
        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          Sign in again
        </button>
      </div>
    </main>
  );
}
