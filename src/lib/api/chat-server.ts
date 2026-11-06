// chat-server.ts — Authenticated chat orchestration with durable idempotent requests.
import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getIdentity } from "./session";
import { rpc } from "./ideas";
import { mapDetail } from "./idea-mapping";
import { chatMessageSchema } from "./chat-client";
import { generateChatAnswer } from "./chat-provider";
import { getChatEnv } from "@/lib/env";
import { fieldLimits } from "@/lib/form-field-limits";
import type { ChatMessage, ChatPage } from "@/types/chat";
const inputSchema = z.object({
  ideaId: z.string().uuid(), requestId: z.string().uuid(),
  content: z.string().trim().min(1).max(fieldLimits.chatQuestion),
}).strict();
// Read a caller-only page; the RPC rechecks current idea visibility on every call.
export async function getChatPage(params: URLSearchParams): Promise<ChatPage> {
  const identity = await getIdentity();
  if (!identity) throw new Error("Please sign in to use chat.");
  const ideaId = z.string().uuid().parse(params.get("ideaId"));
  const beforeTime = z.iso.datetime({ offset: true }).nullable().parse(params.get("beforeTime"));
  const beforeId = z.string().uuid().nullable().parse(params.get("beforeId"));
  const rows = z.array(chatMessageSchema).parse(await rpc(await createClient(), "get_idea_chat", {
    p_idea_id: ideaId, p_before_time: beforeTime, p_before_id: beforeId, p_limit: 25,
  }));
  return { rows, userId: identity.id };
}
// Persist the question before generation and accept an answer only for its active lease.
export async function postChat(raw: unknown): Promise<ChatPage> {
  const identity = await getIdentity();
  if (!identity) throw new Error("Please sign in to use chat.");
  const input = inputSchema.parse(raw);
  const config = getChatEnv();
  if (!config.apiKey || !config.apiUrl || !config.writeSecret || !config.freeTierConfirmed)
    throw new Error("AI chat setup is incomplete. Ask an administrator to configure the free Google AI Studio connection.");
  const client = await createClient(true);
  const idea = mapDetail(await rpc(client, "get_idea_detail", { p_idea_id: input.ideaId })).idea;
  const reservation = z.object({ complete: z.boolean(), question_id: z.string().uuid().optional(), lease_id: z.string().uuid().optional() }).parse(
    await rpc(client, "begin_idea_chat", { p_idea_id: input.ideaId, p_request_id: input.requestId,
      p_content: input.content, p_secret: config.writeSecret }));
  if (!reservation.complete) {
    if (!reservation.question_id || !reservation.lease_id) throw new Error("Could not reserve the question.");
    const finishArgs = { p_question_id: reservation.question_id, p_lease_id: reservation.lease_id, p_secret: config.writeSecret };
    try {
      const messages = z.array(chatMessageSchema).parse(await rpc(client, "get_idea_chat", { p_idea_id: input.ideaId, p_limit: 25 }));
      const question: ChatMessage = { id: reservation.question_id, role: "user", content: input.content,
        created_at: new Date().toISOString(), request_id: input.requestId, state: "pending" };
      const context = [...messages.filter((message) => message.request_id !== input.requestId), question];
      const answer = await generateChatAnswer({ apiKey: config.apiKey, apiUrl: config.apiUrl, idea, messages: context, requestId: input.requestId });
      await rpc(client, "finish_idea_chat", { ...finishArgs, p_answer: answer });
    } catch (error) {
      try { await rpc(client, "finish_idea_chat", { ...finishArgs, p_answer: null }); }
      catch { throw new Error("The question is saved, but completion could not be confirmed. Reopen chat and retry after two minutes."); }
      throw error;
    }
  }
  return getChatPage(new URLSearchParams({ ideaId: input.ideaId }));
}
