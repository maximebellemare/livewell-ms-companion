import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

type AppTextProps = PropsWithChildren<{
  style?: StyleProp<TextStyle>;
}> &
  Pick<TextProps, "numberOfLines">;

export default function AppText({ children, style, numberOfLines }: AppTextProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.text, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 22,
  },
});
