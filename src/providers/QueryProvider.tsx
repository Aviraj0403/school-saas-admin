'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale time by default
            refetchOnWindowFocus: false, // Don't refetch on window focus by default
          },
        },
      })
  );

  // Signing out must not leave the previous user's data in the cache.
  useEffect(() => {
    const clear = () => queryClient.clear();
    window.addEventListener('auth:logout', clear);
    return () => window.removeEventListener('auth:logout', clear);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
