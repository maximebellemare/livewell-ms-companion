
CREATE TABLE public.learn_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id uuid NOT NULL REFERENCES public.learn_articles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

ALTER TABLE public.learn_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads"
  ON public.learn_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reads"
  ON public.learn_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reads"
  ON public.learn_reads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
