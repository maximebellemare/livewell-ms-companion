import { ActivityIndicator, StyleSheet, View } from "react-native";
import AppText from "./AppText";

type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e8751a" />
      <AppText style={styles.message}>{message}</AppText>
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
  message: {
    color: "#6b7280",
  },
});
