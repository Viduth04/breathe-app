import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Leaf mark + "Breathe" wordmark shown at the top of every auth screen
export function BrandLogo() {
  return (
    <View
      style={styles.logo}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Breathe"
    >
      <View style={styles.logoMark}>
        <Ionicons name="leaf" size={18} color={colors.primary} />
      </View>
      <Text style={styles.logoText}>Breathe</Text>
    </View>
  );
}

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

// Back button and logo on one row (Register, Forgot Password)
export default function AuthHeader() {
  return (
    <View style={styles.row}>
      <BackButton />
      <BrandLogo />
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
  logo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.sm,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 18, fontWeight: "700", color: colors.primary },
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
