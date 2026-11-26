'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

export default function AppFooter() {
  const year = new Date().getFullYear();
  const { isAdmin } = usePermissions();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row lg:px-6">
        <p>© {year} EduNexus. All rights reserved.</p>
        {isAdmin && (
          <a href="/academics/guide" className="transition-colors hover:text-foreground">
            Help &amp; user guide
          </a>
        )}
      </div>
    </footer>
  );
}
