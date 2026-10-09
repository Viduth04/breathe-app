// Counsellor Patients List - Muaath (Member 4). Supports FR01, FR07, NFR01.
// Privacy-first caseload directory showing anonymous student IDs, session cadences, and session history links.

import React, { useState, useMemo } from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { PatientItem } from "@/types/counsellorDetailScreens";
import { usePopup } from "@/components/common/popup";

type FilterTab = "all" | "active" | "anonymous" | "past";

export default function PatientsListScreen() {
  const { patients = [], profile } = useCounsellorStore();
  const { alert } = usePopup();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  // Dynamic counts computed from actual real caseload data
  const tabCounts = useMemo(() => {
    const activeCount = patients.filter(
      (p) => p.isActive || p.status === "active"
    ).length;
    const anonCount = patients.filter((p) => p.idMode === "anonymous").length;
    const pastCount = patients.filter(
      (p) => p.status === "inactive" || !p.isActive
    ).length;
    return {
      all: patients.length,
      active: activeCount,
      anonymous: anonCount,
      past: pastCount,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    let result = patients.filter((patient) => {
      // Tab filter
      if (activeTab === "active" && !patient.isActive && patient.status !== "active") {
        return false;
      }
      if (activeTab === "anonymous" && patient.idMode !== "anonymous") {
        return false;
      }
      if (activeTab === "past" && patient.status !== "inactive" && patient.isActive) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = patient.displayName.toLowerCase().includes(query);
        const matchesAnon = patient.studentAnonId.toLowerCase().includes(query);
        const matchesTiming = patient.sessionTimingText.toLowerCase().includes(query);
        return matchesName || matchesAnon || matchesTiming;
      }

      return true;
    });

    // Apply sorting
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else {
      result = [...result].sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
    }

    return result;
  }, [patients, activeTab, searchQuery, sortBy]);

  const handlePatientPress = (patient: PatientItem) => {
    router.navigate({
      pathname: "/(counsellor-detail)/past-sessions",
      params: {
        studentAnonId: patient.studentAnonId,
        studentId: patient.studentId,
        displayName: patient.displayName,
      },
    });
  };

  const renderAvatar = (patient: PatientItem) => {
    if (patient.idMode === "anonymous") {
      let iconName: "shield-outline" | "key-outline" | "lock-closed-outline" = "shield-outline";
      let bg = "#F1F5F9";
      let border = "#E2E8F0";
      let iconColor = "#475569";

      if (patient.avatarIcon === "key") {
        iconName = "key-outline";
        bg = "#F0F9FF";
        border = "#BAE6FD";
        iconColor = "#0284C7";
      } else if (patient.avatarIcon === "lock") {
        iconName = "lock-closed-outline";
        bg = "#F1F5F9";
        border = "#E2E8F0";
        iconColor = "#475569";
      }

      return (
        <View style={[styles.avatarBox, { backgroundColor: bg, borderColor: border }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
      );
    }

    // Standard Profile with Initials
    let bg = "#ECFDF5";
    let border = "#A7F3D0";
    let textColor = "#065F46";

    if (patient.badgeStyle === "amber") {
      bg = "#FFFBEB";
      border = "#FDE68A";
      textColor = "#92400E";
    } else if (patient.badgeStyle === "teal") {
      bg = "#F0FDFA";
      border = "#99F6E4";
      textColor = "#0D9488";
    } else if (patient.badgeStyle === "indigo") {
      bg = "#EEF2FF";
      border = "#C7D2FE";
      textColor = "#4338CA";
    }

    return (
      <View style={[styles.avatarBox, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.avatarInitials, { color: textColor }]}>
          {patient.initials || "ST"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#065F46" />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Patients
        </Text>

        <Pressable
          onPress={() => router.navigate("/(counsellor-detail)/settings")}
          style={styles.profileAvatarBtn}
          accessibilityRole="button"
          accessibilityLabel="Counselor Profile"
          hitSlop={8}
        >
          <View style={styles.counselorAvatarCircle}>
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.counselorAvatarImg}
                accessibilityLabel="Counselor Profile Photo"
              />
            ) : (
              <Text style={styles.counselorAvatarText}>DR</Text>
            )}
          </View>
          <View style={styles.counselorOnlineDot} />
        </Pressable>
      </View>

      {/* ─── Search Bar ─── */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#94A3B8"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients by name or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable
            onPress={() =>
              alert(
                "Filter Options",
                "Filter by: Active Sessions, Inactive Caseload, Triage Level, or Academic Faculty."
              )
            }
            style={styles.filterTuneBtn}
            accessibilityRole="button"
            accessibilityLabel="Open Filters"
            hitSlop={8}
          >
            <Ionicons name="options-outline" size={18} color="#64748B" />
          </Pressable>
        </View>
      </View>

      {/* ─── Category Filter Chips ─── */}
      <View style={styles.tabsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          <Pressable
            style={[styles.tabChip, activeTab === "all" && styles.tabChipActive]}
            onPress={() => setActiveTab("all")}
            accessibilityRole="button"
            accessibilityLabel="All patients"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.tabChipText,
                activeTab === "all" && styles.tabChipTextActive,
              ]}
            >
              All ({tabCounts.all})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabChip, activeTab === "active" && styles.tabChipActive]}
            onPress={() => setActiveTab("active")}
            accessibilityRole="button"
            accessibilityLabel="Active patients"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.tabChipText,
                activeTab === "active" && styles.tabChipTextActive,
              ]}
            >
              Active ({tabCounts.active})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabChip, activeTab === "anonymous" && styles.tabChipActive]}
            onPress={() => setActiveTab("anonymous")}
            accessibilityRole="button"
            accessibilityLabel="Anonymous patients"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={activeTab === "anonymous" ? colors.white : "#64748B"}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.tabChipText,
                activeTab === "anonymous" && styles.tabChipTextActive,
              ]}
            >
              Anonymous ({tabCounts.anonymous})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabChip, activeTab === "past" && styles.tabChipActive]}
            onPress={() => setActiveTab("past")}
            accessibilityRole="button"
            accessibilityLabel="Past Cases"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.tabChipText,
                activeTab === "past" && styles.tabChipTextActive,
              ]}
            >
              Past Cases{tabCounts.past > 0 ? ` (${tabCounts.past})` : ""}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* ─── Subheader: Assigned Cases & Sorting ─── */}
      <View style={styles.subheaderRow}>
        <Text style={styles.assignedCasesText}>
          {filteredPatients.length} Assigned Cases
        </Text>

        <Pressable
          style={styles.sortTrigger}
          onPress={() =>
            setSortBy((prev) => (prev === "recent" ? "name" : "recent"))
          }
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortBy === "recent" ? "Recent Activity" : "Student Name"}`}
        >
          <Text style={styles.sortLabel}>
            Sort:{" "}
            <Text style={styles.sortValue}>
              {sortBy === "recent" ? "Recent Activity" : "Student Name"}
            </Text>
          </Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </Pressable>
      </View>

      {/* ─── Patients Card List ─── */}
      <ScrollView
        contentContainerStyle={styles.listScroll}
        showsVerticalScrollIndicator={false}
      >
        {filteredPatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={38} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching patients found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or switching category filter tabs.
            </Text>
          </View>
        ) : (
          filteredPatients.map((patient) => (
            <Pressable
              key={patient.id}
              style={styles.patientCard}
              onPress={() => handlePatientPress(patient)}
              accessibilityRole="button"
              accessibilityLabel={`${patient.displayName}, ${patient.sessionTimingText}`}
            >
              <View style={styles.cardLeft}>
                {renderAvatar(patient)}

                <View style={styles.cardMeta}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.patientName} numberOfLines={1}>
                      {patient.displayName}
                    </Text>

                    {/* Cadence or Anonymous Pill */}
                    {patient.idMode === "anonymous" ? (
                      <View style={styles.anonBlackPill}>
                        <Text style={styles.anonBlackPillText}>ANONYMOUS</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.cadencePill,
                          patient.badgeStyle === "amber" && styles.cadencePillAmber,
                          patient.badgeStyle === "teal" && styles.cadencePillTeal,
                          patient.badgeStyle === "indigo" && styles.cadencePillIndigo,
                        ]}
                      >
                        <Text
                          style={[
                            styles.cadencePillText,
                            patient.badgeStyle === "amber" && styles.cadenceTextAmber,
                            patient.badgeStyle === "teal" && styles.cadenceTextTeal,
                            patient.badgeStyle === "indigo" && styles.cadenceTextIndigo,
                          ]}
                        >
                          {patient.badgeText}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.patientTimingText} numberOfLines={1}>
                    {patient.sessionTimingText}
                  </Text>
                </View>
              </View>

              {/* Card Right: Status Indicator & Chevron */}
              <View style={styles.cardRight}>
                {patient.isActive && (
                  <View style={styles.activeDot} />
                )}
                {patient.status === "pending" && (
                  <View style={styles.pendingCircle} />
                )}
                <Pressable
                  style={styles.cardChatBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.navigate({
                      pathname: "/(counsellor)/messages",
                      params: { studentAnonId: patient.studentAnonId },
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${patient.displayName}`}
                  hitSlop={6}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color="#065F46" />
                </Pressable>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </View>
            </Pressable>
          ))
        )}

        <View style={{ height: spacing.xl }} />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#065F46",
    flex: 1,
    marginLeft: 4,
  },
  profileAvatarBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  counselorAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(6, 95, 70, 0.2)",
    overflow: "hidden",
  },
  counselorAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  counselorAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  counselorOnlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: colors.white,
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    marginBottom: 10,
  },
  searchContainer: {
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(6, 95, 70, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    paddingVertical: 0,
  },
  filterTuneBtn: {
    padding: 4,
  },
  tabsSection: {
    marginBottom: spacing.sm,
  },
  tabsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  tabChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabChipActive: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  tabChipTextActive: {
    color: colors.white,
  },
  subheaderRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  assignedCasesText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  sortTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  sortValue: {
    fontWeight: "700",
    color: "#1E293B",
  },
  listScroll: {
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: spacing.xl,
    gap: 10,
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 8,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardMeta: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  patientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  anonBlackPill: {
    backgroundColor: "#0F172A",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  anonBlackPillText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.4,
  },
  cadencePill: {
    backgroundColor: "#ECFDF5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cadencePillText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#065F46",
    letterSpacing: 0.4,
  },
  cadencePillAmber: {
    backgroundColor: "#FEF3C7",
  },
  cadenceTextAmber: {
    color: "#92400E",
  },
  cadencePillTeal: {
    backgroundColor: "#CCFBF1",
  },
  cadenceTextTeal: {
    color: "#0F766E",
  },
  cadencePillIndigo: {
    backgroundColor: "#E0E7FF",
  },
  cadenceTextIndigo: {
    color: "#4338CA",
  },
  patientTimingText: {
    fontSize: 12,
    color: "#64748B",
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardChatBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#065F46",
    borderWidth: 1.5,
    borderColor: "#ECFDF5",
  },
  pendingCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});
