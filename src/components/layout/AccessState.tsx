'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldOff, Lock } from 'lucide-react';

/** Shown in place of a page the role cannot open or the plan does not include. */
export function AccessState({ status }: { status: 'off' | 'denied' }) {
  const off = status === 'off';
  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        {off ? <Lock className="size-6" /> : <ShieldOff className="size-6" />}
      </span>
      <h2 className="text-lg font-semibold">
        {off ? 'Not included in your plan' : 'You do not have access'}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {off
          ? 'This feature is switched off for your school. Ask your school administrator or contact support to enable it.'
          : 'Your role cannot open this page. If you think this is a mistake, ask your school administrator.'}
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
