// Anonymous Session Details Screen - Muaath (Member 4). Supports FR08, NFR01, NFR02.
// High-fidelity implementation matching approved prototype media_1791021938403.png
// Never reveals student identity, provides check-in toggle, prep note editing, and action links.

import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function AnonymousSessionDetailsScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    studentAnonId?: string;
  }>();

  const store = useCounsellorStore();
  const sessionId = params.sessionId || "session-3";
  const studentAnonId = params.studentAnonId || "Student #8812";

  // Data from shared store
  const sessionData = store.anonymousSession8812;
  const currentPrepNote = store.prepNotes[sessionId] || store.prepNotes[studentAnonId] || sessionData.prepNotes;
  const isCheckedIn = !!store.checkedInSessions[sessionId] || !!store.checkedInSessions[studentAnonId];

  // Local state
  const [modalVisible, setModalVisible] = useState(false);
  const [newNoteText, setNewNoteText] = useState(currentPrepNote);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3200);
  };

  const handleToggleCheckIn = () => {
    const nextState = store.toggleCheckIn(sessionId);
    if (nextState) {
      showToast("Student arrival verified. Clinical notes unlocked.");
    } else {
      showToast("Check-in reset to pending.");
    }
  };

  const handleSavePrepNote = () => {
    if (!newNoteText.trim()) return;
    store.addPrepNote(sessionId, newNoteText.trim());
    setModalVisible(false);
    showToast("Prep observation updated in clinical record.");
  };

  const handleReschedule = () => {
    Alert.alert(
      "Reschedule Session",
      `Select a new time slot for ${studentAnonId}'s in-person appointment.`,
      [
        {
          text: "Tomorrow 03:00 PM",
          onPress: () => {
            store.rescheduleSession(sessionId, "03:00 PM – 03:45 PM");
            showToast("Session rescheduled to Tomorrow 03:00 PM.");
          },
        },
        {
          text: "Open Calendar",
          onPress: () => router.navigate("/(counsellor-detail)/my-calendar"),
        },
        { text: "Dismiss", style: "cancel" },
      ]
    );
  };

  const handleCancelSession = () => {
    Alert.alert(
      "Cancel Session",
      `Are you sure you want to cancel the session with ${studentAnonId}? A confidential notification will be dispatched to advising.`,
      [
        { text: "Keep Session", style: "cancel" },
        {
          text: "Confirm Cancellation",
          style: "destructive",
          onPress: () => {
            store.cancelSession(sessionId, "Canceled by counselor via Session Details");
            showToast("Session canceled. Advising notified.");
            setTimeout(() => {
              router.navigate("/(counsellor)/dashboard");
            }, 1000);
          },
        },
      ]
    );
  };

  const handleStartSession = () => {
    if (isCheckedIn) {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId,
          studentAnonId,
          studentName: studentAnonId,
          idMode: "anonymous",
        },
      });
    } else {
      handleToggleCheckIn();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Authentic Header Bar ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressedState]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#076047" />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Session Details
        </Text>

        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: store.profile.avatarUrl }}
            style={styles.counselorAvatar}
            accessibilityLabel="Counselor profile"
          />
          <View style={styles.onlineBadge} />
        </View>
      </View>

      {/* ─── Feedback Toast ─── */}
      {feedbackToast && (
        <View style={styles.toastContainer} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={18} color="#076047" />
          <Text style={styles.toastText}>{feedbackToast}</Text>
        </View>
      )}

      {/* ─── Main Scrollable Area ─── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Context Strip */}
        <View style={styles.contextRow}>
          <View style={styles.contextLeft}>
            <View style={styles.pulsingDot} />
            <Text style={styles.contextText}>Counselor Active Deck</Text>
          </View>
          <Text style={styles.contextModeBadge}>IN-PERSON CARE</Text>
        </View>

        {/* ─── 1. SESSION SUMMARY CARD ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.studentInfoGroup}>
              <View style={styles.buildingIconSquare}>
                <MaterialCommunityIcons name="office-building" size={22} color="#076047" />
              </View>
              <View style={styles.nameLocationGroup}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.studentTitle}>{studentAnonId}</Text>
                  <View style={styles.anonymousChip}>
                    <Ionicons name="shield-outline" size={12} color="#6B6A5E" />
                    <Text style={styles.anonymousChipText}>Anonymous</Text>
                  </View>
                </View>
                <View style={styles.locationSubRow}>
                  <Ionicons name="location-outline" size={14} color="#076047" />
                  <Text style={styles.locationSubText}>In-Person • Room 302</Text>
                </View>
              </View>
            </View>

            <View style={styles.timeRemainingPill}>
              <Ionicons name="time-outline" size={13} color="#6B6A5E" />
              <Text style={styles.timeRemainingText}>{sessionData.timeRelative}</Text>
            </View>
          </View>

          {/* Inner Timing Box */}
          <View style={styles.innerTimingBox}>
            <View style={styles.timingMainRow}>
              <View style={styles.timingClockGroup}>
                <Ionicons name="calendar-outline" size={16} color="#076047" />
                <Text style={styles.timeRangeText}>{sessionData.timeRange}</Text>
              </View>
              <View style={styles.durationPill}>
                <Text style={styles.durationPillText}>{sessionData.duration}</Text>
              </View>
            </View>

            <View style={styles.timingFooterRow}>
              <View style={styles.caseRefGroup}>
                <Ionicons name="pricetag-outline" size={13} color="#6B6A5E" />
                <Text style={styles.caseRefText}>
                  Case Ref: <Text style={styles.boldText}>{sessionData.caseRef}</Text>
                </Text>
              </View>
              <View style={styles.recurrenceGroup}>
                <View style={styles.greenMiniDot} />
                <Text style={styles.recurrenceText}>{sessionData.recurrence}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── 2. APPOINTMENT INFORMATION CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>APPOINTMENT INFORMATION</Text>
            <View style={styles.intakeBadge}>
              <Text style={styles.intakeBadgeText}>{sessionData.intakeType}</Text>
            </View>
          </View>

          {/* Location Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconSquare}>
              <MaterialCommunityIcons name="door-open" size={18} color="#076047" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.fieldLabel}>LOCATION</Text>
              <Text style={styles.fieldValueBold}>{sessionData.location}</Text>
              <Text style={styles.fieldSubText}>{sessionData.locationSub}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Session Type Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconSquare}>
              <Ionicons name="people-outline" size={18} color="#076047" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.fieldLabel}>SESSION TYPE</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.fieldValueBold}>{sessionData.sessionTypeLabel}</Text>
                <View style={styles.grayBadge}>
                  <Text style={styles.grayBadgeText}>45 mins</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Concern / Referral Tags */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconSquare}>
              <MaterialCommunityIcons name="brain" size={18} color="#076047" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.fieldLabel}>REFERRAL / PRIMARY CONCERN</Text>
              <View style={styles.tagsWrapRow}>
                <View style={styles.clinicalTagPill}>
                  <Ionicons name="school-outline" size={13} color="#076047" />
                  <Text style={styles.clinicalTagText}>Academic Pressure</Text>
                </View>
                <View style={styles.clinicalTagPill}>
                  <Ionicons name="chatbubbles-outline" size={13} color="#076047" />
                  <Text style={styles.clinicalTagText}>Social Connection</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Booking Status */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconSquare}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#076047" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.fieldLabel}>BOOKING STATUS</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.fieldValueBold}>{sessionData.bookingStatus}</Text>
                <View style={styles.confirmedPill}>
                  <Ionicons name="checkmark" size={14} color="#076047" />
                  <Text style={styles.confirmedPillText}>Confirmed</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Privacy & Compliance */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconSquare}>
              <Ionicons name="lock-closed-outline" size={18} color="#076047" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.fieldLabel}>PRIVACY & COMPLIANCE</Text>
              <Text style={styles.fieldValueBold}>{sessionData.privacyNotice}</Text>
              <View style={styles.complianceRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#076047" />
                <Text style={styles.complianceText}>{sessionData.complianceNotice}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── 3. PREP NOTES CARD ─── */}
        <View style={styles.prepCard}>
          <View style={styles.prepAccentBar} />
          <View style={styles.prepCardContent}>
            <View style={styles.prepHeaderRow}>
              <View style={styles.prepHeaderLeft}>
                <MaterialCommunityIcons name="feather" size={18} color="#076047" />
                <Text style={styles.sectionHeaderTitle}>PREP NOTES</Text>
              </View>
              <View style={styles.preSessionBadge}>
                <Text style={styles.preSessionBadgeText}>Pre-Session</Text>
              </View>
            </View>

            <Text style={styles.prepBodyText}>{currentPrepNote}</Text>

            <View style={styles.prepFooterRow}>
              <Pressable
                onPress={() => {
                  setNewNoteText(currentPrepNote);
                  setModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Add or edit prep note"
                style={({ pressed }) => [styles.addPrepButton, pressed && styles.pressedState]}
                hitSlop={8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#076047" />
                <Text style={styles.addPrepButtonText}>Add Prep Note</Text>
              </Pressable>

              <Text style={styles.prepUpdatedText}>{sessionData.prepNoteUpdatedAt}</Text>
            </View>
          </View>
        </View>

        {/* ─── 4. ACTION ROW (Reschedule / Cancel) ─── */}
        <View style={styles.actionGrid}>
          <Pressable
            onPress={handleReschedule}
            accessibilityRole="button"
            accessibilityLabel="Reschedule Session"
            style={({ pressed }) => [styles.rescheduleButton, pressed && styles.pressedState]}
          >
            <Ionicons name="calendar-outline" size={18} color="#076047" />
            <Text style={styles.rescheduleButtonText}>Reschedule</Text>
          </Pressable>

          <Pressable
            onPress={handleCancelSession}
            accessibilityRole="button"
            accessibilityLabel="Cancel Session"
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedState]}
          >
            <MaterialCommunityIcons name="calendar-remove-outline" size={18} color="#B91C1C" />
            <Text style={styles.cancelButtonText}>Cancel Session</Text>
          </Pressable>
        </View>

        {/* Deep Link to View Notes */}
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/(counsellor-detail)/session-notes",
              params: {
                sessionId,
                studentAnonId,
                studentName: studentAnonId,
                idMode: "anonymous",
              },
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Open Clinical Session Notes"
          style={({ pressed }) => [styles.notesLinkRow, pressed && styles.pressedState]}
        >
          <Ionicons name="document-text-outline" size={16} color="#076047" />
          <Text style={styles.notesLinkText}>View Clinical Notes History</Text>
          <Ionicons name="chevron-forward" size={16} color="#076047" />
        </Pressable>
      </ScrollView>

      {/* ─── 5. STICKY BOTTOM ACTION BAR ─── */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomBarInner}>
          <Pressable
            onPress={handleStartSession}
            accessibilityRole="button"
            accessibilityLabel={
              isCheckedIn ? "Student Checked-In, Start Session" : "Mark Student as Checked-In"
            }
            style={({ pressed }) => [
              styles.primaryCheckInButton,
              isCheckedIn ? styles.checkedInButtonBg : styles.defaultCheckInBg,
              pressed && styles.pressedState,
            ]}
          >
            <Ionicons
              name={isCheckedIn ? "checkmark-circle-outline" : "person-add-outline"}
              size={20}
              color={isCheckedIn ? "#076047" : "#FFFFFF"}
            />
            <Text
              style={[
                styles.checkInButtonText,
                isCheckedIn ? styles.checkedInText : styles.defaultCheckInText,
              ]}
            >
              {isCheckedIn ? "Student Checked-In • Start Session" : "Mark as Checked-In"}
            </Text>
          </Pressable>

          <Text style={[styles.checkInSubtext, isCheckedIn && styles.checkedInSubtextActive]}>
            {isCheckedIn
              ? "Student is waiting at Room 302. Clinical notes unlocked."
              : "Check-in unlocks clinical notes & arrival notification"}
          </Text>

          {/* iOS Home Indicator Bar */}
          <View style={styles.homeIndicator} />
        </View>
      </View>

      {/* ─── Interactive Modal for Prep Notes ─── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet} accessibilityViewIsModal={true}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                Add Clinical Prep Observation
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                style={styles.modalCloseCircle}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color="#6B6A5E" />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalTextInput}
              multiline
              numberOfLines={4}
              placeholder="Add specific conversational anchors or somatic reminders..."
              placeholderTextColor="#9CA3AF"
              value={newNoteText}
              onChangeText={setNewNoteText}
              accessibilityLabel="Clinical prep observation text"
            />

            <Pressable
              onPress={handleSavePrepNote}
              accessibilityRole="button"
              accessibilityLabel="Save Reflection Note"
              style={({ pressed }) => [styles.saveModalButton, pressed && styles.pressedState]}
            >
              <Text style={styles.saveModalButtonText}>Save Reflection Note</Text>
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
    backgroundColor: "#FAF8F5",
  },
  header: {
    height: 52,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF8F5",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(7, 96, 71, 0.08)",
  },
  headerButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1B2B24",
    letterSpacing: -0.3,
  },
  avatarContainer: {
    position: "relative",
    width: 34,
    height: 34,
  },
  counselorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "rgba(7, 96, 71, 0.2)",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.25)",
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#076047",
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 130,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  contextLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#076047",
  },
  contextText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6A5E",
  },
  contextModeBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.12)",
    marginBottom: spacing.md,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  studentInfoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  buildingIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
  },
  nameLocationGroup: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  studentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2B24",
  },
  anonymousChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(107, 106, 94, 0.25)",
    backgroundColor: "#F9FAFB",
  },
  anonymousChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B6A5E",
  },
  locationSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationSubText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B6A5E",
  },
  timeRemainingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timeRemainingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B6A5E",
  },
  innerTimingBox: {
    marginTop: spacing.sm,
    backgroundColor: "#FAF8F5",
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
  },
  timingMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timingClockGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeRangeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B2B24",
    letterSpacing: -0.2,
  },
  durationPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.18)",
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
  },
  timingFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  caseRefGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  caseRefText: {
    fontSize: 12,
    color: "#6B6A5E",
  },
  boldText: {
    fontWeight: "700",
    color: "#1B2B24",
  },
  recurrenceGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  greenMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#076047",
  },
  recurrenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.12)",
    marginBottom: spacing.md,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
    letterSpacing: 0.6,
  },
  intakeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },
  intakeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B6A5E",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 6,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  infoIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B6A5E",
    letterSpacing: 0.5,
  },
  fieldValueBold: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B2B24",
    marginTop: 2,
  },
  fieldSubText: {
    fontSize: 12,
    color: "#6B6A5E",
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  grayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },
  grayBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B6A5E",
  },
  tagsWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  clinicalTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  clinicalTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  confirmedPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
  },
  complianceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#076047",
  },
  prepCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.12)",
    marginBottom: spacing.md,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  prepAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#076047",
  },
  prepCardContent: {
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  prepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  prepHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  preSessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  preSessionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B6A5E",
  },
  prepBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B6A5E",
    marginBottom: 10,
  },
  prepFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  addPrepButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: TOUCH_TARGET,
  },
  addPrepButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#076047",
  },
  prepUpdatedText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B6A5E",
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.md,
  },
  rescheduleButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.3)",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rescheduleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#076047",
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B91C1C",
  },
  notesLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "rgba(7, 96, 71, 0.06)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
  },
  notesLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#076047",
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 249, 236, 0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(7, 96, 71, 0.12)",
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 8,
  },
  bottomBarInner: {
    alignItems: "center",
  },
  primaryCheckInButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  defaultCheckInBg: {
    backgroundColor: "#076047",
  },
  checkedInButtonBg: {
    backgroundColor: "#A7F3D0",
    borderWidth: 1,
    borderColor: "#076047",
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  defaultCheckInText: {
    color: "#FFFFFF",
  },
  checkedInText: {
    color: "#076047",
  },
  checkInSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6A5E",
    marginTop: 6,
    textAlign: "center",
  },
  checkedInSubtextActive: {
    color: "#076047",
    fontWeight: "700",
  },
  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(27, 43, 36, 0.25)",
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(7, 96, 71, 0.1)",
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2B24",
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTextInput: {
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: "#1B2B24",
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  saveModalButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#076047",
    alignItems: "center",
    justifyContent: "center",
  },
  saveModalButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
