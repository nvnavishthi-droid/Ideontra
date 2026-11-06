// proxy.ts — Refresh session cookies and apply optimistic route protection.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";
// Preserve refreshed cookies and cache headers on normal and redirect responses.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const client = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    },
  );
  const { data } = await client.auth.getClaims();
  if (!data?.claims && request.nextUrl.pathname === "/") {
    const redirected = NextResponse.redirect(new URL("/auth", request.url));
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
