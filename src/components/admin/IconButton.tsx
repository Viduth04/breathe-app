// Admin panel - Viduth (Member 1).

import { colors, radius, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

// Round 48px icon button for row actions (Edit, Delete)
export default function IconButton({
  icon,
  label,
  onPress,
  danger = false,
  loading = false,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; // Read by screen readers
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const color = danger ? colors.danger : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        danger && styles.danger,
        (pressed || disabled) && styles.dim,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Ionicons name={icon} size={20} color={color} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  danger: { backgroundColor: colors.dangerTint },
  dim: { opacity: 0.6 },
});
