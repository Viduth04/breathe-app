// Clinic Hours Notice Banner - Muaath (Member 4). Supports FR08.
// Quick shortcut card linking to the Schedule & Availability management tab.

import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ClinicHoursBanner() {
  const goToSchedule = () => router.navigate("/(counsellor)/schedule");

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            Need to block clinic hours?
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Set custom buffers, breaks & holiday hours
          </Text>
        </View>

        {/* Manage Action Button */}
        <Pressable
          onPress={goToSchedule}
          accessibilityRole="button"
          accessibilityLabel="Manage clinic hours and availability schedule"
          style={({ pressed }) => [
            styles.manageButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.manageButtonText}>Manage</Text>
          <Ionicons
            name="open-outline"
            size={13}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  manageButton: {
    minHeight: TOUCH_TARGET - 4,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
