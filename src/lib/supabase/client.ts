// client.ts — Centralized browser client using the publishable key only.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";
// Create the browser's shared Supabase client.
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey);
}
