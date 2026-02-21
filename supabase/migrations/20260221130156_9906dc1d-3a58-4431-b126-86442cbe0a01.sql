
DROP FUNCTION IF EXISTS public.get_badge_leaderboard(integer);

CREATE OR REPLACE FUNCTION public.get_badge_leaderboard(result_limit integer DEFAULT 20)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, badge_count bigint, latest_badge_at timestamptz, previous_rank bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH current_ranking AS (
    SELECT
      be.user_id,
      COALESCE(pp.display_name, 'MS Warrior') AS display_name,
      pp.avatar_url,
      COUNT(DISTINCT be.badge_id) AS badge_count,
      MAX(be.earned_at) AS latest_badge_at,
      ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT be.badge_id) DESC, MAX(be.earned_at) ASC) AS current_rank
    FROM badge_events be
    LEFT JOIN profiles_public pp ON pp.user_id = be.user_id
    GROUP BY be.user_id, pp.display_name, pp.avatar_url
    HAVING COUNT(DISTINCT be.badge_id) > 0
  ),
  previous_ranking AS (
    SELECT
      be.user_id,
      ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT be.badge_id) DESC, MAX(be.earned_at) ASC) AS prev_rank
    FROM badge_events be
    WHERE be.earned_at <= (now() - interval '7 days')
    GROUP BY be.user_id
    HAVING COUNT(DISTINCT be.badge_id) > 0
  )
  SELECT
    cr.user_id,
    cr.display_name,
    cr.avatar_url,
    cr.badge_count,
    cr.latest_badge_at,
    pr.prev_rank AS previous_rank
  FROM current_ranking cr
  LEFT JOIN previous_ranking pr ON pr.user_id = cr.user_id
  ORDER BY cr.current_rank ASC
  LIMIT result_limit;
$$;
