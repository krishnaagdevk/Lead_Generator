"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { OfflineSyncProvider } from "@/components/providers/OfflineSyncProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineSyncProvider>{children}</OfflineSyncProvider>
    </QueryClientProvider>
  );
}
