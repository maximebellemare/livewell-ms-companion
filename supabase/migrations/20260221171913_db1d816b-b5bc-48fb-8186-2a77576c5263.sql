-- Smart Match Profiles
CREATE TABLE public.smart_match_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  opt_in boolean NOT NULL DEFAULT false,
  bio text,
  looking_for text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_match_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own match profile" ON public.smart_match_profiles FOR SELECT USING (auth.uid() = user_id);

-- Users can view other opted-in profiles (for matching)
CREATE POLICY "Users can view opted in profiles" ON public.smart_match_profiles FOR SELECT USING (opt_in = true);

CREATE POLICY "Users can create own match profile" ON public.smart_match_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own match profile" ON public.smart_match_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own match profile" ON public.smart_match_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_smart_match_profiles_updated_at BEFORE UPDATE ON public.smart_match_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();