// Request Card Component - Muaath (Member 4). Supports FR08, FR07, NFR01, NFR06.
// Displays pending student booking requests with AI Mood Brief and Accept/View dual actions.

import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { BookingRequestItem } from "@/types/counsellorDashboard";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  request: BookingRequestItem;
  onAccept: (request: BookingRequestItem) => void;
  onView: (request: BookingRequestItem) => void;
};

export default function RequestCard({ request, onAccept, onView }: Props) {
  const isVideo = request.sessionType === "video";
  const isChat = request.sessionType === "chat";

  return (
    <View style={styles.card}>
      {/* Top Header: Student & Modality Chip */}
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.studentName} numberOfLines={1}>
            {request.displayName}
          </Text>
          <Text style={styles.requestedTime}>
            Requested — {request.requestedTime}
          </Text>
        </View>

        {/* Modality Tag */}
        <View
          style={[
            styles.modalityChip,
            isVideo && styles.videoModalityChip,
            isChat && styles.chatModalityChip,
          ]}
          accessibilityLabel={`Session mode: ${request.sessionType}, duration: ${request.duration}`}
        >
          <Ionicons
            name={isVideo ? "videocam-outline" : isChat ? "chatbubbles-outline" : "business-outline"}
            size={13}
            color={isVideo ? "#0284C7" : isChat ? colors.primary : colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text
            style={[
              styles.modalityText,
              isVideo && styles.videoModalityText,
              isChat && styles.chatModalityText,
            ]}
          >
            {isVideo ? "Video" : isChat ? "Chat" : "In-Person"} • {request.duration}
          </Text>
        </View>
      </View>

      {/* Focus / Topic Tag */}
      <View style={styles.topicRow}>
        <View style={styles.topicTag}>
          <Text style={styles.topicText}>{request.topic}</Text>
        </View>
      </View>

      {/* AI Mood Brief Banner (Supportive Summary, Non-Diagnostic) */}
      {request.aiMoodBrief && (
        <View style={styles.aiBriefBanner} accessibilityLabel={`AI Mood Brief: ${request.aiMoodBrief}`}>
          <Ionicons
            name="trending-down-outline"
            size={16}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.aiBriefText}>
            <Text style={styles.aiBriefPrefix}>AI Mood Brief: </Text>
            {request.aiMoodBrief}
          </Text>
        </View>
      )}

      {/* Dual Action Buttons: Accept (Filled) & View (Outline) */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => onAccept(request)}
          accessibilityRole="button"
          accessibilityLabel={`Accept request from ${request.displayName}`}
          style={({ pressed }) => [
            styles.acceptButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="checkmark-sharp"
            size={16}
            color={colors.white}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </Pressable>

        <Pressable
          onPress={() => onView(request)}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${request.displayName}`}
          style={({ pressed }) => [
            styles.viewButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="eye-outline"
            size={16}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.viewButtonText}>View</Text>
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.md,
    gap: spacing.sm + 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  requestedTime: {
    ...typography.caption,
    marginTop: 2,
  },
  modalityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoModalityChip: {
    backgroundColor: "#E0F2FE",
    borderColor: "rgba(186, 230, 253, 0.7)",
  },
  chatModalityChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  modalityText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  videoModalityText: {
    color: "#0284C7",
  },
  chatModalityText: {
    color: colors.text,
  },
  topicRow: {
    flexDirection: "row",
  },
  topicTag: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(230, 225, 211, 0.9)",
  },
  topicText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  aiBriefBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radius.sm + 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.6)",
  },
  aiBriefText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#064E3B",
    flex: 1,
  },
  aiBriefPrefix: {
    fontWeight: "800",
    color: colors.primary,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: 2,
  },
  acceptButton: {
    flex: 1,
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.primary,
    borderRadius: radius.sm + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  viewButton: {
    flex: 1,
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
