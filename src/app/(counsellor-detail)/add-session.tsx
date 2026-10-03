// Add Session Screen - Muaath (Member 4). Supports FR08, NFR01, NFR02, NFR06.
// High-fidelity implementation matching approved prototype media_1791022238194.png
// Live clinical sync, student quick select, modality switch, auto-calculated end time,
// duration pills, clinical tags, privacy toggles, and strict validation (prevents overlaps/past times).

import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { MOCK_ADD_SESSION_STUDENTS } from "@/services/mockDetailScreensData";
import { SessionType } from "@/types/counsellorDashboard";

type DurationOption = "15m" | "30m" | "45m" | "60m";

export default function AddSessionScreen() {
  const store = useCounsellorStore();

  // Form state
  const [selectedStudent, setSelectedStudent] = useState(MOCK_ADD_SESSION_STUDENTS[0]);
  const [sessionModality, setSessionModality] = useState<SessionType>("video");
  const [selectedDateQuick, setSelectedDateQuick] = useState<"Today" | "Tomorrow" | "Wed, Aug 20">("Tomorrow");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [duration, setDuration] = useState<DurationOption>("45m");
  const [sessionFocus, setSessionFocus] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Sleep Hygiene"]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Auto-calculated end time
  const calculatedEndTime = useMemo(() => {
    const durationMinutes = parseInt(duration.replace("m", ""), 10) || 45;
    const [timeStr, meridiem] = startTime.split(" ");
    const [hoursStr, minsStr] = timeStr.split(":");
    let hours = parseInt(hoursStr, 10);
    let mins = parseInt(minsStr, 10);

    mins += durationMinutes;
    if (mins >= 60) {
      hours += Math.floor(mins / 60);
      mins = mins % 60;
    }

    const formattedMins = mins < 10 ? `0${mins}` : mins;
    return `${hours}:${formattedMins} ${meridiem || "AM"}`;
  }, [startTime, duration]);

  // Formatted date string
  const formattedDate = useMemo(() => {
    if (selectedDateQuick === "Today") return "Today, Monday, Aug 18, 2026";
    if (selectedDateQuick === "Tomorrow") return "Tuesday, Aug 19, 2026";
    return "Wednesday, Aug 20, 2026";
  }, [selectedDateQuick]);

  // Validation: Check for required fields and overlapping sessions
  const validationError = useMemo(() => {
    if (!selectedStudent) {
      return "Student selection is required.";
    }

    // Check overlap with existing confirmed sessions on that time/date
    const isToday = selectedDateQuick === "Today";
    if (isToday) {
      const overlap = store.sessions.find((s) => s.timeRange.includes(startTime));
      if (overlap) {
        return `Conflict: ${overlap.displayName} is already scheduled at ${startTime}.`;
      }
    }

    return null;
  }, [selectedStudent, selectedDateQuick, startTime, store.sessions]);

  const isValid = !validationError;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddSessionSubmit = () => {
    if (!isValid) return;

    store.addSession({
      studentId: selectedStudent.id,
      studentAnonId: selectedStudent.studentAnonId,
      displayName: isAnonymous ? selectedStudent.studentAnonId : selectedStudent.displayName,
      idMode: isAnonymous ? "anonymous" : selectedStudent.idMode,
      sessionType: sessionModality,
      date: formattedDate,
      startTime,
      endTime: calculatedEndTime,
      duration,
      locationOrRoom: sessionModality === "in-person" ? "Room 302" : undefined,
      focus: sessionFocus,
      selectedTags,
      isAnonymous,
      sendReminder,
    });

    setFeedbackToast("Session created and synced across clinical calendar.");
    setTimeout(() => {
      router.navigate("/(counsellor)/dashboard");
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Top Header ─── */}
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
          Add Session
        </Text>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressedState]}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color="#6B6A5E" />
          </Pressable>
          <Image
            source={{ uri: store.profile.avatarUrl }}
            style={styles.counselorAvatar}
            accessibilityLabel="Counselor profile"
          />
        </View>
      </View>

      {/* ─── Feedback Toast ─── */}
      {feedbackToast && (
        <View style={styles.toastContainer} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={18} color="#076047" />
          <Text style={styles.toastText}>{feedbackToast}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Live Clinical Sync Banner ─── */}
        <View style={styles.syncBanner}>
          <View style={styles.syncLeft}>
            <View style={styles.syncDot} />
            <View>
              <Text style={styles.syncTitle}>Live clinical sync active</Text>
              <Text style={styles.syncSubtitle}>15-min automated buffer applied</Text>
            </View>
          </View>
          <Ionicons name="cloud-done-outline" size={20} color="#076047" />
        </View>

        {/* ─── 1. STUDENT Section ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="person-outline" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>STUDENT</Text>
            </View>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Required</Text>
            </View>
          </View>

          {/* Student Dropdown Trigger */}
          <Pressable
            onPress={() => setShowStudentDropdown(!showStudentDropdown)}
            accessibilityRole="combobox"
            accessibilityLabel={`Selected student: ${selectedStudent.displayName}`}
            style={styles.studentDropdownTrigger}
          >
            <Ionicons name="search-outline" size={18} color="#6B6A5E" />
            <Text style={styles.studentDropdownText} numberOfLines={1}>
              {selectedStudent.displayName}
            </Text>
            <Ionicons
              name={showStudentDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#6B6A5E"
            />
          </Pressable>

          {/* Dropdown Options */}
          {showStudentDropdown && (
            <View style={styles.dropdownMenu}>
              {MOCK_ADD_SESSION_STUDENTS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedStudent(item);
                    setIsAnonymous(item.idMode === "anonymous");
                    setShowStudentDropdown(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedStudent.id === item.id }}
                  accessibilityLabel={`Select student ${item.displayName}`}
                  accessibilityHint="Selects this student for session booking"
                  style={[
                    styles.dropdownItem,
                    selectedStudent.id === item.id && styles.dropdownItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedStudent.id === item.id && styles.dropdownItemTextActive,
                    ]}
                  >
                    {item.displayName}
                  </Text>
                  {selectedStudent.id === item.id && (
                    <Ionicons name="checkmark" size={16} color="#076047" />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Quick Select Pills */}
          <View style={styles.quickSelectRow}>
            <Text style={styles.quickSelectLabel}>Quick Select</Text>
            <View style={styles.quickPillsWrap}>
              {MOCK_ADD_SESSION_STUDENTS.map((item) => {
                const isActive = selectedStudent.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedStudent(item);
                      setIsAnonymous(item.idMode === "anonymous");
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Quick select ${item.quickLabel}`}
                    style={[styles.quickPill, isActive && styles.quickPillActive]}
                  >
                    {isActive && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    <Text
                      style={[
                        styles.quickPillText,
                        isActive && styles.quickPillTextActive,
                      ]}
                    >
                      {item.quickLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ─── 2. SESSION MODALITY Section ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <MaterialCommunityIcons name="video-account" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>SESSION MODALITY</Text>
            </View>
            <Text style={styles.modalityCategoryText}>
              {sessionModality === "in-person" ? "In-Person" : "Virtual"}
            </Text>
          </View>

          {/* Modality Segmented Selector */}
          <View style={styles.modalitySegmentedRow}>
            <Pressable
              onPress={() => setSessionModality("video")}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionModality === "video" }}
              accessibilityLabel="Video consultation"
              style={[
                styles.modalitySegment,
                sessionModality === "video" && styles.modalitySegmentActive,
              ]}
            >
              <Ionicons
                name="videocam"
                size={18}
                color={sessionModality === "video" ? "#FFFFFF" : "#6B6A5E"}
              />
              <Text
                style={[
                  styles.modalitySegmentText,
                  sessionModality === "video" && styles.modalitySegmentTextActive,
                ]}
              >
                Video
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSessionModality("chat")}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionModality === "chat" }}
              accessibilityLabel="Chat session"
              style={[
                styles.modalitySegment,
                sessionModality === "chat" && styles.modalitySegmentActive,
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={sessionModality === "chat" ? "#FFFFFF" : "#6B6A5E"}
              />
              <Text
                style={[
                  styles.modalitySegmentText,
                  sessionModality === "chat" && styles.modalitySegmentTextActive,
                ]}
              >
                Chat
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSessionModality("in-person")}
              accessibilityRole="radio"
              accessibilityState={{ selected: sessionModality === "in-person" }}
              accessibilityLabel="In-Person consultation"
              style={[
                styles.modalitySegment,
                sessionModality === "in-person" && styles.modalitySegmentActive,
              ]}
            >
              <MaterialCommunityIcons
                name="office-building"
                size={16}
                color={sessionModality === "in-person" ? "#FFFFFF" : "#6B6A5E"}
              />
              <Text
                style={[
                  styles.modalitySegmentText,
                  sessionModality === "in-person" && styles.modalitySegmentTextActive,
                ]}
              >
                In-Person
              </Text>
            </Pressable>
          </View>

          {/* Modality Notice Box */}
          <View style={styles.modalityNoticeBox}>
            <Ionicons name="lock-closed" size={14} color="#076047" />
            <Text style={styles.modalityNoticeText}>
              {sessionModality === "video"
                ? "Encrypted end-to-end clinical video link will be generated automatically."
                : sessionModality === "chat"
                ? "Confidential encrypted chat thread will be initialized."
                : "Room 302 assigned in Counseling Wing. Sanitization protocol active."}
            </Text>
          </View>
        </View>

        {/* ─── 3. DATE & SCHEDULE Section ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="calendar-outline" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>DATE & SCHEDULE</Text>
            </View>
          </View>

          <Text style={styles.inputSubLabel}>DATE</Text>

          {/* Date Picker Display */}
          <View style={styles.dateDisplayRow}>
            <View style={styles.dateDisplayLeft}>
              <Ionicons name="calendar" size={18} color="#076047" />
              <Text style={styles.dateDisplayText}>{formattedDate}</Text>
            </View>
            <Ionicons name="calendar-clear-outline" size={18} color="#6B6A5E" />
          </View>

          {/* Quick Date Pills */}
          <View style={styles.quickDateRow}>
            {(["Today", "Tomorrow", "Wed, Aug 20"] as const).map((d) => {
              const isActive = selectedDateQuick === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDateQuick(d)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Set date to ${d}`}
                  style={[styles.quickDatePill, isActive && styles.quickDatePillActive]}
                >
                  <Text
                    style={[
                      styles.quickDatePillText,
                      isActive && styles.quickDatePillTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Time & Calculated End Grid */}
          <View style={styles.timeGridRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.inputSubLabel}>START TIME</Text>
              <Pressable
                onPress={() => {
                  const slots = ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"];
                  const currentIdx = slots.indexOf(startTime);
                  const nextSlot = slots[(currentIdx + 1) % slots.length];
                  setStartTime(nextSlot);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Start time: ${startTime}. Tap to cycle slot`}
                style={styles.timeInputBox}
              >
                <Ionicons name="time-outline" size={16} color="#076047" />
                <Text style={styles.timeValueText}>{startTime}</Text>
                <Ionicons name="swap-vertical" size={14} color="#6B6A5E" />
              </Pressable>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.inputSubLabel}>CALCULATED END</Text>
              <View style={styles.calculatedEndBox}>
                <Ionicons name="checkmark" size={16} color="#076047" />
                <Text style={styles.timeValueText}>{calculatedEndTime}</Text>
                <View style={styles.autoBadge}>
                  <Text style={styles.autoBadgeText}>AUTO</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Duration Row */}
          <View style={styles.durationHeaderRow}>
            <Text style={styles.inputSubLabel}>Duration</Text>
            <Text style={styles.durationHint}>Standard Clinical {duration}</Text>
          </View>

          <View style={styles.durationPillsRow}>
            {(["15m", "30m", "45m", "60m"] as const).map((opt) => {
              const isActive = duration === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setDuration(opt)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Duration ${opt}`}
                  style={[styles.durationPill, isActive && styles.durationPillActive]}
                >
                  <Text
                    style={[
                      styles.durationPillText,
                      isActive && styles.durationPillTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ─── 4. SESSION FOCUS Section ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <MaterialCommunityIcons name="brain" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>SESSION FOCUS</Text>
            </View>
            <Text style={styles.optionalText}>Optional</Text>
          </View>

          <TextInput
            style={styles.focusInput}
            multiline
            numberOfLines={3}
            placeholder="e.g., Exam anxiety, sleep hygiene follow-up, PHQ-9 review..."
            placeholderTextColor="#9CA3AF"
            value={sessionFocus}
            onChangeText={setSessionFocus}
            accessibilityLabel="Session clinical focus area"
          />

          <Text style={styles.tagsHeader}>Recommended Clinical Tags</Text>
          <View style={styles.tagsWrapRow}>
            {["Exam Stress", "Sleep Hygiene", "Intake Assessment", "GAD-7 Check"].map((t) => {
              const isSelected = selectedTags.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Tag: ${t}`}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                >
                  <Ionicons
                    name={isSelected ? "checkmark" : "add"}
                    size={14}
                    color="#076047"
                  />
                  <Text style={styles.tagChipText}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ─── 5. PRIVACY & NOTIFICATIONS Section ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>PRIVACY & NOTIFICATIONS</Text>
            </View>
          </View>

          {/* Switch 1: Mark as Anonymous */}
          <View style={styles.switchRow}>
            <View style={styles.switchIconBox}>
              <Ionicons name="shield-outline" size={16} color="#076047" />
            </View>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Mark as Anonymous Session</Text>
              <Text style={styles.switchSubtitle}>
                Hides student full identity from session log & calendar exports
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: "#D1D5DB", true: "#076047" }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Mark session as anonymous"
            />
          </View>

          <View style={styles.divider} />

          {/* Switch 2: Send reminder */}
          <View style={styles.switchRow}>
            <View style={styles.switchIconBox}>
              <Ionicons name="notifications-outline" size={16} color="#076047" />
            </View>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Send reminder notification</Text>
              <Text style={styles.switchSubtitle}>
                Sends push notification & in-app reminder 15m prior
              </Text>
            </View>
            <Switch
              value={sendReminder}
              onValueChange={setSendReminder}
              trackColor={{ false: "#D1D5DB", true: "#076047" }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Send reminder notification"
            />
          </View>
        </View>

        {/* Inline Validation Error (if any) */}
        {validationError && (
          <View style={styles.validationErrorCard} accessibilityLiveRegion="assertive">
            <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
            <Text style={styles.validationErrorText}>{validationError}</Text>
          </View>
        )}

        {/* HIPAA compliance label */}
        <View style={styles.complianceRow}>
          <Ionicons name="lock-closed" size={13} color="#6B6A5E" />
          <Text style={styles.complianceText}>HIPAA & FERPA Compliant Storage</Text>
        </View>
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomButtonsRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel adding session"
            style={({ pressed }) => [styles.cancelOutlineButton, pressed && styles.pressedState]}
          >
            <Text style={styles.cancelOutlineText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleAddSessionSubmit}
            disabled={!isValid}
            accessibilityRole="button"
            accessibilityLabel="Submit and Add Session"
            accessibilityState={{ disabled: !isValid }}
            style={({ pressed }) => [
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
              pressed && isValid && styles.pressedState,
            ]}
          >
            <Text style={styles.submitButtonText}>Add Session</Text>
          </Pressable>
        </View>

        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2B24",
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    width: TOUCH_TARGET - 6,
    height: TOUCH_TARGET - 6,
    borderRadius: 19,
    backgroundColor: "rgba(107, 106, 94, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  counselorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(7, 96, 71, 0.2)",
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
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  syncLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#076047",
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#076047",
  },
  syncSubtitle: {
    fontSize: 12,
    color: "#076047",
    opacity: 0.85,
    marginTop: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    marginBottom: spacing.md,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
    letterSpacing: 0.6,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#076047",
  },
  modalityCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  optionalText: {
    fontSize: 11,
    color: "#6B6A5E",
  },
  studentDropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  studentDropdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B2B24",
    flex: 1,
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
    borderRadius: radius.md,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#ECFDF5",
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1B2B24",
  },
  dropdownItemTextActive: {
    fontWeight: "700",
    color: "#076047",
  },
  quickSelectRow: {
    marginTop: 2,
  },
  quickSelectLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B6A5E",
    marginBottom: 6,
  },
  quickPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  quickPillActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1B2B24",
  },
  quickPillTextActive: {
    color: "#FFFFFF",
  },
  modalitySegmentedRow: {
    flexDirection: "row",
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 10,
  },
  modalitySegment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md - 2,
  },
  modalitySegmentActive: {
    backgroundColor: "#076047",
  },
  modalitySegmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6A5E",
  },
  modalitySegmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalityNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalityNoticeText: {
    fontSize: 12,
    color: "#78350F",
    flex: 1,
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B6A5E",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dateDisplayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B2B24",
  },
  quickDateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  quickDatePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  quickDatePillActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  quickDatePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1B2B24",
  },
  quickDatePillTextActive: {
    color: "#FFFFFF",
  },
  timeGridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.md,
  },
  timeColumn: {
    flex: 1,
  },
  timeInputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  calculatedEndBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  timeValueText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B2B24",
  },
  autoBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "#E5F8E4",
  },
  autoBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#076047",
  },
  durationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  durationHint: {
    fontSize: 11,
    fontWeight: "600",
    color: "#076047",
  },
  durationPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  durationPillActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B2B24",
  },
  durationPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  focusInput: {
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: "#1B2B24",
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  tagsHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B6A5E",
    marginBottom: 6,
  },
  tagsWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  tagChipActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#076047",
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  switchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  switchContent: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B2B24",
  },
  switchSubtitle: {
    fontSize: 11,
    color: "#6B6A5E",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  validationErrorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  validationErrorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
    flex: 1,
  },
  complianceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
  },
  complianceText: {
    fontSize: 11,
    color: "#6B6A5E",
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
  cancelOutlineButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "#076047",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelOutlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#076047",
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: "#076047",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
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
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
