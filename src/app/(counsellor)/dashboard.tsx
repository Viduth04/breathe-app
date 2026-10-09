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
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  BookingRequestItem,
  CounsellorProfileInfo,
  SessionItem,
} from "@/types/counsellorDashboard";
import { useCounsellorBadges } from "@/context/CounsellorBadgeContext";
import { useCounsellorStore } from "@/services/counsellorStore";
import { usePopup } from "@/components/common/popup";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useMemo } from "react";
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
  const params = useLocalSearchParams<{
    reviewStudentId?: string;
    sessionCompleted?: string;
  }>();

  const {
    requests,
    sessions,
    pastSessions = [],
    patients = [],
    isAvailable,
    profile,
    toggleAvailability,
  } = useCounsellorStore();
  const { showToast } = usePopup();

  // Compute exact session records and pending request counts from database
  const totalHistoryRecords = useMemo(() => {
    return pastSessions.length;
  }, [pastSessions]);

  const pendingRequestsCount = useMemo(() => {
    return requests.filter((r) => r.status === "pending").length;
  }, [requests]);

  const studentRequestsCount = useMemo(() => {
    // Accurately reflect active student booking requests from real database
    return pendingRequestsCount > 0 ? pendingRequestsCount : requests.length;
  }, [pendingRequestsCount, requests]);

  const [activeFilter, setActiveFilter] = useState<TimeFilter>("Day");
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

  // If navigated here after completing a live session
  useEffect(() => {
    if (params?.sessionCompleted) {
      showToast({ message: "Consultation concluded. Case audit logged.", type: "success" });
    }
  }, [params?.sessionCompleted]);

  const handleSelectFilter = (filter: TimeFilter) => {
    setActiveFilter(filter);
    if (filter === "Session History") {
      router.navigate("/(counsellor-detail)/past-sessions");
    } else if (filter === "Week" || filter === "Month") {
      router.navigate({
        pathname: "/(counsellor)/schedule",
        params: { viewMode: filter.toLowerCase() },
      });
    }
  };

  // Toggle availability state with inline feedback
  const handleToggleAvailability = (value: boolean) => {
    toggleAvailability(value);
    showToast({
      message: value
        ? "You are now online and available for bookings."
        : "Availability paused. Students will see you as away.",
      type: value ? "success" : "info",
    });
  };

  // Accept a booking request -> routes to Confirm Acceptance modal
  const handleAcceptRequest = (request: BookingRequestItem) => {
    router.navigate({
      pathname: "/(counsellor-detail)/confirm-acceptance",
      params: { requestId: request.id, studentAnonId: request.studentAnonId },
    });
  };

  // View request details in full detail screen
  const handleViewRequest = (request: BookingRequestItem) => {
    router.navigate({
      pathname: "/(counsellor-detail)/request-detail",
      params: { requestId: request.id, studentAnonId: request.studentAnonId },
    });
  };

  // Action button pressed on a session card: follow exact modality screen flow
  const handleSessionAction = (session: SessionItem) => {
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

    if (isExpired) {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId: session.id,
          studentAnonId: session.studentAnonId,
          studentName: session.displayName,
        },
      });
      return;
    }

    if (session.sessionType === "video") {
      // 1. VIDEO SESSION FLOW: Ready to Join Lobby -> Active Video Call
      if (session.isNext) {
        router.navigate({
          pathname: "/(counsellor-detail)/ready-to-join",
          params: {
            sessionId: session.id,
            studentAnonId: session.studentAnonId,
            sessionTitle: session.sessionTypeLabel || "Encrypted Video Consultation",
            timeRange: session.timeRange,
          },
        });
      } else {
        router.navigate({
          pathname: "/(counsellor-detail)/confirmed-session",
          params: {
            sessionId: session.id,
            studentAnonId: session.studentAnonId,
            sessionType: "video",
          },
        });
      }
    } else if (session.sessionType === "chat") {
      // 2. SECURE CHAT SESSION FLOW: Real-time confidential messaging thread
      router.navigate({
        pathname: "/(counsellor)/messages",
        params: {
          studentAnonId: session.studentAnonId,
          sessionId: session.id,
        },
      });
    } else if (session.sessionType === "in-person") {
      // 3. IN-PERSON SESSION FLOW: Room 302 attendance check-in & clinical notes
      router.navigate({
        pathname: "/(counsellor-detail)/anonymous-session-details",
        params: {
          sessionId: session.id,
          studentAnonId: session.studentAnonId,
          sessionType: "in-person",
        },
      });
    } else {
      router.navigate({
        pathname: "/(counsellor-detail)/confirmed-session",
        params: {
          sessionId: session.id,
          studentAnonId: session.studentAnonId,
        },
      });
    }
  };

  // Add Session action -> routes to Add Session form screen
  const handleAddSession = () => {
    router.navigate("/(counsellor-detail)/add-session");
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
        {/* Profile Card with Availability Switch */}
        <CounsellorProfileCard
          profile={{ ...profile, unreadAlertsCount: alertsUnread }}
          isAvailable={isAvailable}
          onToggleAvailability={handleToggleAvailability}
        />

        {/* Controls Row: Time Filter & Add Session CTA */}
        <SegmentedControl
          activeFilter={activeFilter}
          onSelectFilter={handleSelectFilter}
          onAddSession={handleAddSession}
        />

        {/* Stat Metrics Cards Grid (3 Columns) */}
        <View style={styles.statsRow}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => router.navigate("/(counsellor-detail)/past-sessions")}
            accessibilityRole="button"
            accessibilityLabel="View Past Sessions History"
          >
            <StatCard
              title="History"
              value={totalHistoryRecords}
              subtitle="Session records"
              iconName="calendar-outline"
              iconColor="#0369A1"
              iconBg="#E0F2FE"
              iconBorder="#BAE6FD"
              subtitleColor="#0369A1"
            />
          </Pressable>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => router.navigate("/(counsellor-detail)/requests")}
            accessibilityRole="button"
            accessibilityLabel="View All Student Booking Requests"
          >
            <StatCard
              title="Requests"
              value={studentRequestsCount}
              subtitle="Awaiting action"
              iconName="clipboard-outline"
              iconColor="#065F46"
              iconBg={colors.success}
              iconBorder="rgba(110, 231, 183, 0.6)"
              subtitleColor="#0369A1"
            />
          </Pressable>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => router.navigate("/(counsellor-detail)/patients-list")}
            accessibilityRole="button"
            accessibilityLabel="View Patients Caseload Directory"
          >
            <StatCard
              title="Patients"
              value={patients.length}
              subtitle="Caseload directory"
              iconName="people-outline"
              iconColor={colors.primary}
              iconBg="#ECFDF5"
              iconBorder="rgba(5, 150, 105, 0.2)"
              subtitleColor="#0369A1"
            />
          </Pressable>
        </View>

        {/* Today's Sessions Section */}
        <SectionHeader
          title="Upcoming Sessions"
            subtitle="All scheduled consultations"
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
            <Text style={styles.emptyText}>No upcoming sessions scheduled</Text>
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
        <Pressable
          onPress={() => router.navigate("/(counsellor-detail)/requests")}
          accessibilityRole="button"
          accessibilityLabel="View All Pending Requests"
        >
          <SectionHeader
            title="Pending Requests"
            subtitle="Awaiting Confirmation"
            badgeText={`${requests.filter((r) => r.status === "pending").length} awaiting`}
          />
        </Pressable>

        {requests.filter((r) => r.status === "pending").length === 0 ? (
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
          requests
            .filter((r) => r.status === "pending")
            .map((request) => (
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
