import type { ProfileUpdateInput } from "../profile/api";

export type OnboardingStep =
  | "welcome"
  | "consent"
  | "profile-basics"
  | "ms-profile"
  | "symptoms"
  | "goals"
  | "about-you"
  | "plan"
  | "complete";

export type OnboardingDraft = {
  display_name: string;
  ms_type: string;
  year_diagnosed: string;
  symptoms: string[];
  goals: string[];
  country: string;
  age_range: string;
};

export type ConsentState = {
  medical_disclaimer: boolean;
  health_data: boolean;
  not_medical: boolean;
  data_control: boolean;
};

export type SaveStepInput = {
  userId: string;
  input: ProfileUpdateInput;
};
