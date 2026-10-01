import LogoutButton from "@/components/auth/LogoutButton";
import ClinicHoursBanner from "@/components/counsellor/ClinicHoursBanner";
import CounsellorProfileCard from "@/components/counsellor/CounsellorProfileCard";
import RequestCard from "@/components/counsellor/RequestCard";
import SectionHeader from "@/components/counsellor/SectionHeader";
import SegmentedControl, {
  TimeFilter,
} from "@/components/counsellor/SegmentedControl";
import SessionCard from "@/components/counsellor/SessionCard";
import StatCard from "@/components/counsellor/StatCard";
import {
  MOCK_COUNSELLOR_PROFILE,
  MOCK_PENDING_REQUESTS,
  MOCK_SESSIONS_TODAY,
} from "@/services/mockCounsellorData";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  BookingRequestItem,
  CounsellorProfileInfo,
  SessionItem,
} from "@/types/counsellorDashboard";
import { useCounsellorBadges } from "@/context/CounsellorBadgeContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CounsellorDashboard() {
  const { alertsUnread } = useCounsellorBadges();
  const params = useLocalSearchParams<{ reviewStudentId?: string }>();

  // Local state for interactive prototype (mock data first, no Firestore)
  const [profile, setProfile] = useState<CounsellorProfileInfo>(
    MOCK_COUNSELLOR_PROFILE
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(profile.isAvailable);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("Day");
  const [sessions, setSessions] = useState<SessionItem[]>(MOCK_SESSIONS_TODAY);
  const [requests, setRequests] = useState<BookingRequestItem[]>(
    MOCK_PENDING_REQUESTS
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackActionStudent, setFeedbackActionStudent] = useState<string | null>(null);
  const [activeModalData, setActiveModalData] = useState<{
    title: string;
    description: string;
    details?: string;
    isProfile?: boolean;
  } | null>(null);
  const [loading] = useState<boolean>(false);

  // If navigated here with reviewStudentId (e.g. from Alerts screen), open detail modal automatically
  useEffect(() => {
    if (params?.reviewStudentId) {
      const targetReq =
        requests.find((r) => r.studentId === params.reviewStudentId) ||
        requests[0];
      if (targetReq) {
        handleViewRequest(targetReq);
      }
    }
  }, [params?.reviewStudentId]);

  // Toggle availability state with inline feedback
  const handleToggleAvailability = (value: boolean) => {
    setIsAvailable(value);
    setFeedbackActionStudent(null);
    setFeedbackMessage(
      value
        ? "You are now online and available for bookings."
        : "Availability paused. Students will see you as away."
    );
  };

  // Accept a booking request
  const handleAcceptRequest = (request: BookingRequestItem) => {
    // Remove request from pending list
    setRequests((prev) => prev.filter((r) => r.id !== request.id));

    // Add as a confirmed session to the day's roster
    const newSession: SessionItem = {
      id: `session-accepted-${request.id}`,
      studentId: request.studentId,
      studentAnonId: request.studentAnonId,
      displayName: request.displayName,
      idMode: request.idMode,
      timeRange: request.requestedTime,
      timeRelative: "Added to Schedule",
      isNext: false,
      sessionType: request.sessionType,
      sessionTypeLabel:
        request.sessionType === "video"
          ? "Encrypted Video Consultation"
          : request.sessionType === "chat"
          ? "Secured Chat Session"
          : "In-Person Consultation",
      noteType: "Focus",
      noteText: request.topic,
      status: "confirmed",
    };

    setSessions((prev) => [...prev, newSession]);
    setFeedbackActionStudent(request.studentAnonId);
    setFeedbackMessage(
      `Accepted session with ${request.displayName}. Added to schedule.`
    );
  };

  // View request details in an accessible modal
  const handleViewRequest = (request: BookingRequestItem) => {
    setActiveModalData({
      title: `Booking Request: ${request.displayName}`,
      description: `Mode: ${request.sessionType.toUpperCase()} • Duration: ${request.duration} • Scheduled: ${request.requestedTime}`,
      details: request.aiMoodBrief
        ? `Focus Area: ${request.topic}\n\nAI Mood Brief (Supportive Summary):\n${request.aiMoodBrief}`
        : `Focus Area: ${request.topic}`,
    });
  };

  // Action button pressed on a session card
  const handleSessionAction = (session: SessionItem) => {
    if (session.isNext) {
      setActiveModalData({
        title: "Starting Encrypted Consultation",
        description: `Connecting to secure session with ${session.displayName}...`,
        details:
          "End-to-end encryption verified. Only you and this anonymous student have access to this room.",
      });
    } else {
      setActiveModalData({
        title: `Clinical Notes: ${session.displayName}`,
        description: `${session.timeRange} (${session.sessionTypeLabel})`,
        details: `${session.noteType}: ${session.noteText}\n\nStudent Privacy Status: ${
          session.idMode === "anonymous"
            ? "Anonymous Mode Active (Real identity hidden per NFR01)"
            : "Standard Student Profile"
        }`,
      });
    }
  };

  // Add Session stub action
  const handleAddSession = () => {
    setActiveModalData({
      title: "Add New Consultation",
      description: "Quickly schedule an emergency or walk-in appointment.",
      details:
        "This will add an appointment slot to your clinical calendar. Feature links with Schedule availability tab.",
    });
  };

  // Profile quick access
  const handleProfilePress = () => {
    setActiveModalData({
      title: "Counsellor Profile Quick Access",
      description: `${profile.fullName} • ${profile.title}`,
      details:
        "Manage credentials, availability preferences, and account session. Log out below to return to Welcome & Sign In.",
      isProfile: true,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Top Bar Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Text style={styles.topBarTitle} accessibilityRole="header">
          Counselor Dashboard
        </Text>
        <Pressable
          onPress={handleProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Quick Access Profile"
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Pressable>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Inline Feedback Toast */}
        {feedbackMessage && (
          <View style={styles.toastBanner} accessibilityRole="alert">
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.toastText}>{feedbackMessage}</Text>
            {feedbackActionStudent && (
              <Pressable
                onPress={() => router.navigate("/(counsellor)/messages")}
                accessibilityRole="button"
                accessibilityLabel="Message Student"
                style={styles.toastActionBtn}
              >
                <Text style={styles.toastActionText}>Message</Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={colors.white}
                />
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                setFeedbackMessage(null);
                setFeedbackActionStudent(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss message"
              hitSlop={8}
            >
              <Ionicons
                name="close"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        )}

        {/* Profile Card with Availability Switch */}
        <CounsellorProfileCard
          profile={{ ...profile, unreadAlertsCount: alertsUnread }}
          isAvailable={isAvailable}
          onToggleAvailability={handleToggleAvailability}
        />

        {/* Controls Row: Time Filter & Add Session CTA */}
        <SegmentedControl
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          onAddSession={handleAddSession}
        />

        {/* Stat Metrics Cards Grid (3 Columns) */}
        <View style={styles.statsRow}>
          <StatCard
            title="Sessions"
            value={sessions.length}
            subtitle="Scheduled today"
            iconName="calendar-outline"
            iconColor="#0369A1"
            iconBg="#E0F2FE"
            iconBorder="#BAE6FD"
            subtitleColor="#0369A1"
          />
          <StatCard
            title="Requests"
            value={requests.length}
            subtitle="Awaiting action"
            iconName="clipboard-outline"
            iconColor="#065F46"
            iconBg={colors.success}
            iconBorder="rgba(110, 231, 183, 0.6)"
          />
          <StatCard
            title="Clinical Time"
            value="2.5h"
            subtitle="Booked hours"
            iconName="time-outline"
            iconColor={colors.primary}
            iconBg="#ECFDF5"
            iconBorder="rgba(5, 150, 105, 0.2)"
          />
        </View>

        {/* Today's Sessions Section */}
        <SectionHeader
          title="Today's Sessions"
          subtitle="Mon, 18 Aug"
          badgeText={`${sessions.length} scheduled`}
        />

        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-clear-outline"
              size={36}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.emptyText}>No sessions scheduled for today</Text>
          </View>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPressAction={handleSessionAction}
            />
          ))
        )}

        {/* Pending Requests Section */}
        <SectionHeader
          title="Pending Requests"
          subtitle="Awaiting Confirmation"
          badgeText={`${requests.length} awaiting`}
        />

        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={38}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.emptyText}>
              All requests have been reviewed. You're all caught up!
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={handleAcceptRequest}
              onView={handleViewRequest}
            />
          ))
        )}

        {/* Shortcut Notice Banner: Block Clinic Hours */}
        <ClinicHoursBanner />
      </ScrollView>

      {/* Accessible Detail Modal Overlay */}
      <Modal
        visible={activeModalData !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModalData(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                {activeModalData?.title}
              </Text>
              <Pressable
                onPress={() => setActiveModalData(null)}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                hitSlop={8}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              {activeModalData?.description}
            </Text>

            {activeModalData?.details ? (
              <View style={styles.modalDetailsBox}>
                <Text style={styles.modalDetailsText}>
                  {activeModalData.details}
                </Text>
              </View>
            ) : null}

            {activeModalData?.isProfile ? (
              <View style={styles.modalProfileActions}>
                <LogoutButton variant="primary" style={styles.modalLogoutButton} />
                <Pressable
                  onPress={() => setActiveModalData(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Close profile dialog"
                  style={styles.modalSecondaryButton}
                >
                  <Text style={styles.modalSecondaryButtonText}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setActiveModalData(null)}
                accessibilityRole="button"
                accessibilityLabel="Dismiss modal"
                style={styles.modalActionButton}
              >
                <Text style={styles.modalActionButtonText}>Got It</Text>
              </Pressable>
            )}
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  topBarSpacer: {
    width: TOUCH_TARGET - 4,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  profileButton: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.7)",
  },
  toastText: {
    ...typography.body,
    fontSize: 13,
    color: "#064E3B",
    fontWeight: "600",
    flex: 1,
  },
  toastActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 4,
  },
  toastActionText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 18,
    color: colors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalDescription: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalDetailsBox: {
    backgroundColor: colors.background,
    borderRadius: radius.sm + 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalDetailsText: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  modalActionButton: {
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  modalProfileActions: {
    gap: spacing.sm,
  },
  modalLogoutButton: {
    width: "100%",
  },
  modalSecondaryButton: {
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
