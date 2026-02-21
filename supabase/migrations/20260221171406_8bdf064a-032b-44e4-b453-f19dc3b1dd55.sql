-- Energy Budgets table (Spoon Theory)
CREATE TABLE public.energy_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  total_spoons integer NOT NULL DEFAULT 12,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.energy_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own energy budgets" ON public.energy_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own energy budgets" ON public.energy_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own energy budgets" ON public.energy_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own energy budgets" ON public.energy_budgets FOR DELETE USING (auth.uid() = user_id);

-- Energy Activities table
CREATE TABLE public.energy_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.energy_budgets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  spoon_cost integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.energy_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own energy activities" ON public.energy_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own energy activities" ON public.energy_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own energy activities" ON public.energy_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own energy activities" ON public.energy_activities FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on energy_budgets
CREATE TRIGGER update_energy_budgets_updated_at
  BEFORE UPDATE ON public.energy_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();