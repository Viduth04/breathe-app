// Notification card - design by Minhaj (Member 3), from his student
// Notifications screen (commit abd360f), moved here so the Home bell panel can
// reuse it. Supports FR05, NFR01.

import { colors, radius, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string; // Also tints the icon circle
  title: string;
  body: string;
  time?: string;
  unread?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
};

export default function NotificationItem({
  icon,
  iconColor,
  title,
  body,
  time,
  unread = false,
  onPress,
  accessibilityHint,
}: Props) {
  const content = (
    <>
      <View
        style={[styles.iconBox, { backgroundColor: iconColor + "20" }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.textContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {time ? <Text style={styles.time}>{time}</Text> : null}
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </>
  );

  // One readable sentence for screen readers instead of three separate texts
  const sentence = /[.!?]$/.test(body) ? body : `${body}.`;
  const label = `${unread ? "New. " : ""}${title}. ${sentence}${time ? ` ${time}.` : ""}`;

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.card, unread && styles.unreadCard, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={label} style={[styles.card, unread && styles.unreadCard]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
    minHeight: 48,
  },
  unreadCard: {
    backgroundColor: colors.white,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  textContent: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
});
