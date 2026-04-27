import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import StepProgress from "./StepProgress";

type OnboardingScaffoldProps = {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  onNext?: () => void | Promise<void>;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  children: ReactNode;
};

export default function OnboardingScaffold({
  title,
  subtitle,
  step,
  totalSteps,
  onNext,
  onBack,
  nextLabel = "Next",
  backLabel = "Back",
  nextDisabled = false,
  loading = false,
  errorMessage,
  children,
}: OnboardingScaffoldProps) {
  return (
    <AppScreen title={title} subtitle={subtitle}>
      <StepProgress step={step} totalSteps={totalSteps} />
      <View style={styles.body}>{children}</View>
      {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
      <View style={styles.actions}>
        {onBack ? <AppButton label={backLabel} onPress={onBack} disabled={loading} /> : null}
        {onNext ? (
          <AppButton
            label={loading ? "Saving..." : nextLabel}
            onPress={() => {
              if (loading || nextDisabled) return;
              void onNext();
            }}
            disabled={loading || nextDisabled}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 16,
  },
  actions: {
    gap: 10,
  },
  error: {
    color: "#b91c1c",
  },
});
