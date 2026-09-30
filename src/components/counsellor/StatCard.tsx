// Stat Card Component - Muaath (Member 4). Supports FR08.
// Individual stat metric card with custom icon pill, counter value, and descriptive status.

import { colors, radius, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  value: string | number;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  highlightSubtitle?: boolean;
  subtitleColor?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  iconName,
  iconColor,
  iconBg,
  iconBorder,
  subtitleColor,
}: Props) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: iconBg, borderColor: iconBorder },
          ]}
        >
          <Ionicons
            name={iconName}
            size={14}
            color={iconColor}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
      </View>

      <View style={styles.bottomBlock}>
        <Text style={styles.value}>{value}</Text>
        <Text
          style={[
            styles.subtitle,
            subtitleColor ? { color: subtitleColor, fontWeight: "700" } : null,
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    justifyContent: "space-between",
    minHeight: 88,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBlock: {
    marginTop: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 2,
  },
});
