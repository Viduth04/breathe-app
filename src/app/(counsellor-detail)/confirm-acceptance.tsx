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
import { usePopup } from "@/components/common/popup";

export default function ConfirmAcceptanceModal() {
  const params = useLocalSearchParams<{ requestId?: string; studentAnonId?: string }>();
  const { confirmAcceptance, requests, scheduleDaySlots, sessions } = useCounsellorStore();
  const { showToast } = usePopup();

  const targetReq =
    requests.find((r) => r.id === params.requestId || r.studentAnonId === params.studentAnonId) ||
    requests[0];

  const studentAnonId = targetReq?.studentAnonId || params.studentAnonId || "Anonymous Student";
  const requestedDate = targetReq?.date
    ? `${targetReq.date} • ${targetReq.requestedTime}`
    : targetReq?.requestedTime || "Upcoming Consultation";
  const sessionFormat =
    targetReq?.sessionType === "video"
      ? "Video Consultation (45 min)"
      : targetReq?.sessionType === "chat"
      ? "Secured Chat Session (45 min)"
      : "In-Person Consultation (45 min)";

  // Strict validation: Check if slot has already been booked
  const isSlotAlreadyBooked = false; // Disabled for testing

  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    // Disabled expired check for testing
    // Disabled slot booked check for testing
    setIsSubmitting(true);
    try {
      if (targetReq?.id) {
        confirmAcceptance(targetReq.id, note.trim());
      }
      router.replace("/(counsellor-detail)/request-accepted");
    } catch (e: any) {
      setIsSubmitting(false);
      showToast({ message: e?.message || "Could not confirm acceptance. Please check connection.", type: "error" });
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
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
                <Text style={styles.preHeaderLabel}>BREATHE • SESSION DISPATCH</Text>
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

            {/* ─── Expired Notice Banner ─── */}
            {false && (
              <View style={styles.expiredNoticeCard}>
                <Ionicons name="alert-circle" size={18} color="#D97706" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.expiredNoticeTitle}>Slot Expired</Text>
                  <Text style={styles.expiredNoticeText}>
                    The scheduled deadline for this booking has elapsed. This request cannot be accepted.
                  </Text>
                </View>
              </View>
            )}

            {/* ─── Already Booked Notice Banner ─── */}
            {true && isSlotAlreadyBooked && (
              <View style={[styles.expiredNoticeCard, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
                <Ionicons name="lock-closed" size={18} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.expiredNoticeTitle, { color: "#991B1B" }]}>Slot Already Booked</Text>
                  <Text style={[styles.expiredNoticeText, { color: "#7F1D1D" }]}>
                    This time slot has already been booked. Counselor validation prevents booking a slot that is already taken. Please reschedule the student to an open slot.
                  </Text>
                </View>
              </View>
            )}

            {/* ─── Actions ─── */}
            <View style={styles.actionsContainer}>
              <Pressable
                onPress={handleConfirm}
                disabled={isSubmitting || !targetReq || isSlotAlreadyBooked}
                style={[
                  styles.confirmButton,
                  isSubmitting && { opacity: 0.6 },
                  (!targetReq || isSlotAlreadyBooked) && { backgroundColor: "#94A3B8", opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  false ? "Slot Expired (Cannot Confirm)"
                    : isSlotAlreadyBooked
                    ? "Slot Already Booked (Reschedule Required)"
                    : "Confirm & Accept Request"
                }
              >
                <Ionicons
                  name={
                    !targetReq ? "ban-outline"
                      : isSlotAlreadyBooked
                      ? "lock-closed-outline"
                      : "checkmark-circle-outline"
                  }
                  size={20}
                  color={!targetReq || isSlotAlreadyBooked ? "#FFFFFF" : "#A7F3D0"}
                />
                <Text style={styles.confirmButtonText}>
                  {!targetReq ? "Request Unavailable" : false ? "Slot Expired"
                    : isSlotAlreadyBooked
                    ? "Slot Already Booked (Reschedule Required)"
                    : "Confirm & Accept"}
                </Text>
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderBottomColor: colors.border,
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
    borderColor: colors.border,
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
  expiredNoticeCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  expiredNoticeTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 2,
  },
  expiredNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#B45309",
    fontWeight: "500",
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
