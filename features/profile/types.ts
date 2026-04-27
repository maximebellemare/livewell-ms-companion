export type Profile = {
  user_id: string;
  onboarding_completed: boolean;
  display_name: string | null;
  ms_type: string | null;
  year_diagnosed: string | null;
  symptoms: string[];
  goals: string[];
  country: string | null;
  age_range: string | null;
};
