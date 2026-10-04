// Requests Screen - Muaath (Member 4). Supports FR01, FR03, NFR01.
// High-fidelity implementation matching approved prototype media_1791021938403.png & media_1791022171958.png
// Full list of pending booking requests, filter tabs (All, Video, Chat, In-Person), Accept & View flows.

import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { BookingRequestItem } from "@/types/counsellorDashboard";

type FilterTab = "all" | "video" | "chat" | "in-person";

export default function RequestsScreen() {
  const store = useCounsellorStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Dynamic filter counts
  const videoCount = store.requests.filter((r) => r.sessionType === "video").length;
  const chatCount = store.requests.filter((r) => r.sessionType === "chat").length;
  const inPersonCount = store.requests.filter((r) => r.sessionType === "in-person").length;

  const filteredRequests = useMemo(() => {
    if (activeFilter === "all") return store.requests;
    return store.requests.filter((r) => r.sessionType === activeFilter);
  }, [store.requests, activeFilter]);

  const handleAccept = (request: BookingRequestItem) => {
    router.navigate({
      pathname: "/(counsellor-detail)/confirm-acceptance",
      params: { requestId: request.id, studentAnonId: request.studentAnonId },
    });
  };

  const handleView = (request: BookingRequestItem) => {
    router.navigate({
      pathname: "/(counsellor-detail)/request-detail",
      params: { requestId: request.id, studentAnonId: request.studentAnonId },
    });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressedState]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#076047" />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Requests
        </Text>

        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: store.profile.avatarUrl }}
            style={styles.counselorAvatar}
            accessibilityLabel="Counselor profile"
          />
          <View style={styles.onlineBadge} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Awaiting Subheader Banner ─── */}
        <View style={styles.awaitingBanner}>
          <View style={styles.awaitingLeft}>
            <MaterialCommunityIcons name="clipboard-clock-outline" size={20} color="#076047" />
            <Text style={styles.awaitingTitle}>AWAITING CONFIRMATION</Text>
          </View>
          <View style={styles.awaitingBadge}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.awaitingBadgeText}>{store.requests.length} awaiting</Text>
          </View>
        </View>

        {/* ─── Filter Tabs (Horizontal Scroll) ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsRow}
        >
          <Pressable
            onPress={() => setActiveFilter("all")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "all" }}
            accessibilityLabel={`All requests, ${store.requests.length} total`}
            style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "all" && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter("video")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "video" }}
            accessibilityLabel={`Video requests, ${videoCount}`}
            style={[styles.filterChip, activeFilter === "video" && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "video" && styles.filterChipTextActive,
              ]}
            >
              Video ({videoCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter("chat")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "chat" }}
            accessibilityLabel={`Chat requests, ${chatCount}`}
            style={[styles.filterChip, activeFilter === "chat" && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "chat" && styles.filterChipTextActive,
              ]}
            >
              Chat ({chatCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter("in-person")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "in-person" }}
            accessibilityLabel={`In-Person requests, ${inPersonCount}`}
            style={[styles.filterChip, activeFilter === "in-person" && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "in-person" && styles.filterChipTextActive,
              ]}
            >
              In-Person ({inPersonCount})
            </Text>
          </Pressable>
        </ScrollView>

        {/* ─── Requests Cards List ─── */}
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="check-all"
              size={48}
              color="#A7F3D0"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No pending booking requests in this filter category.
            </Text>
          </View>
        ) : (
          filteredRequests.map((req) => {
            const isAnon = req.idMode === "anonymous";

            return (
              <View key={req.id} style={styles.requestCard}>
                {/* Header Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.studentIdentGroup}>
                    {isAnon ? (
                      <View style={styles.anonIconSquare}>
                        <Ionicons name="lock-closed" size={16} color="#076047" />
                      </View>
                    ) : (
                      <View style={styles.initialsCircle}>
                        <Text style={styles.initialsText}>{getInitials(req.displayName)}</Text>
                      </View>
                    )}

                    <View style={styles.nameAnonRow}>
                      <Text style={styles.studentNameText} numberOfLines={1}>
                        {req.displayName}
                      </Text>
                      {isAnon && (
                        <View style={styles.anonPill}>
                          <Text style={styles.anonPillText}>Anonymous</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Modality Badge */}
                  <View style={styles.modalityPill}>
                    <Ionicons
                      name={
                        req.sessionType === "video"
                          ? "videocam-outline"
                          : req.sessionType === "chat"
                          ? "chatbubble-outline"
                          : "business-outline"
                      }
                      size={13}
                      color="#076047"
                    />
                    <Text style={styles.modalityPillText}>
                      {req.sessionType === "video"
                        ? "Video"
                        : req.sessionType === "chat"
                        ? "Chat"
                        : "In-Person"}{" "}
                      • {req.duration || "45m"}
                    </Text>
                  </View>
                </View>

                {/* Timing Row */}
                <View style={styles.timingRow}>
                  <Ionicons name="time-outline" size={14} color="#6B6A5E" />
                  <Text style={styles.timingText}>
                    Requested — <Text style={styles.timingValueText}>{req.requestedTime}</Text>
                  </Text>
                </View>

                {/* Concern / Topic Chip */}
                <View style={styles.topicBox}>
                  <Text style={styles.topicText}>{req.topic}</Text>
                </View>

                {/* AI Mood Brief (if available) */}
                {req.aiMoodBrief && (
                  <View style={styles.aiBriefCard}>
                    <MaterialCommunityIcons name="brain" size={16} color="#076047" />
                    <Text style={styles.aiBriefText} numberOfLines={2}>
                      <Text style={styles.aiBriefBold}>AI Mood Brief: </Text>
                      {req.aiMoodBrief}
                    </Text>
                  </View>
                )}

                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                  <Pressable
                    onPress={() => handleAccept(req)}
                    accessibilityRole="button"
                    accessibilityLabel={`Accept request from ${req.displayName}`}
                    style={({ pressed }) => [styles.acceptButton, pressed && styles.pressedState]}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleView(req)}
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${req.displayName}`}
                    style={({ pressed }) => [styles.viewButton, pressed && styles.pressedState]}
                  >
                    <Ionicons name="eye-outline" size={16} color="#076047" />
                    <Text style={styles.viewButtonText}>View</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {/* ─── Compliance Footer ─── */}
        <View style={styles.complianceFooter}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#076047" />
          <Text style={styles.complianceFooterText}>
            HIPAA & FERPA Compliant • Auto-syncs to Calendar on Acceptance
          </Text>
        </View>
      </ScrollView>
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
    color: "#076047",
    letterSpacing: -0.3,
  },
  avatarContainer: {
    position: "relative",
    width: 34,
    height: 34,
  },
  counselorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "rgba(7, 96, 71, 0.2)",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  awaitingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm + 2,
    paddingHorizontal: 2,
  },
  awaitingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  awaitingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
    letterSpacing: 0.6,
  },
  awaitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#076047",
  },
  awaitingBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.2)",
  },
  filterChipActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#076047",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.12)",
    marginBottom: spacing.md,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  studentIdentGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  anonIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
  },
  initialsCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
  },
  initialsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  nameAnonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B2B24",
  },
  anonPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  anonPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B6A5E",
  },
  modalityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
  },
  modalityPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#076047",
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  timingText: {
    fontSize: 12,
    color: "#6B6A5E",
  },
  timingValueText: {
    fontWeight: "600",
    color: "#1B2B24",
  },
  topicBox: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  topicText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  aiBriefCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  aiBriefText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#076047",
    flex: 1,
  },
  aiBriefBold: {
    fontWeight: "700",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "#076047",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#076047",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#076047",
  },
  complianceFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  complianceFooterText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#076047",
    textAlign: "center",
    flex: 1,
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    marginVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2B24",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B6A5E",
    textAlign: "center",
  },
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
