ALTER TABLE public.user_diet_plans 
ADD COLUMN weekly_selections jsonb NOT NULL DEFAULT '{}'::jsonb;