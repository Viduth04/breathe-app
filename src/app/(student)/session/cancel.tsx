import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { cancelBooking, getBooking } from "@/services/bookingService";
import { Booking } from "@/types/booking";
import { db } from "@/firebase/config";
import { listCounsellors } from "@/services/adminService";
import { doc, getDoc } from "firebase/firestore";
import { ActivityIndicator } from "react-native";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";
import CounsellorAvatar from "@/components/common/CounsellorAvatar";

export default function CancelBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedReason, setSelectedReason] = useState("conflict");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<"confirm" | "success">("confirm");
    const [cancelLoading, setCancelLoading] = useState(false);
  const [session, setSession] = useState<Booking | null>(null);
  const [counsellorName, setCounsellorName] = useState("Counselor");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getBooking(id).then(async (data) => {
        setSession(data);
        if (data?.counsellorId) {
          try {
            const counsellorsList = await listCounsellors();
            const found = counsellorsList.find(c => c.uid === data.counsellorId);
            if (found) {
              setCounsellorName(found.fullName);
            }
          } catch(err) {
            console.error("Error fetching counsellors", err);
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleCancel = async () => {
    if (!id || !session) return;
    setCancelLoading(true);
    try {
      const reasonLabel = reasons.find(r => r.id === selectedReason)?.label || selectedReason;
      const finalReason = [reasonLabel, additionalNotes.trim()].filter(Boolean).join(" - ");
      await cancelBooking(session, finalReason);
      setModalStep("success");
    } catch(e) {
      console.error(e);
      alert(e instanceof Error ? `Failed to cancel session: ${e.message}` : "Failed to cancel session. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };


  const reasons = [
    { id: "conflict", label: "Schedule conflict / Class clash" },
    { id: "better", label: "Feeling better / No longer needed" },
    { id: "different_counselor", label: "Want to book with a different counselor" },
    { id: "technical", label: "Technical / Internet issues" },
    { id: "other", label: "Other reason" },
  ];

  if (loading) { return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop: 40}} /></SafeAreaView>; }
  
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Cancel Booking Confirmation</Text>
        <View style={styles.headerRightIcon}>
          <Ionicons name="person-outline" size={20} color="#FFF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Session Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsLabel}>SESSION DETAILS</Text>
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.sessionInfoRow}>
            <View style={{ marginRight: 12 }}>
                <CounsellorAvatar uid={session?.counsellorId || ""} name={counsellorName !== "Counselor" ? counsellorName : "Counselor"} size={54} />
              </View>
            <View style={styles.sessionInfoRight}>
              <Text style={styles.counselorName}>Counselor: {counsellorName}</Text>
                
                <View style={styles.infoLine}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {session?.startAt && typeof session.startAt.toDate === 'function' 
                      ? session.startAt.toDate().toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + session.startAt.toDate().toLocaleTimeString('en-LK', { hour: "2-digit", minute: "2-digit" })
                      : 'Date TBD'
                    }
                  </Text>
                </View>
                
                <View style={styles.infoLine}>
                  <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {session?.sessionType === 'video' ? 'Video Call' : session?.sessionType === 'chat' ? 'Chat Session' : 'Phone Call'} (Anonymous)
                  </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Cancellation Reason */}
        <View style={styles.reasonSection}>
          <Text style={styles.reasonTitle}>
            Why do you need to cancel? <Text style={styles.reasonOptional}>(Optional)</Text>
          </Text>
          <Text style={styles.reasonSub}>
            Help us understand how to improve your support experience.
          </Text>

          <View style={styles.radioList}>
            {reasons.map((reason) => {
              const isActive = selectedReason === reason.id;
              return (
                <Pressable
                  key={reason.id}
                  style={[styles.radioItem, isActive && styles.radioItemActive]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.radioLabel, isActive && styles.radioLabelActive]}>
                    {reason.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.additionalSection}>
          <Text style={styles.additionalLabel}>ADDITIONAL DETAILS</Text>
          <TextInput
            style={styles.textInput}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Add additional notes (optional)..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionArea}>
          <Pressable style={styles.confirmCancelBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="close-circle-outline" size={18} color="#FFF" />
            <Text style={styles.confirmCancelText}>Confirm Cancellation</Text>
          </Pressable>
          
          <Pressable style={styles.keepApptBtn} onPress={() => router.back()}>
            <Text style={styles.keepApptText}>Keep Appointment</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setModalStep("confirm");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {modalStep === "confirm" ? (
              <>
                <View style={styles.modalIconContainer}>
                  <View style={styles.modalIconBox}>
                    <Ionicons name="calendar-outline" size={26} color={colors.primary} />
                  </View>
                  <View style={styles.modalAlertBadge}>
                    <Text style={styles.modalAlertText}>!</Text>
                  </View>
                </View>
                
                <Text style={styles.modalTitle}>Cancel This Appointment?</Text>
                <Text style={styles.modalSub}>
                  {session?.startAt && typeof session.startAt.toDate === 'function' ? `Are you sure you want to cancel your session with ${counsellorName} on ${session.startAt.toDate().toLocaleDateString('en-LK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at ${session.startAt.toDate().toLocaleTimeString('en-LK', { hour: "2-digit", minute: "2-digit" })}?` : `Are you sure you want to cancel your session with ${counsellorName}?`}
                </Text>

                <Pressable 
                  style={styles.modalConfirmBtn} 
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={18} color="#FFF" />
                  <Text style={styles.modalConfirmText}>Yes, Cancel Booking</Text>
                </Pressable>

                <Pressable 
                  style={styles.modalKeepBtn} 
                  onPress={() => {
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalKeepText}>Keep My Appointment</Text>
                </Pressable>

                
              </>
            ) : (
              <>
                <View style={styles.modalIconBoxSuccess}>
                  <Ionicons name="checkmark" size={32} color="#FFF" />
                </View>
                
                <Text style={styles.modalTitle}>Cancellation Confirmed</Text>
                <Text style={styles.modalSub}>
                  Your appointment has been cancelled. A confirmation email has been sent to your inbox.
                </Text>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Session Type</Text>
                    <View style={styles.modalDetailIconRow}>
                      <Ionicons name={session?.sessionType === 'chat' ? 'chatbubble-outline' : session?.sessionType === 'phone' ? 'call-outline' : 'videocam-outline'} size={16} color={colors.primary} />
                        <Text style={styles.modalDetailValueDark}>{session?.sessionType === 'video' ? 'Video Call' : session?.sessionType === 'chat' ? 'Chat Session' : 'Phone Call'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Status</Text>
                    <View style={styles.modalStatusPill}>
                      <View style={styles.modalDetailDotGray} />
                      <Text style={styles.modalStatusText}>Cancelled</Text>
                    </View>
                  </View>
                </View>

                <Pressable 
                  style={styles.modalPrimaryBtn} 
                  onPress={() => {
                    setModalVisible(false);
                    setModalStep("confirm");
                    router.replace("/(student)/session/dashboard");
                  }}
                >
                  <Text style={styles.modalPrimaryText}>Back to My Sessions</Text>
                </Pressable>

                <View style={styles.modalFooterRow}>
                  <Ionicons name="leaf-outline" size={14} color={colors.primary} />
                  <Text style={styles.modalFooterSupportText}>
                    Take your time. We're always here for you.
                  </Text>
                </View>
              </>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    // Keeps the right-hand icon clear of the floating crisis help button
    paddingRight: FLOATING_HELP_CLEARANCE,
    paddingVertical: spacing.sm,
    backgroundColor: "#FDFBF7",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  headerRightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  policyNotice: {
    flexDirection: "row",
    backgroundColor: "#E5F8E4",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  policyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#CBEFCD",
    alignItems: "center",
    justifyContent: "center",
  },
  policyTextContainer: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  policySub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  detailsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "#FFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  confirmedBadge: {
    backgroundColor: "#A3D9B1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  sessionInfoRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  videoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfoRight: {
    flex: 1,
    gap: 4,
  },
  counselorName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rescheduleCard: {
    backgroundColor: "#F3F0E6",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  rescheduleHeader: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  rescheduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  rescheduleTextContainer: {
    flex: 1,
  },
  rescheduleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  rescheduleSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rescheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 8,
  },
  rescheduleBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  reasonSection: {
    marginBottom: spacing.lg,
  },
  reasonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  reasonOptional: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  reasonSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  radioList: {
    gap: spacing.sm,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: spacing.sm,
  },
  radioItemActive: {
    backgroundColor: "#E5F8E4",
    borderColor: "#E5F8E4",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E1D8", // beige
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.text,
  },
  radioLabelActive: {
    color: colors.primary,
    fontWeight: "500",
  },
  additionalSection: {
    marginBottom: spacing.xl,
  },
  additionalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: radius.md,
    padding: spacing.md,
    height: 100,
    fontSize: 14,
    color: colors.text,
  },
  actionArea: {
    gap: spacing.sm,
  },
  confirmCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3E3A33", // Dark brownish gray from mockup
    paddingVertical: 16,
    borderRadius: radius.full,
    gap: 8,
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  keepApptBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 16,
    borderRadius: radius.full,
  },
  keepApptText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalIconContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalAlertBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modalAlertText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.danger,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  modalSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  modalConfirmBtn: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  modalKeepBtn: {
    width: "100%",
    backgroundColor: "#F3F0E6",
    paddingVertical: 16,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  modalKeepText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  modalFooterText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  modalIconBoxSuccess: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalDetailsBox: {
    width: "100%",
    backgroundColor: "#F3F0E6",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    gap: 12,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalDetailLabelUpperCase: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  modalDetailValueDark: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  modalDetailIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAE6DF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  modalDetailDotGray: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  modalPrimaryBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  modalSecondaryBtn: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.xl,
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  modalFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalFooterSupportText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
