// Crisis Support - Viduth (Member 1). Fixes Milestone 02 F9 / R9.

import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const openCrisis = () => router.push("/crisis");

// "Need urgent help?" text link (Welcome, Login)
export default function UrgentHelpLink() {
  return (
    <Pressable
      onPress={openCrisis}
      accessibilityRole="link"
      accessibilityLabel="Need urgent help? Open crisis support"
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Ionicons
        name="help-buoy-outline"
        size={18}
        color={colors.primary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.linkText}>Need urgent help?</Text>
    </Pressable>
  );
}

// Right padding a full-width top bar needs (measured from the screen edge) so
// nothing in it sits under FloatingHelpButton: its 16px inset, the 48px
// button and an 8px gap
export const FLOATING_HELP_CLEARANCE = spacing.md + TOUCH_TARGET + spacing.sm;

// Small round help button floating in the top-right corner of the student
// area (rendered by the (student) layout, so it's on every student screen)
export function FloatingHelpButton() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  if (
    pathname.includes("/session/counselor") ||
    pathname.includes("/session/book")
  ) {
    return null;
  }

  return (
    <Pressable
      onPress={openCrisis}
      accessibilityRole="button"
      accessibilityLabel="Need urgent help? Open crisis support"
      hitSlop={4}
      style={({ pressed }) => [
        styles.floating,
        { top: insets.top + spacing.sm, right: spacing.md },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="help-buoy" size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  pressed: { opacity: 0.7 },
  floating: {
    position: "absolute",
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.selected,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
