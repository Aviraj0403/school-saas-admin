'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className:
          'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/90 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl p-4 text-xs font-medium',
        style: {
          borderRadius: '1rem',
        },
      }}
    />
  );
}
