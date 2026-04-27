import { Pressable, StyleSheet, Text } from "react-native";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function AppButton({ label, onPress, disabled = false }: AppButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && styles.buttonDisabled]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#e8751a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
