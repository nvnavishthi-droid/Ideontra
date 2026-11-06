// index.ts — idea-chat Edge Function: authenticated private AI chat for one idea.
// Runs every RPC as the calling user; Gemini and the write secret live in Edge Function secrets.
import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.119.0/cors";
import { clientError, handleChat } from "./chat.ts";
import { fingerprint, log, shape } from "./log.ts";

const headers = { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, no-store" };

// Build a JSON response that always carries CORS headers.
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

// Read the project's default publishable key (legacy anon key as fallback).
function publishableKey(): { key: string; source: string } {
  const keys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keys) return { key: (JSON.parse(keys) as Record<string, string>).default, source: "SUPABASE_PUBLISHABLE_KEYS.default" };
  return { key: Deno.env.get("SUPABASE_ANON_KEY")!, source: "SUPABASE_ANON_KEY" };
}

// Verify the caller, then run the chat flow under their own session and RLS.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const trace = crypto.randomUUID().slice(0, 8);
  const started = Date.now();
  log(trace, "request", { method: req.method, hasAuthHeader: req.headers.has("Authorization"),
    hasApikeyHeader: req.headers.has("apikey"), origin: req.headers.get("origin") });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const authorization = req.headers.get("Authorization") ?? "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!token) { log(trace, "auth.missing-token", {}, "error"); return json({ error: "Please sign in to use chat." }, 401); }
    const pk = publishableKey();
    log(trace, "client.config", { supabaseUrl: Deno.env.get("SUPABASE_URL"), keySource: pk.source,
      keyPrefix: pk.key?.slice(0, 15), tokenLength: token.length, tokenSegments: token.split(".").length });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, pk.key, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    log(trace, "auth.claims", { ok: !claimsError, error: claimsError?.message, userId,
      role: claims?.claims?.role, exp: claims?.claims?.exp, nowSec: Math.floor(Date.now() / 1000) },
      claimsError ? "error" : "log");
    if (claimsError || !userId || claims.claims.role !== "authenticated")
      return json({ error: "Please sign in to use chat." }, 401);
    // Trim secrets: values pasted in the dashboard can carry a trailing newline.
    const secret = (name: string) => Deno.env.get(name)?.trim() || undefined;
    const config = {
      apiKey: secret("GEMINI_API_KEY"),
      apiUrl: secret("GEMINI_API_URL"),
      writeSecret: secret("IDEA_CHAT_SERVER_SECRET"),
      freeTierConfirmed: secret("GEMINI_FREE_TIER_CONFIRMED") === "true",
    };
    log(trace, "secrets", {
      GEMINI_API_KEY: { ...shape(config.apiKey), prefix: config.apiKey?.slice(0, 3) },
      GEMINI_API_URL: { ...shape(config.apiUrl), value: config.apiUrl },
      GEMINI_FREE_TIER_CONFIRMED: { ...shape(Deno.env.get("GEMINI_FREE_TIER_CONFIRMED")), parsed: config.freeTierConfirmed },
      IDEA_CHAT_SERVER_SECRET: { ...shape(Deno.env.get("IDEA_CHAT_SERVER_SECRET")), usedSha256_16: await fingerprint(config.writeSecret) },
    });
    const raw = await req.text();
    log(trace, "body", { bytes: raw.length });
    if (raw.length > 24000) throw new Error("Body too large");
    const page = await handleChat(JSON.parse(raw), {
      userId, config,
      log: (step, data, level) => log(trace, step, data, level),
      rpc: async (name, args) => {
        const t = Date.now();
        const { data, error, status } = await supabase.rpc(name, args);
        if (error) {
          log(trace, `rpc.${name}.error`, { ms: Date.now() - t, status, code: error.code,
            message: error.message, details: error.details, hint: error.hint }, "error");
          throw new Error(error.message);
        }
        log(trace, `rpc.${name}.ok`, { ms: Date.now() - t, status });
        return data;
      },
    });
    log(trace, "done", { ms: Date.now() - started, rows: page.rows.length });
    return json(page);
  } catch (error) {
    const message = clientError(error);
    log(trace, "failed", { ms: Date.now() - started, name: error instanceof Error ? error.name : typeof error,
      cause: error instanceof Error ? error.message : String(error), returned: message }, "error");
    return json({ error: message }, 400);
  }
});
