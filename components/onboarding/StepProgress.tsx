import { StyleSheet, View } from "react-native";

type StepProgressProps = {
  step: number;
  totalSteps: number;
};

export default function StepProgress({ step, totalSteps }: StepProgressProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index < step ? styles.dotActive : null]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  dotActive: {
    backgroundColor: "#e8751a",
  },
});
