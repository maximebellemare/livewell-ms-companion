import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import SelectChips from "../../components/onboarding/SelectChips";
import { GOALS, ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";

export default function GoalsScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    if (isSavingStep) return;

    const ok = await saveStep({
      goals: draft.goals ?? [],
    });

    if (!ok) {
      setErrorMessage("Unable to save your profile. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.push("/about-you");
  };

  return (
    <OnboardingScaffold
      title="Goals"
      subtitle="Pick any goals that feel relevant right now."
      step={6}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <SelectChips
        options={GOALS}
        selected={draft.goals ?? []}
        onChange={(next) => {
          setErrorMessage(null);
          setDraft((current) => ({ ...current, goals: next }));
        }}
      />
    </OnboardingScaffold>
  );
}
