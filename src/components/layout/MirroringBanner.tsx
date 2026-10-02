'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function MirroringBanner() {
  const { isMirroring, activeUser, originalUser, exitMirroring } = useAuthStore();

  if (!isMirroring || !activeUser) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-[60] relative animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
        <i className="pi pi-eye text-sm animate-bounce"></i>
        <span>
          MIRROR MODE ACTIVE: You are viewing the platform as{' '}
          <strong className="underline underline-offset-2">{activeUser.name}</strong> (
          {activeUser.role})
        </span>
        {originalUser && (
          <span className="opacity-80 hidden md:inline">• Original Admin: {originalUser.name}</span>
        )}
      </div>

      <button
        onClick={() => {
          exitMirroring();
          window.location.href = '/dashboard';
        }}
        className="px-3 py-1 bg-white text-amber-900 rounded-md font-extrabold hover:bg-amber-50 transition-all text-[11px] shadow-sm flex items-center gap-1 cursor-pointer"
      >
        <i className="pi pi-sign-out text-xs"></i>
        <span>Exit Mirroring</span>
      </button>
    </div>
  );
}
