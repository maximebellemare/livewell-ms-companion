import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  badge_count: number;
  latest_badge_at: string;
}

export function useBadgeLeaderboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["badge-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_badge_leaderboard", {
        result_limit: 20,
      });
      if (error) throw error;
      return (data ?? []) as LeaderboardEntry[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
