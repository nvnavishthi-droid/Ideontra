// chat-client.ts — Same-origin private chat requests with validated responses.
import { z } from "zod";
import type { ChatMessage, ChatPage } from "@/types/chat";
export const chatMessageSchema = z.object({
  id: z.string().uuid(), role: z.enum(["user", "assistant"]), content: z.string(),
  created_at: z.string(), request_id: z.string().uuid(),
  state: z.enum(["pending", "failed", "complete"]),
});
// Parse failures without exposing internal provider or database details.
async function parseResponse(response: Response): Promise<ChatPage> {
  const raw: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(raw);
    throw new Error(error.success ? error.data.error : "Chat is unavailable. Please retry.");
  }
  return z.object({ rows: z.array(chatMessageSchema), userId: z.string().uuid() }).parse(raw);
}
// Load one server-paginated history page without persisting browser cache entries.
export async function readChat(ideaId: string, before?: ChatMessage): Promise<ChatPage> {
  const params = new URLSearchParams({ ideaId });
  if (before) { params.set("beforeTime", before.created_at); params.set("beforeId", before.id); }
  return parseResponse(await fetch(`/api/idea-chat?${params}`, { cache: "no-store" }));
}
// Send an idempotent question; the server loads both idea context and private history.
export async function sendChat(ideaId: string, content: string, requestId: string): Promise<ChatPage> {
  return parseResponse(await fetch("/api/idea-chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ideaId, content, requestId }),
  }));
}
