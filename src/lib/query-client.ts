// query-client.ts — Create isolated server caches and a stable browser cache.
import { isServer, QueryClient } from "@tanstack/react-query";

// Create a query client with shared freshness defaults.
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  });
}

let browserQueryClient: QueryClient | undefined;

// Reuse the browser cache while keeping server renders isolated.
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
