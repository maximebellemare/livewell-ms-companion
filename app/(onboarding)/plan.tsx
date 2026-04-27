import { useRouter } from "expo-router";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

export default function PlanScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="Your Plan"
      subtitle="You’re almost ready to start."
      step={8}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/complete")}
      nextLabel="Continue"
    >
      <AppText>
        We’ll use your profile information to personalize your experience as you continue.
      </AppText>
    </OnboardingScaffold>
  );
}
