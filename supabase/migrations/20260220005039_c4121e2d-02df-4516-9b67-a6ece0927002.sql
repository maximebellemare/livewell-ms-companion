
-- Create relapses table for tracking MS flare-ups
CREATE TABLE public.relapses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  triggers TEXT[] NULL DEFAULT '{}',
  treatment TEXT NULL,
  notes TEXT NULL,
  is_recovered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relapses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own relapses"
  ON public.relapses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own relapses"
  ON public.relapses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relapses"
  ON public.relapses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own relapses"
  ON public.relapses FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_relapses_updated_at
  BEFORE UPDATE ON public.relapses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
