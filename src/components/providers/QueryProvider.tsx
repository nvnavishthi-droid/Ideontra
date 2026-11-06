// QueryProvider.tsx — Make TanStack Query available to client components.
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@/lib/query-client";

interface QueryProviderProps {
  children: ReactNode;
}

// Supply the shared query client without making the root layout client-only.
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
