// Session Card Component - Muaath (Member 4). Supports FR08, NFR01, NFR02, NFR06.
// Displays scheduled session details, privacy badge, focus note, and action CTA.

import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { SessionItem } from "@/types/counsellorDashboard";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  session: SessionItem;
  onPressAction: (session: SessionItem) => void;
};

export default function SessionCard({ session, onPressAction }: Props) {
  // Session icon and style styling based on type
  const getSessionTypeInfo = () => {
    switch (session.sessionType) {
      case "video":
        return {
          icon: "videocam" as const,
          bgColor: "#E0F2FE",
          borderColor: "#BAE6FD",
          iconColor: "#0284C7",
        };
      case "chat":
        return {
          icon: "chatbubbles" as const,
          bgColor: colors.success,
          borderColor: "rgba(110, 231, 183, 0.6)",
          iconColor: "#065F46",
        };
      case "in-person":
      default:
        return {
          icon: "business" as const,
          bgColor: "#ECFDF5",
          borderColor: "rgba(5, 150, 105, 0.2)",
          iconColor: colors.primary,
        };
    }
  };

  const typeInfo = getSessionTypeInfo();

  const isExpired = Boolean(
    session.isExpired ||
    session.status === "completed" ||
    (() => {
      if (session.endAt) {
        const endMs = session.endAt.toDate ? session.endAt.toDate().getTime() : new Date(session.endAt).getTime();
        return !isNaN(endMs) && endMs < Date.now();
      }
      return false;
    })()
  );

  return (
    <View style={styles.card}>
      {/* Top Timing & Status Chip Row */}
      <View style={styles.headerRow}>
        <View style={styles.timeGroup}>
          <View
            style={[
              styles.timeDot,
              { backgroundColor: isExpired ? "#94A3B8" : (session.isNext ? "#047857" : colors.textSecondary) },
            ]}
          />
          <Text style={styles.timeText}>{session.timeRange}</Text>
        </View>

        <View
          style={[
            styles.chip,
            isExpired ? styles.chipConcluded : (session.isNext ? styles.chipUrgent : styles.chipStandard),
          ]}
          accessibilityLabel={`Timing: ${isExpired ? "Concluded" : session.timeRelative}`}
        >
          {!isExpired && session.isNext && (
            <View style={styles.pulseDot} />
          )}
          <Text
            style={[
              styles.chipText,
              isExpired ? styles.chipTextConcluded : (session.isNext ? styles.chipTextUrgent : styles.chipTextStandard),
            ]}
          >
            {isExpired ? "Concluded" : session.timeRelative}
          </Text>
        </View>
      </View>

      {/* Student & Session Modality Row */}
      <View style={styles.studentRow}>
        <View style={styles.identityGroup}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: typeInfo.bgColor,
                borderColor: typeInfo.borderColor,
              },
            ]}
          >
            <Ionicons
              name={typeInfo.icon}
              size={18}
              color={typeInfo.iconColor}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
          <View style={styles.nameDetails}>
            <Text style={styles.studentName} numberOfLines={1}>
              {session.displayName}
            </Text>
            <Text
              style={[
                styles.modalityLabel,
                session.sessionType === "video" && styles.videoModalityColor,
              ]}
              numberOfLines={1}
            >
              {session.sessionTypeLabel}
            </Text>
          </View>
        </View>

        {/* Privacy / ID Mode Badge */}
        <View
          style={styles.idBadge}
          accessibilityLabel={`ID mode: ${session.idMode === "anonymous" ? "Anonymous" : "Standard ID"}`}
        >
          <Ionicons
            name={session.idMode === "anonymous" ? "eye-off-outline" : "person-outline"}
            size={13}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.idBadgeText}>
            {session.idMode === "anonymous" ? "Anonymous" : "Standard ID"}
          </Text>
        </View>
      </View>

      {/* Pre-session Focus or Follow-up Note */}
      {session.noteText ? (
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            <Text style={styles.notePrefix}>{session.noteType}: </Text>
            {session.noteText}
          </Text>
        </View>
      ) : null}

      {/* Action CTA Button */}
      {isExpired ? (
        <Pressable
          onPress={() => onPressAction(session)}
          accessibilityRole="button"
          accessibilityLabel={`Session Concluded, review notes for ${session.displayName}`}
          style={({ pressed }) => [
            styles.concludedButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color="#047857"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.concludedButtonText}>
            Session Concluded • Review Notes
          </Text>
        </Pressable>
      ) : session.isNext ? (
        <Pressable
          onPress={() => onPressAction(session)}
          accessibilityRole="button"
          accessibilityLabel={
            session.sessionType === "video"
              ? `Join Video Call with ${session.displayName}`
              : session.sessionType === "chat"
              ? `Open Secure Chat with ${session.displayName}`
              : `In-Person Check-in with ${session.displayName}`
          }
          style={({ pressed }) => [
            styles.primaryButton,
            session.sessionType === "chat" && { backgroundColor: "#065F46" },
            session.sessionType === "in-person" && { backgroundColor: "#047857" },
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name={
              session.sessionType === "video"
                ? "videocam-outline"
                : session.sessionType === "chat"
                ? "chatbubble-ellipses-outline"
                : "location-outline"
            }
            size={18}
            color={colors.white}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.primaryButtonText}>
            {session.sessionType === "video"
              ? "Join Video Call"
              : session.sessionType === "chat"
              ? "Open Secure Chat"
              : "In-Person Check-in"}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => onPressAction(session)}
          accessibilityRole="button"
          accessibilityLabel={
            session.sessionType === "chat"
              ? `Open Secure Chat with ${session.displayName}`
              : session.sessionType === "in-person"
              ? `In-Person Details for ${session.displayName}`
              : `Video Session Details for ${session.displayName}`
          }
          style={({ pressed }) => [
            styles.secondaryButton,
            session.sessionType === "chat" && styles.mintOutlineButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name={
              session.sessionType === "video"
                ? "videocam-outline"
                : session.sessionType === "chat"
                ? "chatbubble-outline"
                : "business-outline"
            }
            size={16}
            color={session.sessionType === "chat" ? colors.primary : colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text
            style={[
              styles.secondaryButtonText,
              session.sessionType === "chat" && styles.mintOutlineButtonText,
            ]}
          >
            {session.sessionType === "video"
              ? "Video Details"
              : session.sessionType === "chat"
              ? "Open Chat"
              : "In-Person Details"}
          </Text>
        </Pressable>
      )}
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.md,
    gap: spacing.sm + 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timeDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 5,
  },
  chipUrgent: {
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.6)",
  },
  chipStandard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipConcluded: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: "#059669",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipTextUrgent: {
    color: "#064E3B",
  },
  chipTextStandard: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  chipTextConcluded: {
    color: "#64748B",
    fontWeight: "700",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  identityGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nameDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  modalityLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 1,
  },
  videoModalityColor: {
    color: "#0284C7",
    fontWeight: "600",
  },
  idBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  noteContainer: {
    backgroundColor: colors.background,
    borderRadius: radius.sm + 2,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(230, 225, 211, 0.8)",
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  notePrefix: {
    fontWeight: "700",
    color: colors.primary,
  },
  primaryButton: {
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  mintOutlineButton: {
    borderColor: "rgba(7, 96, 71, 0.3)",
    backgroundColor: colors.surface,
  },
  mintOutlineButtonText: {
    color: colors.primary,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  concludedButton: {
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: "#ECFDF5",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  concludedButtonText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "700",
  },
});
