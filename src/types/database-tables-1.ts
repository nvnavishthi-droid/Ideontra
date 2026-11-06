// database-tables-1.ts — Generated Supabase schema types; split to keep files reviewable.
import type { Database } from "./database";
export type PublicTables1 = {
  idea_votes: {
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
        foreignKeyName: "idea_votes_idea_id_fkey";
        columns: ["idea_id"];
        isOneToOne: false;
        referencedRelation: "ideas";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "idea_votes_user_id_fkey";
        columns: ["user_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  ideas: {
    Row: {
      category: string;
      created_at: string;
      demo_video_path: string | null;
      demo_video_url: string | null;
      effort_score: number | null;
      evaluation_quadrant: string | null;
      expected_impact: string;
      id: string;
      impact_score: number | null;
      is_anonymous: boolean;
      links: string[] | null;
      outcome_summary: string | null;
      owner_id: string | null;
      problem: string;
      proposed_solution: string;
      rough_effort: string | null;
      status: string;
      submitted_at: string | null;
      target_date: string | null;
      title: string;
      updated_at: string;
      who_benefits: string;
    };
    Insert: {
      category: string;
      created_at?: string;
      demo_video_path?: string | null;
      demo_video_url?: string | null;
      effort_score?: number | null;
      evaluation_quadrant?: string | null;
      expected_impact: string;
      id?: string;
      impact_score?: number | null;
      is_anonymous?: boolean;
      links?: string[] | null;
      outcome_summary?: string | null;
      owner_id?: string | null;
      problem: string;
      proposed_solution: string;
      rough_effort?: string | null;
      status?: string;
      submitted_at?: string | null;
      target_date?: string | null;
      title: string;
      updated_at?: string;
      who_benefits: string;
    };
    Update: {
      category?: string;
      created_at?: string;
      demo_video_path?: string | null;
      demo_video_url?: string | null;
      effort_score?: number | null;
      evaluation_quadrant?: string | null;
      expected_impact?: string;
      id?: string;
      impact_score?: number | null;
      is_anonymous?: boolean;
      links?: string[] | null;
      outcome_summary?: string | null;
      owner_id?: string | null;
      problem?: string;
      proposed_solution?: string;
      rough_effort?: string | null;
      status?: string;
      submitted_at?: string | null;
      target_date?: string | null;
      title?: string;
      updated_at?: string;
      who_benefits?: string;
    };
    Relationships: [
      {
        foreignKeyName: "ideas_owner_id_fkey";
        columns: ["owner_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  profiles: {
    Row: {
      created_at: string;
      email: string | null;
      full_name: string | null;
      id: string;
      role: Database["public"]["Enums"]["user_role"];
    };
    Insert: {
      created_at?: string;
      email?: string | null;
      full_name?: string | null;
      id: string;
      role?: Database["public"]["Enums"]["user_role"];
    };
    Update: {
      created_at?: string;
      email?: string | null;
      full_name?: string | null;
      id?: string;
      role?: Database["public"]["Enums"]["user_role"];
    };
    Relationships: [];
  };
};
