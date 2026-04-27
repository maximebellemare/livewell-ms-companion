import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

type AppTextProps = PropsWithChildren<{
  style?: StyleProp<TextStyle>;
}>;

export default function AppText({ children, style }: AppTextProps) {
  return <Text style={[styles.text, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 22,
  },
});
