
-- Add premium subscription fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS premium_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS monthly_reports_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reports_reset_at timestamp with time zone DEFAULT now();

-- Create premium_programs table for tracking user program progress
CREATE TABLE IF NOT EXISTS public.premium_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  program_id text NOT NULL,
  day_number integer NOT NULL DEFAULT 1,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.premium_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own programs" ON public.premium_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own programs" ON public.premium_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own programs" ON public.premium_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own programs" ON public.premium_programs FOR DELETE USING (auth.uid() = user_id);

-- Create program_day_logs to track individual day completions
CREATE TABLE IF NOT EXISTS public.program_day_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  program_id text NOT NULL,
  day_number integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(user_id, program_id, day_number)
);

ALTER TABLE public.program_day_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day logs" ON public.program_day_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own day logs" ON public.program_day_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own day logs" ON public.program_day_logs FOR DELETE USING (auth.uid() = user_id);
