import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/* ─── Types ─────────────────────────────────────────────── */
export type FeedbackCategory = "feature" | "ui" | "bug" | "integration" | "other";
export type FeedbackStatus = "new" | "planned" | "in_progress" | "done" | "declined";

export interface FeedbackPost {
  id: string;
  user_id: string;
  display_name: string;
  is_anonymous: boolean;
  title: string;
  body: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface FeedbackComment {
  id: string;
  post_id: string;
  user_id: string;
  display_name: string;
  is_anonymous: boolean;
  body: string;
  created_at: string;
}

/* ─── Posts ──────────────────────────────────────────────── */
export const useFeedbackPosts = (sortBy: "popular" | "newest" = "popular", category?: FeedbackCategory) => {
  return useQuery({
    queryKey: ["feedback-posts", sortBy, category],
    queryFn: async () => {
      let query = (supabase as any)
        .from("feedback_posts")
        .select("*");

      if (category) {
        query = query.eq("category", category);
      }

      if (sortBy === "popular") {
        query = query.order("upvotes_count", { ascending: false }).order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data ?? []) as FeedbackPost[];
    },
  });
};

export const useFeedbackPost = (postId: string | null) => {
  return useQuery({
    queryKey: ["feedback-post", postId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_posts")
        .select("*")
        .eq("id", postId!)
        .single();
      if (error) throw error;
      return data as FeedbackPost;
    },
    enabled: !!postId,
  });
};

export const useCreateFeedbackPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: {
      user_id: string;
      display_name: string;
      is_anonymous: boolean;
      title: string;
      body: string;
      category: FeedbackCategory;
    }) => {
      const { data, error } = await (supabase as any)
        .from("feedback_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback-posts"] }),
  });
};

export const useUpdateFeedbackStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: FeedbackStatus }) => {
      const { error } = await (supabase as any)
        .from("feedback_posts")
        .update({ status })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback-posts"] });
      qc.invalidateQueries({ queryKey: ["feedback-post"] });
    },
  });
};

/* ─── Upvotes ───────────────────────────────────────────── */
export const useMyUpvotes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["feedback-my-upvotes", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_upvotes")
        .select("post_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set<string>((data ?? []).map((r: any) => r.post_id as string));
    },
    enabled: !!user,
  });
};

export const useToggleUpvote = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, isUpvoted }: { postId: string; isUpvoted: boolean }) => {
      if (isUpvoted) {
        const { error } = await (supabase as any)
          .from("feedback_upvotes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("feedback_upvotes")
          .insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback-posts"] });
      qc.invalidateQueries({ queryKey: ["feedback-post"] });
      qc.invalidateQueries({ queryKey: ["feedback-my-upvotes"] });
    },
  });
};

/* ─── Comments ──────────────────────────────────────────── */
export const useFeedbackComments = (postId: string | null) => {
  return useQuery({
    queryKey: ["feedback-comments", postId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_comments")
        .select("*")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FeedbackComment[];
    },
    enabled: !!postId,
  });
};

export const useCreateFeedbackComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment: {
      post_id: string;
      user_id: string;
      display_name: string;
      is_anonymous: boolean;
      body: string;
    }) => {
      const { error } = await (supabase as any)
        .from("feedback_comments")
        .insert(comment);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["feedback-comments", vars.post_id] });
      qc.invalidateQueries({ queryKey: ["feedback-posts"] });
      qc.invalidateQueries({ queryKey: ["feedback-post"] });
    },
  });
};
