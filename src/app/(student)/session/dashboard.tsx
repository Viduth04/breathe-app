// Student Sessions Dashboard Screen - Telehealth Hub & Clinical Appointment Gateway
// Dual-scope architecture: "Find Counselor" (triage & practitioner discovery) & "My Sessions" (lifecycle management)
// 100% Real Firestore database data: real counsellors, real slots, real bookings (zero mock data)
// Privacy-first Anonymous Mode, modality-aware launching (video, chat, in-person), strict Asia/Colombo timezone alignment.

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import Button from "@/components/common/Button";
import CounsellorAvatar from "@/components/common/CounsellorAvatar";
import Card from "@/components/common/Card";
import { listCounsellors } from "@/services/adminService";
import {
  cancelBooking,
  deleteCancelledBooking,
  subscribeToMyBookings,
} from "@/services/bookingService";
import { Booking } from "@/types/booking";
import { CounsellorProfile } from "@/types/counsellor";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { collection, onSnapshot, query, where } from "firebase/firestore";

type OpenCounsellorSlot = {
  startAt: Date;
  endAt: Date;
};

const webSearchInputStyle = {
  outlineStyle: "none",
  outlineWidth: 0,
  borderWidth: 0,
  boxShadow: "none",
} as any;

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  return null;
};

