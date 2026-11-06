// chat.ts — Private chat API and Supabase RPC contracts.
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  request_id: string;
  state: "pending" | "failed" | "complete";
}
export interface ChatPage {
  rows: ChatMessage[];
  userId: string;
}
export type ChatFunctions = {
  get_idea_chat: {
    Args: { p_idea_id: string; p_before_time?: string | null; p_before_id?: string | null; p_limit?: number };
    Returns: import("./database").Json;
  };
  begin_idea_chat: {
    Args: { p_idea_id: string; p_request_id: string; p_content: string; p_secret: string };
    Returns: import("./database").Json;
  };
  finish_idea_chat: {
    Args: { p_question_id: string; p_lease_id: string; p_answer: string | null; p_secret: string };
    Returns: undefined;
  };
}
