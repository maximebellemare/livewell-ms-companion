import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "./AppText";

type AppScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export default function AppScreen({ children, title, subtitle }: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {title ? <AppText style={styles.title}>{title}</AppText> : null}
        {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff7f2",
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    gap: 12,
    paddingTop: 12,
  },
});
