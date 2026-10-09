// Requests Screen - Muaath (Member 4). Supports FR01, FR03, NFR01.
// Production-grade implementation displaying all student booking requests:
// Pending (awaiting action), Confirmed (accepted), and Declined (rejected)
// with complete clinical screener scores, intake notes, room details, and status-aware action flows.

import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { BookingRequestItem, RequestStatus, SessionType } from "@/types/counsellorDashboard";

type StatusFilterTab = "all" | "pending" | "confirmed" | "declined";
type ModalityFilterTab = "all" | "video" | "chat" | "in-person";

export default function RequestsScreen() {
  const store = useCounsellorStore();
  const params = useLocalSearchParams<{ status?: StatusFilterTab; requestId?: string }>();
  const [statusFilter, setStatusFilter] = useState<StatusFilterTab>(() => {
    if (params.status && ["all", "pending", "confirmed", "declined"].includes(params.status)) {
      return params.status as StatusFilterTab;
    }
    return "all";
  });
  const [modalityFilter, setModalityFilter] = useState<ModalityFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (params.status && ["all", "pending", "confirmed", "declined"].includes(params.status)) {
      setStatusFilter(params.status as StatusFilterTab);
    }
  }, [params.status]);

  // Helper predicates for robust status matching across live database records
  const isPendingStatus = (status?: string) => {
    const s = (status || "").toLowerCase().trim();
    return s === "pending";
  };

  const isConfirmedStatus = (status?: string) => {
    const s = (status || "").toLowerCase().trim();
    return s === "confirmed" || s === "completed";
  };

  const isDeclinedStatus = (status?: string) => {
    const s = (status || "").toLowerCase().trim();
    return s === "declined" || s === "cancelled" || s === "rejected";
  };

  // Dynamic filter counts
  const pendingCount = useMemo(
    () => store.requests.filter((r) => isPendingStatus(r.status)).length,
    [store.requests]
  );
  const confirmedCount = useMemo(
    () => store.requests.filter((r) => isConfirmedStatus(r.status)).length,
    [store.requests]
  );
  const declinedCount = useMemo(
    () => store.requests.filter((r) => isDeclinedStatus(r.status)).length,
    [store.requests]
  );

  const videoCount = useMemo(
    () =>
      store.requests.filter((r) => {
        const mod = (r.sessionType || "").toLowerCase().trim();
        return mod === "video" || mod === "phone";
      }).length,
    [store.requests]
  );
  const chatCount = useMemo(
    () =>
      store.requests.filter(
        (r) => (r.sessionType || "").toLowerCase().trim() === "chat"
      ).length,
    [store.requests]
  );
  const inPersonCount = useMemo(
    () =>
      store.requests.filter(
        (r) => (r.sessionType || "").toLowerCase().trim() === "in-person"
      ).length,
    [store.requests]
  );

  const filteredRequests = useMemo(() => {
    return store.requests.filter((req) => {
      // 1. Status Filter
      if (statusFilter === "pending" && !isPendingStatus(req.status)) {
        return false;
      }
      if (statusFilter === "confirmed" && !isConfirmedStatus(req.status)) {
        return false;
      }
      if (statusFilter === "declined" && !isDeclinedStatus(req.status)) {
        return false;
      }

      // 2. Modality Filter
      const mod = (req.sessionType || "").toLowerCase().trim();
      const normalizedMod = mod === "phone" ? "video" : mod;
      if (modalityFilter !== "all" && normalizedMod !== modalityFilter) {
        return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (req.displayName || "").toLowerCase().includes(q);
        const matchesAnon = (req.studentAnonId || "").toLowerCase().includes(q);
        const matchesTopic = (req.topic || "").toLowerCase().includes(q);
        const matchesNotes = (req.notes || "").toLowerCase().includes(q);
        const matchesReason = (req.cancelReason || "").toLowerCase().includes(q);
        if (!matchesName && !matchesAnon && !matchesTopic && !matchesNotes && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [store.requests, statusFilter, modalityFilter, searchQuery]);

  const handleAccept = (request: BookingRequestItem) => {
    router.navigate({
      pathname: "/(counsellor-detail)/confirm-acceptance",
      params: { requestId: request.id, studentAnonId: request.studentAnonId },
    });
  };

  const handleDecline = (request: BookingRequestItem) => {
    router.push({
      pathname: "/(counsellor-detail)/decline-request",
      params: {
        requestId: request.id,
        studentAnonId: request.studentAnonId,
        proposedDate: request.date || "Scheduled Slot",
        proposedTime: request.requestedTime,
        sessionTypeLabel:
          request.sessionType === "chat"
            ? "Secured Chat Session"
            : request.sessionType === "in-person"
            ? "In-Person Consultation"
            : "Video Consultation (45m)",
      },
    });
  };

  const handleView = (request: BookingRequestItem) => {
    router.navigate({
      pathname: "/(counsellor-detail)/request-detail",
      params: { requestId: request.id, studentAnonId: request.studentAnonId },
    });
  };

  const handleJoinConfirmed = (request: BookingRequestItem) => {
    if (request.isExpired) {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId: request.id,
          studentAnonId: request.studentAnonId,
          studentName: request.displayName,
        },
      });
      return;
    }
    if (request.sessionType === "video") {
      router.navigate({
        pathname: "/(counsellor-detail)/ready-to-join",
        params: {
          studentAnonId: request.studentAnonId,
          sessionTitle: "Encrypted Video Consultation",
          timeRange: request.requestedTime,
          duration: request.duration || "45m",
          sessionId: request.id,
        },
      });
    } else if (request.sessionType === "chat") {
      router.navigate({
        pathname: "/(counsellor)/messages",
        params: {
          studentAnonId: request.studentAnonId,
          sessionId: request.id,
        },
      });
    } else {
      router.navigate({
        pathname: "/(counsellor-detail)/anonymous-session-details",
        params: {
          sessionId: request.id,
          studentAnonId: request.studentAnonId,
          sessionType: "in-person",
        },
      });
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const cleanNote = (notes?: string) => {
    if (!notes) return null;
    return notes.replace(/^ANONYMOUS:\s*/, "").trim();
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

        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Booking Requests
          </Text>
          <Text style={styles.headerSubtitle}>Student Care & Triage Overview</Text>
        </View>

        <View style={styles.avatarContainer}>
          {store.profile.avatarUrl && !avatarError ? (
            <Image
              source={{ uri: store.profile.avatarUrl }}
              style={styles.counselorAvatar}
              accessibilityLabel="Counselor profile"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={styles.counselorAvatarFallback}>
              <Text style={styles.counselorAvatarInitials}>
                {getInitials(store.profile.fullName || "Dr. Perera")}
              </Text>
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Status Metric Summary Cards ─── */}
        <View style={styles.metricsRow}>
          <Pressable
            style={[
              styles.metricCard,
              { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" },
              statusFilter === "pending" && styles.metricCardActive,
            ]}
            onPress={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="time" size={16} color="#D97706" />
              <Text style={[styles.metricCount, { color: "#B45309" }]}>{pendingCount}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: "#92400E" }]}>Pending</Text>
          </Pressable>

          <Pressable
            style={[
              styles.metricCard,
              { backgroundColor: "#E5F8E4", borderColor: "#A7F3D0" },
              statusFilter === "confirmed" && styles.metricCardActive,
            ]}
            onPress={() => setStatusFilter(statusFilter === "confirmed" ? "all" : "confirmed")}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="checkmark-circle" size={16} color="#076047" />
              <Text style={[styles.metricCount, { color: "#076047" }]}>{confirmedCount}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: "#076047" }]}>Confirmed</Text>
          </Pressable>

          <Pressable
            style={[
              styles.metricCard,
              { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
              statusFilter === "declined" && styles.metricCardActive,
            ]}
            onPress={() => setStatusFilter(statusFilter === "declined" ? "all" : "declined")}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={[styles.metricCount, { color: "#DC2626" }]}>{declinedCount}</Text>
            </View>
            <Text style={[styles.metricLabel, { color: "#991B1B" }]}>Declined</Text>
          </Pressable>
        </View>

        {/* ─── Search Input ─── */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#6B6A5E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student alias, topic, or note..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* ─── Status Filter Tabs ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsRow}
        >
          <Pressable
            onPress={() => setStatusFilter("all")}
            accessibilityRole="tab"
            accessibilityState={{ selected: statusFilter === "all" }}
            style={[styles.statusTab, statusFilter === "all" && styles.statusTabActive]}
          >
            <Text style={[styles.statusTabText, statusFilter === "all" && styles.statusTabTextActive]}>
              All ({store.requests.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStatusFilter("pending")}
            accessibilityRole="tab"
            accessibilityState={{ selected: statusFilter === "pending" }}
            style={[styles.statusTab, statusFilter === "pending" && styles.statusTabPendingActive]}
          >
            <View style={[styles.dotIndicator, { backgroundColor: "#D97706" }]} />
            <Text
              style={[
                styles.statusTabText,
                statusFilter === "pending" && { color: "#92400E", fontWeight: "700" },
              ]}
            >
              Pending ({pendingCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStatusFilter("confirmed")}
            accessibilityRole="tab"
            accessibilityState={{ selected: statusFilter === "confirmed" }}
            style={[styles.statusTab, statusFilter === "confirmed" && styles.statusTabConfirmedActive]}
          >
            <View style={[styles.dotIndicator, { backgroundColor: "#076047" }]} />
            <Text
              style={[
                styles.statusTabText,
                statusFilter === "confirmed" && { color: "#076047", fontWeight: "700" },
              ]}
            >
              Confirmed ({confirmedCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStatusFilter("declined")}
            accessibilityRole="tab"
            accessibilityState={{ selected: statusFilter === "declined" }}
            style={[styles.statusTab, statusFilter === "declined" && styles.statusTabDeclinedActive]}
          >
            <View style={[styles.dotIndicator, { backgroundColor: "#DC2626" }]} />
            <Text
              style={[
                styles.statusTabText,
                statusFilter === "declined" && { color: "#991B1B", fontWeight: "700" },
              ]}
            >
              Declined ({declinedCount})
            </Text>
          </Pressable>
        </ScrollView>

        {/* ─── Modality Filter Chips (Sub-Filter) ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modalityChipsRow}
        >
          <Pressable
            onPress={() => setModalityFilter("all")}
            style={[styles.modalityChip, modalityFilter === "all" && styles.modalityChipActive]}
          >
            <Text style={[styles.modalityChipText, modalityFilter === "all" && styles.modalityChipTextActive]}>
              All Modalities
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setModalityFilter("video")}
            style={[styles.modalityChip, modalityFilter === "video" && styles.modalityChipActive]}
          >
            <Ionicons
              name="videocam-outline"
              size={13}
              color={modalityFilter === "video" ? "#FFFFFF" : "#076047"}
            />
            <Text style={[styles.modalityChipText, modalityFilter === "video" && styles.modalityChipTextActive]}>
              Video ({videoCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setModalityFilter("chat")}
            style={[styles.modalityChip, modalityFilter === "chat" && styles.modalityChipActive]}
          >
            <Ionicons
              name="chatbubble-outline"
              size={13}
              color={modalityFilter === "chat" ? "#FFFFFF" : "#076047"}
            />
            <Text style={[styles.modalityChipText, modalityFilter === "chat" && styles.modalityChipTextActive]}>
              Chat ({chatCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setModalityFilter("in-person")}
            style={[styles.modalityChip, modalityFilter === "in-person" && styles.modalityChipActive]}
          >
            <Ionicons
              name="business-outline"
              size={13}
              color={modalityFilter === "in-person" ? "#FFFFFF" : "#076047"}
            />
            <Text style={[styles.modalityChipText, modalityFilter === "in-person" && styles.modalityChipTextActive]}>
              In-Person ({inPersonCount})
            </Text>
          </Pressable>
        </ScrollView>

        {/* ─── Requests Cards List ─── */}
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-text-search-outline"
              size={48}
              color="#A7F3D0"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>
              {statusFilter === "pending"
                ? "No Pending Requests"
                : statusFilter === "confirmed"
                ? "No Confirmed Requests"
                : statusFilter === "declined"
                ? "No Declined Requests"
                : "No matching requests found"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter !== "all" || modalityFilter !== "all" || searchQuery
                ? "Try switching filter tabs or clearing search to view more requests."
                : "No booking requests recorded from students at this time."}
            </Text>
          </View>
        ) : (
          filteredRequests.map((req) => {
            const isAnon = req.idMode === "anonymous";
            const noteText = cleanNote(req.notes);
            const isPending = isPendingStatus(req.status);
            const isConfirmed = isConfirmedStatus(req.status);
            const isDeclined = isDeclinedStatus(req.status);
            const isHighlighted = params.requestId === req.id;

            // Prevent duplicate text in topic chip and student note
            const isDuplicateTopic =
              noteText &&
              req.topic &&
              noteText.trim().toLowerCase() === req.topic.trim().toLowerCase();
            const topicLabel = isDuplicateTopic
              ? req.sessionType === "chat"
                ? "Secured Chat Intake"
                : req.sessionType === "in-person"
                ? "Clinic Consultation Intake"
                : "Telehealth Consultation"
              : req.topic || "Clinical Consultation";

            // Status border accent color
            const cardAccentColor = isPending
              ? "#F59E0B"
              : isConfirmed
              ? "#10B981"
              : "#EF4444";

            return (
              <View
                key={req.id}
                style={[
                  styles.requestCard,
                  { borderLeftColor: cardAccentColor, borderLeftWidth: 4 },
                  isHighlighted && { borderColor: "#076047", borderWidth: 2 },
                ]}
              >
                {/* 1. Header: Student Identifier + Status Badge */}
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
                          <Text style={styles.anonPillText}>Anonymous Mode</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadgePill,
                      isPending && { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" },
                      isConfirmed && { backgroundColor: "#E5F8E4", borderColor: "#A7F3D0" },
                      isDeclined && { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
                    ]}
                  >
                    <Ionicons
                      name={
                        isPending
                          ? "hourglass-outline"
                          : isConfirmed
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={12}
                      color={isPending ? "#D97706" : isConfirmed ? "#076047" : "#DC2626"}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isPending && { color: "#B45309" },
                        isConfirmed && { color: "#076047" },
                        isDeclined && { color: "#DC2626" },
                      ]}
                    >
                      {isPending
                        ? "Pending Review"
                        : isConfirmed
                        ? "Confirmed"
                        : "Declined"}
                    </Text>
                  </View>
                </View>

                {/* 2. Modality & Timing Strip */}
                <View style={styles.infoStrip}>
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
                        ? "Video Call"
                        : req.sessionType === "chat"
                        ? "Secure Chat"
                        : "In-Person Clinic"}{" "}
                      • {req.duration || "45m"}
                    </Text>
                  </View>

                  <View style={styles.timingRow}>
                    <Ionicons name="calendar-outline" size={13} color="#6B6A5E" />
                    <Text style={styles.timingText}>
                      {req.date || "Scheduled Slot"} •{" "}
                      <Text style={styles.timingValueText}>{req.requestedTime}</Text>
                    </Text>
                  </View>
                </View>

                {/* 3. Clinical screener & topic chips */}
                <View style={styles.clinicalBadgesRow}>
                  {/* Concern / Topic Chip */}
                  <View style={styles.topicBox}>
                    <Ionicons name="bookmark-outline" size={12} color="#076047" />
                    <Text style={styles.topicText}>{topicLabel}</Text>
                  </View>

                  {/* PHQ-9 Screener Chip */}
                  {typeof req.phqScore === "number" && (
                    <View
                      style={[
                        styles.phqChip,
                        req.phqScore >= 15
                          ? { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }
                          : req.phqScore >= 10
                          ? { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }
                          : { backgroundColor: "#E5F8E4", borderColor: "#A7F3D0" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="clipboard-pulse-outline"
                        size={12}
                        color={
                          req.phqScore >= 15
                            ? "#DC2626"
                            : req.phqScore >= 10
                            ? "#D97706"
                            : "#076047"
                        }
                      />
                      <Text
                        style={[
                          styles.phqChipText,
                          req.phqScore >= 15
                            ? { color: "#991B1B" }
                            : req.phqScore >= 10
                            ? { color: "#92400E" }
                            : { color: "#076047" },
                        ]}
                      >
                        PHQ-9: {req.phqScore} ({req.phqRange || "Standard"})
                      </Text>
                    </View>
                  )}
                </View>

                {/* 4. Student Note (Quote Block) */}
                {noteText && (
                  <View style={styles.noteQuoteBox}>
                    <Ionicons name="chatbox-ellipses-outline" size={14} color="#076047" />
                    <Text style={styles.noteQuoteText} numberOfLines={2}>
                      <Text style={styles.noteQuoteLabel}>Student Note: </Text>
                      {noteText}
                    </Text>
                  </View>
                )}

                {/* 5. Additional Clinical Info based on status */}
                {isConfirmed && (
                  <View style={styles.confirmedInfoBox}>
                    <Ionicons name="lock-closed-outline" size={14} color="#076047" />
                    <Text style={styles.confirmedInfoText}>
                      {req.sessionType === "video"
                        ? `Encrypted Room: brth-${req.id.slice(0, 8)} • Auto-synced to Calendar`
                        : req.sessionType === "chat"
                        ? `Secured Thread: ${req.studentAnonId} • HIPAA & FERPA Guarded`
                        : "Clinic Room 302 • Campus Psychological Services Center"}
                    </Text>
                  </View>
                )}

                {isDeclined && (
                  <View style={styles.declinedInfoBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
                    <Text style={styles.declinedInfoText}>
                      <Text style={{ fontWeight: "700" }}>Decline Reason: </Text>
                      {req.cancelReason || "Schedule conflict / Counselor fully booked"}
                    </Text>
                  </View>
                )}

                {/* 6. Action Buttons based on status */}
                <View style={styles.actionButtonsRow}>
                  {isPending && (
                    <>
                      {req.isExpired ? (
                        <View style={styles.expiredSlotBadge}>
                          <Ionicons name="time-outline" size={13} color="#B45309" />
                          <Text style={styles.expiredSlotBadgeText}>Slot Expired</Text>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => handleAccept(req)}
                          accessibilityRole="button"
                          accessibilityLabel={`Accept request from ${req.displayName}`}
                          style={({ pressed }) => [
                            styles.acceptButton,
                            pressed && styles.pressedState,
                          ]}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={() => handleDecline(req)}
                        accessibilityRole="button"
                        accessibilityLabel={`Decline request from ${req.displayName}`}
                        style={({ pressed }) => [
                          styles.declineButton,
                          pressed && styles.pressedState,
                        ]}
                      >
                        <Ionicons name="close" size={16} color="#DC2626" />
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleView(req)}
                        accessibilityRole="button"
                        accessibilityLabel={`View details for ${req.displayName}`}
                        style={({ pressed }) => [
                          styles.viewButton,
                          pressed && styles.pressedState,
                        ]}
                      >
                        <Ionicons name="eye-outline" size={16} color="#076047" />
                        <Text style={styles.viewButtonText}>Details</Text>
                      </Pressable>
                    </>
                  )}

                  {isConfirmed && (
                    <>
                      <Pressable
                        onPress={() => handleJoinConfirmed(req)}
                        accessibilityRole="button"
                        accessibilityLabel={req.isExpired ? `Review notes for ${req.displayName}` : `Enter session with ${req.displayName}`}
                        style={({ pressed }) => [
                          styles.acceptButton,
                          { flex: 2 },
                          req.isExpired && { backgroundColor: "#065F46" },
                          pressed && styles.pressedState,
                        ]}
                      >
                        <Ionicons
                          name={
                            req.isExpired
                              ? "document-text-outline"
                              : req.sessionType === "video"
                              ? "videocam-outline"
                              : req.sessionType === "chat"
                              ? "chatbubbles-outline"
                              : "clipboard-outline"
                          }
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.acceptButtonText}>
                          {req.isExpired
                            ? "Concluded • Notes"
                            : req.sessionType === "video"
                            ? "Join Video Call"
                            : req.sessionType === "chat"
                            ? "Open Chat"
                            : "Session Notes"}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleView(req)}
                        accessibilityRole="button"
                        accessibilityLabel={`View details for ${req.displayName}`}
                        style={({ pressed }) => [
                          styles.viewButton,
                          pressed && styles.pressedState,
                        ]}
                      >
                        <Ionicons name="eye-outline" size={16} color="#076047" />
                        <Text style={styles.viewButtonText}>Details</Text>
                      </Pressable>
                    </>
                  )}

                  {isDeclined && (
                    <Pressable
                      onPress={() => handleView(req)}
                      accessibilityRole="button"
                      accessibilityLabel={`View details for ${req.displayName}`}
                      style={({ pressed }) => [
                        styles.viewButton,
                        { flex: 1 },
                        pressed && styles.pressedState,
                      ]}
                    >
                      <Ionicons name="document-text-outline" size={16} color="#076047" />
                      <Text style={styles.viewButtonText}>View Request History & Reason</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* ─── Compliance Footer ─── */}
        <View style={styles.complianceFooter}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#076047" />
          <Text style={styles.complianceFooterText}>
            Access-Controlled & Encrypted at Rest • Clinical Governance
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
    height: 56,
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
  headerTitleCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#076047",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6B6A5E",
    fontWeight: "500",
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
  counselorAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3EDE2",
    borderWidth: 1.5,
    borderColor: "rgba(7, 96, 71, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  counselorAvatarInitials: {
    fontSize: 12,
    fontWeight: "800",
    color: "#076047",
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
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  metricCardActive: {
    transform: [{ scale: 1.02 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  metricCount: {
    fontSize: 16,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
    paddingHorizontal: 12,
    height: 40,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1B2B24",
    paddingVertical: 0,
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.xs + 2,
    paddingBottom: 2,
  },
  statusTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.18)",
  },
  statusTabActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  statusTabPendingActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  statusTabConfirmedActive: {
    backgroundColor: "#E5F8E4",
    borderColor: "#10B981",
  },
  statusTabDeclinedActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#076047",
  },
  statusTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalityChipsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.md,
  },
  modalityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.12)",
  },
  modalityChipActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  modalityChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#076047",
  },
  modalityChipTextActive: {
    color: "#FFFFFF",
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
    marginBottom: 8,
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
  statusBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
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
    gap: 4,
  },
  timingText: {
    fontSize: 12,
    color: "#6B6A5E",
  },
  timingValueText: {
    fontWeight: "600",
    color: "#1B2B24",
  },
  clinicalBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  topicBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#076047",
  },
  phqChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  phqChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  noteQuoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#076047",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  noteQuoteLabel: {
    fontWeight: "700",
    color: "#076047",
  },
  noteQuoteText: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 16,
    flex: 1,
  },
  confirmedInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  confirmedInfoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
    flex: 1,
  },
  declinedInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  declinedInfoText: {
    fontSize: 11,
    color: "#991B1B",
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  expiredSlotBadge: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  expiredSlotBadgeText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "700",
  },
  acceptButton: {
    flex: 1,
    height: 40,
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
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  declineButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  viewButton: {
    flex: 1,
    height: 40,
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
    fontSize: 13,
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
