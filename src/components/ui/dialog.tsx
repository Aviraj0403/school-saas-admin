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

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#140f2d]/45 dark:bg-black/70 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col rounded-3xl bg-card border border-border shadow-pop overflow-hidden animate-slide-up',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 px-7 pt-6 pb-4 shrink-0">
            <h3 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-zinc-400 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white transition-colors p-2 rounded-full"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="px-7 pb-7 pt-2 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
