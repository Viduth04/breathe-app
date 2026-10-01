import Logo from "@/components/common/Logo";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

// Round back button; falls back to Welcome when there is no history (e.g. web refresh)
export function BackButton() {
  return (
    <Pressable
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace("/(auth)/welcome")
      }
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Ionicons name="arrow-back" size={20} color={colors.text} />
    </Pressable>
  );
}

// Back button and logo on one row (Register, Forgot Password, privacy screens)
export default function AuthHeader() {
  return (
    <View style={styles.row}>
      <BackButton />
      <Logo size={20} showWordmark badge />
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  spacer: { width: TOUCH_TARGET },
  back: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
});
