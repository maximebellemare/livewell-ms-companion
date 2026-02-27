
-- Categories for feature requests
CREATE TYPE public.feedback_category AS ENUM ('feature', 'ui', 'bug', 'integration', 'other');
CREATE TYPE public.feedback_status AS ENUM ('new', 'planned', 'in_progress', 'done', 'declined');

-- Feature requests table
CREATE TABLE public.feedback_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category feedback_category NOT NULL DEFAULT 'feature',
  status feedback_status NOT NULL DEFAULT 'new',
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view
CREATE POLICY "Anyone can view feedback posts"
  ON public.feedback_posts FOR SELECT
  USING (true);

-- Users can create their own
CREATE POLICY "Users can create feedback posts"
  ON public.feedback_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own posts (title/body only via app)
CREATE POLICY "Users can update own feedback posts"
  ON public.feedback_posts FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can delete own, admins can delete any
CREATE POLICY "Users can delete own feedback posts"
  ON public.feedback_posts FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Upvotes table (one per user per post)
CREATE TABLE public.feedback_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feedback_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.feedback_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes"
  ON public.feedback_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can create own upvotes"
  ON public.feedback_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own upvotes"
  ON public.feedback_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.feedback_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feedback_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback comments"
  ON public.feedback_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create feedback comments"
  ON public.feedback_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback comments"
  ON public.feedback_comments FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update upvotes_count
CREATE OR REPLACE FUNCTION public.update_feedback_upvotes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts SET upvotes_count = upvotes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts SET upvotes_count = upvotes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_feedback_upvotes_count
AFTER INSERT OR DELETE ON public.feedback_upvotes
FOR EACH ROW EXECUTE FUNCTION public.update_feedback_upvotes_count();

-- Trigger to update comments_count
CREATE OR REPLACE FUNCTION public.update_feedback_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_feedback_comments_count
AFTER INSERT OR DELETE ON public.feedback_comments
FOR EACH ROW EXECUTE FUNCTION public.update_feedback_comments_count();

-- Updated_at trigger
CREATE TRIGGER update_feedback_posts_updated_at
BEFORE UPDATE ON public.feedback_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
