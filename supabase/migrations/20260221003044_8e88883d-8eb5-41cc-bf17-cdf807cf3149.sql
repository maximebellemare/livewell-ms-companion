
-- Remove the broad SELECT policy that re-exposes health data
DROP POLICY IF EXISTS "Authenticated can read profiles for community" ON public.profiles;

-- Recreate the view as SECURITY DEFINER (intentional - it only exposes safe columns)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_barrier=true) AS
  SELECT user_id, display_name, avatar_url
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
