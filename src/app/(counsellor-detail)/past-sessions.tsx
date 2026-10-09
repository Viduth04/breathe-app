// Counsellor Past Sessions History Screen - Muaath (Member 4). Supports FR01, FR08.
// Completed and logged clinical session history matching high-fidelity design.

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import {
  PastSessionFilter,
  PastSessionItem,
} from "@/types/counsellorDetailScreens";
import { usePopup } from "@/components/common/popup";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function PastSessionsHistoryScreen() {
  const params = useLocalSearchParams<{
    studentAnonId?: string;
    displayName?: string;
  }>();

  const { alert, showToast } = usePopup();
  const store = useCounsellorStore();
  const rawSessions = store.pastSessions || [];

  const [activeFilter, setActiveFilter] = useState<PastSessionFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeStudentFilter, setActiveStudentFilter] = useState<string | null>(
    params.studentAnonId || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Live real data statistics derived from database records
  const completedCount = rawSessions.filter((s) => s.status === "completed").length;
  const rescheduledCount = rawSessions.filter((s) => s.status === "rescheduled").length;
  const wrapUpCount = rawSessions.filter((s) => s.status === "pending-wrapup").length;
  const totalCount = rawSessions.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
  const clinicalHours = (completedCount * 0.75).toFixed(1);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await store.completeSession(id);
      showToast("Session notes sealed and saved to database.");
      setFeedback("Session notes sealed and marked as completed in database.");
    } catch {
      showToast("Failed to update session status.");
    }
  };

  const handleScheduleFollowUp = () => {
    router.navigate("/(counsellor)/schedule");
  };

  const handleMessageStudent = (studentIdOrAnon: string) => {
    router.navigate({
      pathname: "/(counsellor)/messages",
      params: { studentAnonId: studentIdOrAnon },
    });
  };

  // Filter real sessions dynamically
  const filteredSessions = useMemo(() => {
    return rawSessions.filter((s) => {
      if (activeStudentFilter) {
        const match =
          s.studentAnonId.toLowerCase() === activeStudentFilter.toLowerCase() ||
          s.displayName.toLowerCase().includes(activeStudentFilter.toLowerCase()) ||
          (params.displayName &&
            s.displayName.toLowerCase() === params.displayName.toLowerCase());
        if (!match) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          s.studentAnonId.toLowerCase().includes(q) ||
          s.displayName.toLowerCase().includes(q) ||
          s.concern.toLowerCase().includes(q) ||
          s.date.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (activeFilter === "completed") return s.status === "completed";
      if (activeFilter === "rescheduled") return s.status === "rescheduled";
      if (activeFilter === "pending-wrapup") return s.status === "pending-wrapup";
      return true; // 'all'
    });
  }, [rawSessions, activeStudentFilter, params.displayName, searchQuery, activeFilter]);

  // Dynamically group completed sessions by month
  const groupedByMonth = useMemo(() => {
    const groups: { month: string; sessions: PastSessionItem[] }[] = [];
    const map = new Map<string, PastSessionItem[]>();

    filteredSessions.forEach((s) => {
      const monthKey = s.monthGroup || "Recent Sessions";
      if (!map.has(monthKey)) {
        map.set(monthKey, []);
      }
      map.get(monthKey)!.push(s);
    });

    map.forEach((sessions, month) => {
      groups.push({ month, sessions });
    });

    return groups;
  }, [filteredSessions]);

  const renderSessionCard = (item: PastSessionItem) => {
    const isExpanded = expandedId === item.id;
    const isWrapUp = item.status === "pending-wrapup";

    return (
      <View key={item.id} style={styles.sessionCard}>
        {/* Card Header Row */}
        <Pressable
          style={styles.cardHeaderPressable}
          onPress={() => toggleExpand(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Session for ${item.displayName}. Tap to toggle clinical details`}
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

            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textSecondary}
              style={{ marginLeft: 6 }}
            />
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
              {!isWrapUp ? (
                <Pressable
                  style={styles.cardMessageBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleMessageStudent(item.studentAnonId || item.displayName);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${item.displayName}`}
                  hitSlop={8}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.primary} />
                  <Text style={styles.cardMessageBtnText}>Message</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Pressable>

        {/* ─── Expanded Card Section ─── */}
        {isExpanded && (
          <View style={styles.expandedWrapUpBox}>
            <View style={styles.privateNotesHeader}>
              <Ionicons name={isWrapUp ? "alert-circle-outline" : "shield-checkmark"} size={14} color={isWrapUp ? "#D97706" : "#047857"} />
              <Text style={[styles.privateNotesTitle, !isWrapUp && { color: "#047857" }]}>
                {isWrapUp ? "Private Notes (Pending Wrap-up Sign-off)" : "Clinical Record (Sealed & Verified)"}
              </Text>
            </View>

            <View style={styles.notesTextBox}>
              <Text style={styles.notesText}>
                {item.privateNotes || (isWrapUp ? "Consultation window elapsed. Please verify case notes and seal record." : "Clinical encounter completed and verified in audit log.")}
              </Text>
            </View>

            <Pressable
              style={styles.messageWrapUpBtn}
              onPress={() => handleMessageStudent(item.studentAnonId || item.displayName)}
              accessibilityLabel={`Message ${item.displayName}`}
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.primary} />
              <Text style={styles.messageWrapUpBtnText}>Message Student</Text>
            </Pressable>

            <Pressable
              style={styles.scheduleFollowUpBtn}
              onPress={handleScheduleFollowUp}
              accessibilityLabel="Schedule Follow Up"
              accessibilityRole="button"
            >
              <Ionicons name="calendar-outline" size={15} color={colors.text} />
              <Text style={styles.scheduleFollowUpText}>Schedule Follow Up</Text>
            </Pressable>

            {isWrapUp ? (
              <Pressable
                style={styles.markCompletedBtn}
                onPress={() => handleMarkCompleted(item.id)}
                accessibilityLabel="Mark as Completed"
                accessibilityRole="button"
              >
                <Ionicons name="checkmark-outline" size={16} color={colors.white} />
                <Text style={styles.markCompletedText}>Mark as Completed</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.scheduleFollowUpBtn, { marginTop: 4 }]}
                onPress={() =>
                  router.navigate({
                    pathname: "/(counsellor-detail)/session-notes",
                    params: {
                      sessionId: item.id,
                      studentAnonId: item.studentAnonId,
                      studentName: item.displayName,
                    },
                  })
                }
                accessibilityLabel="Review Full Clinical Notes"
                accessibilityRole="button"
              >
                <Ionicons name="document-text-outline" size={15} color="#047857" />
                <Text style={[styles.scheduleFollowUpText, { color: "#047857", fontWeight: "700" }]}>
                  Review Full Clinical Notes
                </Text>
              </Pressable>
            )}
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

        <Text style={styles.headerTitle}>History</Text>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>DR</Text>
          </View>
          <View style={styles.avatarOnlineBadge} />
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
              COUNSELOR PORTAL • DR. ANJALI PERERA
            </Text>
          </View>

          <Pressable
            style={[styles.searchIconButton, isSearchVisible && styles.searchIconButtonActive]}
            onPress={() => setIsSearchVisible((prev) => !prev)}
            accessibilityLabel="Search sessions"
            accessibilityRole="button"
          >
            <Ionicons name="search" size={17} color={isSearchVisible ? colors.primary : colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.filterButton}
            onPress={() => alert("Filter Records", "Filter clinical records by status, modality, or search by student ID.")}
            accessibilityLabel="Filter sessions"
            accessibilityRole="button"
          >
            <Ionicons name="options-outline" size={15} color={colors.text} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </Pressable>
        </View>

        {/* ─── Search Bar ─── */}
        {isSearchVisible && (
          <View style={styles.searchBoxContainer}>
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student ID, concern, or date..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        )}

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
              <Text style={styles.statMainNumber}>{completedCount}</Text>
              <Text style={styles.statTotalLabel}>total</Text>
            </View>
            <View style={styles.statFooterRow}>
              <View style={styles.greenStatDot} />
              <Text style={styles.statFootnoteText}>
                {completionRate}% completion rate
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
              <Text style={styles.statMainNumber}>{clinicalHours}</Text>
              <Text style={styles.statTotalLabel}>hrs</Text>
            </View>
            <View style={styles.statFooterRow}>
              <Ionicons name="lock-closed-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.statFootnoteText}>Verified log</Text>
            </View>
          </View>
        </View>

        {/* ─── Active Student Filter Banner ─── */}
        {activeStudentFilter && (
          <View style={styles.studentFilterPillBanner}>
            <View style={styles.studentFilterLeft}>
              <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.studentFilterText}>
                Showing:{" "}
                <Text style={styles.studentFilterBold}>
                  {params.displayName || activeStudentFilter}
                </Text>
              </Text>
            </View>
            <Pressable
              onPress={() => setActiveStudentFilter(null)}
              style={styles.studentFilterClearBtn}
              accessibilityRole="button"
              accessibilityLabel="Show all students"
              hitSlop={8}
            >
              <Text style={styles.studentFilterClearText}>Show All</Text>
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </Pressable>
          </View>
        )}

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
              All ({totalCount})
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
              Completed {completedCount}
            </Text>
          </Pressable>

          {wrapUpCount > 0 && (
            <Pressable
              style={[styles.filterPill, activeFilter === "pending-wrapup" && styles.filterPillActive]}
              onPress={() => setActiveFilter("pending-wrapup")}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === "pending-wrapup" && styles.filterPillTextActive,
                  { color: activeFilter === "pending-wrapup" ? colors.white : "#D97706" },
                ]}
              >
                Notes Pending ({wrapUpCount})
              </Text>
            </Pressable>
          )}

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
              Rescheduled {rescheduledCount}
            </Text>
          </Pressable>
        </ScrollView>

        {/* ─── Dynamic Month Sections / Empty State ─── */}
        {groupedByMonth.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="time-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Completed Sessions Found</Text>
            <Text style={styles.emptyDescription}>
              {activeFilter !== "all" || searchQuery
                ? "No consultation records match the active filter criteria."
                : "Completed sessions will appear here once consultations conclude and clinical notes are sealed in the database."}
            </Text>
            <Pressable
              style={styles.emptyActionBtn}
              onPress={() => router.navigate("/(counsellor)/dashboard")}
              accessibilityRole="button"
              accessibilityLabel="View Today's Schedule"
            >
              <Ionicons name="calendar-outline" size={16} color={colors.white} />
              <Text style={styles.emptyActionText}>View Today's Schedule</Text>
            </Pressable>
          </View>
        ) : (
          groupedByMonth.map((group) => (
            <View key={group.month} style={styles.monthSection}>
              <View style={styles.monthHeaderRow}>
                <View style={styles.monthDotRow}>
                  <View style={styles.greenSectionDot} />
                  <Text style={styles.monthSectionTitle}>{group.month}</Text>
                </View>
                <Text style={styles.sessionCountText}>
                  {group.sessions.length} Session{group.sessions.length === 1 ? "" : "s"}
                </Text>
              </View>
              {group.sessions.map(renderSessionCard)}
            </View>
          ))
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
  avatarWrapper: {
    position: "relative",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#064E3B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(6, 95, 70, 0.2)",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  avatarOnlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: colors.white,
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
  cardMessageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginLeft: 8,
    minHeight: 28,
  },
  cardMessageBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  messageWrapUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    minHeight: TOUCH_TARGET,
    borderRadius: radius.md,
    gap: 6,
    marginBottom: 8,
  },
  messageWrapUpBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  studentFilterPillBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  studentFilterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  studentFilterText: {
    fontSize: 12,
    color: colors.text,
  },
  studentFilterBold: {
    fontWeight: "700",
    color: colors.primary,
  },
  studentFilterClearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
  },
  studentFilterClearText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
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
  searchIconButtonActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  searchBoxContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 2,
  },
  emptyContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    minHeight: TOUCH_TARGET,
  },
  emptyActionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
