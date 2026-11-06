// database-tables-0.ts — Generated Supabase schema types; split to keep files reviewable.
import type { Json } from "./database";
export type PublicTables0 = {
  audit_log: {
    Row: {
      action: string;
      actor_id: string | null;
      details: Json;
      id: string;
      idea_id: string | null;
      occurred_at: string;
    };
    Insert: {
      action: string;
      actor_id?: string | null;
      details?: Json;
      id?: string;
      idea_id?: string | null;
      occurred_at?: string;
    };
    Update: {
      action?: string;
      actor_id?: string | null;
      details?: Json;
      id?: string;
      idea_id?: string | null;
      occurred_at?: string;
    };
    Relationships: [];
  };
  idea_comments: {
    Row: {
      content: string;
      created_at: string;
      deleted_at: string | null;
      id: string;
      idea_id: string;
      parent_comment_id: string | null;
      updated_at: string;
      user_id: string;
    };
    Insert: {
      content: string;
      created_at?: string;
      deleted_at?: string | null;
      id?: string;
      idea_id: string;
      parent_comment_id?: string | null;
      updated_at?: string;
      user_id: string;
    };
    Update: {
      content?: string;
      created_at?: string;
      deleted_at?: string | null;
      id?: string;
      idea_id?: string;
      parent_comment_id?: string | null;
      updated_at?: string;
      user_id?: string;
    };
    Relationships: [
      {
        foreignKeyName: "idea_comments_idea_id_fkey";
        columns: ["idea_id"];
        isOneToOne: false;
        referencedRelation: "ideas";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_comments_parent_comment_id_fkey";
        columns: ["parent_comment_id"];
        isOneToOne: false;
        referencedRelation: "idea_comments";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_comments_user_id_fkey";
        columns: ["user_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  idea_followers: {
    Row: {
      created_at: string;
      id: string;
      idea_id: string;
      user_id: string;
    };
    Insert: {
      created_at?: string;
      id?: string;
      idea_id: string;
      user_id: string;
    };
    Update: {
      created_at?: string;
      id?: string;
      idea_id?: string;
      user_id?: string;
    };
    Relationships: [
      {
        foreignKeyName: "idea_followers_idea_id_fkey";
        columns: ["idea_id"];
        isOneToOne: false;
        referencedRelation: "ideas";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_followers_user_id_fkey";
        columns: ["user_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  idea_owner_history: {
    Row: {
      assigned_at: string;
      assigned_by: string;
      id: string;
      idea_id: string;
      owner_id: string;
    };
    Insert: {
      assigned_at?: string;
      assigned_by: string;
      id?: string;
      idea_id: string;
      owner_id: string;
    };
    Update: {
      assigned_at?: string;
      assigned_by?: string;
      id?: string;
      idea_id?: string;
      owner_id?: string;
    };
    Relationships: [
      {
        foreignKeyName: "idea_owner_history_assigned_by_fkey";
        columns: ["assigned_by"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_owner_history_idea_id_fkey";
        columns: ["idea_id"];
        isOneToOne: false;
        referencedRelation: "ideas";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_owner_history_owner_id_fkey";
        columns: ["owner_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  idea_private_details: {
    Row: {
      idea_id: string;
      submitter_id: string;
    };
    Insert: {
      idea_id: string;
      submitter_id: string;
    };
    Update: {
      idea_id?: string;
      submitter_id?: string;
    };
    Relationships: [
      {
        foreignKeyName: "idea_private_details_idea_id_fkey";
        columns: ["idea_id"];
        isOneToOne: true;
        referencedRelation: "ideas";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_private_details_submitter_id_fkey";
        columns: ["submitter_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  idea_progress_updates: {
    Row: {
      created_at: string;
      id: string;
      idea_id: string;
      update_text: string;
      user_id: string;
    };
    Insert: {
      created_at?: string;
      id?: string;
      idea_id: string;
      update_text: string;
      user_id: string;
    };
    Update: {
      created_at?: string;
      id?: string;
      idea_id?: string;
      update_text?: string;
      user_id?: string;
    };
    Relationships: [
      {
        foreignKeyName: "idea_progress_updates_idea_id_fkey";
        columns: ["idea_id"];
        isOneToOne: false;
        referencedRelation: "ideas";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_progress_updates_user_id_fkey";
        columns: ["user_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  idea_status_history: {
    Row: {
      changed_at: string;
      changed_by: string;
      from_status: string | null;
      id: string;
      idea_id: string;
      reason: string | null;
      to_status: string;
    };
    Insert: {
      changed_at?: string;
      changed_by: string;
      from_status?: string | null;
      id?: string;
      idea_id: string;
      reason?: string | null;
      to_status: string;
    };
    Update: {
      changed_at?: string;
      changed_by?: string;
      from_status?: string | null;
      id?: string;
      idea_id?: string;
      reason?: string | null;
      to_status?: string;
    };
    Relationships: [
      {
        foreignKeyName: "idea_status_history_changed_by_fkey";
        columns: ["changed_by"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_status_history_idea_id_fkey";
        columns: ["idea_id"];
        isOneToOne: false;
        referencedRelation: "ideas";
        referencedColumns: ["id"];
      },
    ];
  };
};
