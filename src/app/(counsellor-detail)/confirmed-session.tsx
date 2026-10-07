// Counsellor Confirmed Session Screen - Muaath (Member 4). Supports FR01, FR08.
// Accepted session detail view for Student #4021 matching high-fidelity design.

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { MOCK_CONFIRMED_SESSION } from "@/services/mockDetailScreensData";
import { ConfirmedSessionData } from "@/types/counsellorDetailScreens";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function ConfirmedSessionScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    studentAnonId?: string;
    sessionType?: string;
  }>();
  const store = useCounsellorStore();

  const matchedSession = store.sessions.find(
    (s) => s.id === params.sessionId || s.studentAnonId === params.studentAnonId
  );
  const matchedPast = store.pastSessions.find(
    (p) => p.id === params.sessionId || p.studentAnonId === params.studentAnonId
  );
  const matchedBooking = store.calendarBookings.find(
    (b) => b.id === params.sessionId || b.id === `cal-${params.sessionId}`
  );
  const isExpired = Boolean(
    matchedPast ||
    matchedBooking?.isExpired ||
    matchedBooking?.isPast ||
    matchedSession?.isExpired
  );

  const [data] = useState<ConfirmedSessionData>(() => {
    if (matchedSession) {
      return {
        ...MOCK_CONFIRMED_SESSION,
        id: matchedSession.id,
        studentAnonId: matchedSession.studentAnonId,
        displayName: matchedSession.displayName,
        idMode: matchedSession.idMode,
        sessionType: matchedSession.sessionType,
        sessionTypeLabel: matchedSession.sessionTypeLabel,
        timeRange: matchedSession.timeRange,
      };
    }
    return MOCK_CONFIRMED_SESSION;
  });

  // Dynamically resolve modality: video, chat, or in-person
  const resolvedSessionType: "video" | "chat" | "in-person" =
    (params.sessionType as any) ||
    matchedSession?.sessionType ||
    (data.sessionType as any) ||
    "video";

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Correct screen flow for each modality
  const handlePrimaryAction = () => {
    if (isExpired) {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId: data.id,
          studentAnonId: data.studentAnonId,
        },
      });
      return;
    }
    if (resolvedSessionType === "video") {
      // 1. VIDEO SESSION FLOW: Ready to Join Lobby -> Active Video Call
      router.navigate({
        pathname: "/(counsellor-detail)/ready-to-join",
        params: {
          studentAnonId: data.studentAnonId,
          sessionTitle: data.sessionTypeLabel || "Encrypted Video Consultation",
          timeRange: data.time || "02:00 PM – 02:45 PM",
          duration: "45 min session",
          sessionId: data.id,
        },
      });
    } else if (resolvedSessionType === "chat") {
      // 2. SECURE CHAT SESSION FLOW: Messages screen / Direct chat thread
      router.navigate({
        pathname: "/(counsellor)/messages",
        params: {
          studentAnonId: data.studentAnonId,
          sessionId: data.id,
        },
      });
    } else {
      // 3. IN-PERSON SESSION FLOW: Anonymous Session Details (Room 302 check-in & clinical notes)
      router.navigate({
        pathname: "/(counsellor-detail)/anonymous-session-details",
        params: {
          sessionId: data.id,
          studentAnonId: data.studentAnonId,
          sessionType: "in-person",
        },
      });
    }
  };

  const handleSecondaryAction = () => {
    if (resolvedSessionType === "chat") {
      // Pre-chat waiting room & prompt docks for chat consultations
      router.navigate({
        pathname: "/(counsellor-detail)/pre-chat-empty-state",
        params: { studentAnonId: data.studentAnonId, sessionId: data.id },
      });
    } else {
      // Direct confidential message
      router.navigate({
        pathname: "/(counsellor)/messages",
        params: { studentAnonId: data.studentAnonId },
      });
    }
  };

  const handleReschedule = () => {
    router.navigate("/(counsellor)/schedule");
  };

  const handleCancelSession = () => {
    setCancelModalVisible(true);
  };

  const confirmCancel = () => {
    setCancelModalVisible(false);
    store.cancelSession(data.id || "session-1", "Canceled by counselor via Confirmed Session Screen");
    setFeedback("Session cancelled. Slot returned to availability calendar.");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButtonCircle}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Counselor Booking</Text>

        <View style={styles.counsellorAvatarContainer}>
          <View style={styles.counsellorAvatarCircle}>
            <Ionicons name="person" size={18} color={colors.white} />
          </View>
          <View style={styles.onlineBadgeDot} />
        </View>
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

        {/* ─── Sub-badges Row ─── */}
        <View style={styles.subBadgesRow}>
          <View style={[styles.confirmedPill, isExpired && styles.concludedPill]}>
            <View style={[styles.greenDot, isExpired && styles.grayDot]} />
            <Text style={[styles.confirmedPillText, isExpired && styles.concludedPillText]}>
              {isExpired ? "SESSION CONCLUDED" : "CONFIRMED • UPCOMING"}
            </Text>
          </View>

          <View style={[styles.startsInPill, isExpired && styles.concludedSubPill]}>
            <Ionicons name="time-outline" size={14} color={isExpired ? "#64748B" : "#0284C7"} />
            <Text style={[styles.startsInPillText, isExpired && styles.concludedSubPillText]}>
              {isExpired ? "Scheduled Window Closed" : `Starts in ${data.startsIn}`}
            </Text>
          </View>
        </View>

        {/* ─── Main Student Card ─── */}
        <View style={styles.card}>
          <View style={styles.studentTopRow}>
            <View style={styles.shieldIconSquare}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#047857" />
            </View>
            <View style={styles.studentMeta}>
              <View style={styles.studentTitleRow}>
                <Text style={styles.studentTitle}>{data.studentAnonId}</Text>
                <View style={styles.anonOutlinePill}>
                  <Ionicons name="shield-outline" size={11} color={colors.textSecondary} />
                  <Text style={styles.anonOutlinePillText}>Anonymous</Text>
                </View>
              </View>
              <Text style={styles.studentSubtitle}>
                Undergraduate • {data.faculty} ({data.yearLevel})
              </Text>
            </View>
          </View>

          {/* Session Type & Ref */}
          <View style={styles.videoSessionRow}>
            <Ionicons
              name={
                resolvedSessionType === "video"
                  ? "videocam-outline"
                  : resolvedSessionType === "chat"
                  ? "chatbubble-ellipses-outline"
                  : "location-outline"
              }
              size={18}
              color="#047857"
            />
            <Text style={styles.videoSessionText}>
              {resolvedSessionType === "video"
                ? (data.sessionTypeLabel || "Encrypted Video Consultation")
                : resolvedSessionType === "chat"
                ? "Confidential Secure Chat Consultation"
                : "On-Campus In-Person Consultation"}
            </Text>
            <Text style={styles.sessionRefText}>{data.sessionRef}</Text>
          </View>

          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar-outline" size={16} color="#047857" />
            <Text style={styles.dateTimeText}>
              {data.date} • {data.time}
            </Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Room Ready & Diagnostics / Key / Facility Check Row */}
          <View style={styles.roomStatusRow}>
            <View style={styles.roomReadyBadge}>
              <View style={styles.roomGreenDot} />
              <Text style={styles.roomReadyText}>
                {resolvedSessionType === "video"
                  ? "Room ready"
                  : resolvedSessionType === "chat"
                  ? "Live E2E Channel Open"
                  : "Room 302 Allocated"}
              </Text>
            </View>

            <Pressable
              style={styles.micCheckBtn}
              onPress={() => {
                if (resolvedSessionType === "video") {
                  Alert.alert(
                    "Device Check",
                    "Microphone: OK\nCamera: 1080p OK\nNetwork: 48ms (Strong Telehealth Uplink)"
                  );
                } else if (resolvedSessionType === "chat") {
                  Alert.alert(
                    "Encryption Verification",
                    "E2E Chat Channel: Ready\nKey Exchange: Curve25519 Verified\nAccess Control: Active"
                  );
                } else {
                  Alert.alert(
                    "Clinical Facility",
                    "Room: 302 Private Suite\nSanitization: Verified\nStaff Check-in: On Standby"
                  );
                }
              }}
            >
              <Ionicons
                name={
                  resolvedSessionType === "video"
                    ? "settings-outline"
                    : resolvedSessionType === "chat"
                    ? "lock-closed-outline"
                    : "business-outline"
                }
                size={14}
                color="#0369A1"
              />
              <Text style={styles.micCheckText}>
                {resolvedSessionType === "video"
                  ? "Test mic & camera"
                  : resolvedSessionType === "chat"
                  ? "Verify Encryption"
                  : "Facility Status"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Pre-Session Intake Card ─── */}
        <View style={styles.card}>
          <View style={styles.intakeHeaderRow}>
            <View style={styles.intakeTitleRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={styles.intakeHeading}>Pre-Session Intake</Text>
            </View>
            <View style={styles.sharedBadge}>
              <Ionicons name="lock-closed-outline" size={12} color="#047857" />
              <Text style={styles.sharedBadgeText}>Shared by student</Text>
            </View>
          </View>

          {/* Check-in Mood Meter */}
          <View style={styles.moodMeterBox}>
            <Text style={styles.moodMeterLabel}>Check-in Mood</Text>
            <View style={styles.moodMeterTrack}>
              <View style={[styles.moodMeterFill, { width: `${(data.checkInMood / data.maxMood) * 100}%` }]} />
            </View>
            <Text style={styles.moodScoreText}>
              {data.checkInMood} / {data.maxMood.toFixed(1)}{" "}
              <Text style={styles.moodStrainText}>({data.moodLabel})</Text>
            </Text>
          </View>

          {/* Intake Quote Box */}
          <View style={styles.intakeQuoteCard}>
            <Text style={styles.intakeQuoteText}>“{data.intakeNote}”</Text>
          </View>

          {/* Clinical Concern Tags */}
          <View style={styles.intakeTagsRow}>
            {data.tags.map((tag, idx) => (
              <View key={idx} style={styles.intakeTagPill}>
                <Text style={styles.intakeTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Counselor Protocol Card ─── */}
        <View style={styles.protocolCard}>
          <View style={styles.protocolIconCircle}>
            <Ionicons
              name={
                resolvedSessionType === "video"
                  ? "shield-outline"
                  : resolvedSessionType === "chat"
                  ? "lock-closed-outline"
                  : "people-outline"
              }
              size={18}
              color="#047857"
            />
          </View>
          <View style={styles.protocolMeta}>
            <Text style={styles.protocolTitle}>
              {resolvedSessionType === "video"
                ? "Telehealth Video Consultation Protocol"
                : resolvedSessionType === "chat"
                ? "Confidential Secure Chat Protocol"
                : "In-Person Clinical Suite Protocol"}
            </Text>
            <Text style={styles.protocolDesc}>
              {resolvedSessionType === "video"
                ? "End-to-end encrypted session with no recording permitted. FERPA and clinical standards enforced."
                : resolvedSessionType === "chat"
                ? "Secure real-time encrypted messaging channel. Notes and chat transcripts protected under student anonymous key."
                : "Room 302 Private Suite. Verify student arrival upon check-in before opening clinical consultation notes."}
            </Text>
          </View>
        </View>

        {/* ─── Modality-Specific Action Buttons ─── */}
        <Pressable
          style={[styles.joinVideoBtn, isExpired && styles.concludedActionBtn]}
          onPress={handlePrimaryAction}
          accessibilityLabel={
            isExpired
              ? "Review Clinical Notes"
              : resolvedSessionType === "video"
              ? "Join Video Session"
              : resolvedSessionType === "chat"
              ? "Open Secure Chat Room"
              : "In-Person Session & Check-In"
          }
          accessibilityRole="button"
        >
          <Ionicons
            name={
              isExpired
                ? "document-text"
                : resolvedSessionType === "video"
                ? "videocam"
                : resolvedSessionType === "chat"
                ? "chatbubble-ellipses"
                : "location"
            }
            size={20}
            color={colors.white}
          />
          <Text style={styles.joinVideoText}>
            {isExpired
              ? "Session Concluded • Review Clinical Notes"
              : resolvedSessionType === "video"
              ? "Join Video Session"
              : resolvedSessionType === "chat"
              ? "Open Secure Chat Room"
              : "In-Person Details & Arrival Check-In"}
          </Text>
        </Pressable>

        {!isExpired && (
          <Pressable
            style={styles.messageSecurelyBtn}
            onPress={handleSecondaryAction}
            accessibilityLabel={
              resolvedSessionType === "chat"
                ? "Pre-Session Waiting Room & Prompts"
                : "Message Student Securely"
            }
            accessibilityRole="button"
          >
            <Ionicons
              name={
                resolvedSessionType === "chat"
                  ? "sparkles-outline"
                  : "chatbubble-outline"
              }
              size={18}
              color={colors.primary}
            />
            <Text style={styles.messageSecurelyText}>
              {resolvedSessionType === "chat"
                ? "Pre-Session Waiting Room & Prompts"
                : "Message Student Securely"}
            </Text>
          </Pressable>
        )}

        {/* Reschedule & Cancel Row (hidden for concluded sessions) */}
        {!isExpired && (
          <View style={styles.dangerActionsRow}>
            <Pressable
              style={styles.secondaryActionBtn}
              onPress={handleReschedule}
            >
              <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Reschedule</Text>
            </Pressable>

            <View style={styles.dotDivider} />

            <Pressable
              style={styles.secondaryActionBtn}
              onPress={handleCancelSession}
            >
              <Ionicons name="calendar-clear-outline" size={15} color={colors.danger} />
              <Text style={styles.cancelActionText}>Cancel Session</Text>
            </Pressable>
          </View>
        )}

        {/* Calendar Sync Hint */}
        <View style={styles.syncCalendarFooter}>
          <Ionicons name="sync-outline" size={14} color="#059669" />
          <Text style={styles.syncCalendarText}>
            Synced with university counseling calendar
          </Text>
        </View>
      </ScrollView>

      {/* ─── Cancel Modal ─── */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Confirmed Session?</Text>
            <Text style={styles.modalDesc}>
              This will notify {data.studentAnonId} and open the slot on your calendar. Please ensure student safety before cancelling.
            </Text>
            <Pressable
              style={[styles.joinVideoBtn, { backgroundColor: colors.danger, marginTop: 12 }]}
              onPress={confirmCancel}
            >
              <Text style={styles.joinVideoText}>Confirm Cancellation</Text>
            </Pressable>
            <Pressable
              style={[styles.messageSecurelyBtn, { marginTop: 8 }]}
              onPress={() => setCancelModalVisible(false)}
            >
              <Text style={styles.messageSecurelyText}>Keep Session</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  counsellorAvatarContainer: {
    position: "relative",
  },
  counsellorAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#064E3B",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineBadgeDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: colors.background,
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
  subBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#059669",
  },
  grayDot: {
    backgroundColor: "#94A3B8",
  },
  concludedPill: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  confirmedPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 0.3,
  },
  concludedPillText: {
    color: "#64748B",
  },
  startsInPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  concludedSubPill: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  startsInPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7",
  },
  concludedSubPillText: {
    color: "#64748B",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  studentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shieldIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  studentMeta: {
    flex: 1,
  },
  studentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  anonOutlinePill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  anonOutlinePillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  studentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  videoSessionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  videoSessionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  sessionRefText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  dateTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  roomStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomReadyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  roomReadyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  micCheckBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  micCheckText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0369A1",
  },
  intakeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  intakeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  intakeHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  sharedBadgeText: {
    fontSize: 10,
    color: "#047857",
    fontWeight: "600",
  },
  moodMeterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  moodMeterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  moodMeterTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  moodMeterFill: {
    height: "100%",
    backgroundColor: "#065F46",
    borderRadius: 4,
  },
  moodScoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  moodStrainText: {
    fontSize: 11,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  intakeQuoteCard: {
    backgroundColor: "#FEFCE8",
    borderWidth: 1,
    borderColor: "#FEF08A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  intakeQuoteText: {
    fontSize: 13,
    color: "#713F12",
    lineHeight: 19,
    fontStyle: "italic",
  },
  intakeTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  intakeTagPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  intakeTagText: {
    fontSize: 11,
    color: "#047857",
    fontWeight: "500",
  },
  protocolCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 10,
  },
  protocolIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  protocolMeta: {
    flex: 1,
  },
  protocolTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#064E3B",
  },
  protocolDesc: {
    fontSize: 11,
    color: "#047857",
    lineHeight: 16,
    marginTop: 2,
  },
  joinVideoBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: 10,
  },
  concludedActionBtn: {
    backgroundColor: "#065F46",
  },
  joinVideoText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  messageSecurelyBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: 14,
  },
  messageSecurelyText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  dangerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
  },
  secondaryActionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  cancelActionText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "600",
  },
  dotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  syncCalendarFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  syncCalendarText: {
    fontSize: 11,
    color: "#059669",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    width: "100%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
});
