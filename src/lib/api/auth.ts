// auth.ts — Validated server actions for Supabase email/password authentication.
"use server";
import { createClient } from "@/lib/supabase/server";
import { authSchema, type AuthValues } from "@/lib/form-schemas";
import type { AuthResult } from "@/types/auth";
// Validate inputs independently of browser checks and create or authenticate an employee.
export async function authenticate(
  values: AuthValues,
  signup: boolean,
): Promise<AuthResult> {
  const parsed = authSchema.safeParse({
    ...values,
    email: values.email?.trim().toLowerCase(),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  const { name, email, password } = parsed.data;
  if (signup && (!name.trim() || /\d/.test(name)))
    return { error: "Enter your full name using letters." };
  try {
    const client = await createClient(true);
    const result = signup
      ? await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
          },
        })
      : await client.auth.signInWithPassword({ email, password });
    if (result.error) return { error: result.error.message };
    if (!result.data.session)
      return {
        error: signup
          ? "Signup did not create a session. If this account already exists, sign in; otherwise ask the administrator to disable Confirm Email in Supabase."
          : "Sign-in did not create a session. Please try again.",
      };
    return {};
  } catch {
    return { error: "Unable to reach authentication. Please try again." };
  }
}
// Revoke the current session and remove its cookies.
export async function signOut(): Promise<AuthResult> {
  try {
    const client = await createClient(true);
    const { error } = await client.auth.signOut();
    return error ? { error: error.message } : {};
  } catch {
    return { error: "Unable to sign out. Please try again." };
  }
}
