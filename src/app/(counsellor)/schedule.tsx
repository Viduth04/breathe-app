// Counsellor Schedule - Muaath (Member 4). Supports FR08, FR01, NFR01, NFR02.
// Clinical schedule & availability management supporting Day, Week, and Month views
// matching approved prototypes media_1791025108845.png and media_1791025039763.png.

import React, { useState, useEffect, useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  MOCK_SCHEDULE_PREFERENCES,
} from "@/services/mockScheduleData";
import {
  SchedulePreference,
  ViewMode,
} from "@/types/counsellorSchedule";
import {
  ScheduleDaySlot,
  useCounsellorStore,
} from "@/services/counsellorStore";

export default function CounsellorScheduleScreen() {
  const params = useLocalSearchParams<{
    view?: string;
    day?: string;
    dateKey?: string;
  }>();

  const store = useCounsellorStore();
  const { user } = useAuth();

  // View mode: day, week, month (defaults to 'day' if param specifies day, or 'week')
  const [viewMode, setViewMode] = useState<ViewMode>(
    (params.view as ViewMode) || "day"
  );

  // Live Colombo (+05:30) Current Date
  const todayColombo = useMemo(() => {
    const now = new Date();
    const colomboOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + colomboOffset);
  }, []);

  const todayKey = useMemo(() => {
    const y = todayColombo.getFullYear();
    const m = String(todayColombo.getMonth() + 1).padStart(2, "0");
    const d = String(todayColombo.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [todayColombo]);

  // Helper to find Monday of the week for any date
  const getWeekStart = (d: Date): Date => {
    const copy = new Date(d);
    const day = copy.getDay(); // 0 is Sun, 1 is Mon
    const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
    copy.setDate(diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  /**
   * Parses time strings like "09:00 AM", "11:00 AM – 11:30 AM", "04:00 PM – 4:30 PM"
   * into minutes from midnight (0..1439) for chronological slot sorting.
   */
  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 9999;
    const firstPart = timeStr.split(/[–\-]/)[0].trim();
    const match = firstPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 9999;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3] ? match[3].toUpperCase() : (hours < 8 ? "PM" : "AM");
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Selected date key for Day View (e.g. "2026-10-07" or "all")
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    params.dateKey || todayKey
  );

  // Week View: Live navigation state
  const [weekNavDate, setWeekNavDate] = useState<Date>(() => getWeekStart(todayColombo));
  const [selectedWeekDateKey, setSelectedWeekDateKey] = useState<string>(
    params.dateKey || todayKey
  );

  // Month View: Live navigation state
  const [monthNavDate, setMonthNavDate] = useState<Date>(
    () => new Date(todayColombo.getFullYear(), todayColombo.getMonth(), 1)
  );
  const [selectedMonthDateKey, setSelectedMonthDateKey] = useState<string>(
    params.dateKey || todayKey
  );

  // Selected calendar day (legacy fallback)
  const selectedCalendarDay = store.selectedCalendarDay || todayColombo.getDate();

  // Scheduling Preferences (active across views)
  const [preferences, setPreferences] = useState<SchedulePreference[]>(
    MOCK_SCHEDULE_PREFERENCES
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Update view mode and dates when route params change
  useEffect(() => {
    if (params.view && (params.view === "day" || params.view === "week" || params.view === "month")) {
      setViewMode(params.view as ViewMode);
    }
    if (params.dateKey) {
      setSelectedDateKey(params.dateKey);
      setSelectedWeekDateKey(params.dateKey);
      setSelectedMonthDateKey(params.dateKey);
      const [y, m, d] = params.dateKey.split("-").map(Number);
      if (y && m && d) {
        const paramDate = new Date(y, m - 1, d);
        setWeekNavDate(getWeekStart(paramDate));
        setMonthNavDate(new Date(y, m - 1, 1));
      }
    }
  }, [params.view, params.dateKey]);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const getActiveDateKey = () => {
    if (viewMode === "week") return selectedWeekDateKey;
    if (viewMode === "month") return selectedMonthDateKey;
    return selectedDateKey;
  };

  // Quick Block Actions with real database persistence
  const blockMorning = async () => {
    const targetDateKey = getActiveDateKey();
    const morningSlots = store.scheduleDaySlots.filter((s) => {
      if (s.dateKey !== targetDateKey || s.isBooked) return false;
      const t = s.startTime || s.timeRange;
      const isMorning = t.includes("AM") || t.startsWith("09:") || t.startsWith("10:") || t.startsWith("11:");
      return isMorning && !store.heldScheduleSlots[s.id];
    });
    for (const s of morningSlots) {
      await store.toggleHoldScheduleSlot(s.id);
    }
    setBlockModalVisible(false);
    showToast(`Morning slots held for ${targetDateKey} (${morningSlots.length} slots).`);
  };

  const blockAfternoon = async () => {
    const targetDateKey = getActiveDateKey();
    const afternoonSlots = store.scheduleDaySlots.filter((s) => {
      if (s.dateKey !== targetDateKey || s.isBooked) return false;
      const t = s.startTime || s.timeRange;
      const isAfternoon = t.includes("PM") || t.startsWith("12:") || t.startsWith("01:") || t.startsWith("02:") || t.startsWith("03:") || t.startsWith("04:");
      return isAfternoon && !store.heldScheduleSlots[s.id];
    });
    for (const s of afternoonSlots) {
      await store.toggleHoldScheduleSlot(s.id);
    }
    setBlockModalVisible(false);
    showToast(`Afternoon slots held for ${targetDateKey} (${afternoonSlots.length} slots).`);
  };

  const blockFullDay = async () => {
    const targetDateKey = getActiveDateKey();
    const daySlots = store.scheduleDaySlots.filter(
      (s) => s.dateKey === targetDateKey && !s.isBooked && !store.heldScheduleSlots[s.id]
    );
    for (const s of daySlots) {
      await store.toggleHoldScheduleSlot(s.id);
    }
    setBlockModalVisible(false);
    showToast(`All bookable slots held for ${targetDateKey} (${daySlots.length} slots).`);
  };

  const togglePreference = (index: number) => {
    setPreferences((prev) =>
      prev.map((pref, i) => {
        if (i === index) {
          return { ...pref, enabled: !pref.enabled };
        }
        return pref;
      })
    );
  };

  const markAllOpen = async () => {
    const targetDateKey = getActiveDateKey();
    const heldSlots = store.scheduleDaySlots.filter(
      (s) => s.dateKey === targetDateKey && !s.isBooked && store.heldScheduleSlots[s.id]
    );
    for (const s of heldSlots) {
      await store.toggleHoldScheduleSlot(s.id);
    }
    showToast(`All slots for this day marked open for student booking (${heldSlots.length} updated).`);
  };

  const handleHoldSlot = async (slotId: string) => {
    try {
      const isNowHeld = await store.toggleHoldScheduleSlot(slotId);
      showToast(isNowHeld ? "Slot held (hidden from student booking)" : "Slot hold released (available for students)");
    } catch (e) {
      console.warn("Failed to toggle hold:", e);
      showToast("Error updating slot hold status");
    }
  };

  // Week View Navigation Handlers
  const handlePrevWeek = () => {
    setWeekNavDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekNavDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleTodayWeek = () => {
    setWeekNavDate(getWeekStart(todayColombo));
    setSelectedWeekDateKey(todayKey);
  };

  const weekRangeLabel = useMemo(() => {
    const start = new Date(weekNavDate);
    const end = new Date(weekNavDate);
    end.setDate(end.getDate() + 6);
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} – ${endStr}`;
  }, [weekNavDate]);

  // Dynamic 7-day strip computed for the viewed week
  const currentWeekDays = useMemo(() => {
    const days: Array<{
      dateKey: string;
      dayShort: string;
      dateNum: number;
      monthShort: string;
      fullDisplay: string;
      isToday: boolean;
      totalSlots: number;
      openSlots: number;
      bookedSlots: number;
      heldSlots: number;
      hasOpen: boolean;
      hasBooked: boolean;
      hasHeld: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekNavDate);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const dk = `${y}-${m}-${dayNum}`;

      const daySlots = store.scheduleDaySlots.filter((s) => s.dateKey === dk);
      const extraConfirmedBookings = store.calendarBookings.filter(
        (b) =>
          !b.isOpenSlot &&
          b.dateKey === dk &&
          !daySlots.some((s) => s.id === b.id || (s.startTime === b.timeSlot || s.timeRange === b.timeRange))
      );

      const booked = daySlots.filter((s) => s.isBooked).length + extraConfirmedBookings.length;
      const held = daySlots.filter((s) => !s.isBooked && (store.heldScheduleSlots[s.id] || s.isHeld)).length;
      const open = daySlots.filter((s) => !s.isBooked && !(store.heldScheduleSlots[s.id] || s.isHeld)).length;
      const total = daySlots.length + extraConfirmedBookings.length;

      days.push({
        dateKey: dk,
        dayShort: d.toLocaleDateString("en-US", { weekday: "short" }),
        dateNum: d.getDate(),
        monthShort: d.toLocaleDateString("en-US", { month: "short" }),
        fullDisplay: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
        isToday: dk === todayKey,
        totalSlots: total,
        openSlots: open,
        bookedSlots: booked,
        heldSlots: held,
        hasOpen: open > 0,
        hasBooked: booked > 0,
        hasHeld: held > 0,
      });
    }
    return days;
  }, [weekNavDate, todayKey, store.scheduleDaySlots, store.heldScheduleSlots]);

  const selectedWeekMeta = useMemo(() => {
    const match = currentWeekDays.find((d) => d.dateKey === selectedWeekDateKey);
    const dateTitle = match ? match.fullDisplay : selectedWeekDateKey;
    const daySlots = store.scheduleDaySlots.filter((s) => s.dateKey === selectedWeekDateKey);
    const booked = daySlots.filter((s) => s.isBooked).length;
    const held = daySlots.filter((s) => !s.isBooked && (store.heldScheduleSlots[s.id] || s.isHeld)).length;
    const open = daySlots.filter((s) => !s.isBooked && !(store.heldScheduleSlots[s.id] || s.isHeld)).length;
    return {
      title: dateTitle,
      statsText: `${open} Available • ${booked} Booked • ${held} Held (${daySlots.length} Total)`,
      openCount: open,
      bookedCount: booked,
      heldCount: held,
      totalCount: daySlots.length,
    };
  }, [selectedWeekDateKey, currentWeekDays, store.scheduleDaySlots, store.heldScheduleSlots]);

  const displayedWeekDaySlots = useMemo(() => {
    return store.scheduleDaySlots.filter((s) => s.dateKey === selectedWeekDateKey);
  }, [store.scheduleDaySlots, selectedWeekDateKey]);

  // Month View Navigation Handlers
  const handlePrevMonth = () => {
    setMonthNavDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setMonthNavDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    setMonthNavDate(new Date(todayColombo.getFullYear(), todayColombo.getMonth(), 1));
    setSelectedMonthDateKey(todayKey);
  };

  const monthTitleLabel = useMemo(() => {
    return monthNavDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [monthNavDate]);

  const isCurrentMonthActive = useMemo(() => {
    return (
      monthNavDate.getFullYear() === todayColombo.getFullYear() &&
      monthNavDate.getMonth() === todayColombo.getMonth()
    );
  }, [monthNavDate, todayColombo]);

  // Dynamic live calendar grid computed for the viewed month
  const monthCalendarDays = useMemo(() => {
    const year = monthNavDate.getFullYear();
    const month = monthNavDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      day: number;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasBooked: boolean;
      hasOpen: boolean;
      hasHeld: boolean;
      totalSlots: number;
    }> = [];

    // Trailing previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, "0");
      const d = String(dNum).padStart(2, "0");
      const dk = `${y}-${m}-${d}`;
      days.push({
        day: dNum,
        dateKey: dk,
        isCurrentMonth: false,
        isToday: dk === todayKey,
        hasBooked: false,
        hasOpen: false,
        hasHeld: false,
        totalSlots: 0,
      });
    }

    // Current month days
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const y = year;
      const m = String(month + 1).padStart(2, "0");
      const d = String(dNum).padStart(2, "0");
      const dk = `${y}-${m}-${d}`;

      const daySlots = store.scheduleDaySlots.filter((s) => s.dateKey === dk);
      const extraConfirmedBookings = store.calendarBookings.filter(
        (b) =>
          !b.isOpenSlot &&
          b.dateKey === dk &&
          !daySlots.some((s) => s.id === b.id || (s.startTime === b.timeSlot || s.timeRange === b.timeRange))
      );

      const hasBooked = daySlots.some((s) => s.isBooked) || extraConfirmedBookings.length > 0;
      const hasHeld = daySlots.some((s) => !s.isBooked && (store.heldScheduleSlots[s.id] || s.isHeld));
      const hasOpen = daySlots.some((s) => !s.isBooked && !(store.heldScheduleSlots[s.id] || s.isHeld));

      days.push({
        day: dNum,
        dateKey: dk,
        isCurrentMonth: true,
        isToday: dk === todayKey,
        hasBooked,
        hasOpen,
        hasHeld,
        totalSlots: daySlots.length + extraConfirmedBookings.length,
      });
    }

    // Leading next month days
    const remaining = (7 - (days.length % 7)) % 7;
    for (let dNum = 1; dNum <= remaining; dNum++) {
      const nextDate = new Date(year, month + 1, dNum);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, "0");
      const d = String(dNum).padStart(2, "0");
      const dk = `${y}-${m}-${d}`;
      days.push({
        day: dNum,
        dateKey: dk,
        isCurrentMonth: false,
        isToday: dk === todayKey,
        hasBooked: false,
        hasOpen: false,
        hasHeld: false,
        totalSlots: 0,
      });
    }

    return days;
  }, [monthNavDate, todayKey, store.scheduleDaySlots, store.heldScheduleSlots]);

  const selectedMonthMeta = useMemo(() => {
    const [y, m, d] = selectedMonthDateKey.split("-").map(Number);
    const dateObj = y && m && d ? new Date(y, m - 1, d) : todayColombo;
    const dateTitle = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const daySlots = store.scheduleDaySlots.filter((s) => s.dateKey === selectedMonthDateKey);
    const booked = daySlots.filter((s) => s.isBooked).length;
    const held = daySlots.filter((s) => !s.isBooked && (store.heldScheduleSlots[s.id] || s.isHeld)).length;
    const open = daySlots.filter((s) => !s.isBooked && !(store.heldScheduleSlots[s.id] || s.isHeld)).length;
    return {
      title: dateTitle,
      statsText: `${open} Available • ${booked} Booked • ${held} Held (${daySlots.length} Total)`,
      openCount: open,
      bookedCount: booked,
      heldCount: held,
      totalCount: daySlots.length,
    };
  }, [selectedMonthDateKey, todayColombo, store.scheduleDaySlots, store.heldScheduleSlots]);

  const displayedMonthDaySlots = useMemo(() => {
    return store.scheduleDaySlots.filter((s) => s.dateKey === selectedMonthDateKey);
  }, [store.scheduleDaySlots, selectedMonthDateKey]);

  // Reusable slot card renderer across Day, Week, and Month views
  const renderScheduleSlotCard = (slot: ScheduleDaySlot) => {
    const isHeld = Boolean(store.heldScheduleSlots[slot.id] ?? slot.isHeld);

    if (!slot.isBooked) {
      // OPEN SLOT CARD
      return (
        <View key={slot.id} style={styles.openSlotCard}>
          <View style={styles.openSlotTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={styles.slotTimeBadge}>
                <Ionicons name="time-outline" size={13} color="#065F46" />
                <Text style={styles.slotTimeBadgeText}>{slot.timeRange}</Text>
              </View>
              {(slot.dateDisplay || slot.dateKey) ? (
                <View style={styles.slotDateBadge}>
                  <Ionicons name="calendar-outline" size={12} color="#475569" />
                  <Text style={styles.slotDateBadgeText}>
                    {slot.dateDisplay || slot.dateKey}
                  </Text>
                </View>
              ) : null}
            </View>

            <Pressable
              style={[
                styles.holdSlotBtn,
                isHeld && styles.holdSlotBtnActive,
              ]}
              onPress={() => handleHoldSlot(slot.id)}
              accessibilityRole="button"
              accessibilityLabel={isHeld ? "Release slot hold" : "Hold slot"}
              hitSlop={8}
            >
              <Ionicons
                name={isHeld ? "lock-closed" : "add"}
                size={14}
                color={isHeld ? "#B45309" : "#065F46"}
              />
              <Text
                style={[
                  styles.holdSlotBtnText,
                  isHeld && styles.holdSlotBtnTextActive,
                ]}
              >
                {isHeld ? "Held" : "Hold Slot"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.openSlotBody}>
            <View style={styles.openSlotIconBox}>
              <Ionicons
                name={isHeld ? "pause-circle-outline" : "checkmark-circle-outline"}
                size={20}
                color={isHeld ? "#B45309" : "#065F46"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.openSlotTitle}>
                  {isHeld ? "Slot Temporarily Held" : "Available for Student Booking"}
                </Text>
                <View style={[styles.availablePill, isHeld && { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.availablePillText, isHeld && { color: "#B45309" }]}>
                    {isHeld ? "Held" : "Available"}
                  </Text>
                </View>
              </View>
              <Text style={styles.openSlotSubtitle}>
                {isHeld
                  ? "Hidden from student booking directory"
                  : "Visible to all students • Real-time booking enabled"}
              </Text>

              {/* Modalities & Duration Badges */}
              <View style={styles.slotModalitiesRow}>
                {slot.sessionTypes && slot.sessionTypes.length > 0 ? (
                  slot.sessionTypes.map((type) => (
                    <View key={type} style={styles.modalityChip}>
                      <Ionicons
                        name={
                          type === "video"
                            ? "videocam-outline"
                            : type === "chat"
                            ? "chatbubble-ellipses-outline"
                            : "person-outline"
                        }
                        size={12}
                        color="#065F46"
                      />
                      <Text style={styles.modalityChipText}>
                        {type === "video" ? "Video Call" : type === "chat" ? "Secure Chat" : "In-Person"}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.modalityFallbackText}>
                    {slot.modalityText}
                  </Text>
                )}

                {slot.endTime && (
                  <View style={styles.durationPill}>
                    <Ionicons name="hourglass-outline" size={11} color="#475569" />
                    <Text style={styles.durationPillText}>
                      {slot.endTime === "Open End" ? "No Limit" : `Ends: ${slot.endTime}`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    }

    // CONFIRMED BOOKED CARD
    return (
      <Pressable
        key={slot.id}
        style={styles.bookedSlotCard}
        onPress={() => {
          if (slot.modalityType === "video") {
            // 1. VIDEO CALL FLOW: Ready to Join Lobby -> Active Video Call
            router.navigate({
              pathname: "/(counsellor-detail)/ready-to-join",
              params: {
                studentAnonId: slot.studentName,
                sessionTitle: "Encrypted Video Consultation",
                timeRange: slot.timeRange,
                sessionId: slot.bookingId || slot.id,
              },
            });
          } else if (slot.modalityType === "chat") {
            // 2. SECURE CHAT FLOW: Real-time Messages screen
            router.navigate({
              pathname: "/(counsellor)/messages",
              params: {
                studentAnonId: slot.studentName,
                sessionId: slot.id,
              },
            });
          } else if (slot.modalityType === "in-person") {
            // 3. IN-PERSON FLOW: Anonymous Session Details (Room 302 & clinical notes)
            router.navigate({
              pathname: "/(counsellor-detail)/anonymous-session-details",
              params: {
                sessionId: slot.id,
                studentAnonId: slot.studentName,
                sessionType: "in-person",
              },
            });
          } else {
            // Fallback to Confirmed Session Screen with dynamic modality handling
            router.navigate({
              pathname: "/(counsellor-detail)/confirmed-session",
              params: {
                sessionId: slot.id,
                studentAnonId: slot.studentName,
              },
            });
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`Session with ${slot.studentName}, ${slot.timeRange}`}
      >
        <View style={styles.bookedSlotHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={styles.slotTimeBadge}>
              <Ionicons name="time" size={13} color="#065F46" />
              <Text style={styles.slotTimeBadgeText}>{slot.timeRange}</Text>
            </View>
            {(slot.dateDisplay || slot.dateKey) ? (
              <View style={styles.slotDateBadge}>
                <Ionicons name="calendar-outline" size={12} color="#475569" />
                <Text style={styles.slotDateBadgeText}>
                  {slot.dateDisplay || slot.dateKey}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.confirmedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
            <Text style={styles.confirmedBadgeText}>CONFIRMED</Text>
          </View>
        </View>

        <View style={styles.bookedStudentRow}>
          <View
            style={[
              styles.bookedModalityIconBox,
              slot.modalityType === "video" && { backgroundColor: "#065F46" },
              slot.modalityType === "chat" && { backgroundColor: "#0284C7" },
              slot.modalityType === "voice" && { backgroundColor: "#D97706" },
              slot.modalityType === "in-person" && { backgroundColor: "#4F46E5" },
            ]}
          >
            {slot.modalityType === "video" && (
              <Ionicons name="videocam" size={20} color="#FFFFFF" />
            )}
            {slot.modalityType === "chat" && (
              <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
            )}
            {slot.modalityType === "voice" && (
              <Ionicons name="call" size={20} color="#FFFFFF" />
            )}
            {slot.modalityType === "in-person" && (
              <Ionicons name="person" size={20} color="#FFFFFF" />
            )}
          </View>

          <View style={{ flex: 1, paddingRight: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Text style={styles.bookedStudentName}>
                {slot.studentName || "Student #5104"}
              </Text>
              {slot.isAnonymous && (
                <View style={styles.anonPill}>
                  <Ionicons name="shield-checkmark" size={10} color="#065F46" />
                  <Text style={styles.anonPillText}>Anonymous</Text>
                </View>
              )}
            </View>
            <View style={styles.bookedModalityRow}>
              <View style={styles.bookedModalityChip}>
                <Text style={styles.bookedModalityChipText}>
                  {slot.modalityType === "video" ? "Video Call" : slot.modalityType === "chat" ? "Secure Chat" : slot.modalityType === "voice" ? "Voice Call" : "In-Person Clinic"}
                </Text>
              </View>
              <Text style={styles.bookedModalitySub}>
                • Confirmed Booking
              </Text>
            </View>
          </View>

          <View style={styles.bookedActionBtn}>
            <Text style={styles.bookedActionBtnText}>
              {slot.modalityType === "video" ? "Enter Room" : slot.modalityType === "chat" ? "Open Chat" : "View"}
            </Text>
            <Ionicons name="chevron-forward" size={13} color="#065F46" />
          </View>
        </View>

        {slot.intakeNote && (
          <Pressable
            style={styles.intakeNoteBanner}
            onPress={() =>
              router.navigate(`/(counsellor-detail)/request-detail?requestId=${slot.id}`)
            }
            accessibilityRole="button"
            accessibilityLabel="Review Intake Form"
          >
            <View style={styles.phqBadge}>
              <Text style={styles.phqBadgeText}>PHQ-9</Text>
            </View>
            <Text style={styles.intakeNoteText} numberOfLines={1}>
              {slot.intakeNote}
            </Text>
            <Text style={styles.intakeReviewLink}>Review &gt;</Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  // Reusable empty slots card
  const renderEmptySlotsCard = (title: string, subtitle: string, targetDateKey?: string) => (
    <View style={styles.emptySlotsCard}>
      <View style={styles.emptySlotsIconBox}>
        <Ionicons name="calendar-outline" size={36} color="#065F46" />
      </View>
      <Text style={styles.emptySlotsTitle}>{title}</Text>
      <Text style={styles.emptySlotsSubtitle}>{subtitle}</Text>
      <Pressable
        style={styles.emptyAddBtn}
        onPress={() =>
          router.push({
            pathname: "/(counsellor-detail)/add-session",
            params: targetDateKey ? { dateKey: targetDateKey } : undefined,
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Add availability slots"
      >
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.emptyAddBtnText}>Add Slots</Text>
      </Pressable>
    </View>
  );

  // Upcoming date strip for Day View with slot counts
  const dateStripList = useMemo(() => {
    const now = new Date();
    const colomboOffset = 5.5 * 60 * 60 * 1000;
    const baseDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + colomboOffset);

    // Map slot counts by dateKey (including confirmed bookings from calendarBookings)
    const slotCounts: Record<string, { total: number; open: number; booked: number }> = {};
    store.scheduleDaySlots.forEach((s) => {
      const dk = s.dateKey || todayKey;
      if (!slotCounts[dk]) slotCounts[dk] = { total: 0, open: 0, booked: 0 };
      slotCounts[dk].total += 1;
      if (s.isBooked) {
        slotCounts[dk].booked += 1;
      } else {
        slotCounts[dk].open += 1;
      }
    });

    // Also include any confirmed bookings from calendarBookings that are not in scheduleDaySlots
    store.calendarBookings.forEach((b) => {
      if (b.isOpenSlot || !b.dateKey) return;
      const dk = b.dateKey;
      const alreadyCounted = store.scheduleDaySlots.some(
        (s) =>
          s.id === b.id ||
          (s.dateKey === b.dateKey && (s.startTime === b.timeSlot || s.timeRange === b.timeRange))
      );
      if (!alreadyCounted) {
        if (!slotCounts[dk]) slotCounts[dk] = { total: 0, open: 0, booked: 0 };
        slotCounts[dk].total += 1;
        slotCounts[dk].booked += 1;
      }
    });

    const items: Array<{
      dateKey: string;
      dayShort: string;
      dateNum: number;
      monthShort: string;
      fullDisplay: string;
      totalSlots: number;
      openSlots: number;
      bookedSlots: number;
      isToday: boolean;
    }> = [];

    // Next 14 days
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dk = `${year}-${month}-${day}`;
      const counts = slotCounts[dk] || { total: 0, open: 0, booked: 0 };

      items.push({
        dateKey: dk,
        dayShort: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
        dateNum: d.getDate(),
        monthShort: d.toLocaleDateString("en-US", { month: "short" }),
        fullDisplay: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
        totalSlots: counts.total,
        openSlots: counts.open,
        bookedSlots: counts.booked,
        isToday: i === 0,
      });
    }

    // Any other dates in store slots
    Object.keys(slotCounts).forEach((dk) => {
      if (!items.some((it) => it.dateKey === dk)) {
        const [y, m, dayNum] = dk.split("-").map(Number);
        const d = new Date(y, m - 1, dayNum);
        const counts = slotCounts[dk];
        items.push({
          dateKey: dk,
          dayShort: d.toLocaleDateString("en-US", { weekday: "short" }),
          dateNum: dayNum,
          monthShort: d.toLocaleDateString("en-US", { month: "short" }),
          fullDisplay: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
          totalSlots: counts.total,
          openSlots: counts.open,
          bookedSlots: counts.booked,
          isToday: dk === todayKey,
        });
      }
    });

    return items;
  }, [store.scheduleDaySlots, store.calendarBookings, todayKey]);

  // Slots filtered for currently selected date, merging any confirmed bookings from calendarBookings
  const displayedDaySlots = useMemo(() => {
    let list: ScheduleDaySlot[] = [];
    if (selectedDateKey === "all") {
      list = [...store.scheduleDaySlots];
    } else {
      list = store.scheduleDaySlots.filter((s) => {
        if (s.dateKey) {
          return s.dateKey === selectedDateKey;
        }
        return selectedDateKey === todayKey;
      });
    }

    // Merge any confirmed bookings from calendarBookings for the selected date
    const targetKey = selectedDateKey === "all" ? undefined : selectedDateKey;
    store.calendarBookings
      .filter((b) => !b.isOpenSlot && b.dateKey && (!targetKey || b.dateKey === targetKey))
      .forEach((b) => {
        const alreadyExists = list.some(
          (s) =>
            s.id === b.id ||
            s.id === b.id.replace(/^cal-slot-/, "") ||
            s.id === b.id.replace(/^cal-/, "") ||
            (s.dateKey === b.dateKey &&
              (s.startTime === b.timeSlot || s.timeRange === b.timeRange))
        );
        if (!alreadyExists) {
          list.push({
            id: b.id.replace(/^cal-slot-/, "").replace(/^cal-/, ""),
            timeRange: b.timeRange,
            isBooked: true,
            studentName: b.displayName || b.studentAnonId || "Student #5104",
            subtitle: "Confirmed student booking",
            modalityText: b.modality === "chat" ? "Secure Chat Session" : b.modality === "in-person" ? "In-Person Consultation" : "Video Consultation",
            modalityType: (b.modality === "chat" ? "chat" : b.modality === "in-person" ? "in-person" : "video") as any,
            statusBadge: "Confirmed",
            isAnonymous: true,
            intakeNote: b.subInfo || "Intake Complete",
            dateKey: b.dateKey,
            dateDisplay: b.dateStr || b.dateKey,
            startTime: b.timeSlot || b.timeRange.split(/[–\-]/)[0]?.trim(),
            endTime: b.timeRange.split(/[–\-]/)[1]?.trim() || "",
            sessionTypes: [b.modality],
          });
        }
      });

    // Sort chronologically from morning to afternoon
    return list.sort(
      (a, b) => parseTimeToMinutes(a.startTime || a.timeRange) - parseTimeToMinutes(b.startTime || b.timeRange)
    );
  }, [store.scheduleDaySlots, store.calendarBookings, selectedDateKey, todayKey]);

  // Formatted date and stats metadata
  const currentDateMeta = useMemo(() => {
    if (selectedDateKey === "all") {
      return {
        title: "All Published Availability Slots",
        statsText: `${store.scheduleDaySlots.filter((s) => s.isBooked).length} Booked • ${store.scheduleDaySlots.filter((s) => !s.isBooked).length} Open for Students (${store.scheduleDaySlots.length} Total)`,
      };
    }
    const match = dateStripList.find((d) => d.dateKey === selectedDateKey);
    const dateTitle = match ? match.fullDisplay : selectedDateKey;
    const booked = displayedDaySlots.filter((s) => s.isBooked).length;
    const open = displayedDaySlots.filter((s) => !s.isBooked).length;
    return {
      title: dateTitle,
      statsText: `${booked} Booked • ${open} Available for Students`,
    };
  }, [selectedDateKey, dateStripList, store.scheduleDaySlots, displayedDaySlots]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* ─── TOP APP HEADER ─── */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <Text style={styles.appHeaderTitle} accessibilityRole="header">
            Schedule
          </Text>
        </View>

        {/* Profile Avatar Button */}
        <Pressable
          style={styles.avatarButton}
          onPress={() => router.navigate("/(counsellor-detail)/settings")}
          accessibilityRole="button"
          accessibilityLabel="Counselor Profile Settings"
        >
          <View style={styles.avatarCircle}>
            {store.profile?.avatarUrl ? (
              <Image
                source={{ uri: store.profile.avatarUrl }}
                style={styles.avatarImg}
                accessibilityLabel="Counselor Avatar"
              />
            ) : (
              <Text style={styles.avatarText}>DR</Text>
            )}
          </View>
          <View style={styles.avatarOnlineBadge} />
        </Pressable>
      </View>

      {/* ─── LIVE CLINICAL SYNC BAR & MANAGE AVAILABILITY LINK ─── */}
      <View style={styles.syncBar}>
        <View style={styles.syncLeft}>
          <View style={styles.syncLiveDot} />
          <Text style={styles.syncLiveText}>LIVE CLINICAL SYNC</Text>
        </View>

        <Pressable
          style={styles.manageAvailabilityLink}
          onPress={() => router.navigate("/(counsellor-detail)/my-calendar?view=day")}
          accessibilityRole="button"
          accessibilityLabel="Manage Availability"
          hitSlop={8}
        >
          <Text style={styles.manageAvailabilityText}>Manage Availability</Text>
          <Ionicons name="chevron-forward" size={14} color="#065F46" />
        </Pressable>
      </View>

      {/* ─── VIEW MODE SWITCHER: DAY | WEEK | MONTH ─── */}
      <View style={styles.switcherContainer}>
        <View style={styles.viewSwitcher} accessibilityRole="tablist">
          <Pressable
            style={[
              styles.viewSwitchTab,
              viewMode === "day" && styles.viewSwitchTabActive,
            ]}
            onPress={() => setViewMode("day")}
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === "day" }}
            accessibilityLabel="Day view"
          >
            <Ionicons
              name="today-outline"
              size={15}
              color={viewMode === "day" ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchTabText,
                viewMode === "day" && styles.viewSwitchTabTextActive,
              ]}
            >
              Day
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.viewSwitchTab,
              viewMode === "week" && styles.viewSwitchTabActive,
            ]}
            onPress={() => setViewMode("week")}
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === "week" }}
            accessibilityLabel="Week view"
          >
            <Ionicons
              name="grid-outline"
              size={15}
              color={viewMode === "week" ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchTabText,
                viewMode === "week" && styles.viewSwitchTabTextActive,
              ]}
            >
              Week
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.viewSwitchTab,
              viewMode === "month" && styles.viewSwitchTabActive,
            ]}
            onPress={() => setViewMode("month")}
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === "month" }}
            accessibilityLabel="Month view"
          >
            <Ionicons
              name="calendar-outline"
              size={15}
              color={viewMode === "month" ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchTabText,
                viewMode === "month" && styles.viewSwitchTabTextActive,
              ]}
            >
              Month
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════ */}
        {/* VIEW 1: DAY VIEW (media_1791025108845.png)        */}
        {/* ══════════════════════════════════════════════════ */}
        {viewMode === "day" && (
          <View style={styles.dayViewWrapper}>
            {/* Quick Action & Add Session Banner */}
            <View style={styles.dayTopActionBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.daySectionHeading}>CLINICAL AVAILABILITY</Text>
                <Text style={styles.daySectionSubtitle}>
                  Manage published slots for student booking
                </Text>
              </View>
              <Pressable
                style={styles.addSlotsHeaderBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(counsellor-detail)/add-session",
                    params: selectedDateKey !== "all" ? { dateKey: selectedDateKey } : undefined,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Add New Availability Slots"
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.addSlotsHeaderBtnText}>Add Slots</Text>
              </Pressable>
            </View>

            {/* Date Selection Strip */}
            <View style={styles.dateSelectorContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateStripScroll}
              >
                {/* "All" button */}
                <Pressable
                  style={[
                    styles.dateStripPill,
                    selectedDateKey === "all" && styles.dateStripPillActive,
                  ]}
                  onPress={() => setSelectedDateKey("all")}
                  accessibilityRole="button"
                  accessibilityLabel="View slots for all dates"
                >
                  <Text
                    style={[
                      styles.dateStripDayName,
                      selectedDateKey === "all" && styles.dateStripTextActive,
                    ]}
                  >
                    All
                  </Text>
                  <Text
                    style={[
                      styles.dateStripDateNum,
                      selectedDateKey === "all" && styles.dateStripTextActive,
                    ]}
                  >
                    {store.scheduleDaySlots.length}
                  </Text>
                  <View
                    style={[
                      styles.dateStripDot,
                      { backgroundColor: selectedDateKey === "all" ? "#A7F3D0" : "#10B981" },
                    ]}
                  />
                </Pressable>

                {/* Day Pills */}
                {dateStripList.map((item) => {
                  const isActive = selectedDateKey === item.dateKey;
                  return (
                    <Pressable
                      key={item.dateKey}
                      style={[
                        styles.dateStripPill,
                        isActive && styles.dateStripPillActive,
                      ]}
                      onPress={() => setSelectedDateKey(item.dateKey)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select date ${item.dayShort}, ${item.monthShort} ${item.dateNum}`}
                    >
                      <Text
                        style={[
                          styles.dateStripDayName,
                          isActive && styles.dateStripTextActive,
                        ]}
                      >
                        {item.dayShort}
                      </Text>
                      <Text
                        style={[
                          styles.dateStripDateNum,
                          isActive && styles.dateStripTextActive,
                        ]}
                      >
                        {item.dateNum}
                      </Text>
                      <View
                        style={[
                          styles.dateStripDot,
                          {
                            backgroundColor: isActive
                              ? "#A7F3D0"
                              : item.totalSlots > 0
                              ? "#10B981"
                              : "#CBD5E1",
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Day Header Subtitle */}
            <View style={styles.daySubtitleRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.dayDateTitle}>{currentDateMeta.title}</Text>
                <Text style={styles.dayStatsSub}>{currentDateMeta.statsText}</Text>
              </View>
              {selectedDateKey !== "all" && (
                <Pressable
                  style={styles.viewAllShortcutBtn}
                  onPress={() => setSelectedDateKey("all")}
                >
                  <Text style={styles.viewAllShortcutText}>View All</Text>
                </Pressable>
              )}
            </View>

            {/* List of Day Slots */}
            <View style={styles.daySlotsList}>
              {displayedDaySlots.length === 0
                ? renderEmptySlotsCard(
                    "No Slots Published for This Date",
                    selectedDateKey === "all"
                      ? "You haven't published any availability slots yet. Use 'Add Slots' to publish dates and times for student booking."
                      : `You haven't published any availability slots for ${currentDateMeta.title} yet. Tap below to create slots.`,
                    selectedDateKey !== "all" ? selectedDateKey : undefined
                  )
                : displayedDaySlots.map(renderScheduleSlotCard)}
            </View>

            {/* 15-Minute Automated Buffer Notice Card */}
            <View style={styles.bufferNoticeCard}>
              <View style={styles.bufferIconBox}>
                <Ionicons name="time" size={16} color="#065F46" />
              </View>
              <Text style={styles.bufferNoticeText}>
                15-minute automated buffer applied after each completed consultation
                for clinical notes and decompression.
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* VIEW 2: MONTH VIEW (Live Calendar Synchronization) */}
        {/* ══════════════════════════════════════════════════ */}
        {viewMode === "month" && (
          <View style={styles.monthViewWrapper}>
            {/* Quick Action & Add Session Banner */}
            <View style={styles.dayTopActionBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.daySectionHeading}>MONTHLY OVERVIEW</Text>
                <Text style={styles.daySectionSubtitle}>
                  Live calendar grid synced with real availability & student bookings
                </Text>
              </View>
              <Pressable
                style={styles.addSlotsHeaderBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(counsellor-detail)/add-session",
                    params: { dateKey: selectedMonthDateKey },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Add New Availability Slots"
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.addSlotsHeaderBtnText}>Add Slots</Text>
              </Pressable>
            </View>

            {/* Calendar Card */}
            <View style={styles.monthCalendarCard}>
              {/* Month Header Nav */}
              <View style={styles.monthNavRow}>
                <Pressable
                  style={styles.monthArrowBtn}
                  onPress={handlePrevMonth}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Ionicons name="chevron-back" size={18} color="#1E293B" />
                </Pressable>

                <View style={styles.monthTitleBox}>
                  <Text style={styles.monthTitleText}>{monthTitleLabel}</Text>
                  <View style={[styles.semesterStartBadge, isCurrentMonthActive && { backgroundColor: "#ECFDF5" }]}>
                    <Text style={[styles.semesterStartText, isCurrentMonthActive && { color: "#065F46" }]}>
                      {isCurrentMonthActive ? "Current Month" : "Clinical Schedule"}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.monthArrowBtn}
                  onPress={handleNextMonth}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Ionicons name="chevron-forward" size={18} color="#1E293B" />
                </Pressable>
              </View>

              {/* Jump to Current Month Button */}
              {!isCurrentMonthActive && (
                <View style={{ alignItems: "center", marginBottom: spacing.xs }}>
                  <Pressable
                    style={styles.todayBtn}
                    onPress={handleTodayMonth}
                    accessibilityRole="button"
                    accessibilityLabel="Return to current month"
                  >
                    <Text style={styles.todayBtnText}>Back to Current Month</Text>
                  </Pressable>
                </View>
              )}

              {/* Day-of-week Headers */}
              <View style={styles.weekDayLabelsRow}>
                {["S", "M", "T", "W", "T", "F", "S"].map((label, idx) => (
                  <Text key={idx} style={styles.weekDayLabelText}>
                    {label}
                  </Text>
                ))}
              </View>

              {/* Calendar Days Grid */}
              <View style={styles.monthGrid}>
                {monthCalendarDays.map((item, idx) => {
                  const isSelected = item.isCurrentMonth && item.dateKey === selectedMonthDateKey;

                  return (
                    <Pressable
                      key={idx}
                      style={[
                        styles.monthCell,
                        isSelected && styles.monthCellSelected,
                        item.isToday && !isSelected && styles.monthCellToday,
                      ]}
                      onPress={() => {
                        if (item.isCurrentMonth) {
                          setSelectedMonthDateKey(item.dateKey);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.dateKey}`}
                    >
                      <Text
                        style={[
                          styles.monthCellText,
                          !item.isCurrentMonth && styles.monthCellTextDisabled,
                          isSelected && styles.monthCellTextSelected,
                          item.isToday && !isSelected && styles.monthCellTextToday,
                        ]}
                      >
                        {item.day}
                      </Text>

                      {/* Live Dot Indicators */}
                      {item.isCurrentMonth && (
                        <View style={styles.cellDotsRow}>
                          {item.hasBooked && <View style={styles.bookedDotIndicator} />}
                          {item.hasHeld && <View style={styles.heldDotIndicator} />}
                          {item.hasOpen && <View style={styles.openDotIndicator} />}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Dot Legend */}
              <View style={styles.modalityLegendRow}>
                <View style={styles.legendItem}>
                  <View style={styles.bookedDotIndicator} />
                  <Text style={styles.legendText}>Booked Session</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.heldDotIndicator} />
                  <Text style={styles.legendText}>Held / Blocked</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.openDotIndicator} />
                  <Text style={styles.legendText}>Open Slot</Text>
                </View>
              </View>
            </View>

            {/* Selected Date Header and Action Bar */}
            <View style={styles.daySubtitleRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.dayDateTitle}>{selectedMonthMeta.title}</Text>
                <Text style={styles.dayStatsSub}>{selectedMonthMeta.statsText}</Text>
              </View>
              <Pressable
                style={styles.viewAllShortcutBtn}
                onPress={() => {
                  setSelectedDateKey(selectedMonthDateKey);
                  setViewMode("day");
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to Day View"
              >
                <Text style={styles.viewAllShortcutText}>Open Day View</Text>
              </Pressable>
            </View>

            {/* List of Slots for Selected Month Date */}
            <View style={styles.daySlotsList}>
              {displayedMonthDaySlots.length === 0
                ? renderEmptySlotsCard(
                    "No Slots Published for This Date",
                    `No availability slots or sessions scheduled for ${selectedMonthMeta.title}. Use 'Add Slots' to publish slots.`,
                    selectedMonthDateKey
                  )
                : displayedMonthDaySlots.map(renderScheduleSlotCard)}
            </View>

            {/* 15-Minute Automated Buffer Notice Card */}
            <View style={styles.bufferNoticeCard}>
              <View style={styles.bufferIconBox}>
                <Ionicons name="time" size={16} color="#065F46" />
              </View>
              <Text style={styles.bufferNoticeText}>
                15-minute automated buffer applied after each completed consultation
                for clinical notes and decompression.
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* VIEW 3: WEEK VIEW (Live Clinical Availability)     */}
        {/* ══════════════════════════════════════════════════ */}
        {viewMode === "week" && (
          <View style={styles.weekViewWrapper}>
            {/* Quick Action & Add Session Banner */}
            <View style={styles.dayTopActionBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.daySectionHeading}>WEEKLY AVAILABILITY</Text>
                <Text style={styles.daySectionSubtitle}>
                  Manage published slots across the week for student booking
                </Text>
              </View>
              <Pressable
                style={styles.addSlotsHeaderBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(counsellor-detail)/add-session",
                    params: { dateKey: selectedWeekDateKey },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Add New Availability Slots"
              >
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.addSlotsHeaderBtnText}>Add Slots</Text>
              </Pressable>
            </View>

            {/* Date Range Navigation Strip */}
            <View style={styles.dateNav}>
              <View style={styles.dateNavArrows}>
                <Pressable
                  style={styles.navArrowBtn}
                  onPress={handlePrevWeek}
                  accessibilityRole="button"
                  accessibilityLabel="Previous week"
                  hitSlop={8}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                </Pressable>
                <Pressable
                  style={styles.navArrowBtn}
                  onPress={handleNextWeek}
                  accessibilityRole="button"
                  accessibilityLabel="Next week"
                  hitSlop={8}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </Pressable>
              </View>
              <Text style={styles.dateNavText}>{weekRangeLabel}</Text>
              <Pressable
                style={styles.todayBtn}
                onPress={handleTodayWeek}
                accessibilityRole="button"
                accessibilityLabel="Go to today"
                hitSlop={8}
              >
                <Text style={styles.todayBtnText}>Today</Text>
              </Pressable>
            </View>

            {/* Quick Rules Section */}
            <View style={styles.quickRulesGrid}>
              <Pressable
                style={styles.quickRuleCard}
                onPress={() =>
                  router.push("/(counsellor-detail)/add-session")
                }
                accessibilityRole="button"
                accessibilityLabel="Set Recurring Rules"
              >
                <View
                  style={[
                    styles.quickRuleIconBg,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.quickRuleTitle}>Set Recurring</Text>
                  <Text style={styles.quickRuleSubtitle}>Multi-week availability</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.quickRuleCard}
                onPress={() => setBlockModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Block Time Off"
              >
                <View
                  style={[
                    styles.quickRuleIconBg,
                    { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  <Ionicons name="calendar" size={20} color="#B45309" />
                </View>
                <View>
                  <Text style={styles.quickRuleTitle}>Block Time Off</Text>
                  <Text style={styles.quickRuleSubtitle}>Hold shift or day</Text>
                </View>
              </Pressable>
            </View>

            {/* Day Selector Strip */}
            <View style={styles.daySelectorSection}>
              <View style={styles.daySelectorHeader}>
                <Text style={styles.sectionTitle}>SELECT DAY</Text>
                <Text style={styles.sectionHint}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={colors.textSecondary}
                  />
                  {" "}Live week overview
                </Text>
              </View>
              <View style={styles.dayStrip}>
                {currentWeekDays.map((day) => {
                  const isActive = day.dateKey === selectedWeekDateKey;
                  return (
                    <Pressable
                      key={day.dateKey}
                      style={[
                        styles.dayItem,
                        isActive && styles.dayItemActive,
                      ]}
                      onPress={() => setSelectedWeekDateKey(day.dateKey)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${day.dayShort}, ${day.monthShort} ${day.dateNum}`}
                    >
                      <Text
                        style={[
                          styles.dayItemName,
                          isActive && styles.dayItemTextActive,
                        ]}
                      >
                        {day.dayShort}
                      </Text>
                      <Text
                        style={[
                          styles.dayItemDate,
                          isActive && styles.dayItemTextActive,
                        ]}
                      >
                        {day.dateNum}
                      </Text>
                      <View
                        style={[
                          styles.dayStatusDot,
                          {
                            backgroundColor: isActive
                              ? "#A7F3D0"
                              : day.hasOpen
                              ? "#10B981"
                              : day.hasHeld
                              ? "#F59E0B"
                              : day.hasBooked
                              ? "#4338CA"
                              : "#CBD5E1",
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Active Day Header & Batch Action */}
            <View style={styles.activeDayHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.activeDayTitle}>
                  {selectedWeekMeta.title}
                </Text>
                <Text style={styles.activeDayStatsRow}>
                  <Text style={styles.statAvailable}>{selectedWeekMeta.openCount} available</Text>
                  {" • "}
                  <Text style={styles.statConfirmed}>{selectedWeekMeta.bookedCount} confirmed</Text>
                  {" • "}
                  <Text style={styles.statClosed}>{selectedWeekMeta.heldCount} held</Text>
                </Text>
              </View>
              <Pressable
                style={styles.markAllBtn}
                onPress={markAllOpen}
                accessibilityRole="button"
                accessibilityLabel="Mark all slots open"
              >
                <Ionicons name="checkmark" size={14} color={colors.primary} />
                <Text style={styles.markAllBtnText}>Mark All</Text>
              </Pressable>
            </View>

            {/* Time Slots List for Selected Week Day */}
            <View style={styles.daySlotsList}>
              {displayedWeekDaySlots.length === 0
                ? renderEmptySlotsCard(
                    "No Slots for This Day",
                    `You haven't published any availability slots for ${selectedWeekMeta.title}. Tap below to create slots.`,
                    selectedWeekDateKey
                  )
                : displayedWeekDaySlots.map(renderScheduleSlotCard)}
            </View>

            {/* Scheduling Preferences Section */}
            <View style={styles.preferencesSection}>
              <View style={styles.preferencesHeader}>
                <View style={styles.prefIconBg}>
                  <Ionicons name="options-outline" size={16} color={colors.primary} />
                </View>
                <Text style={styles.preferencesTitle}>Scheduling Preferences</Text>
              </View>

              <View style={styles.preferencesList}>
                {preferences.map((pref, idx) => (
                  <View key={pref.id} style={styles.preferenceCard}>
                    <View style={styles.preferenceTextCol}>
                      <Text style={styles.preferenceTitle}>{pref.title}</Text>
                      <Text style={styles.preferenceSubtitle}>
                        {pref.description}
                      </Text>
                    </View>
                    <Switch
                      value={pref.enabled}
                      onValueChange={() => togglePreference(idx)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.white}
                      accessibilityLabel={pref.title}
                      style={styles.switch}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* 15-Minute Automated Buffer Notice Card */}
            <View style={styles.bufferNoticeCard}>
              <View style={styles.bufferIconBox}>
                <Ionicons name="time" size={16} color="#065F46" />
              </View>
              <Text style={styles.bufferNoticeText}>
                15-minute automated buffer applied after each completed consultation
                for clinical notes and decompression.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Feedback Toast */}
      {feedbackMessage && (
        <View style={styles.toast} accessibilityRole="alert">
          <Ionicons name="checkmark-circle" size={18} color="#A7F3D0" />
          <Text style={styles.toastText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Quick Action Modal Dialog */}
      <Modal
        visible={modalData !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalData(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              {modalData?.title}
            </Text>
            <Text style={styles.modalDescription}>
              {modalData?.description}
            </Text>
            <Pressable
              onPress={() => setModalData(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss modal"
              style={styles.modalBtn}
            >
              <Text style={styles.modalBtnText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Block Time Off Modal */}
      <Modal
        visible={blockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                Block Clinical Time Off
              </Text>
              <Pressable
                onPress={() => setBlockModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
            <Text style={styles.modalDescription}>
              Select the shift duration to block on{" "}
              {viewMode === "week"
                ? selectedWeekMeta.title
                : viewMode === "month"
                ? selectedMonthMeta.title
                : currentDateMeta.title}
              . Booked sessions are preserved.
            </Text>

            <View style={styles.blockOptionList}>
              <Pressable
                style={styles.blockOptionBtn}
                onPress={blockMorning}
                accessibilityRole="button"
                accessibilityLabel="Block Morning Shifts"
              >
                <View style={styles.blockOptionIconBox}>
                  <Ionicons name="sunny-outline" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockOptionTitle}>Block Morning Shifts</Text>
                  <Text style={styles.blockOptionSubtitle}>
                    09:00 AM – 12:00 PM (3 slots)
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>

              <Pressable
                style={styles.blockOptionBtn}
                onPress={blockAfternoon}
                accessibilityRole="button"
                accessibilityLabel="Block Afternoon Shifts"
              >
                <View style={styles.blockOptionIconBox}>
                  <Ionicons
                    name="partly-sunny-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockOptionTitle}>Block Afternoon Shifts</Text>
                  <Text style={styles.blockOptionSubtitle}>
                    01:00 PM – 05:00 PM (4 slots)
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.blockOptionBtn,
                  { borderColor: "rgba(194, 50, 50, 0.3)" },
                ]}
                onPress={blockFullDay}
                accessibilityRole="button"
                accessibilityLabel="Block Entire Day"
              >
                <View
                  style={[
                    styles.blockOptionIconBox,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={colors.danger}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.blockOptionTitle, { color: colors.danger }]}>
                    Block Entire Day
                  </Text>
                  <Text style={styles.blockOptionSubtitle}>
                    Mark all slots as closed
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: "#FAF7F0",
  },
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appHeaderTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#065F46",
    letterSpacing: -0.4,
  },
  avatarButton: {
    position: "relative",
    minWidth: TOUCH_TARGET - 4,
    minHeight: TOUCH_TARGET - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(6, 95, 70, 0.2)",
    overflow: "hidden",
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  avatarOnlineBadge: {
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
  syncBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.6)",
    backgroundColor: "#FAF7F0",
  },
  syncLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  syncLiveText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065F46",
    letterSpacing: 0.6,
  },
  manageAvailabilityLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  manageAvailabilityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  switcherContainer: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  viewSwitcher: {
    flexDirection: "row",
    backgroundColor: "#EFECE4",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  viewSwitchTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 38,
    borderRadius: 9,
  },
  viewSwitchTabActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  viewSwitchTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  viewSwitchTabTextActive: {
    color: "#065F46",
    fontWeight: "800",
  },

  // ─── DAY VIEW STYLES ───
  dayViewWrapper: {
    marginTop: spacing.xs,
  },
  dayTopActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  daySectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#065F46",
    letterSpacing: 0.5,
  },
  daySectionSubtitle: {
    fontSize: 11,
    color: "#047857",
    marginTop: 2,
  },
  addSlotsHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#065F46",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addSlotsHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  dateSelectorContainer: {
    marginBottom: spacing.sm + 2,
  },
  dateStripScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dateStripPill: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minWidth: 54,
  },
  dateStripPillActive: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
  },
  dateStripDayName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
  },
  dateStripDateNum: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    marginVertical: 2,
  },
  dateStripTextActive: {
    color: "#FFFFFF",
  },
  dateStripDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  viewAllShortcutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllShortcutText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
    textDecorationLine: "underline",
  },
  emptySlotsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: spacing.md,
  },
  emptySlotsIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptySlotsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: "center",
  },
  emptySlotsSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#065F46",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  slotDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotDateBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  availablePill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availablePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065F46",
  },
  slotModalitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  modalityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  modalityChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  modalityFallbackText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  daySubtitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  dayDateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  dayStatsSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  daySlotsList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  openSlotCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A7F3D0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  openSlotTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  slotTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotTimeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  holdSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  holdSlotBtnActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  holdSlotBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  holdSlotBtnTextActive: {
    color: "#B45309",
  },
  openSlotBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  openSlotIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  openSlotTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  openSlotSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  bookedSlotCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    borderLeftWidth: 5,
    borderLeftColor: "#059669",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookedSlotHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#065F46",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  confirmedBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  bookedStudentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  bookedModalityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bookedStudentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  anonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  anonPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  bookedModalityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  bookedModalityChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  bookedModalityChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  bookedModalitySub: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  bookedActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  bookedActionBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#065F46",
  },
  intakeNoteBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: spacing.sm + 4,
  },
  phqBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  phqBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.white,
  },
  intakeNoteText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
  },
  intakeReviewLink: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },

  bufferNoticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  bufferIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  bufferNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#166534",
    fontWeight: "500",
  },

  // ─── MONTH VIEW STYLES ───
  monthViewWrapper: {
    marginTop: spacing.xs,
  },
  monthCalendarCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.md,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  monthTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  semesterStartBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  semesterStartText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  weekDayLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  weekDayLabelText: {
    width: 38,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  monthCell: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
    borderRadius: 8,
  },
  monthCellSelected: {
    backgroundColor: "#065F46",
    borderRadius: 20,
  },
  monthCellToday: {
    borderWidth: 1.5,
    borderColor: "#065F46",
    borderRadius: 8,
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  monthCellTextDisabled: {
    color: "#CBD5E1",
    fontWeight: "500",
  },
  monthCellTextSelected: {
    color: colors.white,
    fontWeight: "800",
  },
  monthCellTextToday: {
    fontWeight: "800",
    color: "#065F46",
  },
  cellDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
    minHeight: 5,
  },
  bookedDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4338CA",
  },
  intakeDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F59E0B",
  },
  heldDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F59E0B",
  },
  openDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
  },
  modalityLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },

  dateSummaryStrip: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.md,
  },
  summaryStripHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm + 2,
  },
  summaryStripDate: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  summaryStripSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  summaryChevronBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewDayText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  miniCardsRow: {
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  miniCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  miniCardTime: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  miniCardName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
    marginVertical: 2,
  },
  miniModalityBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  miniModalityText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#166534",
  },

  // ─── WEEK VIEW STYLES ───
  weekViewWrapper: {
    marginTop: spacing.xs,
  },
  titleBlock: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subTitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: spacing.sm,
  },
  dateNavArrows: {
    flexDirection: "row",
    alignItems: "center",
  },
  navArrowBtn: {
    width: TOUCH_TARGET - 12,
    height: TOUCH_TARGET - 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  dateNavText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  todayBtn: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(7, 96, 71, 0.08)",
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  quickRulesGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickRuleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quickRuleIconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRuleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  quickRuleSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  daySelectorSection: {
    marginBottom: spacing.md,
  },
  daySelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs + 2,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  dayStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dayItemName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dayItemDate: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  dayItemTextActive: {
    color: colors.white,
  },
  dayStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  activeDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  activeDayTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  activeDayStatsRow: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  statAvailable: {
    color: "#059669",
    fontWeight: "700",
  },
  statConfirmed: {
    color: "#D97706",
    fontWeight: "700",
  },
  statClosed: {
    color: "#6B7280",
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  saveSection: {
    marginVertical: spacing.sm + 2,
  },
  saveBtn: {
    minHeight: TOUCH_TARGET,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnIcon: {
    marginRight: 6,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  saveHintText: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
  },
  weekendCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    gap: spacing.xs + 2,
  },
  weekendIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  weekendTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  weekendSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  openWeekendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    minHeight: TOUCH_TARGET - 6,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  openWeekendBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  slotsList: {
    gap: spacing.xs + 4,
    marginBottom: spacing.md,
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
    gap: spacing.sm,
  },
  slotCardClosed: {
    backgroundColor: "rgba(245, 245, 244, 0.7)",
    borderStyle: "dashed",
    borderColor: "#D6D3D1",
  },
  slotIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  slotIconBoxOpen: {
    backgroundColor: colors.success,
  },
  slotIconBoxBooked: {
    backgroundColor: "#E2E8F0",
  },
  slotIconBoxClosed: {
    backgroundColor: "#E7E5E4",
  },
  slotCenter: {
    flex: 1,
  },
  slotTimeRange: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  slotTimeStrikethrough: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  slotDescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  slotDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  slotDescriptionBooked: {
    color: "#334155",
    fontWeight: "600",
  },
  slotDescriptionClosed: {
    color: "#78716C",
  },
  slotActionPill: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  slotActionPillOpen: {
    backgroundColor: "#A7F3D0",
    borderWidth: 1,
    borderColor: "#6EE7B7",
  },
  slotActionPillBooked: {
    backgroundColor: "#1E293B",
  },
  slotActionPillClosed: {
    backgroundColor: "#E7E5E4",
    borderWidth: 1,
    borderColor: "#D6D3D1",
  },
  bookedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  slotActionPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  slotActionPillTextOpen: {
    color: "#064E3B",
  },
  slotActionPillTextBooked: {
    color: colors.white,
  },
  slotActionPillTextClosed: {
    color: "#57534E",
  },
  preferencesSection: {
    marginBottom: spacing.xl,
  },
  preferencesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  prefIconBg: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  preferencesTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  preferencesList: {
    gap: spacing.sm,
  },
  preferenceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: spacing.sm,
  },
  preferenceTextCol: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  preferenceSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  toast: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  toastText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  modalBtn: {
    minHeight: TOUCH_TARGET - 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  blockOptionList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  blockOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  blockOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  blockOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  blockOptionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
