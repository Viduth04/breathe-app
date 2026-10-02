// Counsellor Request Accepted Screen - Muaath (Member 4). Supports FR01, FR08.
// Success state screen showing confirmed booking summary, E2EE status, and next clinical steps.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function RequestAcceptedScreen() {
  const { lastAcceptedSession } = useCounsellorStore();
  const [prepModalVisible, setPrepModalVisible] = useState(false);
  const [prepNote, setPrepNote] = useState("");
  const [prepSavedToast, setPrepSavedToast] = useState(false);

  const studentAnonId = lastAcceptedSession?.studentAnonId || "Student #5104";
  const dateText = lastAcceptedSession?.date
    ? `${lastAcceptedSession.date} • ${lastAcceptedSession.timeRange}`
    : "Tomorrow, Tue 19 Aug • 10:00–10:45 AM";

  const handleMessageStudent = () => {
    router.navigate({
      pathname: "/(counsellor-detail)/pre-chat-empty-state",
      params: { studentAnonId, fromAcceptance: "true" },
    });
  };

  const handleViewInCalendar = () => {
    router.navigate({
      pathname: "/(counsellor-detail)/my-calendar",
      params: { highlightId: "brth-5104-sec" },
    });
  };

  const handleBackToDashboard = () => {
    router.navigate("/(counsellor)/dashboard");
  };

  const handleSavePrepNote = () => {
    setPrepModalVisible(false);
    setPrepSavedToast(true);
    setTimeout(() => setPrepSavedToast(false), 3000);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        {/* ─── Top Bar ─── */}
        <View style={styles.topBar}>
          <View style={styles.portalPill}>
            <Ionicons name="shield-checkmark" size={14} color="#065F46" />
            <Text style={styles.portalPillText}>
              BREATHE <Text style={styles.portalDot}>•</Text> CLINICAL PORTAL
            </Text>
          </View>

          <Pressable
            onPress={handleBackToDashboard}
            style={styles.closeTouchTarget}
            accessibilityRole="button"
            accessibilityLabel="Close confirmation"
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color="#5F7067" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Toast feedback */}
          {prepSavedToast && (
            <View style={styles.toastBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#065F46" />
              <Text style={styles.toastText}>Prep note saved securely to student record.</Text>
            </View>
          )}

          {/* ─── Hero Success Area ─── */}
          <View style={styles.heroSection}>
            <View style={styles.heroOuterGlow}>
              <View style={styles.heroInnerGlow}>
                <View style={styles.heroIconBox}>
                  <Ionicons name="checkmark" size={32} color={colors.white} />
                </View>
              </View>
            </View>

            <Text style={styles.heroTitle}>Request Accepted</Text>
            <Text style={styles.heroSubtitle}>
              The session has been added to your schedule and synced to your calendar.
            </Text>
          </View>

          {/* ─── Session Summary Card ─── */}
          <View style={styles.summaryCard}>
            {/* Header row: Student Identifier + Anonymous Badge */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.studentIdentRow}>
                <View style={styles.studentAvatarCircle}>
                  <Ionicons name="person" size={16} color="#065F46" />
                </View>
                <Text style={styles.studentIdentText}>{studentAnonId}</Text>
              </View>

              <View style={styles.anonBadgePill}>
                <Ionicons name="eye-off-outline" size={12} color="#64748B" />
                <Text style={styles.anonBadgePillText}>Anonymous Mode</Text>
              </View>
            </View>

            {/* Session Detail Items */}
            <View style={styles.detailsList}>
              {/* Item 1: Date & Time */}
              <View style={styles.detailItemRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="calendar-outline" size={18} color="#065F46" />
                </View>
                <View style={styles.detailTextCol}>
                  <Text style={styles.detailCaption}>DATE & TIME</Text>
                  <Text style={styles.detailPrimaryVal}>{dateText}</Text>
                </View>
              </View>

              {/* Item 2: Modality & E2EE */}
              <View style={styles.detailItemRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="videocam-outline" size={18} color="#065F46" />
                </View>
                <View style={styles.detailTextCol}>
                  <View style={styles.modalityTitleRow}>
                    <Text style={styles.detailPrimaryVal}>Encrypted Video Call (45m)</Text>
                    <View style={styles.e2eeBadge}>
                      <Ionicons name="lock-closed" size={9} color="#4B5563" />
                      <Text style={styles.e2eeBadgeText}>E2EE</Text>
                    </View>
                  </View>
                  <Text style={styles.detailSubtext}>Direct room link activates 5m prior</Text>
                </View>
              </View>
            </View>

            {/* Footer Verification: Calendar Sync */}
            <View style={styles.syncFooterRow}>
              <Ionicons name="checkmark-circle" size={16} color="#065F46" />
              <Text style={styles.syncFooterText}>Synced to Apple/Google Calendar</Text>
            </View>
          </View>

          {/* ─── Next Steps Section ─── */}
          <View style={styles.nextStepsSection}>
            <Text style={styles.nextStepsHeading}>NEXT STEPS</Text>

            {/* Action Card 1: Message Student Securely */}
            <Pressable
              onPress={handleMessageStudent}
              style={styles.actionCard}
              accessibilityRole="button"
              accessibilityLabel="Message Student Securely"
            >
              <View style={styles.actionCardLeft}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#065F46" />
                </View>
                <View style={styles.actionCardMeta}>
                  <Text style={styles.actionCardTitle}>Message Student Securely</Text>
                  <Text style={styles.actionCardSub}>Send a check-in or pre-session instructions</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Action Card 2: Add Prep Notes */}
            <Pressable
              onPress={() => setPrepModalVisible(true)}
              style={styles.actionCard}
              accessibilityRole="button"
              accessibilityLabel="Add Prep Notes"
            >
              <View style={styles.actionCardLeft}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="create-outline" size={20} color="#065F46" />
                </View>
                <View style={styles.actionCardMeta}>
                  <Text style={styles.actionCardTitle}>Add Prep Notes</Text>
                  <Text style={styles.actionCardSub}>Private clinical notes visible only to you</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          </View>
        </ScrollView>

        {/* ─── Bottom Action Area ─── */}
        <View style={styles.bottomArea}>
          <Pressable
            onPress={handleBackToDashboard}
            style={styles.primaryDashboardBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
          >
            <Text style={styles.primaryDashboardBtnText}>Back to Dashboard</Text>
          </Pressable>

          <Pressable
            onPress={handleViewInCalendar}
            style={styles.secondaryLinkBtn}
            accessibilityRole="button"
            accessibilityLabel="View in My Calendar"
          >
            <Text style={styles.secondaryLinkBtnText}>View in My Calendar</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── Prep Notes Modal ─── */}
      <Modal
        visible={prepModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrepModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Private Prep Notes</Text>
            <Text style={styles.modalDesc}>
              These notes are encrypted and only accessible by you during clinical review for {studentAnonId}.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Focus on grounding techniques, review PHQ-9 screener..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={prepNote}
              onChangeText={setPrepNote}
            />
            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setPrepModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSavePrepNote}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveBtnText}>Save Notes</Text>
              </Pressable>
            </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  portalPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF3EF",
    borderWidth: 1,
    borderColor: "#D5E3DB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  portalPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#065F46",
    letterSpacing: 0.5,
  },
  portalDot: {
    color: "#8AA395",
  },
  closeTouchTarget: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  toastText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
  },
  heroSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  heroOuterGlow: {
    padding: 8,
    borderRadius: 36,
    backgroundColor: "rgba(236, 253, 245, 0.7)",
  },
  heroInnerGlow: {
    padding: 6,
    borderRadius: 30,
    backgroundColor: "rgba(167, 243, 208, 0.35)",
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#1A2421",
    letterSpacing: -0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#5F7067",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 290,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2EBE5",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F2",
  },
  studentIdentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  studentIdentText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2421",
  },
  anonBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2F6",
    borderWidth: 1,
    borderColor: "#DCE4EC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  anonBadgePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  detailsList: {
    paddingVertical: 14,
    gap: 14,
  },
  detailItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#F4F7F5",
    borderWidth: 1,
    borderColor: "#E3EBE6",
    justifyContent: "center",
    alignItems: "center",
  },
  detailTextCol: {
    flex: 1,
  },
  detailCaption: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#5F7067",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  detailPrimaryVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2421",
    marginTop: 2,
  },
  modalityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  e2eeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    borderWidth: 1,
    borderColor: "#E2E6EC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  e2eeBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#4B5563",
    letterSpacing: 0.4,
  },
  detailSubtext: {
    fontSize: 12,
    color: "#5F7067",
    marginTop: 2,
  },
  syncFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F4F2",
    gap: 6,
  },
  syncFooterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A2421",
  },
  nextStepsSection: {
    gap: 10,
    marginBottom: 10,
  },
  nextStepsHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#5F7067",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2EBE5",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F2FAF6",
    borderWidth: 1,
    borderColor: "#D5EFE3",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardMeta: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2421",
  },
  actionCardSub: {
    fontSize: 11.5,
    color: "#5F7067",
    marginTop: 2,
  },
  bottomArea: {
    paddingVertical: 12,
    alignItems: "center",
    gap: 10,
  },
  primaryDashboardBtn: {
    width: "100%",
    backgroundColor: "#065F46",
    minHeight: TOUCH_TARGET,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryDashboardBtnText: {
    color: colors.white,
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  secondaryLinkBtn: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  secondaryLinkBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1A2421",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A2421",
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12.5,
    color: "#5F7067",
    lineHeight: 18,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  modalSaveBtn: {
    backgroundColor: "#065F46",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveBtnText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "700",
  },
});
