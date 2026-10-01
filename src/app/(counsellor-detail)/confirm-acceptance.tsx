// Counsellor Confirm Acceptance Popup - Muaath (Member 4). Supports FR01, FR08.
// Accessible modal dialog summarizing anonymous session details before committing acceptance.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function ConfirmAcceptanceModal() {
  const params = useLocalSearchParams<{ requestId?: string; studentAnonId?: string }>();
  const { confirmAcceptance, requests } = useCounsellorStore();

  const targetReq =
    requests.find((r) => r.id === params.requestId || r.studentAnonId === params.studentAnonId) ||
    requests[0];

  const studentAnonId = targetReq?.studentAnonId || "Student #5104";
  const requestedDate = "Tomorrow, Tue 19 Aug • 10:00–10:45 AM";
  const sessionFormat = "Video Consultation (45 min)";

  const [note, setNote] = useState("");

  const handleConfirm = () => {
    confirmAcceptance(targetReq?.id || "req-1", note.trim());
    router.replace("/(counsellor-detail)/request-accepted");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.scrimBackdrop}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollWrapper}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalCard} accessibilityRole="alert" accessibilityViewIsModal={true}>
            {/* ─── Header ─── */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.preHeaderLabel}>MINDEASE • SESSION DISPATCH</Text>
                <Text style={styles.modalTitle}>Confirm{"\n"}Acceptance</Text>
              </View>

              <Pressable
                onPress={handleCancel}
                style={styles.closeCircleButton}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            {/* ─── Student Summary Card ─── */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <Text style={styles.studentIdTitle}>{studentAnonId}</Text>
                <View style={styles.anonymousBadge}>
                  <Ionicons name="eye-off-outline" size={13} color="#475569" />
                  <Text style={styles.anonymousBadgeText}>[ANONYMOUS MODE]</Text>
                </View>
              </View>

              <View style={styles.summaryDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text style={styles.detailText}>{requestedDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="videocam-outline" size={16} color="#64748B" />
                  <Text style={styles.detailText}>{sessionFormat}</Text>
                </View>
              </View>
            </View>

            {/* ─── Reassurance Sync Row ─── */}
            <View style={styles.syncRow}>
              <Ionicons name="sync-outline" size={14} color="#64748B" />
              <Text style={styles.syncText}>This will sync to your calendar automatically.</Text>
            </View>

            {/* ─── Counselor Note Input ─── */}
            <View style={styles.noteContainer}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteLabel}>Counselor note (optional)</Text>
                <Text style={styles.noteCounter}>{note.length}/140</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a short note for the student..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                maxLength={140}
                value={note}
                onChangeText={setNote}
                accessibilityLabel="Optional counselor note"
              />
            </View>

            {/* ─── Encryption Security Banner ─── */}
            <View style={styles.securityBanner}>
              <View style={styles.lockBox}>
                <Ionicons name="lock-closed" size={15} color="#064E3B" />
              </View>
              <Text style={styles.securityText}>
                End-to-end encrypted session link generated upon student notification.
              </Text>
            </View>

            {/* ─── Actions ─── */}
            <View style={styles.actionsContainer}>
              <Pressable
                onPress={handleConfirm}
                style={styles.confirmButton}
                accessibilityRole="button"
                accessibilityLabel="Confirm & Accept Request"
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#A7F3D0" />
                <Text style={styles.confirmButtonText}>Confirm & Accept</Text>
              </Pressable>

              <Pressable
                onPress={handleCancel}
                style={styles.cancelLink}
                accessibilityRole="button"
                accessibilityLabel="Cancel and return to queue"
              >
                <Text style={styles.cancelLinkText}>Cancel and return to queue</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrimBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    padding: 22,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  preHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#064E3B",
    opacity: 0.8,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 28,
  },
  closeCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  summaryCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginBottom: 10,
  },
  studentIdTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  anonymousBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  anonymousBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 0.4,
  },
  summaryDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  syncText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  noteContainer: {
    marginBottom: 14,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  noteCounter: {
    fontSize: 11,
    color: "#94A3B8",
  },
  noteInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 64,
    textAlignVertical: "top",
  },
  securityBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  lockBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: "#064E3B",
    lineHeight: 16,
    fontWeight: "500",
  },
  actionsContainer: {
    gap: 8,
    alignItems: "center",
  },
  confirmButton: {
    width: "100%",
    backgroundColor: "#065F46",
    minHeight: TOUCH_TARGET,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
  cancelLink: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
});
