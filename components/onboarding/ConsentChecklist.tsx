import { Pressable, StyleSheet, View } from "react-native";
import { CONSENT_ITEMS } from "../../features/onboarding/constants";
import type { ConsentState } from "../../features/onboarding/types";
import AppText from "../ui/AppText";

type ConsentChecklistProps = {
  values: ConsentState;
  onChange: (next: ConsentState) => void;
};

export default function ConsentChecklist({ values, onChange }: ConsentChecklistProps) {
  const toggle = (key: keyof ConsentState) => {
    onChange({
      ...values,
      [key]: !values[key],
    });
  };

  return (
    <View style={styles.container}>
      {CONSENT_ITEMS.map((item) => (
        <Pressable key={item.id} onPress={() => toggle(item.id)} style={styles.row}>
          <View style={[styles.box, values[item.id] ? styles.boxChecked : null]} />
          <AppText style={styles.label}>{item.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#9ca3af",
    backgroundColor: "#ffffff",
    marginTop: 2,
  },
  boxChecked: {
    borderColor: "#e8751a",
    backgroundColor: "#e8751a",
  },
  label: {
    flex: 1,
  },
});
