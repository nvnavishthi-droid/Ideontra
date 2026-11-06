// chat-client.ts — Private chat: history via RPC, questions via the idea-chat Edge Function.
import { z } from "zod";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { rpc } from "./ideas";
import type { ChatMessage, ChatPage } from "@/types/chat";
export const chatMessageSchema = z.object({
  id: z.string().uuid(), role: z.enum(["user", "assistant"]), content: z.string(),
  created_at: z.string(), request_id: z.string().uuid(),
  state: z.enum(["pending", "failed", "complete"]),
});
const pageSchema = z.object({ rows: z.array(chatMessageSchema), userId: z.string().uuid() });
const fallback = "Chat is unavailable. Please retry.";
// Resolve the signed-in user's ID from verified token claims.
async function currentUserId(): Promise<string> {
  const { data, error } = await createClient().auth.getClaims();
  const id = data?.claims?.sub;
  if (error || !id) throw new Error("Please sign in to use chat.");
  return id;
}
// Load one keyset-paginated history page; the RPC returns only the caller's rows.
export async function readChat(ideaId: string, before?: ChatMessage): Promise<ChatPage> {
  const userId = await currentUserId();
  const rows = z.array(chatMessageSchema).parse(await rpc(createClient(), "get_idea_chat", {
    p_idea_id: ideaId, p_before_time: before?.created_at ?? null, p_before_id: before?.id ?? null, p_limit: 25,
  }));
  return { rows, userId };
}
// Send an idempotent question; the Edge Function loads idea context and private history.
export async function sendChat(ideaId: string, content: string, requestId: string): Promise<ChatPage> {
  const { data, error } = await createClient().functions.invoke("idea-chat", { body: { ideaId, content, requestId } });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = z.object({ error: z.string() }).safeParse(await error.context.json().catch(() => null));
      throw new Error(body.success ? body.data.error : fallback);
    }
    throw new Error(fallback);
  }
  return pageSchema.parse(data);
}
