import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LearnArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  body: string;
  read_time: string;
  sort_order: number;
  created_at: string;
}

export const useLearnArticles = () =>
  useQuery({
    queryKey: ["learn-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_articles")
        .select("id, category, title, summary, body, read_time, sort_order, created_at")
        .eq("published", true)
        .order("sort_order");
      if (error) throw error;
      return data as LearnArticle[];
    },
  });

export const useLearnBookmarkIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learn-bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_bookmarks")
        .select("article_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map((b) => b.article_id));
    },
  });
};

export const useToggleLearnBookmark = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, isBookmarked }: { articleId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isBookmarked) {
        const { error } = await supabase
          .from("learn_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("learn_bookmarks")
          .insert({ user_id: user.id, article_id: articleId });
        if (error) throw error;
      }
    },
    onMutate: async ({ articleId, isBookmarked }) => {
      await qc.cancelQueries({ queryKey: ["learn-bookmarks", user?.id] });
      const prev = qc.getQueryData<Set<string>>(["learn-bookmarks", user?.id]);
      qc.setQueryData<Set<string>>(["learn-bookmarks", user?.id], (old) => {
        const next = new Set(old);
        isBookmarked ? next.delete(articleId) : next.add(articleId);
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["learn-bookmarks", user?.id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["learn-bookmarks", user?.id] }),
  });
};
