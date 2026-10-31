'use client';

import React from 'react';
import { Eye, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRole } from '@/lib/format';

/**
 * Mirroring only swaps the role the UI renders for — every API call still uses the
 * signed-in admin's token. The banner says so, so nobody mistakes the preview for
 * what that user can actually see or do.
 */
export function MirroringBanner() {
  const { isMirroring, activeUser, exitMirroring } = useAuthStore();

  if (!isMirroring || !activeUser) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-pop animate-slide-up">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-ink">
        <Eye className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">
          Previewing as {activeUser.name} · {formatRole(activeUser.role)}
        </p>
        <p className="truncate text-xs text-white/60">
          Layout preview only — data is still loaded with your own permissions.
        </p>
      </div>
      <button
        onClick={() => {
          exitMirroring();
          window.location.href = '/dashboard';
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-white/90"
      >
        <X className="size-3.5" />
        Exit
      </button>
    </div>
  );
}
