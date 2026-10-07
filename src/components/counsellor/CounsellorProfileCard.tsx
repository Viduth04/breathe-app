// Counsellor Profile Card - Muaath (Member 4). Supports FR08.
// Includes avatar, verification badge, unread alerts shortcut, and live availability toggle.

import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { CounsellorProfileInfo } from "@/types/counsellorDashboard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

type Props = {
  profile: CounsellorProfileInfo;
  isAvailable: boolean;
  onToggleAvailability: (value: boolean) => void;
};

export default function CounsellorProfileCard({
  profile,
  isAvailable,
  onToggleAvailability,
}: Props) {
  const goToAlerts = () => router.navigate("/(counsellor)/alerts");

  return (
    <View
      style={[
        styles.card,
        !isAvailable && styles.cardMuted,
      ]}
      accessibilityRole="summary"
    >
      <View style={styles.topRow}>
        {/* Avatar with Online/Offline indicator */}
        <Pressable
          onPress={() => router.navigate("/(counsellor-detail)/settings")}
          accessibilityRole="button"
          accessibilityLabel="Open Counselor Settings"
        >
          <View style={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatar}
                accessibilityLabel={`${profile.fullName} profile photo`}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="#065F46" />
              </View>
            )}
            <View
              style={[
                styles.onlineBadge,
                { backgroundColor: isAvailable ? "#059669" : colors.textSecondary },
              ]}
            />
          </View>
        </Pressable>

        {/* Identity & Credentials */}
        <Pressable
          style={styles.infoCol}
          onPress={() => router.navigate("/(counsellor-detail)/settings")}
          accessibilityRole="button"
          accessibilityLabel="View Counselor Settings"
        >
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.fullName}
            </Text>
            {profile.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#0284C7"
                accessibilityLabel="Verified Professional"
              />
            )}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {profile.title} • {profile.organization}
          </Text>
        </Pressable>

        {/* Notification Bell with Unread Badge */}
        <Pressable
          onPress={goToAlerts}
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${profile.unreadAlertsCount} unread`}
          style={({ pressed }) => [
            styles.bellButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={colors.text}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          {profile.unreadAlertsCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {profile.unreadAlertsCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Availability Status & Switch */}
      <View style={styles.availabilityRow}>
        <View style={styles.statusIndicatorGroup}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isAvailable ? "#047857" : colors.textSecondary },
            ]}
          />
          <Text style={styles.availabilityLabel}>
            {isAvailable
              ? "Available for Consultations"
              : "Unavailable (Away / In Session)"}
          </Text>
        </View>

        <Switch
          value={isAvailable}
          onValueChange={onToggleAvailability}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          accessibilityLabel="Toggle consultation availability"
          accessibilityHint="Changes whether students can book immediate sessions"
          style={styles.switch}
        />
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
    borderColor: "rgba(7, 96, 71, 0.12)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: spacing.md,
  },
  cardMuted: {
    borderColor: colors.border,
    backgroundColor: "#FCFCFA",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "rgba(5, 150, 105, 0.3)",
  },
  avatarPlaceholder: {
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.white,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  bellButton: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: radius.sm + 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  buttonPressed: {
    opacity: 0.75,
  },
  unreadBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "700",
  },
  availabilityRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(230, 225, 211, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusIndicatorGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  availabilityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});
