import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import SelectChips from "../../components/onboarding/SelectChips";
import { COMMON_SYMPTOMS, ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";

export default function SymptomsScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    if (isSavingStep) return;

    const ok = await saveStep({
      symptoms: draft.symptoms ?? [],
    });

    if (!ok) {
      setErrorMessage("Unable to save your profile. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.push("/goals");
  };

  return (
    <OnboardingScaffold
      title="Symptoms"
      subtitle="Choose any symptoms you want to track."
      step={5}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <SelectChips
        options={COMMON_SYMPTOMS}
        selected={draft.symptoms ?? []}
        onChange={(next) => {
          setErrorMessage(null);
          setDraft((current) => ({ ...current, symptoms: next }));
        }}
      />
    </OnboardingScaffold>
  );
}
