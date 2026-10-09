// Section Header Component - Muaath (Member 4). Supports FR08.
// Heading with uppercase title, secondary date/status, and pill badge.

import { colors, radius, spacing } from "@/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  badgeText: string;
};

export default function SectionHeader({ title, subtitle, badgeText }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.badge} accessibilityLabel={badgeText}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.6)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#064E3B",
  },
});
