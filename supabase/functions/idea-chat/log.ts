// log.ts — Structured diagnostic logs for idea-chat. Never logs secrets, prompts or question text.

// Write one JSON log line tagged with the request trace ID.
export function log(trace: string, step: string, data: Record<string, unknown> = {}, level: "log" | "error" = "log") {
  const line = JSON.stringify({ fn: "idea-chat", trace, step, ...data });
  if (level === "error") console.error(line); else console.log(line);
}

// Short SHA-256 fingerprint so a secret can be compared with Vault without revealing it.
export async function fingerprint(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

// Describe a string's shape (length, surrounding whitespace/quotes) without its content.
export function shape(value: string | undefined) {
  if (value === undefined) return { present: false };
  return {
    present: true, length: value.length,
    trimmedLength: value.trim().length,
    hasQuotes: /^["']|["']$/.test(value),
    hasNewline: /[\r\n]/.test(value),
  };
}
