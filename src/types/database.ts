// database.ts — Supabase-generated database contract and split schema references.
import type { ChatTables } from "./database-chat-table";
import type { ChatFunctions } from "./chat";
import type { PublicTables0 } from "./database-tables-0";
import type { PublicTables1 } from "./database-tables-1";
import type { PublicFunctions0 } from "./database-functions-0";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: PublicTables0 & PublicTables1 & ChatTables;
    Views: {
      [_ in never]: never;
    };
    Functions: PublicFunctions0 & ChatFunctions;
    Enums: {
      user_role: "member" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
