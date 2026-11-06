// IdeaChat.tsx — Persistent caller-only conversation with server-paginated history.
"use client";
import { useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { readChat, sendChat } from "@/lib/api/chat-client";
import { fieldLimits } from "@/lib/form-field-limits";
import type { ChatMessage } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLoader } from "@/components/shared/Loaders";
import { FormField } from "@/components/shared/FormField";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";
// Scope every cache entry and composer to the signed-in user and selected idea.
export function IdeaChat({ ideaId, userId }: { ideaId: string; userId: string }) {
  const client = useQueryClient();
  const queryKey = ["private-chat", userId, ideaId];
  const input = useRef<HTMLTextAreaElement>(null);
  const request = useRef<{ content: string; id: string } | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [failure, setFailure] = useState<string>();
  const query = useInfiniteQuery({
    queryKey, initialPageParam: undefined as ChatMessage | undefined,
    queryFn: async ({ pageParam }) => {
      const page = await readChat(ideaId, pageParam);
      if (page.userId !== userId) throw new Error("Your session changed. Please reload the page.");
      return page;
    },
    getNextPageParam: (page) => page.rows.length === 25 ? page.rows[0] : undefined,
    staleTime: 0, gcTime: 0, retry: false,
  });
  const mutation = useMutation({
    mutationFn: ({ content, id }: { content: string; id: string }) => sendChat(ideaId, content, id),
    // Refresh from the server after either success or a saved-question failure.
    onSettled: () => { void client.invalidateQueries({ queryKey }); },
    onSuccess: (page) => {
      if (page.userId !== userId) { setFailure("Your session changed. Reload the page."); return; }
      setValue(""); request.current = null;
    },
    onError: (error) => setFailure(error.message),
  });
  // Reuse the request identity when retrying unchanged content after a connection failure.
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = value.trim();
    if (!content) {
      setError("Enter a question about this idea.");
      input.current?.focus(); input.current?.scrollIntoView({ block: "nearest" }); return;
    }
    setError(undefined);
    if (request.current?.content !== content) request.current = { content, id: crypto.randomUUID() };
    mutation.mutate(request.current!);
  }
  const messages = query.data?.pages.toReversed().flatMap((page) => page.rows) ?? [];
  return (
    <section className="flex flex-col gap-4" aria-label="Private idea AI chat">
      <p className="text-xs text-muted-foreground">Only you can see this saved conversation. AI answers may be inaccurate. Idea text and your questions are sent to Google.</p>
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto rounded-lg border p-4" aria-label="Conversation">
        {query.isPending && <div role="status" aria-label="Loading conversation" className="flex flex-col gap-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-3/4" /></div>}
        {query.error && <div role="alert"><p>{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button></div>}
        {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage && <ButtonLoader />}Load older messages</Button>}
        {!query.isPending && !query.error && !messages.length && <p className="text-muted-foreground">Ask about this idea’s problem, solution, benefits or possible improvements.</p>}
        {messages.map((message) => (
          <article key={message.id} className={`rounded-lg border p-3 ${message.role === "user" ? "bg-muted" : "bg-card"}`}>
            <p className="mb-2 text-xs text-muted-foreground">{message.role === "user" ? "You" : "AI"} · {format(new Date(message.created_at), "dd MMM yyyy, HH:mm")}</p>
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            {message.role === "user" && message.state !== "complete" && <Button type="button" className="mt-2" variant="outline" disabled={mutation.isPending} onClick={() => { request.current = { content: message.content, id: message.request_id }; setValue(message.content); input.current?.focus(); }}>Retry this question</Button>}
          </article>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <FormField id="idea-chat-question" label="Your question" error={error} hint="Your conversation is saved for this idea.">
          <Textarea ref={input} id="idea-chat-question" value={value} maxLength={fieldLimits.chatQuestion}
            aria-invalid={!!error} aria-describedby={error ? "idea-chat-question-error" : undefined}
            disabled={mutation.isPending} onChange={(event) => { setValue(event.target.value); setError(undefined); }} />
        </FormField>
        <Button type="submit" className="self-end" disabled={query.isPending || !!query.error || mutation.isPending}>
          {mutation.isPending && <ButtonLoader />}{mutation.isPending ? "Thinking…" : "Send"}
        </Button>
      </form>
      <FeedbackDialog feedback={failure ? { title: "AI chat", message: failure } : null} onClose={() => setFailure(undefined)} />
    </section>
  );
}
