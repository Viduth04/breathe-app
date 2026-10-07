// Counsellor Request Detail Screen - Muaath (Member 4). Supports FR01, FR08.
// Full pending booking request view for Student #5104 matching high-fidelity design.

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { MOCK_REQUEST_DETAIL } from "@/services/mockDetailScreensData";
import { RequestDetailData } from "@/types/counsellorDetailScreens";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function RequestDetailScreen() {
  const params = useLocalSearchParams<{ requestId?: string; studentAnonId?: string }>();
  const store = useCounsellorStore();

  const matchedReq = store.requests.find(
    (r) => r.id === params.requestId || r.studentAnonId === params.studentAnonId
  );

  const [data, setData] = useState<RequestDetailData>(() => {
    if (matchedReq) {
      return {
        ...MOCK_REQUEST_DETAIL,
        id: matchedReq.id,
        studentAnonId: matchedReq.studentAnonId,
        displayName: matchedReq.displayName || matchedReq.studentAnonId,
        idMode: matchedReq.idMode || "anon",
        sessionType: matchedReq.sessionType,
        sessionTypeLabel:
          matchedReq.sessionType === "video"
            ? "Encrypted Video Call (45m)"
            : matchedReq.sessionType === "chat"
            ? "Secured Chat Session"
            : "In-Person Consultation",
        proposedDate: matchedReq.date || "Scheduled Slot",
        proposedTime: matchedReq.requestedTime || "10:00–10:45 AM",
        primaryConcernTopic: matchedReq.topic || "General Wellbeing",
        concern: matchedReq.topic || "General Wellbeing",
        personalNote: matchedReq.notes ? matchedReq.notes.replace(/^ANONYMOUS:\s*/, "") : "No additional note provided by student.",
        status:
          (matchedReq.status || "").toLowerCase() === "confirmed" || (matchedReq.status || "").toLowerCase() === "completed"
            ? "accepted"
            : (matchedReq.status || "").toLowerCase() === "declined" || (matchedReq.status || "").toLowerCase() === "cancelled" || (matchedReq.status || "").toLowerCase() === "rejected"
            ? "declined"
            : "pending",
      };
    }
    return {
      ...MOCK_REQUEST_DETAIL,
      id: params.requestId || "req-pending",
      studentAnonId: params.studentAnonId || "Student #ANON",
      proposedDate: "Scheduled Slot",
      personalNote: "No additional note provided by student.",
    };
  });

  useEffect(() => {
    if (matchedReq) {
      setData((prev) => ({
        ...prev,
        id: matchedReq.id,
        studentAnonId: matchedReq.studentAnonId,
        displayName: matchedReq.displayName || matchedReq.studentAnonId,
        idMode: matchedReq.idMode || "anon",
        sessionType: matchedReq.sessionType,
        sessionTypeLabel:
          matchedReq.sessionType === "video"
            ? "Encrypted Video Call (45m)"
            : matchedReq.sessionType === "chat"
            ? "Secured Chat Session"
            : "In-Person Consultation",
        proposedDate: matchedReq.date || prev.proposedDate,
        proposedTime: matchedReq.requestedTime || prev.proposedTime,
        primaryConcernTopic: matchedReq.topic || "General Wellbeing",
        concern: matchedReq.topic || "General Wellbeing",
        personalNote: matchedReq.notes ? matchedReq.notes.replace(/^ANONYMOUS:\s*/, "") : "No additional note provided by student.",
        status:
          (matchedReq.status || "").toLowerCase() === "confirmed" || (matchedReq.status || "").toLowerCase() === "completed"
            ? "accepted"
            : (matchedReq.status || "").toLowerCase() === "declined" || (matchedReq.status || "").toLowerCase() === "cancelled" || (matchedReq.status || "").toLowerCase() === "rejected"
            ? "declined"
            : "pending",
      }));
    }
  }, [matchedReq]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);

  // Strict validation: check if slot has already been booked by another session or by the counselor
  const isSlotAlreadyBooked = useMemo(() => {
    if (!matchedReq) return false;
    const slotConflict = Boolean(
      matchedReq.slotId &&
      store.scheduleDaySlots.some((s) => s.id === matchedReq.slotId && s.isBooked)
    );
    const sessionConflict = store.sessions.some(
      (s) =>
        s.id !== matchedReq.id &&
        s.date === matchedReq.date &&
        s.timeRange === matchedReq.requestedTime &&
        s.status === "confirmed"
    );
    return slotConflict || sessionConflict;
  }, [matchedReq, store.scheduleDaySlots, store.sessions]);

  // Real available open slots from Firestore /slots
  const availableOpenSlots = useMemo(() => {
    return store.scheduleDaySlots.filter(
      (s) => !s.isBooked && !store.heldScheduleSlots[s.id]
    ).slice(0, 6);
  }, [store.scheduleDaySlots, store.heldScheduleSlots]);

  const handleAccept = () => {
    if (isSlotAlreadyBooked) {
      setFeedback("This time slot is already booked. Counselor validation prevents booking it again. Please reschedule.");
      return;
    }
    router.navigate({
      pathname: "/(counsellor-detail)/confirm-acceptance",
      params: { requestId: data.id, studentAnonId: data.studentAnonId },
    });
  };

  const handleReschedule = () => {
    setRescheduleModalVisible(true);
  };

  const confirmRescheduleToSlot = async (slot: any) => {
    setRescheduleModalVisible(false);
    try {
      await store.rescheduleBooking(
        data.id,
        slot.dateDisplay || slot.dateKey,
        slot.timeRange,
        slot.id
      );
      setData((prev) => ({
        ...prev,
        status: "rescheduled",
        proposedDate: slot.dateDisplay || slot.dateKey,
        proposedTime: slot.timeRange,
      }));
      setFeedback(
        `Alternative slot on ${slot.dateDisplay || slot.dateKey} (${slot.timeRange}) scheduled in database. Rescheduling is allowed multiple times.`
      );
    } catch (e: any) {
      setFeedback(`Failed to update schedule: ${e?.message || "Check connection"}`);
    }
  };

  const confirmReschedule = () => {
    if (availableOpenSlots.length > 0) {
      confirmRescheduleToSlot(availableOpenSlots[0]);
    } else {
      setRescheduleModalVisible(false);
      setData((prev) => ({ ...prev, status: "rescheduled" }));
      setFeedback("Alternative slot proposed to student via secure notification.");
    }
  };

  const handleJoin = () => {
    if (matchedReq?.isExpired) {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId: data.id,
          studentAnonId: data.studentAnonId,
        },
      });
      return;
    }
    if (data.sessionType === "video") {
      router.navigate({
        pathname: "/(counsellor-detail)/ready-to-join",
        params: {
          studentAnonId: data.studentAnonId,
          sessionTitle: "Encrypted Video Consultation",
          timeRange: data.proposedTime,
          duration: "45m",
          sessionId: data.id,
        },
      });
    } else if (data.sessionType === "chat") {
      router.navigate({
        pathname: "/(counsellor)/messages",
        params: {
          studentAnonId: data.studentAnonId,
          sessionId: data.id,
        },
      });
    } else {
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

  const handleDecline = () => {
    router.push({
      pathname: "/(counsellor-detail)/decline-request",
      params: {
        requestId: data.id,
        studentAnonId: data.studentAnonId,
        proposedDate: data.proposedDate,
        proposedTime: data.proposedTime,
        sessionTypeLabel: data.sessionTypeLabel,
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
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Request Detail</Text>
          <Text style={styles.headerSubtitle}>
            Counselor Triage • {data.studentAnonId}
          </Text>
        </View>

        <Pressable
          style={styles.headerIconButton}
          accessibilityLabel="More options"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => Alert.alert("Options", "Clinical audit log & case metadata")}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
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

        {/* ─── Status / Queue Progress Bar ─── */}
        <View style={styles.queueContainer}>
          <Text style={styles.queueLabel}>TRIAGE QUEUE</Text>
          <View style={styles.queueDot} />
          <Text style={styles.queuePending}>Pending Confirmation</Text>
          <View style={styles.queueDot} />
          <View style={styles.awaitingBadge}>
            <View style={styles.bluePulseDot} />
            <Text style={styles.awaitingText}>
              Awaiting Reply ({data.awaitingReplyHours}h left)
            </Text>
          </View>
        </View>

        {/* ─── Student Profile Card ─── */}
        <View style={styles.card}>
          <View style={styles.studentTopRow}>
            <View style={styles.studentIconSquare}>
              <Ionicons name="location-outline" size={22} color="#0284C7" />
            </View>
            <View style={styles.studentMeta}>
              <View style={styles.studentTitleRow}>
                <Text style={styles.studentTitle}>{data.studentAnonId}</Text>
                <View style={styles.anonBadge}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#047857" />
                  <Text style={styles.anonBadgeText}>Anonymous Mode</Text>
                </View>
              </View>
              <Text style={styles.studentSubtitle}>
                {data.level} • {data.department}
              </Text>
            </View>
          </View>

          {/* Clinical Tags */}
          <View style={styles.tagGroup}>
            <View style={styles.blueTag}>
              <Ionicons name="videocam-outline" size={14} color="#0369A1" />
              <Text style={styles.blueTagText}>{data.sessionTypeLabel}</Text>
            </View>
            <View style={styles.greenTag}>
              <Ionicons name="pricetag-outline" size={14} color="#047857" />
              <Text style={styles.greenTagText}>{data.concern}</Text>
            </View>
            <View style={styles.grayTag}>
              <Ionicons name="person-outline" size={14} color="#64748B" />
              <Text style={styles.grayTagText}>{data.consultationNumber}</Text>
            </View>
          </View>

          {/* Requested Time Box */}
          <View style={styles.requestedDateBox}>
            <View style={styles.calendarIconCircle}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.requestedDateMeta}>
              <Text style={styles.requestedDateText}>{data.proposedDate}</Text>
              <View style={styles.clockRow}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.requestedTimeText}>{data.proposedTime}</Text>
              </View>
            </View>
            <View style={styles.requestedStatusBadge}>
              <Text style={styles.requestedStatusText}>
                {data.status === "accepted" ? "Accepted" : "Requested"}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Section Header: Session Snapshot ─── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.greenMiniPill}>
              <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
            </View>
            <Text style={styles.sectionHeading}>Session Snapshot</Text>
          </View>
          <View style={styles.sharedBadge}>
            <Ionicons name="lock-closed-outline" size={12} color="#047857" />
            <Text style={styles.sharedBadgeText}>Shared by student</Text>
          </View>
        </View>

        {/* ─── 5-Day Mood Trend Card ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>5-DAY PRE-SESSION MOOD TREND</Text>
            <View style={styles.stressDipBadge}>
              <Text style={styles.stressDipText}>{data.moodBriefLabel}</Text>
            </View>
          </View>

          {/* Line Chart Visualizer */}
          <View style={styles.chartContainer}>
            <View style={styles.chartGridLines}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
            </View>

            {/* Render Mood Points & Connecting Bar */}
            <View style={styles.moodPointsRow}>
              {data.moodTrend.map((pt, idx) => {
                const heightPercent = (pt.score / 5) * 60 + 10;
                return (
                  <View key={idx} style={styles.moodCol}>
                    <View style={styles.pointTrack}>
                      <View
                        style={[
                          styles.moodDot,
                          {
                            bottom: `${heightPercent}%`,
                          },
                        ]}
                      >
                        <View style={styles.moodDotInner} />
                      </View>
                    </View>
                    <Text style={styles.chartDayText}>{pt.day}</Text>
                    <Text style={styles.chartScoreText}>{pt.score}/5</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI Mood Brief Notice */}
          <View style={styles.aiBriefBox}>
            <Ionicons name="flash" size={15} color="#D97706" style={styles.briefIcon} />
            <Text style={styles.aiBriefText}>
              <Text style={styles.aiBriefBold}>AI Mood Brief: </Text>
              {data.aiBrief}
            </Text>
          </View>
        </View>

        {/* ─── Student Personal Note Card ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>STUDENT'S PERSONAL NOTE</Text>
            <Text style={styles.quoteIcon}>“</Text>
          </View>
          <View style={styles.quoteBox}>
            <View style={styles.quoteGreenBorder} />
            <Text style={styles.quoteText}>{data.personalNote}</Text>
          </View>
        </View>

        {/* ─── Meta Row: Urgency & Format ─── */}
        <View style={styles.metaRow}>
          <View style={[styles.metaCard, styles.metaCardLeft]}>
            <View style={styles.flagIconCircle}>
              <Ionicons name="flag-outline" size={16} color="#047857" />
            </View>
            <View>
              <Text style={styles.metaLabel}>URGENCY LEVEL</Text>
              <Text style={styles.metaValue}>{data.urgencyLevel}</Text>
            </View>
          </View>

          <View style={[styles.metaCard, styles.metaCardRight]}>
            <View style={styles.micIconCircle}>
              <Ionicons name="mic-outline" size={16} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.metaLabel}>FORMAT</Text>
              <Text style={styles.metaValue}>{data.format}</Text>
            </View>
          </View>
        </View>

        {/* ─── Decision & Scheduling Card ─── */}
        <View style={styles.decisionCard}>
          <View style={styles.decisionHeaderRow}>
            <Text style={styles.decisionTitle}>
              {data.status === "accepted"
                ? "Confirmed Appointment"
                : data.status === "declined"
                ? "Request Declined"
                : "Decision & Scheduling"}
            </Text>
            <Text style={styles.syncHint}>Auto-syncs to calendar</Text>
          </View>

          {data.status === "accepted" ? (
            <>
              <Pressable
                style={[styles.primaryBtn, matchedReq?.isExpired && { backgroundColor: "#065F46" }]}
                onPress={handleJoin}
                accessibilityLabel={matchedReq?.isExpired ? "Review Notes" : "Enter Session"}
                accessibilityRole="button"
              >
                <Ionicons
                  name={
                    matchedReq?.isExpired
                      ? "document-text-outline"
                      : data.sessionType === "video"
                      ? "videocam-outline"
                      : data.sessionType === "chat"
                      ? "chatbubbles-outline"
                      : "business-outline"
                  }
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.primaryBtnText}>
                  {matchedReq?.isExpired
                    ? "Session Concluded • Review Notes"
                    : data.sessionType === "video"
                    ? "Enter Video Room"
                    : data.sessionType === "chat"
                    ? "Open Secured Chat"
                    : "Session Notes & Room"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.outlineBtn}
                onPress={() => router.navigate("/(counsellor)/schedule")}
                accessibilityLabel="View in Clinical Schedule"
                accessibilityRole="button"
              >
                <Ionicons name="calendar-outline" size={18} color={colors.text} />
                <Text style={styles.outlineBtnText}>View in Clinical Schedule</Text>
              </Pressable>
            </>
          ) : data.status === "declined" ? (
            <>
              <View style={styles.declinedNoticeBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.declinedNoticeText}>
                  This booking request was declined. (Reason:{" "}
                  {matchedReq?.cancelReason || "Schedule conflict"})
                </Text>
              </View>
              <Pressable
                style={styles.primaryBtn}
                onPress={() =>
                  router.navigate({
                    pathname: "/(counsellor-detail)/requests",
                    params: { status: "declined" },
                  })
                }
                accessibilityLabel="View All Declined Requests"
                accessibilityRole="button"
              >
                <Ionicons name="list-outline" size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>View All Declined Requests</Text>
              </Pressable>
            </>
          ) : (
            <>
              {matchedReq?.isExpired && (
                <View style={styles.expiredNoticeCard}>
                  <Ionicons name="time-outline" size={18} color="#B45309" />
                  <Text style={styles.expiredNoticeText}>
                    The requested session slot ({data.proposedDate} • {data.proposedTime}) has expired and cannot be accepted. Please propose an alternative time slot or decline.
                  </Text>
                </View>
              )}

              {!matchedReq?.isExpired && isSlotAlreadyBooked && (
                <View style={[styles.expiredNoticeCard, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
                  <Ionicons name="lock-closed" size={18} color="#DC2626" />
                  <Text style={[styles.expiredNoticeText, { color: "#7F1D1D" }]}>
                    Slot Already Booked: This time slot ({data.proposedDate} • {data.proposedTime}) is already booked by another confirmed session. Counselor validation prevents duplicate bookings. Please use Reschedule to select an alternative slot (rescheduling is allowed multiple times).
                  </Text>
                </View>
              )}

              {/* Accept Button */}
              <Pressable
                style={[
                  styles.primaryBtn,
                  (matchedReq?.isExpired || isSlotAlreadyBooked) && { backgroundColor: "#CBD5E1" },
                ]}
                disabled={Boolean(matchedReq?.isExpired || isSlotAlreadyBooked)}
                onPress={handleAccept}
                accessibilityLabel={
                  matchedReq?.isExpired
                    ? "Slot Expired"
                    : isSlotAlreadyBooked
                    ? "Slot Already Booked"
                    : "Accept Request"
                }
                accessibilityRole="button"
              >
                <Ionicons
                  name={
                    matchedReq?.isExpired
                      ? "time-outline"
                      : isSlotAlreadyBooked
                      ? "lock-closed-outline"
                      : "checkmark-circle-outline"
                  }
                  size={20}
                  color={matchedReq?.isExpired || isSlotAlreadyBooked ? "#64748B" : colors.white}
                />
                <Text
                  style={[
                    styles.primaryBtnText,
                    (matchedReq?.isExpired || isSlotAlreadyBooked) && { color: "#64748B" },
                  ]}
                >
                  {matchedReq?.isExpired
                    ? "Slot Expired (Cannot Accept)"
                    : isSlotAlreadyBooked
                    ? "Slot Already Booked (Use Reschedule)"
                    : "Accept Request"}
                </Text>
              </Pressable>

              {/* Reschedule Button */}
              <Pressable
                style={styles.outlineBtn}
                onPress={handleReschedule}
                accessibilityLabel="Reschedule or Propose New Time"
                accessibilityRole="button"
              >
                <Ionicons name="calendar-outline" size={18} color={colors.text} />
                <Text style={styles.outlineBtnText}>Reschedule / Propose New Time</Text>
              </Pressable>

              {/* Decline Button */}
              <Pressable
                style={styles.declineBtn}
                onPress={handleDecline}
                accessibilityLabel="Decline with note to student"
                accessibilityRole="button"
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.declineBtnText}>Decline with note to student</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* ─── Reschedule Modal ─── */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Propose Alternative Slot</Text>
            <Text style={styles.modalDesc}>
              Select an open availability slot from your clinical schedule for {data.studentAnonId}. Rescheduling is allowed multiple times.
            </Text>

            {availableOpenSlots.length > 0 ? (
              availableOpenSlots.map((slot: any) => (
                <Pressable
                  key={slot.id}
                  style={styles.modalSlotBtn}
                  onPress={() => confirmRescheduleToSlot(slot)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${slot.dateDisplay || slot.dateKey} at ${slot.timeRange}`}
                >
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.modalSlotText}>
                    {slot.dateDisplay || slot.dateKey}, {slot.timeRange}
                  </Text>
                </Pressable>
              ))
            ) : (
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ fontSize: 13, color: "#64748B", textAlign: "center" }}>
                  No open availability slots found. Please publish new slots from Add Session.
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.outlineBtn, { marginTop: 12 }]}
              onPress={() => setRescheduleModalVisible(false)}
            >
              <Text style={styles.outlineBtnText}>Cancel</Text>
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
  headerIconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
    marginTop: 2,
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
  queueContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  queueLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  queueDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  queuePending: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "600",
  },
  awaitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: "auto",
  },
  bluePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
  awaitingText: {
    fontSize: 10,
    color: "#1D4ED8",
    fontWeight: "600",
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
  studentIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
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
  anonBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  anonBadgeText: {
    fontSize: 11,
    color: "#047857",
    fontWeight: "600",
  },
  studentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tagGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  blueTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  blueTagText: {
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "500",
  },
  greenTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  greenTagText: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "500",
  },
  grayTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  grayTagText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  requestedDateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  calendarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  requestedDateMeta: {
    flex: 1,
  },
  requestedDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  clockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  requestedTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  requestedStatusBadge: {
    borderWidth: 1,
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requestedStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greenMiniPill: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeading: {
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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  stressDipBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stressDipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EF4444",
  },
  chartContainer: {
    height: 100,
    position: "relative",
    justifyContent: "flex-end",
    paddingVertical: 6,
  },
  chartGridLines: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 24,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  moodPointsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
  },
  moodCol: {
    alignItems: "center",
    width: 44,
  },
  pointTrack: {
    height: 50,
    width: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  moodDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#1E293B",
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  moodDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1E293B",
  },
  chartDayText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
  },
  chartScoreText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  aiBriefBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEFCE8",
    borderWidth: 1,
    borderColor: "#FEF08A",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  briefIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  aiBriefText: {
    flex: 1,
    fontSize: 12,
    color: "#713F12",
    lineHeight: 17,
  },
  aiBriefBold: {
    fontWeight: "700",
  },
  quoteIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#CBD5E1",
    lineHeight: 24,
  },
  quoteBox: {
    flexDirection: "row",
    marginTop: 4,
  },
  quoteGreenBorder: {
    width: 3,
    backgroundColor: "#10B981",
    borderRadius: 2,
    marginRight: 10,
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic",
    color: colors.textSecondary,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  metaCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaCardLeft: {},
  metaCardRight: {},
  flagIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  micIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  decisionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  decisionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  decisionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  syncHint: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: 10,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  outlineBtn: {
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
  outlineBtnText: {
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
    marginTop: 2,
  },
  declineBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  expiredNoticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  expiredNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#B45309",
    fontWeight: "600",
    flex: 1,
  },
  declinedNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  declinedNoticeText: {
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "600",
    flex: 1,
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
  modalSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  modalSlotText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
});
