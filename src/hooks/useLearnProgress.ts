import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useLearnProgress = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learn-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_progress")
        .select("article_id, progress")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data) map[row.article_id] = Number(row.progress);
      return map;
    },
  });
};

export const useSaveLearnProgress = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, progress }: { articleId: string; progress: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("learn_progress")
        .upsert(
          { user_id: user.id, article_id: articleId, progress, updated_at: new Date().toISOString() },
          { onConflict: "user_id,article_id" }
        );
      if (error) throw error;
    },
    onMutate: async ({ articleId, progress }) => {
      await qc.cancelQueries({ queryKey: ["learn-progress", user?.id] });
      qc.setQueryData<Record<string, number>>(["learn-progress", user?.id], (old) => ({
        ...old,
        [articleId]: progress,
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["learn-progress", user?.id] }),
  });
};
