// database-chat-table.ts — Generated Supabase chat table contract, 2026-11-06.
export type ChatTables = {
      idea_chat_messages: {
        Row: {
          attempts: string[]
          content: string
          created_at: string
          id: string
          idea_id: string
          lease_id: string | null
          lease_until: string | null
          reply_to: string | null
          request_id: string
          role: string
          state: string
          user_id: string
        }
        Insert: {
          attempts?: string[]
          content: string
          created_at?: string
          id?: string
          idea_id: string
          lease_id?: string | null
          lease_until?: string | null
          reply_to?: string | null
          request_id: string
          role: string
          state?: string
          user_id: string
        }
        Update: {
          attempts?: string[]
          content?: string
          created_at?: string
          id?: string
          idea_id?: string
          lease_id?: string | null
          lease_until?: string | null
          reply_to?: string | null
          request_id?: string
          role?: string
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_chat_messages_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: true
            referencedRelation: "idea_chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
};
