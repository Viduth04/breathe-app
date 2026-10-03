// Counsellor Alerts - Muaath (Member 4). Supports FR05, NFR01.
// Notification & clinical alert center matching exact Figma layout and interactions.

import { useCounsellorBadges } from "@/context/CounsellorBadgeContext";
import { useCounsellorStore } from "@/services/counsellorStore";
import {
  MOCK_ALERTS_EARLIER,
  MOCK_ALERTS_TODAY,
} from "@/services/mockAlertsData";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { AlertFilter, AlertItem } from "@/types/counsellorAlerts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CounsellorAlertsScreen() {
  const { alertsUnread, markAlertsAsRead } = useCounsellorBadges();
  const { alertPreferences } = useCounsellorStore();
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("all");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isAllRead, setIsAllRead] = useState(alertsUnread === 0);
  const [modalData, setModalData] = useState<{
    title: string;
    description: string;
    details?: string;
  } | null>(null);

  const handleMarkAllRead = () => {
    setIsAllRead(true);
    markAlertsAsRead();
    setFeedbackMessage("All notifications marked as read.");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Navigate to Request Detail screen for Student #5104
  const handleReviewRequest = () => {
    router.navigate("/(counsellor-detail)/request-detail");
  };

  // Navigate to Messages for Secure Chat with Student #4021
  const handleSecureChat = () => {
    router.navigate({
      pathname: "/(counsellor)/messages",
      params: { studentAnonId: "Student #4021" },
    });
  };

  // Dynamic filter matching
  const isAlertVisible = (alert: AlertItem) => {
    if (activeFilter === "unread") return alert.isUnread && !isAllRead;
    if (activeFilter === "intake")
      return alert.category === "intake" || alert.category === "request";
    if (activeFilter === "schedule")
      return alert.category === "session" || alert.category === "reschedule";
    return true;
  };

  const visibleTodayAlerts = MOCK_ALERTS_TODAY.filter(isAlertVisible);
  const visibleEarlierAlerts = MOCK_ALERTS_EARLIER.filter(isAlertVisible);
  const totalVisible = visibleTodayAlerts.length + visibleEarlierAlerts.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.navigate("/(counsellor)/dashboard")}
          accessibilityRole="button"
          accessibilityLabel="Go back to Dashboard"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Notifications
        </Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.navigate("/(counsellor-detail)/clinical-alerts-preferences")}
          accessibilityRole="button"
          accessibilityLabel="Clinical Alerts and Preferences"
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QUIET HOURS / DUTY OFF STATUS BANNER */}
        {alertPreferences?.quietHoursDutyOff && (
          <View style={styles.quietHoursBanner} accessibilityRole="summary">
            <View style={styles.quietHoursLeft}>
              <View style={styles.quietHoursIconBox}>
                <Ionicons name="moon" size={16} color="#4338CA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quietHoursTitle}>
                  Duty Off • Quiet Hours Active
                </Text>
                <Text style={styles.quietHoursSub}>
                  Emergency crisis triggers remain prioritized • Standard alerts silenced (06:00 PM – 08:00 AM)
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.quietHoursEditBtn}
              onPress={() => router.navigate("/(counsellor-detail)/clinical-alerts-preferences")}
              accessibilityRole="button"
              accessibilityLabel="Edit quiet hours preferences"
              hitSlop={8}
            >
              <Text style={styles.quietHoursEditBtnText}>Edit</Text>
            </Pressable>
          </View>
        )}

        {/* 2. CLINICAL ALERTS BANNER */}
        {!bannerDismissed && (
          <View style={styles.banner} accessibilityRole="alert">
            <View style={styles.bannerIconBox}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <Pressable
              style={styles.bannerContent}
              onPress={() => router.navigate("/(counsellor-detail)/clinical-alerts-preferences")}
              accessibilityRole="button"
              accessibilityLabel="Manage Clinical Alerts and Schedule Updates"
            >
              <Text style={styles.bannerTitle}>
                Clinical Alerts & Schedule Updates
              </Text>
              <Text style={styles.bannerDesc}>
                2 pending student triage requests and 1 intake assessment
                awaiting clinical review. Tap to manage preferences.
              </Text>
            </Pressable>
            <Pressable
              style={styles.bannerClose}
              onPress={() => setBannerDismissed(true)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss banner"
              hitSlop={10}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* 3. FILTER CHIPS BAR */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              style={[
                styles.filterChip,
                activeFilter === "all" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("all")}
              accessibilityRole="button"
              accessibilityLabel="All notifications"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === "all" && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === "unread" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("unread")}
              accessibilityRole="button"
              accessibilityLabel="Unread notifications"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === "unread" && styles.filterTextActive,
                ]}
              >
                Unread
              </Text>
              {!isAllRead && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>3</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === "intake" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("intake")}
              accessibilityRole="button"
              accessibilityLabel="Filter Intake and Alerts"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === "intake" && styles.filterTextActive,
                ]}
              >
                Intake / Alerts
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === "schedule" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("schedule")}
              accessibilityRole="button"
              accessibilityLabel="Filter Schedule"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === "schedule" && styles.filterTextActive,
                ]}
              >
                Schedule Re...
              </Text>
            </Pressable>
          </ScrollView>

          {/* Mark All Read Action Button (≥44x44px touch target) */}
          <Pressable
            style={styles.markAllReadBtn}
            onPress={handleMarkAllRead}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
          >
            <Ionicons
              name="checkmark-done"
              size={22}
              color={isAllRead ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* DYNAMIC ALERT FEED OR EMPTY STATE */}
        {totalVisible === 0 ? (
          <View style={styles.emptyFeedBox} accessibilityRole="summary">
            <View style={styles.emptyFeedIconCircle}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={40}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyFeedTitle}>All caught up!</Text>
            <Text style={styles.emptyFeedSubtitle}>
              No notifications matching the "{activeFilter}" filter.
            </Text>
          </View>
        ) : (
          <>
            {/* 4. TODAY SECTION */}
            {visibleTodayAlerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Today</Text>
                    <View style={styles.dotIndicator} />
                  </View>
                  <Text style={styles.sectionCount}>
                    {visibleTodayAlerts.length} priority
                  </Text>
                </View>

                {/* Card 1: New Session Request */}
                {visibleTodayAlerts.some((a) => a.id === "alert-1") && (
                  <Pressable
                    style={styles.card}
                    accessibilityRole="button"
                    accessibilityLabel="View triage notification for Student #5104"
                    onPress={() => router.navigate("/(counsellor-detail)/notification-detail")}
                  >
                    <View style={styles.cardMainRow}>
                      <View style={styles.iconBox}>
                        <Ionicons
                          name="send-outline"
                          size={20}
                          color={colors.text}
                        />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            New Session Request
                          </Text>
                          <View style={styles.timeRow}>
                            <Text style={styles.timeText}>10m ago</Text>
                            {!isAllRead && <View style={styles.unreadDot} />}
                          </View>
                        </View>
                        <Text style={styles.cardBody} numberOfLines={2}>
                          Student #5104 requested a 45-min Anxiety Consultation for...
                        </Text>

                        {/* Badges & Actions Row (Side by Side per PNG) */}
                        <View style={styles.actionRowInline}>
                          <View style={styles.badgeMint}>
                            <Text style={styles.badgeMintText}>Urgent / Triage</Text>
                          </View>
                          <Pressable
                            style={styles.actionBtnFilled}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleReviewRequest();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Review Request for Student #5104"
                          >
                            <Text style={styles.actionBtnFilledText}>Review Request</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.chevronBox}>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </Pressable>
                )}

                {/* Card 2: Intake Questionnaire Submitted */}
                {visibleTodayAlerts.some((a) => a.id === "alert-2") && (
                  <View style={styles.card} accessibilityRole="summary">
                    <View style={styles.cardMainRow}>
                      <View style={styles.iconBox}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color={colors.text}
                        />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            Intake Questionnaire Submitted
                          </Text>
                          <View style={styles.timeRow}>
                            <Text style={styles.timeText}>45m ago</Text>
                            {!isAllRead && <View style={styles.unreadDot} />}
                          </View>
                        </View>
                        <Text style={styles.cardBody} numberOfLines={2}>
                          Sarah Jenkins completed her pre-session PHQ-9 assessment
                        </Text>

                        {/* Badges & Actions Row (Side by Side per PNG) */}
                        <View style={styles.actionRowInline}>
                          <View style={styles.badgeMint}>
                            <Text style={styles.badgeMintText}>PHQ-9 • Moderate</Text>
                          </View>
                          <Pressable
                            style={styles.actionBtnGray}
                            onPress={() =>
                              setModalData({
                                title: "PHQ-9 Intake Assessment",
                                description:
                                  "Sarah Jenkins (Student #4810) · Score: 12 (Moderate Depression/Anxiety)\n\nPre-session clinical questionnaire completed. Notes flagged for follow-up review.",
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel="View Assessment for Sarah Jenkins"
                          >
                            <Text style={styles.actionBtnGrayText}>View Assessment</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.chevronBox}>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Card 3: Session in 15 Minutes */}
                {visibleTodayAlerts.some((a) => a.id === "alert-3") && (
                  <View style={styles.card} accessibilityRole="summary">
                    <View style={styles.cardMainRow}>
                      <View style={styles.iconBox}>
                        <Ionicons
                          name="videocam-outline"
                          size={20}
                          color={colors.text}
                        />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            Session in 15 Minutes
                          </Text>
                          <View style={styles.timeRow}>
                            <Text style={styles.timeTextUrgent}>Just now</Text>
                            {!isAllRead && <View style={styles.unreadDot} />}
                          </View>
                        </View>
                        <Text style={styles.cardBody} numberOfLines={2}>
                          Upcoming Video Consultation with Alex Rivera at 10:00 AM....
                        </Text>

                        <View style={styles.actionRowInline}>
                          <Pressable
                            style={styles.actionBtnFilled}
                            onPress={() =>
                              router.navigate({
                                pathname: "/(counsellor-detail)/ready-to-join",
                                params: {
                                  studentAnonId: "Alex Rivera",
                                  sessionTitle: "Encrypted Video Consultation",
                                  timeRange: "10:00 AM – 10:45 AM",
                                  duration: "45 min session",
                                },
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Enter Consultation Room with Alex Rivera"
                          >
                            <View style={styles.pulseDot} />
                            <Text style={styles.actionBtnFilledText}>Enter Room</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.chevronBox}>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 5. EARLIER THIS WEEK SECTION */}
            {visibleEarlierAlerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleBold}>Earlier this week</Text>

                {/* Card 4: Message from Student */}
                {visibleEarlierAlerts.some((a) => a.id === "alert-4") && (
                  <View style={styles.card} accessibilityRole="summary">
                    <View style={styles.cardMainRow}>
                      <View style={styles.iconBox}>
                        <Ionicons
                          name="chatbubble-outline"
                          size={20}
                          color={colors.text}
                        />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            Message from Student
                          </Text>
                          <Text style={styles.timeText}>Yesterday</Text>
                        </View>
                        <Text style={styles.cardBody} numberOfLines={2}>
                          Student #4021 sent a message in secure chat regarding breathing
                        </Text>

                        <View style={styles.actionRowInline}>
                          <Pressable
                            style={styles.actionBtnGray}
                            onPress={handleSecureChat}
                            accessibilityRole="button"
                            accessibilityLabel="Secure Chat with Student #4021"
                          >
                            <Text style={styles.actionBtnGrayText}>Secure Chat</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.chevronBox}>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Card 5: Session Cancelled / Rescheduled */}
                {visibleEarlierAlerts.some((a) => a.id === "alert-5") && (
                  <View style={styles.card} accessibilityRole="summary">
                    <View style={styles.cardMainRow}>
                      <View style={styles.iconBox}>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color={colors.text}
                        />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            Session Cancelled / Resch
                          </Text>
                          <Text style={styles.timeText}>Tuesday</Text>
                        </View>
                        <Text style={styles.cardBody} numberOfLines={2}>
                          Student #8821 requested to reschedule Thursday's slot to...
                        </Text>

                        {/* Actionable Reschedule Link to Schedule per Fix #5 */}
                        <View style={styles.actionRowInline}>
                          <Pressable
                            style={styles.actionBtnGray}
                            onPress={() => router.navigate("/(counsellor)/schedule")}
                            accessibilityRole="button"
                            accessibilityLabel="View in Schedule"
                          >
                            <Text style={styles.actionBtnGrayText}>View in Schedule</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.chevronBox}>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* 6. COMPLIANCE FOOTER */}
        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.footerText}>
            All clinical notifications synced with portal •{" "}
            <Text style={{ fontWeight: "700", color: colors.primary }}>
              HIPAA compliant
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Floating Feedback Toast */}
      {feedbackMessage && (
        <View style={styles.toast} accessibilityRole="alert">
          <Text style={styles.toastText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Accessible Detail Modal Overlay */}
      <Modal
        visible={modalData !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalData(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              {modalData?.title}
            </Text>
            <Text style={styles.modalDescription}>
              {modalData?.description}
            </Text>
            <Pressable
              onPress={() => setModalData(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss modal"
              style={styles.modalBtn}
            >
              <Text style={styles.modalBtnText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255, 249, 236, 0.95)",
  },
  headerBtn: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  banner: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.sm,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.6)",
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 2,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 2,
  },
  bannerDesc: {
    fontSize: 11,
    color: colors.primary,
    lineHeight: 16,
  },
  bannerClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  quietHoursBanner: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  quietHoursLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  quietHoursIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  quietHoursTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3730A3",
  },
  quietHoursSub: {
    fontSize: 11,
    color: "#4F46E5",
    lineHeight: 15,
    marginTop: 2,
  },
  quietHoursEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#4338CA",
  },
  quietHoursEditBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: spacing.xs,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  filterBadge: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.white,
  },
  markAllReadBtn: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
  },
  sectionTitleBold: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.08)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: spacing.sm + 2,
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 2,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    flex: 1,
    marginRight: spacing.xs,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  timeTextUrgent: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  cardBody: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  actionRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  badgeMint: {
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(110, 231, 183, 0.6)",
  },
  badgeMintText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#064E3B",
  },
  actionBtnFilled: {
    minHeight: TOUCH_TARGET - 10,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnFilledText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  actionBtnGray: {
    minHeight: TOUCH_TARGET - 10,
    backgroundColor: "#F1F5F9",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnGrayText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  chevronBox: {
    paddingLeft: spacing.xs,
    paddingTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  toast: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    zIndex: 100,
  },
  toastText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
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
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    padding: spacing.lg,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  modalBtn: {
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyFeedBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
    gap: spacing.xs + 2,
  },
  emptyFeedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  emptyFeedSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
