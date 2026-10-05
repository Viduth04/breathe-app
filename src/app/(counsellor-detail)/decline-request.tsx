// Counsellor Decline Request - Muaath (Member 4). Supports FR01, FR03, NFR01.
// Triage decline sheet with reason chips, supportive note, and student reassurance.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";

const REASON_OPTIONS = [
  "Schedule conflict",
  "Fully booked this week",
  "Outside my specialty",
  "Other",
];

export default function DeclineRequestScreen() {
  const params = useLocalSearchParams<{
    requestId?: string;
    studentAnonId?: string;
    proposedDate?: string;
    proposedTime?: string;
    sessionTypeLabel?: string;
  }>();

  const { declineRequest, requests } = useCounsellorStore();

  const targetRequest =
    requests.find((r) => r.id === params.requestId) || requests[0];

  const studentAnonId =
    params.studentAnonId || targetRequest?.studentAnonId || "Student #5104";
  const dateFormatted =
    params.proposedDate || "Tomorrow, Tue 19 Aug";
  const timeFormatted =
    params.proposedTime || targetRequest?.requestedTime || "10:00–10:45 AM";
  const sessionModality =
    params.sessionTypeLabel ||
    (targetRequest?.sessionType === "chat"
      ? "Secured Chat Session"
      : "Video Consultation (45 min)");

  const [selectedReason, setSelectedReason] = useState<string>("Schedule conflict");
  const [supportiveNote, setSupportiveNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmDecline = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    declineRequest(
      targetRequest?.id || params.requestId || "req-1",
      selectedReason,
      supportiveNote.trim() || undefined
    );

    router.replace({
      pathname: "/(counsellor-detail)/request-declined",
      params: {
        studentAnonId,
        dateFormatted,
        timeFormatted,
        sessionModality,
        reason: selectedReason,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* ─── Top Header ─── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerIconButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerDispatchTag}>
              BREATHE • SESSION DISPATCH
            </Text>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Decline Request
            </Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            style={styles.headerIconButton}
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Student Profile Summary Card ─── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.studentIdGroup}>
                <Ionicons name="person-circle-outline" size={22} color="#059669" />
                <Text style={styles.studentIdText}>{studentAnonId}</Text>
              </View>
              <View style={styles.anonPill}>
                <Text style={styles.anonPillText}>Anonymous Mode</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={15} color="#64748B" />
              <Text style={styles.metaText}>
                {dateFormatted} • {timeFormatted}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="videocam-outline" size={15} color="#64748B" />
              <Text style={styles.metaText}>{sessionModality}</Text>
            </View>
          </View>

          {/* ─── Reason Chips ─── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>REASON</Text>
            <View style={styles.chipsContainer}>
              {REASON_OPTIONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : styles.chipUnselected,
                    ]}
                    onPress={() => setSelectedReason(reason)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Decline reason: ${reason}`}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={colors.white}
                        style={{ marginRight: 5 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ─── Supportive Note ─── */}
          <View style={styles.sectionBlock}>
            <View style={styles.noteHeaderRow}>
              <Text style={styles.noteLabel}>Supportive Note</Text>
              <Text style={styles.charCountText}>
                {supportiveNote.length}/200
              </Text>
            </View>

            <View style={styles.textAreaBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Add a short, supportive note (optional)..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={200}
                value={supportiveNote}
                onChangeText={setSupportiveNote}
                textAlignVertical="top"
              />
              <View style={styles.resizeGrip}>
                <Ionicons name="reorder-two-outline" size={14} color="#CBD5E1" />
              </View>
            </View>
          </View>

          {/* ─── Reassurance Notice ─── */}
          <View style={styles.reassuranceCard}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#059669"
              style={{ marginTop: 1 }}
            />
            <Text style={styles.reassuranceText}>
              The student will be notified promptly and guided to re-request with
              another counselor or choose a new time.
            </Text>
          </View>

          {/* Spacer */}
          <View style={{ height: spacing.lg }} />

          {/* ─── Bottom Action Buttons ─── */}
          <Pressable
            style={[styles.confirmDeclineBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleConfirmDecline}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Confirm Decline"
          >
            <Text style={styles.confirmDeclineBtnText}>Confirm Decline</Text>
          </Pressable>

          <Pressable
            style={styles.cancelLinkBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel and keep in queue"
          >
            <Text style={styles.cancelLinkText}>Cancel and keep in queue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(6, 78, 59, 0.06)",
  },
  headerIconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
  },
  headerDispatchTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#065F46",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: spacing.md,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  studentIdGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  anonPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  anonPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#64748B",
    marginBottom: spacing.sm,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
  },
  chipSelected: {
    backgroundColor: "#064E3B",
  },
  chipUnselected: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: colors.white,
  },
  chipTextUnselected: {
    color: "#1F2937",
  },
  noteHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  charCountText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  textAreaBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: spacing.sm + 4,
    minHeight: 110,
    position: "relative",
  },
  textInput: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
    padding: 0,
    flex: 1,
  },
  resizeGrip: {
    position: "absolute",
    bottom: 6,
    right: 8,
  },
  reassuranceCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  reassuranceText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#065F46",
    fontWeight: "500",
  },
  confirmDeclineBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    borderRadius: 999,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  confirmDeclineBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
  },
  cancelLinkBtn: {
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
});
