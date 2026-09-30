// Admin panel - Viduth (Member 1).

import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props<T extends string> = {
  label: string;
  options: readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  multiple?: boolean; // false = pick exactly one
  error?: string;
  optionLabel?: (option: T) => string;
};

// Row of selectable chips with a label and an error line, like our Input
export default function ChipSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
  multiple = true,
  error,
  optionLabel = (o) => o,
}: Props<T>) {
  const toggle = (option: T) => {
    if (!multiple) return onChange([option]);
    onChange(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option],
    );
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable
              key={option}
              onPress={() => toggle(option)}
              accessibilityRole={multiple ? "checkbox" : "radio"}
              accessibilityLabel={`${label}: ${optionLabel(option)}`}
              accessibilityState={{ checked: active }}
              style={[
                styles.chip,
                active && styles.chipActive,
                error && !selected.length ? styles.chipError : null,
              ]}
            >
              {active ? (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {optionLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.selected, borderColor: colors.primary },
  chipError: { borderColor: colors.danger },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.xs },
});
