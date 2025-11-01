'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { ApiError } from '@/lib/api';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error: any) => {
          // Don't retry on authentication/authorization errors
          if (error instanceof ApiError) {
            if (error.status === 401 || error.status === 403) {
              return false;
            }
            // Don't retry on client errors (4xx)
            if (error.status && error.status >= 400 && error.status < 500) {
              return false;
            }
          }
          // Retry up to 3 times for network errors and server errors (5xx)
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}