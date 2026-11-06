// route.ts — Private same-origin history and bounded AI chat submission endpoint.
import { getChatPage, postChat } from "@/lib/api/chat-server";
import { ZodError } from "zod";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
// Normalize expected errors without leaking provider payloads or internal SQL details.
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Chat is unavailable. Please retry.";
  const allowed = /^(Please sign in|Idea unavailable|AI chat setup|Google|Chat limit|A reply is already|The question is saved|Request expired|Chat provider)/;
  // Log unexpected causes server-side only (message text, never secrets or request bodies).
  if (!(error instanceof ZodError) && !allowed.test(message))
    console.error("[idea-chat] unexpected error:", error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  return Response.json({ error: error instanceof ZodError ? "Invalid chat request." :
    allowed.test(message) ? message : "Chat is unavailable. Please retry." },
  { status: message.startsWith("Please sign in") ? 401 : 400, headers });
}
// Return only the current user's paginated conversation for the authorized idea.
export async function GET(request: Request) {
  try { return Response.json(await getChatPage(new URL(request.url).searchParams), { headers }); }
  catch (error) { return failure(error); }
}
// Require same-origin writes and limit streamed input before parsing JSON.
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid content type");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing request body");
    const decoder = new TextDecoder();
    let size = 0; let body = "";
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 24000) { await reader.cancel(); throw new Error("Body too large"); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    return Response.json(await postChat(JSON.parse(body)), { headers });
  } catch (error) { return failure(error); }
}
