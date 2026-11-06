// session.ts — Server-only verification of identity and hook-issued role claims.
import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AuthIdentity } from "@/types/auth";
// Verify against Auth and accept only trusted application role claims.
export const getIdentity = cache(async (): Promise<AuthIdentity | null> => {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403 ||
      error.name === "AuthSessionMissingError"
    )
      return null;
    throw new Error("Authentication service is unavailable. Please try again.");
  }
  if (!data.user) return null;
  const claims = await client.auth.getClaims();
  if (claims.error)
    throw new Error("Could not verify your session. Please sign in again.");
  const role: unknown = claims.data?.claims.app_metadata?.role;
  if (role !== "admin" && role !== "member") return null;
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .single();
  if (profileError) throw new Error("Could not load your employee profile.");
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    role,
    name:
      typeof profile.full_name === "string" ? profile.full_name : "Employee",
  };
});
