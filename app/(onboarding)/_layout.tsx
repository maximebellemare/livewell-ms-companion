import { Stack } from "expo-router";
import RouteGate from "../../components/ui/RouteGate";

export default function OnboardingLayout() {
  return (
    <RouteGate mode="onboarding">
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}
