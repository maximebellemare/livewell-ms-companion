import { useEffect, useState } from "react";
import { useAuth } from "../auth/hooks";
import { useCompleteOnboarding, useMyProfile, useSaveProfileStep } from "../profile/hooks";
import type { ProfileUpdateInput } from "../profile/api";
import type { ConsentState, OnboardingDraft } from "./types";

const EMPTY_DRAFT: OnboardingDraft = {
  display_name: "",
  ms_type: "",
  year_diagnosed: "",
  symptoms: [],
  goals: [],
  country: "",
  age_range: "",
};

const EMPTY_CONSENT: ConsentState = {
  medical_disclaimer: false,
  health_data: false,
  not_medical: false,
  data_control: false,
};

export function useOnboarding() {
  const { user } = useAuth();
  const profileQuery = useMyProfile(user?.id);
  const saveProfileStep = useSaveProfileStep();
  const completeOnboardingMutation = useCompleteOnboarding();
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [consent, setConsent] = useState<ConsentState>(EMPTY_CONSENT);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return;
    }

    setDraft({
      display_name: profile?.display_name ?? "",
      ms_type: profile?.ms_type ?? "",
      year_diagnosed: profile?.year_diagnosed ?? "",
      symptoms: profile?.symptoms ?? [],
      goals: profile?.goals ?? [],
      country: profile?.country ?? "",
      age_range: profile?.age_range ?? "",
    });
  }, [profileQuery.data]);

  async function saveStep(input: ProfileUpdateInput): Promise<boolean> {
    if (!user?.id || saveProfileStep.isPending) {
      return false;
    }

    try {
      await saveProfileStep.mutateAsync({ userId: user.id, input });
      return true;
    } catch {
      return false;
    }
  }

  async function completeOnboarding(): Promise<boolean> {
    if (!user?.id || completeOnboardingMutation.isPending) {
      return false;
    }

    try {
      await completeOnboardingMutation.mutateAsync({
        userId: user.id,
        input: {
          onboarding_completed: true,
          display_name: draft.display_name || null,
          ms_type: draft.ms_type || null,
          year_diagnosed: draft.year_diagnosed || null,
          symptoms: draft.symptoms ?? [],
          goals: draft.goals ?? [],
          country: draft.country || null,
          age_range: draft.age_range || null,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  return {
    userId: user?.id ?? null,
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    draft,
    consent,
    setDraft,
    setConsent,
    saveStep,
    completeOnboarding,
    isSavingStep: saveProfileStep.isPending,
    isCompleting: completeOnboardingMutation.isPending,
  };
}

export { useSaveProfileStep } from "../profile/hooks";
