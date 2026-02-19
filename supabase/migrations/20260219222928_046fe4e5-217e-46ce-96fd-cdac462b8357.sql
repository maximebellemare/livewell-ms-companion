
-- Store per-user article reading progress (0.0 to 1.0)
CREATE TABLE public.learn_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.learn_articles(id) ON DELETE CASCADE,
  progress NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.learn_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own progress"
  ON public.learn_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.learn_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.learn_progress FOR UPDATE
  USING (auth.uid() = user_id);
