// chat.ts — Edge chat orchestration: reserve the question, ask Gemini, save the answer.
import { z } from "npm:zod@4.6.7";
import { generateChatAnswer, pickIdeaContent, type ChatMessage } from "./provider.ts";

// Mirrors the idea_chat_messages DB CHECK and src/lib/form-field-limits.ts.
const CHAT_QUESTION_MAX = 4000;

export interface ChatConfig {
  apiKey?: string; apiUrl?: string; writeSecret?: string; freeTierConfirmed: boolean;
}
export interface ChatDeps {
  userId: string;
  config: ChatConfig;
  rpc: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  generate?: typeof generateChatAnswer;
  log?: (step: string, data?: Record<string, unknown>, level?: "log" | "error") => void;
}

const inputSchema = z.object({
  ideaId: z.string().uuid(), requestId: z.string().uuid(),
  content: z.string().trim().min(1).max(CHAT_QUESTION_MAX),
}).strict();
const messageSchema = z.object({
  id: z.string().uuid(), role: z.enum(["user", "assistant"]), content: z.string(),
  created_at: z.string(), request_id: z.string().uuid(),
  state: z.enum(["pending", "failed", "complete"]),
});

// Errors whose message is safe and useful to show the user verbatim.
const allowed = /^(Please sign in|Idea unavailable|AI chat setup|Google|Chat limit|A reply is already|The question is saved|Request expired|Chat provider)/;

// Map any error to a client-safe message; log unexpected causes (never secrets or bodies).
export function clientError(error: unknown): string {
  if (error instanceof z.ZodError) return "Invalid chat request.";
  const message = error instanceof Error ? error.message : String(error);
  if (allowed.test(message)) return message;
  console.error("[idea-chat] unexpected error:", error instanceof Error ? `${error.name}: ${message}` : message);
  return "Chat is unavailable. Please retry.";
}

// Persist the question before generation and accept an answer only for its active lease.
export async function handleChat(raw: unknown, deps: ChatDeps): Promise<{ rows: ChatMessage[]; userId: string }> {
  const log = deps.log ?? (() => {});
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) { log("input.invalid", { issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, "error"); throw parsed.error; }
  const input = parsed.data;
  log("input.ok", { ideaId: input.ideaId, requestId: input.requestId, questionChars: input.content.length });
  const { config, rpc } = deps;
  if (!config.apiKey || !config.apiUrl || !config.writeSecret || !config.freeTierConfirmed)
    throw new Error("AI chat setup is incomplete. Ask an administrator to configure the free Google AI Studio connection.");
  log("config.ok");
  const idea = pickIdeaContent(await rpc("get_idea_detail", { p_idea_id: input.ideaId }));
  const reservation = z.object({ complete: z.boolean(), question_id: z.string().uuid().optional(), lease_id: z.string().uuid().optional() }).parse(
    await rpc("begin_idea_chat", { p_idea_id: input.ideaId, p_request_id: input.requestId,
      p_content: input.content, p_secret: config.writeSecret }));
  log("reservation", { complete: reservation.complete, questionId: reservation.question_id, leaseId: reservation.lease_id });
  if (!reservation.complete) {
    if (!reservation.question_id || !reservation.lease_id) throw new Error("Could not reserve the question.");
    const finishArgs = { p_question_id: reservation.question_id, p_lease_id: reservation.lease_id, p_secret: config.writeSecret };
    try {
      const messages = z.array(messageSchema).parse(await rpc("get_idea_chat", { p_idea_id: input.ideaId, p_limit: 25 }));
      const question: ChatMessage = { id: reservation.question_id, role: "user", content: input.content,
        created_at: new Date().toISOString(), request_id: input.requestId, state: "pending" };
      const context = [...messages.filter((message) => message.request_id !== input.requestId), question];
      log("history", { messages: messages.length, contextMessages: context.length });
      const answer = await (deps.generate ?? generateChatAnswer)({ apiKey: config.apiKey, apiUrl: config.apiUrl, idea, messages: context, requestId: input.requestId, log });
      log("gemini.answer", { answerChars: answer.length });
      await rpc("finish_idea_chat", { ...finishArgs, p_answer: answer });
    } catch (error) {
      log("generation.failed", { cause: error instanceof Error ? error.message : String(error) }, "error");
      try { await rpc("finish_idea_chat", { ...finishArgs, p_answer: null }); }
      catch (finishError) { log("finish.failed", { cause: finishError instanceof Error ? finishError.message : String(finishError) }, "error"); throw new Error("The question is saved, but completion could not be confirmed. Reopen chat and retry after two minutes."); }
      throw error;
    }
  }
  const rows = z.array(messageSchema).parse(await rpc("get_idea_chat", { p_idea_id: input.ideaId, p_limit: 25 }));
  return { rows, userId: deps.userId };
}
