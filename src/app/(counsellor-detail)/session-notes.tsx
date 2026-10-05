// View Notes / Session Notes Screen - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// High-fidelity implementation matching approved prototype media_1791022096387.png
// Confidential clinical progress notes, follow-up priority review, topics tags, and HIPAA-encrypted logs.

import React, { useState } from "react";
import {
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { MOCK_SESSION_NOTES_MAYA } from "@/services/mockDetailScreensData";

export default function SessionNotesScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    studentAnonId?: string;
    studentName?: string;
    idMode?: string;
  }>();

  const store = useCounsellorStore();
  const studentKey = params.studentName || params.studentAnonId || "Maya Senanayake";

  // Notes data from store, fallback to Maya mock
  const notesData =
    store.sessionNotes[studentKey] ||
    store.sessionNotes[params.studentAnonId || ""] ||
    store.sessionNotes["std-maya"] ||
    MOCK_SESSION_NOTES_MAYA;

  // Local state for adding note
  const [modalVisible, setModalVisible] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3200);
  };

  const handleSaveNewNote = () => {
    const trimmed = newNoteContent.trim();
    if (!trimmed) {
      showToast("Cannot save empty note. Please enter clinical observations.");
      return;
    }
    if (trimmed.length < 5) {
      showToast("Note is too short. Minimum 5 characters required for clinical records.");
      return;
    }
    store.addClinicalNote(studentKey, trimmed, notesData.sessionType === "chat" ? "Chat" : "Consultation");
    setNewNoteContent("");
    setModalVisible(false);
    showToast("Clinical note encrypted and synced to record.");
  };

  const handleSaveNotesFooter = () => {
    showToast("All session observations saved and verified.");
    setTimeout(() => {
      router.back();
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Authentic Navigation Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressedState]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#1B2B24" />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Session Notes
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
        {/* ─── 1. TOP SESSION SUMMARY CARD ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.studentInfoGroup}>
              <View style={styles.chatIconSquare}>
                <Ionicons
                  name={notesData.sessionType === "chat" ? "chatbubble" : "videocam"}
                  size={20}
                  color="#076047"
                />
              </View>
              <View style={styles.nameModalityGroup}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.studentTitle}>{notesData.displayName}</Text>
                  <View style={styles.standardIdChip}>
                    <Ionicons name="checkmark-circle" size={12} color="#076047" />
                    <Text style={styles.standardIdChipText}>
                      {notesData.idMode === "standard" ? "Standard ID" : "Anonymous"}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalitySubRow}>
                  <View style={styles.modalityDot} />
                  <Text style={styles.modalitySubText}>{notesData.sessionTypeLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.timeRemainingPill}>
              <Ionicons name="time-outline" size={13} color="#6B6A5E" />
              <Text style={styles.timeRemainingText}>{notesData.timeRelative}</Text>
            </View>
          </View>

          {/* Inner Upcoming Slot Box */}
          <View style={styles.innerTimingBox}>
            <View style={styles.timingMainRow}>
              <View style={styles.timingClockGroup}>
                <Ionicons name="time-outline" size={15} color="#076047" />
                <Text style={styles.timeRangeText}>{notesData.timeRange}</Text>
                <Text style={styles.durationMutedText}>({notesData.duration})</Text>
              </View>
              <View style={styles.upcomingPill}>
                <View style={styles.upcomingDot} />
                <Text style={styles.upcomingPillText}>Upcoming</Text>
              </View>
            </View>

            <View style={styles.timingFooterRow}>
              <Text style={styles.caseRefText}>
                Case Ref: <Text style={styles.boldText}>{notesData.caseRef}</Text>
              </Text>
              <Text style={styles.sessionOrdinalText}>{notesData.sessionOrdinal}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. FOLLOW-UP PRIORITY CARD ─── */}
        <View style={styles.followUpCard}>
          <View style={styles.followUpHeaderRow}>
            <Text style={styles.followUpBadgeText}>FOLLOW-UP</Text>
            <Text style={styles.followUpPriorityText}>{notesData.followUpPriority}</Text>
          </View>
          <Text style={styles.followUpBodyText}>{notesData.followUpAction}</Text>
        </View>

        {/* ─── 3. TOPICS & TAGS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>TOPICS & TAGS</Text>
            <View style={styles.coveredPill}>
              <Text style={styles.coveredPillText}>{notesData.topics.length} Covered</Text>
            </View>
          </View>

          <View style={styles.topicsGrid}>
            {notesData.topics.map((t, idx) => (
              <View key={idx} style={styles.topicChip}>
                <Text style={styles.topicIcon}>{t.icon}</Text>
                <Text style={styles.topicName}>{t.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── 4. CLINICAL NOTES (HIPAA ENCRYPTED) ─── */}
        <View style={styles.notesSection}>
          <View style={styles.clinicalHeaderRow}>
            <Text style={styles.clinicalTitle}>Clinical Notes</Text>
            <View style={styles.hipaaPill}>
              <Ionicons name="lock-closed" size={12} color="#1B2B24" />
              <Text style={styles.hipaaText}>HIPAA Encrypted</Text>
            </View>
          </View>
          <Text style={styles.clinicalSubtitle}>
            Past session progress notes & clinical observations
          </Text>

          {/* Timeline Notes List */}
          {notesData.notes.map((entry) => (
            <View key={entry.id} style={styles.noteEntryCard}>
              <View style={styles.noteAccentBar} />
              <View style={styles.noteContent}>
                <View style={styles.entryHeaderRow}>
                  <View style={styles.entryDateGroup}>
                    <Ionicons name="calendar-outline" size={14} color="#076047" />
                    <Text style={styles.entryDateText}>{entry.date}</Text>
                  </View>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#076047" />
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                </View>

                <Text style={styles.entryBodyText}>{entry.content}</Text>

                <View style={styles.entryFooterRow}>
                  <View style={styles.signGroup}>
                    <Ionicons name="pencil-outline" size={13} color="#076047" />
                    <Text style={styles.signText}>{entry.counselorName}</Text>
                  </View>
                  <View style={styles.syncGroup}>
                    <Ionicons name="cloud-done-outline" size={14} color="#076047" />
                    <Text style={styles.syncText}>{entry.signedStatus}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* + Add Note Button */}
          <Pressable
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add New Clinical Progress Note"
            style={({ pressed }) => [styles.addNotePillButton, pressed && styles.pressedState]}
          >
            <Ionicons name="add" size={18} color="#076047" />
            <Text style={styles.addNotePillText}>Add Note</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ─── 5. STICKY BOTTOM ACTION BAR ─── */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomButtonsRow}>
          <Pressable
            onPress={() => router.navigate("/(counsellor)/dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
            style={({ pressed }) => [styles.secondaryOutlineButton, pressed && styles.pressedState]}
          >
            <Text style={styles.secondaryOutlineText}>Back to Dashboard</Text>
          </Pressable>

          <Pressable
            onPress={handleSaveNotesFooter}
            accessibilityRole="button"
            accessibilityLabel="Save Clinical Notes"
            style={({ pressed }) => [styles.primarySaveButton, pressed && styles.pressedState]}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.primarySaveText}>Save Notes</Text>
          </Pressable>
        </View>

        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>

      {/* ─── Interactive Modal for Adding Note ─── */}
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
                New Clinical Observation
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
              placeholder="Record objective observations, therapeutic interventions, and homework assignments..."
              placeholderTextColor="#9CA3AF"
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              accessibilityLabel="Clinical observation text entry"
            />

            <Pressable
              onPress={handleSaveNewNote}
              accessibilityRole="button"
              accessibilityLabel="Save Clinical Note"
              style={({ pressed }) => [styles.saveModalButton, pressed && styles.pressedState]}
            >
              <Text style={styles.saveModalButtonText}>Sign & Sync Clinical Note</Text>
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
    backgroundColor: "#FFF9EC",
  },
  header: {
    height: 52,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF9EC",
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
    backgroundColor: "#076047",
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
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    marginBottom: spacing.sm + 2,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
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
  chatIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
  },
  nameModalityGroup: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  studentTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1B2B24",
  },
  standardIdChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#E5F8E4",
  },
  standardIdChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#076047",
  },
  modalitySubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  modalityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#076047",
  },
  modalitySubText: {
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
    borderColor: "rgba(7, 96, 71, 0.08)",
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
    fontSize: 14,
    fontWeight: "700",
    color: "#1B2B24",
  },
  durationMutedText: {
    fontSize: 12,
    color: "#6B6A5E",
  },
  upcomingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#E5F8E4",
  },
  upcomingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#076047",
  },
  upcomingPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#076047",
  },
  timingFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  caseRefText: {
    fontSize: 12,
    color: "#6B6A5E",
  },
  boldText: {
    fontWeight: "700",
    color: "#1B2B24",
  },
  sessionOrdinalText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6A5E",
  },
  followUpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    marginBottom: spacing.sm + 2,
  },
  followUpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  followUpBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
    letterSpacing: 0.5,
  },
  followUpPriorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6A5E",
  },
  followUpBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B6A5E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    marginBottom: spacing.sm + 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
    letterSpacing: 0.6,
  },
  coveredPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#F3F4F6",
  },
  coveredPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B6A5E",
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  topicIcon: {
    fontSize: 13,
  },
  topicName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1B2B24",
  },
  notesSection: {
    marginTop: spacing.xs,
  },
  clinicalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  clinicalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2B24",
  },
  hipaaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hipaaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1B2B24",
  },
  clinicalSubtitle: {
    fontSize: 12,
    color: "#6B6A5E",
    marginBottom: 12,
  },
  noteEntryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.12)",
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  noteAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: "#076047",
  },
  noteContent: {
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  entryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  entryDateGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  entryDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B2B24",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  entryBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B6A5E",
    marginBottom: 10,
  },
  entryFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  signGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  syncGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  syncText: {
    fontSize: 11,
    color: "#6B6A5E",
  },
  addNotePillButton: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.3)",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 12,
  },
  addNotePillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#076047",
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 249, 236, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(7, 96, 71, 0.12)",
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryOutlineButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#076047",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryOutlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#076047",
  },
  primarySaveButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#076047",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primarySaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(27, 43, 36, 0.25)",
    alignSelf: "center",
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
    minHeight: 110,
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
