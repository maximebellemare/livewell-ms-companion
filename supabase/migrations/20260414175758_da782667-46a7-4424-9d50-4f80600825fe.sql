
-- Fix INSERT policies: replace current_setting with auth.role()
DROP POLICY IF EXISTS "Service role can insert risk scores" ON risk_scores;
CREATE POLICY "Service role can insert risk scores"
ON risk_scores FOR INSERT
TO public
WITH CHECK ((auth.uid() = user_id) OR (auth.role() = 'service_role'));

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
TO public
WITH CHECK ((auth.uid() = user_id) OR (auth.role() = 'service_role'));

-- Fix smart_match_profiles: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Users can view opted in profiles" ON smart_match_profiles;
CREATE POLICY "Users can view opted in profiles"
ON smart_match_profiles FOR SELECT
TO authenticated
USING (opt_in = true);

-- Make reports bucket private
UPDATE storage.buckets SET public = false WHERE id = 'reports';

-- Fix reports storage SELECT policy: add ownership check
DROP POLICY IF EXISTS "Reports are publicly readable" ON storage.objects;
CREATE POLICY "Users can read own reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Remove messages from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
  END IF;
END;
$$;
