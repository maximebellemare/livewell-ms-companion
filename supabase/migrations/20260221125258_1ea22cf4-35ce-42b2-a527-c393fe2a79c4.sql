
-- Create a security definer function to return the badge leaderboard
-- This bypasses RLS on badge_events so we can aggregate across users
CREATE OR REPLACE FUNCTION public.get_badge_leaderboard(result_limit integer DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  badge_count bigint,
  latest_badge_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    be.user_id,
    COALESCE(pp.display_name, 'MS Warrior') AS display_name,
    pp.avatar_url,
    COUNT(DISTINCT be.badge_id) AS badge_count,
    MAX(be.earned_at) AS latest_badge_at
  FROM badge_events be
  LEFT JOIN profiles_public pp ON pp.user_id = be.user_id
  GROUP BY be.user_id, pp.display_name, pp.avatar_url
  HAVING COUNT(DISTINCT be.badge_id) > 0
  ORDER BY badge_count DESC, latest_badge_at ASC
  LIMIT result_limit;
$$;
