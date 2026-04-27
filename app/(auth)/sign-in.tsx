import { useRouter } from "expo-router";
import { useState } from "react";
import AuthForm from "../../components/auth/AuthForm";
import AppButton from "../../components/ui/AppButton";
import AppText from "../../components/ui/AppText";
import { useAuth } from "../../features/auth/hooks";
import { getAuthErrorMessage } from "../../lib/auth-errors";

export default function SignInScreen() {
  const router = useRouter();
  const { isMockMode, devMockState, setDevMockState, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
    }
    setLoading(false);
  };

  return (
    <AuthForm
      title="Sign In"
      subtitle="Sign in with your email and password"
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      submitLabel="Sign In"
      onSubmit={handleSubmit}
      loading={loading}
      errorMessage={errorMessage}
      showPassword
      footer={
        <>
          <AppButton label="Sign up" onPress={() => router.push("/sign-up")} />
          <AppButton label="Forgot password" onPress={() => router.push("/forgot-password")} />
        </>
      }
    >
      {isMockMode ? (
        <>
          <AppText style={{ fontWeight: "700", color: "#b45309" }}>
            Dev-only mock auth mode is active.
          </AppText>
          <AppText>Current mock state: {devMockState}</AppText>
          <AppButton label="Simulate signed-out" onPress={() => setDevMockState("signed-out")} />
          <AppButton label="Simulate signed-in onboarded" onPress={() => setDevMockState("signed-in-onboarded")} />
          <AppButton
            label="Simulate signed-in not onboarded"
            onPress={() => setDevMockState("signed-in-not-onboarded")}
          />
        </>
      ) : null}
    </AuthForm>
  );
}
