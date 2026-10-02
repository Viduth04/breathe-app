// Counsellor Notification Detail Screen - Muaath (Member 4). Supports FR05, FR08.
// Full alert detail view for Student #5104 Clinical Triage Alert matching high-fidelity design.

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { MOCK_NOTIFICATION_DETAIL } from "@/services/mockDetailScreensData";
import { NotificationDetailData } from "@/types/counsellorDetailScreens";

export default function NotificationDetailScreen() {
  const [data] = useState<NotificationDetailData>(MOCK_NOTIFICATION_DETAIL);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleReviewAndAccept = () => {
    router.navigate({
      pathname: "/(counsellor-detail)/confirm-acceptance",
      params: { requestId: "req-1", studentAnonId: data.studentAnonId },
    });
  };

  const handleSuggestAlternative = () => {
    router.navigate("/(counsellor)/schedule");
  };

  const handleDecline = () => {
    router.push({
      pathname: "/(counsellor-detail)/decline-request",
      params: {
        requestId: "req-1",
        studentAnonId: data.studentAnonId,
        proposedDate: "Tomorrow, Tue 19 Aug",
        proposedTime: "10:00–10:45 AM",
        sessionTypeLabel: "Encrypted Video Call (45m)",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerIconButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color="#064E3B" />
        </Pressable>

        <Text style={styles.headerTitle}>Notification Detail</Text>

        <Pressable
          style={styles.headerIconButton}
          accessibilityLabel="More options"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => Alert.alert("Notification Options", "Mark unread • Mute triage alerts")}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#064E3B" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Feedback Banner ─── */}
        {feedback && (
          <View style={styles.feedbackBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* ─── Sub-header Pill Banner ─── */}
        <View style={styles.triageBannerRow}>
          <View style={styles.triagePill}>
            <Ionicons name="information-circle-outline" size={15} color="#0284C7" />
            <Text style={styles.triagePillText}>CLINICAL TRIAGE ALERT</Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => Alert.alert("Alert Rules", "High-priority student triage routed via automated intake screener.")}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        {/* ─── Big Triage Badge Icon ─── */}
        <View style={styles.triageIconContainer}>
          <View style={styles.triageIconSquare}>
            <Ionicons name="clipboard-outline" size={30} color="#065F46" />
            <Text style={styles.triageIconLabel}>TRIAGE</Text>
          </View>
        </View>

        {/* ─── Alert Title & Priority ─── */}
        <Text style={styles.mainTitle}>{data.title}</Text>

        <View style={styles.receivedMetaRow}>
          <Text style={styles.receivedTimeText}>
            Received {data.receivedAt}
          </Text>
          <View style={styles.dotDivider} />
          <View style={styles.priorityPill}>
            <View style={styles.priorityDot} />
            <Text style={styles.priorityPillText}>
              Triage Priority: High
            </Text>
          </View>
        </View>

        {/* ─── Main Details Card ─── */}
        <View style={styles.card}>
          {/* Section: Student Profile */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionCaption}>STUDENT PROFILE</Text>
            <View style={styles.studentTitleRow}>
              <Text style={styles.studentNameText}>{data.studentAnonId}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.studentMetaText}>
              {data.studentMode} • {data.studentLevel}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Section: Request Type & Modality */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionCaption}>REQUEST TYPE & MODALITY</Text>
            <Text style={styles.modalityTitleText}>{data.requestType}</Text>
            <View style={styles.modalityRow}>
              <Ionicons name="videocam-outline" size={16} color="#047857" />
              <Text style={styles.modalityDescText}>{data.modality}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Section: Proposed Slot */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionCaption}>PROPOSED SLOT</Text>
            <View style={styles.slotRow}>
              <Ionicons name="calendar-outline" size={17} color="#047857" />
              <Text style={styles.slotText}>
                {data.proposedDate} • {data.proposedTime}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Section: Primary Concern & Screener */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionCaption}>PRIMARY CONCERN & SCREENER</Text>
            <Text style={styles.concernDescText}>{data.primaryConcern}</Text>

            {/* PHQ-9 Score Card */}
            <View style={styles.phqScoreBox}>
              <Text style={styles.phqScoreLabel}>
                PHQ-9 Score:{" "}
                <Text style={styles.phqScoreValue}>{data.phqScore}</Text>
              </Text>
              <View style={styles.phqRangeBadge}>
                <Text style={styles.phqRangeText}>{data.phqRange}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Bottom Actions ─── */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.reviewAcceptBtn}
            onPress={handleReviewAndAccept}
            accessibilityLabel="Review and Accept Request"
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle-outline" size={19} color={colors.white} />
            <Text style={styles.reviewAcceptText}>
              {data.actions.primary}
            </Text>
          </Pressable>

          <Pressable
            style={styles.suggestAlternativeBtn}
            onPress={handleSuggestAlternative}
            accessibilityLabel="Suggest Alternative Time Slot"
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={17} color={colors.text} />
            <Text style={styles.suggestAlternativeText}>
              {data.actions.secondary}
            </Text>
          </Pressable>

          <Pressable
            style={styles.declineBtn}
            onPress={handleDecline}
            accessibilityLabel="Decline intake alert"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.declineText}>{data.actions.tertiary}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerIconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    gap: 8,
  },
  feedbackText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    flex: 1,
  },
  triageBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 16,
  },
  triagePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  triagePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369A1",
    letterSpacing: 0.5,
  },
  triageIconContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  triageIconSquare: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  triageIconLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    lineHeight: 28,
    marginTop: 8,
  },
  receivedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  receivedTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  priorityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 5,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
  priorityPillText: {
    fontSize: 11,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 16,
    marginBottom: 16,
  },
  cardSection: {
    paddingVertical: 4,
  },
  sectionCaption: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  studentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentNameText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  verifiedBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#047857",
  },
  studentMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  modalityTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  modalityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalityDescText: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "500",
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  slotText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  concernDescText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  phqScoreBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEFCE8",
    borderWidth: 1,
    borderColor: "#FEF08A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  phqScoreLabel: {
    fontSize: 12,
    color: "#713F12",
  },
  phqScoreValue: {
    fontWeight: "700",
  },
  phqRangeBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phqRangeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#854D0E",
  },
  actionsContainer: {
    marginTop: 4,
  },
  reviewAcceptBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: 10,
  },
  reviewAcceptText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  suggestAlternativeBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: 8,
  },
  suggestAlternativeText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_TARGET,
    gap: 6,
  },
  declineText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});
