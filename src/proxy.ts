// proxy.ts — Next.js 16 authentication session refresh entry point.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
// Refresh authentication before the protected dashboard and sign-in page.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}
export const config = { matcher: ["/", "/auth"] };
