import { useRouter } from "expo-router";
import { useState } from "react";
import ConsentChecklist from "../../components/onboarding/ConsentChecklist";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import { CONSENT_ITEMS, ONBOARDING_STEPS } from "../../features/onboarding/constants";
import type { ConsentState } from "../../features/onboarding/types";

const INITIAL_CONSENT: ConsentState = {
  medical_disclaimer: false,
  health_data: false,
  not_medical: false,
  data_control: false,
};

export default function ConsentScreen() {
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    const allRequiredAccepted = CONSENT_ITEMS.every((item) => !item.required || consent[item.id]);
    if (!allRequiredAccepted) {
      setErrorMessage("Please accept all required items to continue.");
      return;
    }

    setErrorMessage(null);
    router.push("/profile-basics");
  };

  return (
    <OnboardingScaffold
      title="Consent"
      subtitle="Please review and accept all required items."
      step={2}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      errorMessage={errorMessage}
    >
      <ConsentChecklist values={consent} onChange={setConsent} />
    </OnboardingScaffold>
  );
}
