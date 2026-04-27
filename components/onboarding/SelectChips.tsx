import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";

type SelectChipsProps = {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
};

export default function SelectChips({
  options,
  selected,
  onChange,
  multiple = true,
}: SelectChipsProps) {
  const toggle = (value: string) => {
    if (multiple) {
      onChange(
        selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      );
      return;
    }

    onChange(selected.includes(value) ? [] : [value]);
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            style={[styles.chip, active ? styles.chipActive : null]}
          >
            <AppText style={active ? styles.textActive : undefined}>{option.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  chipActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff0e1",
  },
  textActive: {
    color: "#b45309",
    fontWeight: "600",
  },
});
