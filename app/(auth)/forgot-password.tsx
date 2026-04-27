import { useState } from "react";
import AuthForm from "../../components/auth/AuthForm";
import AppText from "../../components/ui/AppText";
import { useAuth } from "../../features/auth/hooks";
import { getAuthErrorMessage } from "../../lib/auth-errors";

export default function ForgotPasswordScreen() {
  const { sendPasswordReset, isMockMode } = useAuth();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email.");
      return;
    }

    setLoading(true);
    const result = await sendPasswordReset(email.trim());
    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
    } else {
      setSuccessMessage("Check your email for a password reset link.");
    }
    setLoading(false);
  };

  return (
    <AuthForm
      title="Forgot Password"
      subtitle="Enter your email to receive a reset link"
      email={email}
      setEmail={setEmail}
      submitLabel="Send Reset Email"
      onSubmit={handleSubmit}
      loading={loading}
      errorMessage={errorMessage}
      successMessage={successMessage}
    >
      {isMockMode ? (
        <AppText style={{ color: "#b45309" }}>
          Recovery emails are unavailable in dev-only mock mode.
        </AppText>
      ) : null}
    </AuthForm>
  );
}
