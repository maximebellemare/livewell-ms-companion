
-- Add notification preference columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_post_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_thread_replies boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push_enabled boolean NOT NULL DEFAULT true;

-- Update the trigger to respect preferences
CREATE OR REPLACE FUNCTION public.notify_on_new_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _post_title TEXT;
  _post_author_id UUID;
  _commenter_name TEXT;
  _target_user_id UUID;
  _notify_post_comments BOOLEAN;
  _notify_thread_replies BOOLEAN;
  _notify_push BOOLEAN;
  _notify_user_ids UUID[] := '{}';
  _supabase_url TEXT;
  _service_key TEXT;
BEGIN
  SELECT title, user_id INTO _post_title, _post_author_id
  FROM community_posts WHERE id = NEW.post_id;

  _commenter_name := NEW.display_name;

  -- Notify the post author (if not the commenter)
  IF _post_author_id IS NOT NULL AND _post_author_id != NEW.user_id THEN
    SELECT COALESCE(notify_post_comments, true), COALESCE(notify_push_enabled, true)
    INTO _notify_post_comments, _notify_push
    FROM profiles WHERE user_id = _post_author_id;

    IF _notify_post_comments THEN
      INSERT INTO notifications (user_id, type, title, body, post_id, comment_id, actor_id, actor_name)
      VALUES (
        _post_author_id, 'comment',
        _commenter_name || ' commented on your post',
        LEFT(NEW.body, 120), NEW.post_id, NEW.id, NEW.user_id, _commenter_name
      );
      IF _notify_push THEN
        _notify_user_ids := array_append(_notify_user_ids, _post_author_id);
      END IF;
    END IF;
  END IF;

  -- Notify other commenters on same post
  FOR _target_user_id IN
    SELECT DISTINCT user_id FROM community_comments
    WHERE post_id = NEW.post_id
      AND user_id != NEW.user_id
      AND user_id != COALESCE(_post_author_id, '00000000-0000-0000-0000-000000000000')
  LOOP
    SELECT COALESCE(notify_thread_replies, true), COALESCE(notify_push_enabled, true)
    INTO _notify_thread_replies, _notify_push
    FROM profiles WHERE user_id = _target_user_id;

    IF _notify_thread_replies THEN
      INSERT INTO notifications (user_id, type, title, body, post_id, comment_id, actor_id, actor_name)
      VALUES (
        _target_user_id, 'comment',
        _commenter_name || ' also commented on "' || LEFT(_post_title, 60) || '"',
        LEFT(NEW.body, 120), NEW.post_id, NEW.id, NEW.user_id, _commenter_name
      );
      IF _notify_push THEN
        _notify_user_ids := array_append(_notify_user_ids, _target_user_id);
      END IF;
    END IF;
  END LOOP;

  -- Send push notifications
  IF array_length(_notify_user_ids, 1) > 0 THEN
    SELECT COALESCE(current_setting('app.settings.supabase_url', true), '') INTO _supabase_url;
    SELECT COALESCE(current_setting('app.settings.service_role_key', true), '') INTO _service_key;
    IF _supabase_url <> '' AND _service_key <> '' THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/send-comment-push',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || _service_key),
        body := jsonb_build_object('user_ids', to_jsonb(_notify_user_ids), 'title', _commenter_name || ' replied 💬', 'body', LEFT(NEW.body, 100))
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
