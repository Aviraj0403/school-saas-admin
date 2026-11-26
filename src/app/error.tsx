'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled client-side exception caught:', error);

    // A stale chunk after a deploy: reload once to pick up the new bundle.
    const isChunkError =
      error.message?.includes('Loading chunk') ||
      error.message?.includes('failed to load') ||
      error.name === 'ChunkLoadError';
    if (isChunkError && typeof window !== 'undefined') window.location.reload();
  }, [error]);

  return (
    <div className="bg-mesh flex min-h-dvh items-center justify-center p-5">
      <div className="surface-card w-full max-w-md p-7 text-center">
        <span className="tone-rose tone-chip mx-auto flex size-14 items-center justify-center rounded-2xl">
          <AlertTriangle className="size-6" />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page hit an unexpected problem. Your data is safe. Try again, or reload the page.
        </p>
        {error.message && (
          <p className="mt-3 rounded-xl bg-muted p-3 text-left font-mono text-[11px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-white shadow-glow"
          >
            <RotateCw className="size-4" /> Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
