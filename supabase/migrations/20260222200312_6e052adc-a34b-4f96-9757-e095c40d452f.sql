
CREATE TABLE public.grounding_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reflections JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grounding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grounding sessions" ON public.grounding_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own grounding sessions" ON public.grounding_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own grounding sessions" ON public.grounding_sessions FOR DELETE USING (auth.uid() = user_id);
