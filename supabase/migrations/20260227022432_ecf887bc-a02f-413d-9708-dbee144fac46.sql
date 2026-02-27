
-- Create fitness plans table for saving AI-generated training plans
CREATE TABLE public.fitness_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Training Plan',
  goals TEXT[] NOT NULL DEFAULT '{}',
  abilities TEXT[] NOT NULL DEFAULT '{}',
  session_duration TEXT,
  weekly_frequency TEXT,
  fitness_level TEXT NOT NULL DEFAULT 'beginner',
  has_gym BOOLEAN NOT NULL DEFAULT false,
  equipment TEXT[] NOT NULL DEFAULT '{}',
  limitations TEXT,
  preferred_time_of_day TEXT,
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout completion tracking
CREATE TABLE public.fitness_workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.fitness_plans(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS
ALTER TABLE public.fitness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_workout_logs ENABLE ROW LEVEL SECURITY;

-- Fitness plans policies
CREATE POLICY "Users can view own fitness plans" ON public.fitness_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own fitness plans" ON public.fitness_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fitness plans" ON public.fitness_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fitness plans" ON public.fitness_plans FOR DELETE USING (auth.uid() = user_id);

-- Workout logs policies
CREATE POLICY "Users can view own workout logs" ON public.fitness_workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workout logs" ON public.fitness_workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout logs" ON public.fitness_workout_logs FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_fitness_plans_updated_at
  BEFORE UPDATE ON public.fitness_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
