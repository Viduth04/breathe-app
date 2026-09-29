// Admin panel - Viduth (Member 1).

import { colors, spacing, TOUCH_TARGET, typography } from "@/theme";
import { StyleSheet, Switch, Text, View } from "react-native";

// Label + optional description + switch, in theme colors
export default function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={typography.caption}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.border}
        accessibilityLabel={label}
        accessibilityHint={description}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
    marginBottom: spacing.md,
  },
  text: { flex: 1, gap: 2 },
  label: { ...typography.body, fontWeight: "600" },
});
