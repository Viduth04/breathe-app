import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useId, useState } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
};

export default function Input({
  label,
  icon,
  error,
  isPassword = false,
  ...rest
}: Props) {
  const [hidden, setHidden] = useState(isPassword);
  const errorId = `input-error-${useId()}`;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error && styles.fieldError]}>
        {icon && (
          <Ionicons name={icon} size={20} color={colors.textSecondary} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          // Screen readers read the error with the field: as the hint on
          // iOS/Android, via aria-describedby on web (RN's types lack it)
          accessibilityHint={error ? `Error: ${error}` : undefined}
          {...(error && Platform.OS === "web"
            ? { "aria-describedby": errorId, "aria-invalid": true }
            : null)}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden(!hidden)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            hitSlop={12}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error} nativeID={errorId}>
          {error}
        </Text>
      ) : null}
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
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  fieldError: { borderColor: colors.danger },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.xs },
});
