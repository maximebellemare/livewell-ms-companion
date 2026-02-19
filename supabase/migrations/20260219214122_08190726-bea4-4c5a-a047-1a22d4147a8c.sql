
-- Articles table (admin-managed content)
CREATE TABLE public.learn_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  body text NOT NULL DEFAULT '',
  read_time text NOT NULL DEFAULT '3 min',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learn_articles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published articles
CREATE POLICY "Authenticated users can view published articles"
  ON public.learn_articles FOR SELECT TO authenticated
  USING (published = true);

-- Admins can manage articles
CREATE POLICY "Admins can manage articles"
  ON public.learn_articles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Bookmarks table (user-specific)
CREATE TABLE public.learn_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id uuid NOT NULL REFERENCES public.learn_articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

ALTER TABLE public.learn_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON public.learn_bookmarks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON public.learn_bookmarks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.learn_bookmarks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_learn_articles_updated_at
  BEFORE UPDATE ON public.learn_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
