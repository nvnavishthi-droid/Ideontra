// realtime.ts — Receive private database events without content or author payloads.
import { createClient } from "@/lib/supabase/client";
import type { AuthIdentity } from "@/types/auth";
// Subscribe with the current JWT and return cleanup for all authorized channels.
export function subscribeIdeas(
  user: AuthIdentity,
  onChange: () => void,
  onError: (message: string) => void,
) {
  const client = createClient();
  let cancelled = false;
  let warned = false;
  let warningTimer: ReturnType<typeof setTimeout> | undefined;
  let authTimer: ReturnType<typeof setTimeout> | undefined;
  const topics = [
    "ideas:public",
    `user:${user.id}`,
    ...(user.role === "admin" ? ["admin:ideas"] : []),
  ];
  const connected = new Set<string>();
  // Notify once when any required channel remains unavailable for thirty seconds.
  function unavailable() {
    if (cancelled || warned || warningTimer !== undefined) return;
    warningTimer = setTimeout(() => {
      warningTimer = undefined;
      if (cancelled || connected.size === topics.length) return;
      warned = true;
      onError("Live updates are still unavailable. Reconnection will continue automatically; refresh to load current data.");
    }, 30_000);
  }
  // Reset outage reporting only after every authorized channel has recovered.
  function recovered(topic: string) {
    connected.add(topic);
    if (connected.size === topics.length) {
      clearTimeout(warningTimer);
      warningTimer = undefined;
      warned = false;
    }
    onChange();
  }
  const channels = topics.map((topic) =>
    client
      .channel(topic, { config: { private: true } })
      .on("broadcast", { event: "changed" }, () => { if (!cancelled) onChange(); }),
  );
  // Retry Auth setup quietly; channel rejoining uses the SDK's existing backoff.
  async function connect() {
    try {
      await client.realtime.setAuth();
      if (cancelled) return;
      channels.forEach((channel, index) =>
        channel.subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") recovered(topics[index]);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            connected.delete(topics[index]);
            unavailable();
          }
        }),
      );
    } catch {
      if (cancelled) return;
      unavailable();
      authTimer = setTimeout(() => { void connect(); }, 5_000);
    }
  }
  void connect();
  return () => {
    cancelled = true;
    clearTimeout(warningTimer);
    clearTimeout(authTimer);
    channels.forEach((channel) => {
      void client.removeChannel(channel);
    });
  };
}
