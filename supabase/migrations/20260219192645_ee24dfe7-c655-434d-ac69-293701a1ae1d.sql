
-- Add reaction_type column to community_likes
ALTER TABLE public.community_likes
  ADD COLUMN reaction_type text NOT NULL DEFAULT 'heart';

-- Add unique constraint: one reaction type per user per post
CREATE UNIQUE INDEX idx_community_likes_user_post_reaction
  ON public.community_likes (user_id, post_id, reaction_type)
  WHERE post_id IS NOT NULL;

-- Add unique constraint: one reaction type per user per comment
CREATE UNIQUE INDEX idx_community_likes_user_comment_reaction
  ON public.community_likes (user_id, comment_id, reaction_type)
  WHERE comment_id IS NOT NULL;