export default function SessionsScreen() {
  const [filter, setFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [mainTab, setMainTab] = useState<"my-sessions" | "find-counselor">("find-counselor");
  const [availableNow, setAvailableNow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [counsellors, setCounsellors] = useState<CounsellorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Booking[]>([]);
  const reconciledReschedules = useRef(new Set<string>());
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [counsellorSlotsMap, setCounsellorSlotsMap] = useState<
    Record<string, OpenCounsellorSlot[]>
  >({});
  const [availabilityNowMillis, setAvailabilityNowMillis] = useState(Date.now());

  useEffect(() => {
    // 1. Fetch real counsellors from Firestore
    const fetchCounsellors = async () => {
      setLoading(true);
      try {
        const data = await listCounsellors();
        setCounsellors(data);
      } catch (e) {
        console.error("fetchCounsellors error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCounsellors();

    // 2. Real-time Firestore synchronization with counselor availability slots
    const slotsQuery = query(collection(db, "slots"));
    const unsubSlots = onSnapshot(
      slotsQuery,
      (snapshot) => {
        const map: Record<string, OpenCounsellorSlot[]> = {};
        snapshot.docs.forEach((docSnap) => {
          const d = docSnap.data();
          if (
            typeof d.counsellorId !== "string" ||
            !d.counsellorId ||
            d.isBooked ||
            d.isHeld ||
            d.status === "held" ||
            d.status === "closed"
          ) return;

          const startAt = toDate(d.startAt);
          const endAt = toDate(d.endAt);
          if (!startAt || !endAt || endAt.getTime() <= startAt.getTime()) return;

          if (!map[d.counsellorId]) map[d.counsellorId] = [];
          map[d.counsellorId].push({ startAt, endAt });
        });
        Object.values(map).forEach((slots) =>
          slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
        );
        setCounsellorSlotsMap(map);
      },
      (err) => {
        console.warn("Slots onSnapshot error:", err);
      }
    );

    // 3. Real-time Firestore synchronization with student's bookings
    let unsubBookings: (() => void) | undefined;
    if (user) {
      setSessionsLoading(true);
      unsubBookings = subscribeToMyBookings(
        user.uid,
        (data) => {
          setSessions(data);
          setSessionsLoading(false);
        },
        (err) => {
          console.error("Bookings sync error:", err);
          setSessionsLoading(false);
        }
      );
    }

    return () => {
      unsubSlots();
      if (unsubBookings) unsubBookings();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const bookingsById = new Map(sessions.map((booking) => [booking.id, booking]));
    sessions.forEach((replacement) => {
      if (replacement.status !== "pending" || !replacement.rescheduledFrom) return;
      const previousBooking = bookingsById.get(replacement.rescheduledFrom);
      if (
        !previousBooking ||
        previousBooking.status !== "confirmed" ||
        previousBooking.studentId !== user.uid ||
        previousBooking.counsellorId !== replacement.counsellorId ||
        reconciledReschedules.current.has(previousBooking.id)
      ) {
        return;
      }

      reconciledReschedules.current.add(previousBooking.id);
      void cancelBooking(previousBooking, "Rescheduled by student").catch((error) => {
        reconciledReschedules.current.delete(previousBooking.id);
        console.error("[sessions] Failed to cancel the original rescheduled booking:", error);
      });
    });
  }, [sessions, user]);

  useEffect(() => {
    const timer = setInterval(() => setAvailabilityNowMillis(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const getCounsellorOpenSlots = (c: CounsellorProfile): OpenCounsellorSlot[] =>
    (counsellorSlotsMap[c.uid] || []).filter(
      (slot) => slot.startAt.getTime() > availabilityNowMillis,
    );

  const formatOpenSlot = (slot: OpenCounsellorSlot) => {
    const date = slot.startAt.toLocaleDateString("en-LK", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Colombo",
    });
    const start = slot.startAt.toLocaleTimeString("en-LK", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Colombo",
    });
    const end = slot.endAt.toLocaleTimeString("en-LK", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Colombo",
    });
    return `${date} • ${start} – ${end}`;
  };

  const filteredCounsellors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const normalizedCategory = selectedCategory.toLocaleLowerCase();

    return counsellors.filter((c) => {
      const specialties = Array.isArray(c.specialties) ? c.specialties : [];
      if (normalizedQuery) {
        const matchName = (c.fullName || "").toLocaleLowerCase().includes(normalizedQuery);
        const matchSpecialty = specialties.some((s) =>
          s.toLocaleLowerCase().includes(normalizedQuery)
        );
        const matchTitle = (c.title || "").toLocaleLowerCase().includes(normalizedQuery);
        if (!matchName && !matchSpecialty && !matchTitle) return false;
      }
      if (normalizedCategory !== "all") {
        if (!specialties.some((s) => s.toLocaleLowerCase() === normalizedCategory)) return false;
      }
      if (availableNow) {
        const openSlots = (counsellorSlotsMap[c.uid] || []).filter(
          (slot) => slot.startAt.getTime() > availabilityNowMillis,
        );
        if (!c.isAvailable || openSlots.length === 0) return false;
      }
      return true;
    });
  }, [
    counsellors,
    searchQuery,
    selectedCategory,
    availableNow,
    counsellorSlotsMap,
    availabilityNowMillis,
  ]);

  // Asia/Colombo timezone alignment formatting
  const formatColomboDateTime = (timestamp?: any) => {
    if (!timestamp) return "Date TBD";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Colombo",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Colombo",
    });
    return `${dateStr} • ${timeStr}`;
  };

  const formatColomboDateOnly = (timestamp?: any) => {
    if (!timestamp) return "Scheduled Slot";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Colombo",
    });
  };

  const nowMillis = Date.now();
  const compareSessionStart = (a: Booking, b: Booking) =>
    a.startAt.toMillis() - b.startAt.toMillis();

  // End-to-end booking lifecycle management
  const upcomingSessions = useMemo(() => {
    const sessionsWithPendingReschedule = new Set(
      sessions
        .filter((booking) => booking.status === "pending" && booking.rescheduledFrom)
        .map((booking) => booking.rescheduledFrom),
    );

    return sessions.filter((s) => {
      if (s.status === "pending") return true;
      if (s.status === "confirmed") {
        if (sessionsWithPendingReschedule.has(s.id)) return false;
        if (s.endAt && typeof s.endAt.toMillis === "function") {
          return s.endAt.toMillis() >= nowMillis;
        }
        return true;
      }
      return false;
    }).sort(compareSessionStart);
  }, [sessions, nowMillis]);

  const pastSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.status === "completed") return true;
      if (s.status === "confirmed") {
        if (s.endAt && typeof s.endAt.toMillis === "function") {
          return s.endAt.toMillis() < nowMillis;
        }
      }
      return false;
    }).sort(compareSessionStart);
  }, [sessions, nowMillis]);

  const cancelledSessions = useMemo(() => {
    return sessions
      .filter((s) => s.status === "cancelled" || s.status === "declined")
      .sort(compareSessionStart);
  }, [sessions]);

  const searchedSessions = useMemo(() => {
    const term = searchQuery.trim().toLocaleLowerCase();
    const filterSessions = (items: Booking[]) =>
      items.filter((session) => {
        const counsellor = counsellors.find((item) => item.uid === session.counsellorId);
        const searchableText = [
          counsellor?.fullName,
          ...(counsellor?.specialties || []),
          session.sessionType,
          session.sessionType.replace("-", " "),
          session.sessionType === "video" ? "video call" : "",
          session.sessionType === "chat" ? "chat session" : "",
          session.sessionType === "in-person" ? "in person" : "",
          session.status,
          session.cancelReason,
          session.notes,
          formatColomboDateTime(session.startAt),
          formatColomboDateOnly(session.startAt),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        return searchableText.includes(term);
      });

    return term
      ? {
          upcoming: filterSessions(upcomingSessions),
          past: filterSessions(pastSessions),
          cancelled: filterSessions(cancelledSessions),
        }
      : {
          upcoming: upcomingSessions,
          past: pastSessions,
          cancelled: cancelledSessions,
        };
  }, [searchQuery, counsellors, upcomingSessions, pastSessions, cancelledSessions]);

  // Modality-aware Launching for confirmed sessions
  const handleJoinSession = (session: Booking) => {
    if (session.sessionType === "chat") {
      router.push({
        pathname: "/(student)/session/chat",
        params: { uid: session.counsellorId, bookingId: session.id },
      });
    } else if (session.sessionType === "in-person") {
      router.push({
        pathname: "/(student)/session/details",
        params: { id: session.id },
      });
    } else {
      // Default: Video Call
      router.push({
        pathname: "/(student)/session/video-call",
        params: { id: session.id },
      });
    }
  };

  const openSessionDetails = (session: Booking) => {
    router.push({
      pathname: "/(student)/session/details",
      params: { id: session.id },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Counselor Booking</Text>
          <Text style={styles.headerSubtitle}>Confidential University Mental Health Care</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput,
              Platform.OS === "web" ? webSearchInputStyle : undefined,
            ]}
            placeholder={
              mainTab === "my-sessions"
                ? "Search sessions by counselor, date, type, or status..."
                : "Search counselors by name, title, or specialty..."
            }
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Categories / Specialties Filter */}
        {mainTab === "find-counselor" && <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
          contentContainerStyle={styles.categoriesContent}
        >
          <Pressable
            style={[styles.categoryPill, selectedCategory === "All" && styles.categoryPillActive]}
            onPress={() => {
              setSelectedCategory("All");
              setMainTab("find-counselor");
            }}
          >
            <Text style={[styles.categoryText, selectedCategory === "All" && styles.categoryTextActive]}>
              All
            </Text>
          </Pressable>
          {["Anxiety", "Stress", "Depression", "Academic Pressure", "Sleep", "Relationships"].map(
            (cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  setMainTab("find-counselor");
                }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>}

        {/* Top Dual-Scope Tabs */}
        <View style={styles.topTabs}>
          <Pressable
            style={[styles.tab, mainTab === "find-counselor" && styles.tabActive]}
            onPress={() => setMainTab("find-counselor")}
          >
            <Text
              style={[
                styles.tabText,
                mainTab === "find-counselor" && styles.tabTextActive,
              ]}
            >
              Find Counselor ({filteredCounsellors.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mainTab === "my-sessions" && styles.tabActive]}
            onPress={() => setMainTab("my-sessions")}
          >
            <Text
              style={[
                styles.tabText,
                mainTab === "my-sessions" && styles.tabTextActive,
              ]}
            >
              My Sessions (
              {upcomingSessions.length + pastSessions.length + cancelledSessions.length})
            </Text>
          </Pressable>
        </View>

        {/* ─── SCOPE 1: MY SESSIONS ─── */}
        {mainTab === "my-sessions" && (
          <>
            {/* Sub-filters across lifecycle */}
            <View style={styles.subFilters}>
              <Pressable
                style={[styles.subFilterPill, filter === "upcoming" && styles.subFilterPillActive]}
                onPress={() => setFilter("upcoming")}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    filter === "upcoming" && styles.subFilterTextActive,
                  ]}
                >
                  Upcoming ({searchedSessions.upcoming.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.subFilterPill, filter === "past" && styles.subFilterPillActive]}
                onPress={() => setFilter("past")}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    filter === "past" && styles.subFilterTextActive,
                  ]}
                >
                  Past ({searchedSessions.past.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.subFilterPill, filter === "cancelled" && styles.subFilterPillActive]}
                onPress={() => setFilter("cancelled")}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    filter === "cancelled" && styles.subFilterTextActive,
                  ]}
                >
                  Cancelled ({searchedSessions.cancelled.length})
                </Text>
              </Pressable>
            </View>

            {/* UPCOMING SESSIONS */}
            {filter === "upcoming" && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={typography.heading}>Active Appointments</Text>
                  <Text style={typography.caption}>
                    Pending requests & confirmed upcoming appointments
                  </Text>
                </View>

                {sessionsLoading ? (
                  <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                ) : searchedSessions.upcoming.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateIconBox}>
                      <Ionicons name="calendar-outline" size={26} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyStateText}>
                      {searchQuery.trim() ? "No matching upcoming sessions" : "No upcoming sessions"}
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Find a counselor and book a consultation to begin care.
                    </Text>
                  </View>
                ) : (
                  searchedSessions.upcoming.map((session) => {
                    const isPending = session.status === "pending";
                    const matchedCounsellor = counsellors.find(
                      (c) => c.uid === session.counsellorId
                    );
                    const counsellorName = matchedCounsellor?.fullName || "Licensed Counselor";
                    const counsellorSpecialty =
                      matchedCounsellor?.specialties?.[0] || "University Psychological Care";

                    return (
                      <Card key={session.id} style={styles.sessionCard}>
                        {/* Top Edge Indicator */}
                        <View
                          style={[
                            styles.cardTopIndicator,
                            isPending && { backgroundColor: "#F59E0B" },
                          ]}
                        />

                        <Pressable
                          disabled={isPending}
                          onPress={() => openSessionDetails(session)}
                          style={styles.cardContent}
                          accessibilityRole={isPending ? undefined : "button"}
                          accessibilityLabel={
                            isPending
                              ? undefined
                              : `View session details for ${formatColomboDateTime(session.startAt)}`
                          }
                        >
                          <View style={styles.cardTopRow}>
                            <View
                              style={[
                                styles.statusPill,
                                isPending && { backgroundColor: "#FEF3C7" },
                              ]}
                            >
                              <View
                                style={[
                                  styles.statusDot,
                                  isPending && { backgroundColor: "#D97706" },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusText,
                                  isPending && { color: "#B45309" },
                                ]}
                              >
                                {isPending ? "Pending Counselor Review" : "Confirmed • Scheduled"}
                              </Text>
                            </View>
                            <Text style={styles.refText}>
                              Ref: #{session.id.substring(0, 5).toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.doctorInfo}>
                            <View style={styles.avatarContainer}>
                              <View style={styles.doctorAvatar}>
                                <CounsellorAvatar
                                  uid={session.counsellorId}
                                  name={counsellorName}
                                  size={52}
                                />
                              </View>
                              <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>Verified</Text>
                              </View>
                            </View>
                            <View style={styles.doctorDetails}>
                              <View style={styles.doctorNameRow}>
                                <Text style={styles.doctorName}>{counsellorName}</Text>
                                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                              </View>
                              <Text style={styles.doctorSpecialty}>
                                Focus:{" "}
                                <Text style={{ color: colors.textSecondary }}>
                                  {counsellorSpecialty}
                                </Text>
                              </Text>
                            </View>
                          </View>

                          <View style={styles.sessionDetailsBox}>
                            <View style={styles.detailRow}>
                              <Ionicons name="time-outline" size={16} color={colors.primary} />
                              <Text style={styles.detailTextBold}>
                                {formatColomboDateTime(session.startAt)}{" "}
                                <Text style={styles.detailTextLight}>(45 min)</Text>
                              </Text>
                            </View>
                            <View style={styles.badgesRow}>
                              <View style={styles.infoBadge}>
                                <Ionicons
                                  name={
                                    session.sessionType === "chat"
                                      ? "chatbubble-outline"
                                      : session.sessionType === "in-person"
                                      ? "business-outline"
                                      : "videocam-outline"
                                  }
                                  size={14}
                                  color={colors.primary}
                                />
                                <Text style={styles.infoBadgeTextDark}>
                                  {session.sessionType === "chat"
                                    ? "Secure Chat"
                                    : session.sessionType === "in-person"
                                    ? "In person"
                                    : "Video Call"}
                                </Text>
                              </View>
                              <View style={styles.infoBadge}>
                                <Ionicons
                                  name="shield-checkmark-outline"
                                  size={14}
                                  color={colors.textSecondary}
                                />
                                <Text style={styles.infoBadgeTextDark}>Anonymous Mode</Text>
                              </View>
                            </View>
                          </View>

                        </Pressable>

                        <View style={styles.cardActions}>
                          {isPending ? (
                            <View style={styles.pendingNoticeBox}>
                              <Ionicons name="hourglass-outline" size={18} color="#D97706" />
                              <Text style={styles.pendingNoticeText}>
                                Request submitted. Awaiting counselor review and clinical confirmation.
                              </Text>
                            </View>
                          ) : session.sessionType !== "in-person" ? (
                            <Pressable
                              style={[
                                styles.actionBtn,
                                {
                                  backgroundColor:
                                    session.sessionType === "chat"
                                      ? "#0D9488"
                                      : colors.primary,
                                  flexDirection: "row",
                                  justifyContent: "center",
                                  gap: 8,
                                  paddingVertical: 14,
                                },
                              ]}
                              onPress={() => handleJoinSession(session)}
                            >
                              <Ionicons
                                name={
                                  session.sessionType === "chat"
                                    ? "chatbubbles-outline"
                                    : "videocam-outline"
                                }
                                size={20}
                                color={colors.white}
                              />
                              <Text style={{ color: colors.white, fontWeight: "600", fontSize: 16 }}>
                                {session.sessionType === "chat"
                                  ? "Open Secure Chat"
                                  : "Join Video Call"}
                              </Text>
                            </Pressable>
                          ) : null}

                          <View style={styles.actionButtonsRow}>
                            {!isPending && (
                              <Pressable
                                style={[styles.actionBtn, styles.rescheduleBtn]}
                                onPress={() =>
                                  router.push({
                                    pathname: "/(student)/session/counselor",
                                    params: {
                                      uid: session.counsellorId,
                                      bookingId: session.id,
                                    },
                                  })
                                }
                              >
                                <Text style={styles.rescheduleText}>Reschedule</Text>
                              </Pressable>
                            )}
                            <Pressable
                              style={[styles.actionBtn, styles.cancelBtn, isPending && { flex: 1 }]}
                              onPress={() =>
                                router.push({
                                  pathname: "/(student)/session/cancel",
                                  params: { id: session.id },
                                })
                              }
                            >
                              <Text style={styles.cancelText}>
                                {isPending ? "Cancel Request" : "Cancel Booking"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </Card>
                    );
                  })
                )}
              </>
            )}

            {/* PAST SESSIONS */}
            {filter === "past" && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={typography.heading}>Past Sessions</Text>
                  <Text style={typography.caption}>
                    Review your completed clinical consultations
                  </Text>
                </View>

                {sessionsLoading ? (
                  <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                ) : searchedSessions.past.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateIconBox}>
                      <MaterialCommunityIcons
                        name="history"
                        size={26}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.emptyStateText}>
                      {searchQuery.trim() ? "No matching past sessions" : "No past consultations yet"}
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Completed appointments and clinical records will appear here.
                    </Text>
                  </View>
                ) : (
                  searchedSessions.past.map((session) => {
                    const matchedCounsellor = counsellors.find(
                      (c) => c.uid === session.counsellorId
                    );
                    const counsellorName = matchedCounsellor?.fullName || "Licensed Counselor";

                    return (
                      <Card key={session.id} style={styles.sessionCard}>
                        <Pressable
                          style={StyleSheet.absoluteFill}
                          onPress={() => openSessionDetails(session)}
                          accessibilityRole="button"
                          accessibilityLabel={`View session details for ${formatColomboDateTime(session.startAt)}`}
                        />
                        <View style={[styles.cardTopIndicator, { backgroundColor: "#9CA3AF" }]} />
                        <View style={styles.cardContent}>
                          <View style={styles.cardTopRow}>
                            <View style={[styles.statusPill, { backgroundColor: "#F3F4F6" }]}>
                              <View style={[styles.statusDot, { backgroundColor: "#6B7280" }]} />
                              <Text style={[styles.statusText, { color: "#4B5563" }]}>
                                Completed • {formatColomboDateOnly(session.startAt)}
                              </Text>
                            </View>
                            <Text style={styles.refText}>
                              Ref: #{session.id.substring(0, 5).toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.doctorInfo}>
                            <View style={styles.avatarContainer}>
                              <View style={styles.doctorAvatar}>
                                <CounsellorAvatar
                                  uid={session.counsellorId}
                                  name={counsellorName}
                                  size={52}
                                />
                              </View>
                            </View>
                            <View style={styles.doctorDetails}>
                              <View style={styles.doctorNameRow}>
                                <Text style={styles.doctorName}>{counsellorName}</Text>
                                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                              </View>
                              <Text style={styles.doctorSpecialty}>
                                Modality:{" "}
                                <Text style={{ color: colors.textSecondary }}>
                                  {session.sessionType === "chat"
                                    ? "Secure Chat"
                                    : session.sessionType === "in-person"
                                    ? "In person"
                                    : "Telehealth Video"}
                                </Text>
                              </Text>
                            </View>
                          </View>

                          <View style={styles.sessionDetailsBox}>
                            <View style={styles.detailRow}>
                              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                              <Text style={styles.detailTextBold}>
                                {formatColomboDateTime(session.startAt)}
                              </Text>
                            </View>
                            <View style={styles.badgesRow}>
                              <View style={styles.infoBadge}>
                                <Ionicons
                                  name="shield-checkmark-outline"
                                  size={14}
                                  color={colors.textSecondary}
                                />
                                <Text style={styles.infoBadgeTextDark}>Anonymous Mode</Text>
                              </View>
                            </View>
                          </View>

                          
                        </View>
                      </Card>
                    );
                  })
                )}
              </>
            )}

            {/* CANCELLED & DECLINED SESSIONS */}
            {filter === "cancelled" && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={typography.heading}>Cancelled Requests</Text>
                  <Text style={typography.caption}>
                    Cancelled by you or declined by counselor
                  </Text>
                </View>

                {sessionsLoading ? (
                  <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                ) : searchedSessions.cancelled.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateIconBox}>
                      <Ionicons name="close-circle-outline" size={26} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyStateText}>
                      {searchQuery.trim() ? "No matching cancelled sessions" : "No cancelled sessions"}
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      All your bookings are currently active or completed.
                    </Text>
                  </View>
                ) : (
                  searchedSessions.cancelled.map((session) => {
                    const isDeclined = session.status === "declined";
                    const matchedCounsellor = counsellors.find(
                      (c) => c.uid === session.counsellorId
                    );
                    const counsellorName = matchedCounsellor?.fullName || "Licensed Counselor";

                    return (
                      <Card key={session.id} style={styles.sessionCard}>
                        <Pressable
                          style={StyleSheet.absoluteFill}
                          onPress={() => openSessionDetails(session)}
                          accessibilityRole="button"
                          accessibilityLabel={`View session details for ${formatColomboDateTime(session.startAt)}`}
                        />
                        <View style={[styles.cardTopIndicator, { backgroundColor: "#EF4444" }]} />
                        <View style={styles.cardContent}>
                          <View style={styles.cardTopRow}>
                            <View
                              style={[
                                styles.cancelledPill,
                                isDeclined && { backgroundColor: "#FEE2E2" },
                              ]}
                            >
                              <View
                                style={[
                                  styles.cancelledDot,
                                  isDeclined && { backgroundColor: "#DC2626" },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.cancelledStatusText,
                                  isDeclined && { color: "#991B1B" },
                                ]}
                              >
                                {isDeclined ? "Declined by Counselor" : "Cancelled"} •{" "}
                                {formatColomboDateOnly(session.startAt)}
                              </Text>
                            </View>
                            <Text style={styles.refText}>
                              Ref: #{session.id.substring(0, 5).toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.doctorInfo}>
                            <View style={styles.doctorAvatar}>
                              <CounsellorAvatar
                                uid={session.counsellorId}
                                name={counsellorName}
                                size={52}
                              />
                            </View>
                            <View style={styles.doctorDetails}>
                              <View style={styles.doctorNameRow}>
                                <Text style={styles.doctorName}>{counsellorName}</Text>
                                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                              </View>
                              <Text style={styles.doctorSpecialty}>
                                Status:{" "}
                                <Text style={{ color: colors.textSecondary }}>
                                  {isDeclined ? "Declined by Counselor" : "Student Cancellation"}
                                </Text>
                              </Text>
                            </View>
                          </View>

                          <View style={styles.originalSlotBox}>
                            <View style={styles.originalSlotHeaderRow}>
                              <View style={styles.calendarIconBox}>
                                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                              </View>
                              <View>
                                <Text style={styles.originalSlotLabel}>Original Time Slot</Text>
                                <Text style={styles.originalSlotTime}>
                                  {formatColomboDateTime(session.startAt)}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.reasonRow}>
                              <Text style={styles.reasonLabel}>Reason: </Text>
                              <Text style={styles.reasonText}>
                                {session.cancelReason ||
                                  (isDeclined
                                    ? "Counselor schedule conflict / Unavailable"
                                    : "User Cancellation")}
                              </Text>
                            </View>
                          </View>

                          <Button
                            title="Delete from list"
                            icon="trash-outline"
                            variant="danger"
                            onPress={() =>
                              Alert.alert(
                                "Delete cancelled session?",
                                "This will remove this cancelled session from your list.",
                                [
                                  { text: "Keep", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => {
                                      if (!user?.uid) return;
                                      void deleteCancelledBooking(user.uid, session).catch((error) => {
                                        console.error("[sessions] Failed to delete cancelled booking:", error);
                                        Alert.alert(
                                          "Could not delete session",
                                          error instanceof Error
                                            ? error.message
                                            : "Please try again.",
                                        );
                                      });
                                    },
                                  },
                                ],
                              )
                            }
                          />
                        </View>
                      </Card>
                    );
                  })
                )}
              </>
            )}
          </>
        )}

        {/* ─── SCOPE 2: FIND COUNSELOR (TRIAGE & DISCOVERY) ─── */}
        {mainTab === "find-counselor" && (
          <View style={styles.findCounselorContainer}>
            {/* Live Available Now Calendar Toggle */}
            <View style={styles.availabilityToggleBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.availabilityTitle}>Show only available now</Text>
                <Text style={styles.availabilitySub}>
                  Filter by immediate openings synced live with counselor schedule
                </Text>
              </View>
              <Switch
                value={availableNow}
                onValueChange={setAvailableNow}
                trackColor={{ true: colors.primary }}
              />
            </View>

            {/* Counselors count row */}
            <View style={styles.sortRow}>
              <Text style={styles.showingText}>
                {filteredCounsellors.length === counsellors.length ? "Total " : "Showing "}
                <Text style={{ fontWeight: "700" }}>
                  {filteredCounsellors.length}
                  {filteredCounsellors.length !== counsellors.length
                    ? ` of ${counsellors.length}`
                    : ""}{" "}
                  counselor{filteredCounsellors.length !== 1 ? "s" : ""}
                </Text>
              </Text>
            </View>

            {loading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : filteredCounsellors.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No counselors found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {availableNow
                    ? "No counselors currently have immediate open slots. Try turning off 'Available now' to view full availability."
                    : "Try adjusting your search or specialty filters."}
                </Text>
              </View>
            ) : (
              filteredCounsellors.map((counselor) => {
                const openSlots = getCounsellorOpenSlots(counselor);
                const isCounsellorAvailable = counselor.isAvailable && openSlots.length > 0;
                const nextSlotText = isCounsellorAvailable
                  ? `Next: ${formatOpenSlot(openSlots[0])}`
                  : "No upcoming openings";

                return (
                  <Card key={counselor.uid} style={styles.findCard}>
                    <View style={styles.findCardTop}>
                      <View style={styles.findAvatar}>
                        <CounsellorAvatar
                          uid={counselor.uid}
                          name={counselor.fullName}
                          size={58}
                        />
                      </View>
                      <View style={styles.findDetails}>
                        <Text style={styles.findName}>{counselor.fullName}</Text>
                        <Text style={styles.findSpecialty}>
                          {counselor.title || counselor.specialties.join(" • ")}
                        </Text>
                        <View style={styles.findRatingRow}>
                          <Text style={styles.findRating}>
                            {counselor.experienceYears} yrs experience
                          </Text>
                          <View style={styles.availabilityIndicatorRow}>
                            <View
                              style={[
                                styles.availabilityDot,
                                {
                                  backgroundColor: counselor.isAvailable
                                    && openSlots.length > 0
                                    ? "#10B981"
                                    : "#9CA3AF",
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.findAvailability,
                                { color: isCounsellorAvailable ? "#065F46" : "#6B7280" },
                              ]}
                            >
                              {isCounsellorAvailable ? "Available" : "Unavailable"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.findCardBottom}>
                      <View style={styles.nextTimeRow}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.nextTimeText} numberOfLines={1}>
                          {nextSlotText}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.viewProfileBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/(student)/session/counselor",
                            params: { uid: counselor.uid },
                          })
                        }
                      >
                        <Text style={styles.viewProfileText}>View Profile & Book</Text>
                        <Ionicons name="arrow-forward" size={15} color="#FFF" />
                      </Pressable>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingRight: FLOATING_HELP_CLEARANCE,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    borderWidth: 0,
    outlineWidth: 0,
    backgroundColor: "transparent",
  },
  categories: {
    marginBottom: spacing.md,
  },
  categoriesContent: {
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  topTabs: {
    flexDirection: "row",
    backgroundColor: colors.success,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  subFilters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  subFilterPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3,
  },
  subFilterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subFilterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  subFilterTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  sessionCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTopIndicator: {
    height: 4,
    backgroundColor: colors.primary,
    width: "100%",
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardActions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F5EC",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  refText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: "hidden",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 1,
    alignItems: "center",
  },
  verifiedText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "700",
  },
  doctorDetails: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: colors.text,
  },
  sessionDetailsBox: {
    backgroundColor: "#F8FAF9",
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailTextBold: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  detailTextLight: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  infoBadgeTextDark: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "600",
  },
  pendingNoticeBox: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pendingNoticeText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  rescheduleBtn: {
    borderColor: colors.primary,
    backgroundColor: "#F4FAF6",
  },
  rescheduleText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  cancelBtn: {
    borderColor: "#F4D8D8",
    backgroundColor: "#FFF5F5",
  },
  cancelText: {
    color: "#B74646",
    fontWeight: "600",
    fontSize: 13,
  },
  cancelledPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE8E8",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  cancelledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  cancelledStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.danger,
  },
  originalSlotBox: {
    backgroundColor: "#F3F0E6",
    padding: spacing.sm + 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  originalSlotHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  calendarIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  originalSlotLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  originalSlotTime: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  reasonRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  reasonLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reasonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyStateIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  findCounselorContainer: {
    paddingBottom: spacing.xl,
  },
  availabilityToggleBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  availabilitySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    paddingRight: 8,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  showingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  findCard: {
    borderWidth: 1,
    borderColor: "#BBE5C4",
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  findCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  findAvatar: {
    width: 58,
    height: 58,
    borderRadius: 8,
    overflow: "hidden",
  },
  findDetails: {
    flex: 1,
  },
  findName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  findSpecialty: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  findRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  findRating: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  availabilityIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  findAvailability: {
    fontSize: 11,
    fontWeight: "700",
  },
  findCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: spacing.xs + 2,
  },
  nextTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  nextTimeText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    gap: 4,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
});
