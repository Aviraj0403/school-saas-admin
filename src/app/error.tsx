'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the caught exception
    console.error('Unhandled client-side exception caught:', error);

    // If it's a chunk loading error (common during deployment desync on Vercel),
    // automatically force a hard reload to get the latest bundle.
    const isChunkError = 
      error.message?.includes('Loading chunk') || 
      error.message?.includes('failed to load') ||
      error.name === 'ChunkLoadError';

    if (isChunkError) {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-8 max-w-md w-full text-center shadow-xl flex flex-col gap-6">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md flex items-center justify-center text-2xl mx-auto">
          <i className="pi pi-exclamation-triangle"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            The page encountered an unexpected error:
            <br />
            <span className="font-mono text-rose-400 mt-1 block">{error.message || 'Unknown error'}</span>

          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md shadow-md transition-all active:scale-95 text-sm"
          >
            Reload Page
          </button>
          <button
            onClick={() => reset()}
            className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold p-3 rounded-md transition-all active:scale-95 text-sm border border-zinc-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
