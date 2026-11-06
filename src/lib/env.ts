// env.ts — Centralized public Supabase and application configuration.
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
};

// Read optional chat credentials only from server API code.
export function getChatEnv() {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    apiUrl: process.env.GEMINI_API_URL,
    freeTierConfirmed: process.env.GEMINI_FREE_TIER_CONFIRMED === "true",
    writeSecret: process.env.IDEA_CHAT_SERVER_SECRET,
  };
}
