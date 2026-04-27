import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import AppText from "./AppText";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
};

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>{message}</AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff7f2",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  message: {
    textAlign: "center",
    color: "#6b7280",
  },
});
