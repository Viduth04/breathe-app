// Counsellor Past Sessions History Screen - Muaath (Member 4). Supports FR01, FR08.
// Completed and logged clinical session history matching high-fidelity design.

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import {
  MOCK_PAST_SESSIONS,
  MOCK_PAST_SESSIONS_STATS,
} from "@/services/mockDetailScreensData";
import {
  PastSessionFilter,
  PastSessionItem,
  PastSessionsStats,
} from "@/types/counsellorDetailScreens";

export default function PastSessionsHistoryScreen() {
  const [sessions, setSessions] = useState<PastSessionItem[]>(MOCK_PAST_SESSIONS);
  const [stats, setStats] = useState<PastSessionsStats>(MOCK_PAST_SESSIONS_STATS);
  const [activeFilter, setActiveFilter] = useState<PastSessionFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>("past-5"); // Default expanded wrap-up card per PNG
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkCompleted = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "completed" } : s))
    );
    setStats((prev) => ({
      ...prev,
      completedSessions: prev.completedSessions + 1,
    }));
    setFeedback("Session notes sealed and marked as completed.");
  };

  const handleScheduleFollowUp = () => {
    router.navigate("/(counsellor)/schedule");
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === "completed") return s.status === "completed";
    if (activeFilter === "rescheduled") return s.status === "rescheduled";
    return true; // 'all'
  });

  // Group by month
  const augustSessions = filteredSessions.filter((s) => s.monthGroup === "August 2026");
  const julySessions = filteredSessions.filter((s) => s.monthGroup === "July 2026");

  const renderSessionCard = (item: PastSessionItem) => {
    const isExpanded = expandedId === item.id;
    const isWrapUp = item.status === "pending-wrapup";

    return (
      <View key={item.id} style={styles.sessionCard}>
        {/* Card Header Row */}
        <Pressable
          style={styles.cardHeaderPressable}
          onPress={() => (isWrapUp ? toggleExpand(item.id) : null)}
          accessibilityRole="button"
          accessibilityLabel={`Session for ${item.displayName}`}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.studentNameCol}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.studentName}>{item.displayName}</Text>
                <View style={styles.idModePill}>
                  <Text style={styles.idModePillText}>
                    {item.idMode === "anonymous" ? "Anonymous" : "Standard ID"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Pill */}
            {item.status === "completed" && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={12} color="#047857" />
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            )}
            {item.status === "rescheduled" && (
              <View style={styles.rescheduledBadge}>
                <Ionicons name="calendar-outline" size={11} color="#475569" />
                <Text style={styles.rescheduledBadgeText}>Rescheduled</Text>
              </View>
            )}
            {item.status === "pending-wrapup" && (
              <View style={styles.wrapUpBadge}>
                <Ionicons name="document-text-outline" size={12} color="#D97706" />
                <Text style={styles.wrapUpBadgeText}>Pending Wrap-up</Text>
              </View>
            )}

            {isWrapUp && (
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.textSecondary}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>

          {/* Type & Room */}
          <View style={styles.modalityRow}>
            <Ionicons
              name={
                item.sessionType === "video"
                  ? "videocam-outline"
                  : item.sessionType === "chat"
                  ? "chatbubble-outline"
                  : "book-outline"
              }
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.modalityText}>
              {item.sessionTypeLabel} • {item.duration}
              {item.room ? ` • ${item.room}` : ""}
            </Text>
          </View>

          {/* Concern Tag & Time */}
          <View style={styles.concernTimeRow}>
            <View style={styles.concernPill}>
              <Text style={styles.concernPillText}>{item.concern}</Text>
            </View>

            <View style={styles.dateTimeWrap}>
              <Text style={styles.dateTimeText}>
                {item.date} • {item.time}
              </Text>
              {!isWrapUp && (
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
        </Pressable>

        {/* ─── Expanded Wrap-up Card Section ─── */}
        {isWrapUp && isExpanded && (
          <View style={styles.expandedWrapUpBox}>
            <View style={styles.privateNotesHeader}>
              <Ionicons name="lock-closed" size={13} color="#475569" />
              <Text style={styles.privateNotesTitle}>
                Private notes (visible only to you)
              </Text>
            </View>

            <View style={styles.notesTextBox}>
              <Text style={styles.notesText}>{item.privateNotes}</Text>
            </View>

            <Pressable
              style={styles.scheduleFollowUpBtn}
              onPress={handleScheduleFollowUp}
              accessibilityLabel="Schedule Follow Up"
              accessibilityRole="button"
            >
              <Ionicons name="calendar-outline" size={15} color={colors.text} />
              <Text style={styles.scheduleFollowUpText}>Schedule Follow Up</Text>
            </Pressable>

            <Pressable
              style={styles.markCompletedBtn}
              onPress={() => handleMarkCompleted(item.id)}
              accessibilityLabel="Mark as Completed"
              accessibilityRole="button"
            >
              <Ionicons name="checkmark-outline" size={16} color={colors.white} />
              <Text style={styles.markCompletedText}>Mark as Completed</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButtonCircle}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Past Sessions History</Text>

        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color={colors.white} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Feedback Banner ─── */}
        {feedback && (
          <View style={styles.feedbackBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* ─── Subheader / Search & Filter Row ─── */}
        <View style={styles.portalSearchRow}>
          <View style={styles.portalPill}>
            <Ionicons name="business-outline" size={13} color="#047857" />
            <Text style={styles.portalPillText} numberOfLines={1}>
              COUNSELOR PORTAL • DR. ...
            </Text>
          </View>

          <Pressable
            style={styles.searchIconButton}
            onPress={() => Alert.alert("Search Records", "Search by student ID, clinical topic, or date")}
            accessibilityLabel="Search sessions"
          >
            <Ionicons name="search" size={17} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.filterButton}
            onPress={() => Alert.alert("Filter", "Filter by semester, modality, or counselor notes status")}
            accessibilityLabel="Filter sessions"
          >
            <Ionicons name="options-outline" size={15} color={colors.text} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </Pressable>
        </View>

        {/* ─── Stats Row ─── */}
        <View style={styles.statsRow}>
          {/* Completed Sessions Stat Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Text style={styles.statLabel}>Completed Sessions</Text>
              <View style={styles.statCheckCircle}>
                <Ionicons name="checkmark" size={13} color="#047857" />
              </View>
            </View>
            <View style={styles.statNumberRow}>
              <Text style={styles.statMainNumber}>{stats.completedSessions}</Text>
              <Text style={styles.statTotalLabel}>total</Text>
            </View>
            <View style={styles.statFooterRow}>
              <View style={styles.greenStatDot} />
              <Text style={styles.statFootnoteText}>
                {stats.completionRate}% completion rate
              </Text>
            </View>
          </View>

          {/* Clinical Hours Stat Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Text style={styles.statLabel}>Clinical Hours</Text>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.statNumberRow}>
              <Text style={styles.statMainNumber}>{stats.clinicalHours}</Text>
              <Text style={styles.statTotalLabel}>hrs</Text>
            </View>
            <View style={styles.statFooterRow}>
              <Ionicons name="lock-closed-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.statFootnoteText}>Verified log</Text>
            </View>
          </View>
        </View>

        {/* ─── Filter Pills Bar ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          <Pressable
            style={[styles.filterPill, activeFilter === "all" && styles.filterPillActive]}
            onPress={() => setActiveFilter("all")}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === "all" && styles.filterPillTextActive,
              ]}
            >
              All (52)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterPill, activeFilter === "completed" && styles.filterPillActive]}
            onPress={() => setActiveFilter("completed")}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === "completed" && styles.filterPillTextActive,
              ]}
            >
              Completed 48
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterPill, activeFilter === "rescheduled" && styles.filterPillActive]}
            onPress={() => setActiveFilter("rescheduled")}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === "rescheduled" && styles.filterPillTextActive,
              ]}
            >
              Rescheduled 3
            </Text>
          </Pressable>

          <Pressable
            style={styles.filterPill}
            onPress={() => Alert.alert("No-Show", "0 no-shows recorded in past 6 months.")}
          >
            <Text style={styles.filterPillText}>No-show 1</Text>
          </Pressable>
        </ScrollView>

        {/* ─── August 2026 Section ─── */}
        {augustSessions.length > 0 && (
          <View style={styles.monthSection}>
            <View style={styles.monthHeaderRow}>
              <View style={styles.monthDotRow}>
                <View style={styles.greenSectionDot} />
                <Text style={styles.monthSectionTitle}>August 2026</Text>
              </View>
              <Text style={styles.sessionCountText}>
                {augustSessions.length} Sessions
              </Text>
            </View>
            {augustSessions.map(renderSessionCard)}
          </View>
        )}

        {/* ─── July 2026 Section ─── */}
        {julySessions.length > 0 && (
          <View style={styles.monthSection}>
            <View style={styles.monthHeaderRow}>
              <View style={styles.monthDotRow}>
                <View style={styles.greenSectionDot} />
                <Text style={styles.monthSectionTitle}>July 2026</Text>
              </View>
              <Text style={styles.sessionCountText}>
                {julySessions.length} Sessions
              </Text>
            </View>
            {julySessions.map(renderSessionCard)}
          </View>
        )}

        {/* ─── Compliance Notice Footer ─── */}
        <View style={styles.complianceCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#047857" style={{ marginTop: 2 }} />
          <Text style={styles.complianceText}>
            Showing past 6 months of consultation records. Clinical notes and session summaries are end-to-end encrypted and stored in strict compliance with university health privacy policies.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#064E3B",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    gap: 8,
  },
  feedbackText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    flex: 1,
  },
  portalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
  },
  portalPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  portalPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.3,
  },
  searchIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    gap: 5,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
  },
  statHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  statCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  statNumberRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginVertical: 4,
  },
  statMainNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  statTotalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  statFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  greenStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statFootnoteText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.white,
  },
  monthSection: {
    marginBottom: 16,
  },
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  monthDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greenSectionDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#059669",
  },
  monthSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  sessionCountText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeaderPressable: {},
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentNameCol: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  idModePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idModePillText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },
  rescheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  rescheduledBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  wrapUpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  wrapUpBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B45309",
  },
  modalityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  modalityText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  concernTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  concernPill: {
    backgroundColor: "#FEFCE8",
    borderWidth: 1,
    borderColor: "#FEF08A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  concernPillText: {
    fontSize: 11,
    color: "#854D0E",
    fontWeight: "500",
  },
  dateTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  expandedWrapUpBox: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    marginTop: 12,
  },
  privateNotesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  privateNotesTitle: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  notesTextBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },
  scheduleFollowUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.md,
    gap: 6,
    marginBottom: 8,
  },
  scheduleFollowUpText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  markCompletedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.md,
    gap: 6,
  },
  markCompletedText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  complianceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginTop: 6,
  },
  complianceText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
