// server.ts — Request-scoped Supabase client with optional cookie writes.
import "server-only";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";
// Read cookies in rendering and persist them only in actions or route handlers.
export async function createClient(writable = false) {
  await connection();
  const store = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(values) {
        if (writable)
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
      },
    },
  });
}
