'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      // keep toasts clear of the notch / bottom tabs on phones
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, right: 12, left: 12 }}
      toastOptions={{
        className:
          'bg-card/95 backdrop-blur-xl border border-border text-foreground shadow-pop rounded-2xl p-4 text-[13px] font-medium',
        style: { borderRadius: '1rem' },
      }}
    />
  );
}
