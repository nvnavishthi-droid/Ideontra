// database-functions-0.ts — Generated Supabase schema types; split to keep files reviewable.
import type { Json } from "./database";
export type PublicFunctions0 = {
  add_idea_comment: {
    Args: {
      p_content: string;
      p_idea_id: string;
      p_parent_comment_id?: string;
    };
    Returns: string;
  };
  add_idea_progress_update: {
    Args: { p_idea_id: string; p_update_text: string };
    Returns: string;
  };
  approve_evaluated_idea: {
    Args: { p_effort: number; p_idea_id: string; p_impact: number };
    Returns: undefined;
  };
  can_access_idea_demo: {
    Args: { p_name: string; p_write?: boolean };
    Returns: boolean;
  };
  can_see_idea: { Args: { p_idea_id: string }; Returns: boolean };
  complete_idea: {
    Args: {
      p_idea_id: string;
      p_outcome?: string;
      p_path?: string;
      p_url?: string;
    };
    Returns: undefined;
  };
  create_idea: {
    Args: {
      p_category: string;
      p_expected_impact: string;
      p_is_anonymous?: boolean;
      p_links?: string[];
      p_problem: string;
      p_proposed_solution: string;
      p_rough_effort?: string;
      p_title: string;
      p_who_benefits: string;
    };
    Returns: string;
  };
  custom_access_token_hook: { Args: { event: Json }; Returns: Json };
  delete_draft: { Args: { p_idea_id: string }; Returns: string };
  delete_idea_comment: { Args: { p_comment_id: string }; Returns: string };
  edit_idea_comment: {
    Args: { p_comment_id: string; p_content: string };
    Returns: string;
  };
  evaluate_idea: {
    Args: {
      p_effort_score: number;
      p_idea_id: string;
      p_impact_score: number;
    };
    Returns: string;
  };
  follow_idea: { Args: { p_idea_id: string }; Returns: undefined };
  get_admin_dashboard: { Args: never; Returns: Json };
  get_idea_detail: { Args: { p_idea_id: string }; Returns: Json };
  get_idea_follow_summary: {
    Args: { p_idea_id: string };
    Returns: {
      follower_count: number;
      is_following: boolean;
    }[];
  };
  get_idea_submitter_name: { Args: { p_idea_id: string }; Returns: string };
  get_idea_summary: { Args: { p_idea_id: string }; Returns: Json };
  get_idea_vote_summary: {
    Args: { p_idea_id: string };
    Returns: {
      has_voted: boolean;
      vote_count: number;
    }[];
  };
  get_profile_names: {
    Args: { p_user_ids: string[] };
    Returns: {
      full_name: string;
      id: string;
    }[];
  };
  is_admin: { Args: never; Returns: boolean };
  is_idea_author: { Args: { p_idea_id: string }; Returns: boolean };
  is_idea_owner: { Args: { p_idea_id: string }; Returns: boolean };
  is_member: { Args: never; Returns: boolean };
  list_idea_owners: {
    Args: { p_page?: number; p_page_size?: number };
    Returns: Json;
  };
  list_ideas: {
    Args: {
      p_active_statuses?: string[];
      p_category?: string;
      p_mode?: string;
      p_owner?: string;
      p_page?: number;
      p_page_size?: number;
      p_q?: string;
      p_quadrant?: string;
      p_sort?: string;
      p_status?: string;
    };
    Returns: Json;
  };
  list_visible_owners: {
    Args: { p_page?: number; p_page_size?: number };
    Returns: Json;
  };
  reassign_idea_owner: {
    Args: { p_idea_id: string; p_new_owner_id: string };
    Returns: undefined;
  };
  save_idea_demo: {
    Args: {
      p_demo_video_path?: string;
      p_demo_video_url?: string;
      p_idea_id: string;
      p_outcome_summary?: string;
    };
    Returns: undefined;
  };
  save_idea_form: {
    Args: { p_idea_id?: string; p_submit?: boolean; p_values: Json };
    Returns: string;
  };
  submit_idea: { Args: { p_idea_id: string }; Returns: string };
  transition_idea: {
    Args: {
      p_idea_id: string;
      p_new_status: string;
      p_owner_id?: string;
      p_reason?: string;
      p_target_date?: string;
    };
    Returns: string;
  };
  unfollow_idea: { Args: { p_idea_id: string }; Returns: undefined };
  unvote_for_idea: { Args: { p_idea_id: string }; Returns: undefined };
  update_idea: {
    Args: {
      p_category: string;
      p_expected_impact: string;
      p_idea_id: string;
      p_is_anonymous: boolean;
      p_links: string[];
      p_problem: string;
      p_proposed_solution: string;
      p_rough_effort: string;
      p_title: string;
      p_who_benefits: string;
    };
    Returns: string;
  };
  vote_for_idea: { Args: { p_idea_id: string }; Returns: undefined };
};
