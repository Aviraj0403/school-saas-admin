'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/** Centered modal on desktop; a bottom sheet on phones (thumb-reachable, safe-area aware). */
export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="shell-scrim animate-fade-in fixed inset-0" onClick={onClose} />

      <div
        className={cn(
          'animate-slide-up relative z-50 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-border bg-card shadow-pop sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl',
          className
        )}
      >
        {/* sheet grabber, phones only */}
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden"
          aria-hidden="true"
        />
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-3 sm:px-7 sm:pt-6">
            <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:px-7 sm:pb-7">
          {children}
        </div>
      </div>
    </div>
  );
}
