"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { OfflineSyncProvider } from "@/components/providers/OfflineSyncProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60, refetchOnWindowFocus: false, retry: 1 },
        },
      })
  );

  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <OfflineSyncProvider>{children}</OfflineSyncProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}
