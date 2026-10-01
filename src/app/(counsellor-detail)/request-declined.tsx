// Counsellor Request Declined Confirmation - Muaath (Member 4). Supports FR01, FR03.
// Confirmation receipt screen displaying declined status, student metadata, and queue routing.

import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function RequestDeclinedScreen() {
  const params = useLocalSearchParams<{
    studentAnonId?: string;
    dateFormatted?: string;
    timeFormatted?: string;
    sessionModality?: string;
    reason?: string;
  }>();

  const { lastDeclinedSession } = useCounsellorStore();

  const studentAnonId =
    params.studentAnonId ||
    lastDeclinedSession?.studentAnonId ||
    "Student #5104";
  const dateFormatted =
    params.dateFormatted ||
    lastDeclinedSession?.date ||
    "Tomorrow, Tue 19 Aug";
  const timeFormatted =
    params.timeFormatted ||
    lastDeclinedSession?.timeRange ||
    "10:00–10:45 AM";
  const sessionModality =
    params.sessionModality ||
    lastDeclinedSession?.modality ||
    "Video Consultation (45 min)";
  const declineReason =
    params.reason || lastDeclinedSession?.reason || "Schedule conflict";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Space */}
        <View style={{ height: spacing.xl }} />

        {/* ─── Top Emblem ─── */}
        <View style={styles.emblemContainer}>
          <View style={styles.emblemCard}>
            <View style={styles.minusIcon} />
          </View>
        </View>

        {/* ─── Header Text ─── */}
        <Text style={styles.title} accessibilityRole="header">
          Request Declined
        </Text>
        <Text style={styles.subtitle}>
          The student has been notified and can{"\n"}request another time.
        </Text>

        {/* ─── Summary Card ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.studentIdText}>{studentAnonId}</Text>
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

          {/* Divider */}
          <View style={styles.divider} />

          {/* Decline Reason Row */}
          <View style={styles.reasonRow}>
            <Text style={styles.reasonLabel}>Decline reason:</Text>
            <View style={styles.reasonPill}>
              <Text style={styles.reasonValue}>{declineReason}</Text>
            </View>
          </View>
        </View>

        {/* ─── View Triage Queue Card ─── */}
        <Pressable
          style={styles.triageQueueCard}
          onPress={() => router.navigate("/(counsellor)/dashboard")}
          accessibilityRole="button"
          accessibilityLabel="View Triage Queue"
        >
          <View style={styles.triageLeft}>
            <Ionicons name="list" size={18} color="#1F2937" />
            <Text style={styles.triageText}>View Triage Queue</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 40 }} />

        {/* ─── Bottom Actions ─── */}
        <Pressable
          style={styles.dashboardBtn}
          onPress={() => router.navigate("/(counsellor)/dashboard")}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
        >
          <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
        </Pressable>

        <Pressable
          style={styles.manageAvailabilityLink}
          onPress={() => router.navigate("/(counsellor)/schedule")}
          accessibilityRole="button"
          accessibilityLabel="Manage Availability"
        >
          <Text style={styles.manageAvailabilityText}>Manage Availability</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    justifyContent: "space-between",
  },
  emblemContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emblemCard: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  minusIcon: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#475569",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    marginBottom: spacing.lg,
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
  studentIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  anonPill: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  anonPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginVertical: spacing.md,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reasonLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  reasonPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reasonValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  triageQueueCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  triageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  triageText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  dashboardBtn: {
    backgroundColor: "#064E3B",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  dashboardBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  manageAvailabilityLink: {
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  manageAvailabilityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
});
