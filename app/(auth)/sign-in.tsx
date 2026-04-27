import { useRouter } from "expo-router";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";
import { useAuth } from "../../features/auth/hooks";

export default function SignInScreen() {
  const router = useRouter();
  const { isMockMode, devMockState, setDevMockState } = useAuth();

  return (
    <AppScreen title="Sign In" subtitle="PR1 auth shell">
      <AppText>Authentication UI will be implemented in a later PR.</AppText>
      {isMockMode ? (
        <>
          <AppText style={{ fontWeight: "700", color: "#b45309" }}>
            Dev-only mock auth mode is active.
          </AppText>
          <AppText>Current mock state: {devMockState}</AppText>
          <AppButton label="Simulate signed-out" onPress={() => setDevMockState("signed-out")} />
          <AppButton
            label="Simulate signed-in onboarded"
            onPress={() => setDevMockState("signed-in-onboarded")}
          />
          <AppButton
            label="Simulate signed-in not onboarded"
            onPress={() => setDevMockState("signed-in-not-onboarded")}
          />
        </>
      ) : null}
      <AppButton label="Sign up" onPress={() => router.push("/sign-up")} />
      <AppButton label="Forgot password" onPress={() => router.push("/forgot-password")} />
    </AppScreen>
  );
}
