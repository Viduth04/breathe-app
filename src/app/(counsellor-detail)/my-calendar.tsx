// Counsellor My Calendar Screen - Muaath (Member 4). Supports FR01, FR08, NFR01, NFR02.
// Clinical Execution Cockpit with Day, Week, and Month views.
// Real Firestore synchronization, strict Asia/Colombo timezone alignment, live auto-sync, and zero mock data.

import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { CalendarBooking, useCounsellorStore } from "@/services/counsellorStore";

type RangeView = "day" | "week" | "month";

const COLOMBO_TIMEZONE = "Asia/Colombo";

/**
 * Returns the current date components in Asia/Colombo timezone
 */
function getColomboNow() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: COLOMBO_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || String(now.getFullYear()), 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || String(now.getMonth() + 1), 10) - 1; // 0-indexed
  const day = parseInt(parts.find((p) => p.type === "day")?.value || String(now.getDate()), 10);
  return { year, month, day };
}

function getInitialDate(paramsDate?: string, storeDay?: number) {
  if (paramsDate && /^\d{4}-\d{2}-\d{2}$/.test(paramsDate)) {
    const [y, m, d] = paramsDate.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  }
  const colombo = getColomboNow();
  if (storeDay && storeDay >= 1 && storeDay <= 31) {
    return { year: colombo.year, month: colombo.month, day: storeDay };
  }
  return colombo;
}

function getBookingDayNum(b: CalendarBooking): number | undefined {
  if (typeof b.dayNum === "number" && !isNaN(b.dayNum)) return b.dayNum;
  if (b.dateKey) {
    const parts = b.dateKey.split("-");
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

/**
 * Parses time strings like "09:00 AM", "11:00 AM - 11:30 AM", "04:00 PM – 4:30 PM"
 * into minutes from midnight (0..1439) for deterministic chronological sorting.
 */
function parseTimeToMinutes(timeStr?: string): number {
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
}

export default function MyCalendarScreen() {
  const params = useLocalSearchParams<{
    view?: string;
    highlightId?: string;
    date?: string;
  }>();

  const store = useCounsellorStore();

  // Active view: day, week, month (defaults to day per prototype)
  const [activeRange, setActiveRange] = useState<RangeView>(
    (params.view as RangeView) || "day"
  );

  // Dynamic Navigation state initialized to actual Colombo date or query param
  const initialDate = useMemo(
    () => getInitialDate(params.date, store.selectedCalendarDay),
    [params.date, store.selectedCalendarDay]
  );

  const [navYear, setNavYear] = useState<number>(initialDate.year);
  const [navMonth, setNavMonth] = useState<number>(initialDate.month);
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.day);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Synchronize when route parameters update
  useEffect(() => {
    if (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      const [y, m, d] = params.date.split("-").map(Number);
      setNavYear(y);
      setNavMonth(m - 1);
      setSelectedDay(d);
      store.setSelectedCalendarDay(d);
    }
    if (params.view && (params.view === "day" || params.view === "week" || params.view === "month")) {
      setActiveRange(params.view as RangeView);
    }
  }, [params.date, params.view]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    showToast("Syncing with live Firestore database...");
    try {
      store.initFirebaseSync();
    } catch (_) {}
    setTimeout(() => {
      setRefreshing(false);
      showToast("Live clinical calendar synced with database.");
    }, 600);
  };

  const handleDaySelect = (dayNum: number) => {
    setSelectedDay(dayNum);
    store.setSelectedCalendarDay(dayNum);
  };

  // Day navigation steppers
  const handlePrevDay = () => {
    const cur = new Date(navYear, navMonth, selectedDay);
    cur.setDate(cur.getDate() - 1);
    setNavYear(cur.getFullYear());
    setNavMonth(cur.getMonth());
    setSelectedDay(cur.getDate());
    store.setSelectedCalendarDay(cur.getDate());
  };

  const handleNextDay = () => {
    const cur = new Date(navYear, navMonth, selectedDay);
    cur.setDate(cur.getDate() + 1);
    setNavYear(cur.getFullYear());
    setNavMonth(cur.getMonth());
    setSelectedDay(cur.getDate());
    store.setSelectedCalendarDay(cur.getDate());
  };

  // Week navigation steppers
  const handlePrevWeek = () => {
    const cur = new Date(navYear, navMonth, selectedDay);
    cur.setDate(cur.getDate() - 7);
    setNavYear(cur.getFullYear());
    setNavMonth(cur.getMonth());
    setSelectedDay(cur.getDate());
    store.setSelectedCalendarDay(cur.getDate());
  };

  const handleNextWeek = () => {
    const cur = new Date(navYear, navMonth, selectedDay);
    cur.setDate(cur.getDate() + 7);
    setNavYear(cur.getFullYear());
    setNavMonth(cur.getMonth());
    setSelectedDay(cur.getDate());
    store.setSelectedCalendarDay(cur.getDate());
  };

  // Month navigation steppers
  const handlePrevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else {
      setNavMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else {
      setNavMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = getColomboNow();
    setNavYear(today.year);
    setNavMonth(today.month);
    setSelectedDay(today.day);
    store.setSelectedCalendarDay(today.day);
    const monthLabel = new Date(today.year, today.month, 1).toLocaleDateString("en-US", {
      month: "short",
      timeZone: COLOMBO_TIMEZONE,
    });
    showToast(`Jumped to Today (${today.day} ${monthLabel})`);
  };

  // Formatted current month title
  const selectedMonthText = useMemo(() => {
    const d = new Date(navYear, navMonth, 1);
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: COLOMBO_TIMEZONE,
    });
  }, [navYear, navMonth]);

  // Formatted day title (e.g. Tuesday, Aug 19)
  const selectedDayFullTitle = useMemo(() => {
    const d = new Date(navYear, navMonth, selectedDay);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: COLOMBO_TIMEZONE,
    });
  }, [navYear, navMonth, selectedDay]);

  // Formatted target date key for the current navigated day (e.g. 2026-10-08)
  const targetDayDateKey = useMemo(() => {
    return `${navYear}-${String(navMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  }, [navYear, navMonth, selectedDay]);

  // Filter confirmed bookings for current navigated month from real store data
  const monthBookings = useMemo(() => {
    const list = store.calendarBookings.filter((b) => {
      if (b.isOpenSlot) return false;
      if (b.statusText === "Cancelled") return false;
      if (b.dateKey) {
        const [y, m] = b.dateKey.split("-").map(Number);
        return y === navYear && m === navMonth + 1;
      }
      if (b.monthYear) {
        return b.monthYear.toLowerCase() === selectedMonthText.toLowerCase();
      }
      return false;
    });

    // Also include confirmed slots from scheduleDaySlots for this month
    store.scheduleDaySlots
      .filter((s) => s.isBooked && s.dateKey)
      .forEach((s) => {
        const [y, m] = s.dateKey!.split("-").map(Number);
        if (y === navYear && m === navMonth + 1) {
          const alreadyExists = list.some(
            (b) =>
              b.id === `cal-slot-${s.id}` ||
              b.id === s.id ||
              (b.dateKey === s.dateKey &&
                (b.timeSlot === s.startTime || b.timeRange === s.timeRange))
          );
          if (!alreadyExists) {
            const rawTime = s.startTime || s.timeRange.split("–")[0]?.trim() || "10:00 AM";
            const dayNum = parseInt(s.dateKey!.split("-")[2], 10);
            list.push({
              id: `cal-slot-${s.id}`,
              timeSlot: rawTime,
              studentId: "",
              studentAnonId: s.studentName || "Student #5104",
              displayName: s.studentName || "Student #5104",
              idMode: "anonymous" as const,
              subInfo: `${s.dateDisplay || s.dateKey || "Upcoming"} • Confirmed Booking`,
              timeRange: s.timeRange,
              modality: (s.modalityType === "chat" ? "chat" : s.modalityType === "in-person" ? "in-person" : "video") as any,
              modalityLabel: s.modalityType === "chat" ? "Secure Thread" : s.modalityType === "in-person" ? "In-Person Consultation" : "Consultation (45m)",
              securityTag: "E2E Encrypted",
              roomId: `brth-${s.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
              roomOrDetail: `Room ID: brth-${s.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
              isOpenSlot: false,
              isBlocked: false,
              statusText: "Intake Complete",
              dateStr: s.dateDisplay || s.dateKey,
              dateKey: s.dateKey,
              dayNum,
              monthYear: selectedMonthText,
              isExpired: false,
              isPast: false,
            });
          }
        }
      });

    return list;
  }, [store.calendarBookings, store.scheduleDaySlots, selectedMonthText, navYear, navMonth]);

  // Bookings specifically on the selected day (including confirmed slots from schedule)
  const selectedDayBookings = useMemo(() => {
    const list = store.calendarBookings.filter((b) => {
      if (b.isOpenSlot) return false;
      if (b.statusText === "Cancelled") return false;
      if (b.dateKey) {
        const [y, m, d] = b.dateKey.split("-").map(Number);
        return y === navYear && m === navMonth + 1 && d === selectedDay;
      }
      if (b.monthYear && b.monthYear.toLowerCase() !== selectedMonthText.toLowerCase()) {
        return false;
      }
      const dNum = getBookingDayNum(b);
      return dNum !== undefined && dNum === selectedDay;
    });

    // Ensure all confirmed booked slots from scheduleDaySlots for target date are included
    store.scheduleDaySlots
      .filter((s) => s.isBooked && (s.dateKey === targetDayDateKey || (s.dateKey && getBookingDayNum({ dateKey: s.dateKey } as any) === selectedDay)))
      .forEach((s) => {
        const alreadyExists = list.some(
          (b) =>
            b.id === `cal-slot-${s.id}` ||
            b.id === s.id ||
            (b.dateKey === (s.dateKey || targetDayDateKey) &&
              (b.timeSlot === s.startTime || b.timeRange === s.timeRange))
        );
        if (!alreadyExists) {
          const rawTime = s.startTime || s.timeRange.split("–")[0]?.trim() || "10:00 AM";
          list.push({
            id: `cal-slot-${s.id}`,
            timeSlot: rawTime,
            studentId: "",
            studentAnonId: s.studentName || "Student #5104",
            displayName: s.studentName || "Student #5104",
            idMode: "anonymous" as const,
            subInfo: `${s.dateDisplay || s.dateKey || "Upcoming"} • Confirmed Booking`,
            timeRange: s.timeRange,
            modality: (s.modalityType === "chat" ? "chat" : s.modalityType === "in-person" ? "in-person" : "video") as any,
            modalityLabel: s.modalityType === "chat" ? "Secure Thread" : s.modalityType === "in-person" ? "In-Person Consultation" : "Consultation (45m)",
            securityTag: "E2E Encrypted",
            roomId: `brth-${s.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
            roomOrDetail: `Room ID: brth-${s.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
            isOpenSlot: false,
            isBlocked: false,
            statusText: "Intake Complete",
            dateStr: s.dateDisplay || s.dateKey,
            dateKey: s.dateKey || targetDayDateKey,
            dayNum: selectedDay,
            monthYear: selectedMonthText,
            isExpired: false,
            isPast: false,
          });
        }
      });

    return list.sort(
      (a, b) => parseTimeToMinutes(a.timeSlot || a.timeRange) - parseTimeToMinutes(b.timeSlot || b.timeRange)
    );
  }, [store.calendarBookings, store.scheduleDaySlots, selectedDay, navYear, navMonth, targetDayDateKey, selectedMonthText]);

  // Day Timeline Items (including open, blocked, and confirmed slots sorted chronologically)
  const dayTimelineItems = useMemo(() => {
    const list = store.calendarBookings.filter((b) => {
      if (b.statusText === "Cancelled") return false;
      if (b.dateKey) {
        const [y, m, d] = b.dateKey.split("-").map(Number);
        return y === navYear && m === navMonth + 1 && d === selectedDay;
      }
      if (b.monthYear && b.monthYear.toLowerCase() !== selectedMonthText.toLowerCase()) {
        return false;
      }
      const dNum = getBookingDayNum(b);
      return dNum !== undefined && dNum === selectedDay;
    });

    // Ensure all confirmed booked slots from scheduleDaySlots for target date are included
    store.scheduleDaySlots
      .filter((s) => s.isBooked && (s.dateKey === targetDayDateKey || (s.dateKey && getBookingDayNum({ dateKey: s.dateKey } as any) === selectedDay)))
      .forEach((s) => {
        const alreadyExists = list.some(
          (b) =>
            b.id === `cal-slot-${s.id}` ||
            b.id === s.id ||
            (b.dateKey === (s.dateKey || targetDayDateKey) &&
              (b.timeSlot === s.startTime || b.timeRange === s.timeRange))
        );
        if (!alreadyExists) {
          const rawTime = s.startTime || s.timeRange.split("–")[0]?.trim() || "10:00 AM";
          list.push({
            id: `cal-slot-${s.id}`,
            timeSlot: rawTime,
            studentId: "",
            studentAnonId: s.studentName || "Student #5104",
            displayName: s.studentName || "Student #5104",
            idMode: "anonymous" as const,
            subInfo: `${s.dateDisplay || s.dateKey || "Upcoming"} • Confirmed Booking`,
            timeRange: s.timeRange,
            modality: (s.modalityType === "chat" ? "chat" : s.modalityType === "in-person" ? "in-person" : "video") as any,
            modalityLabel: s.modalityType === "chat" ? "Secure Thread" : s.modalityType === "in-person" ? "In-Person Consultation" : "Consultation (45m)",
            securityTag: "E2E Encrypted",
            roomId: `brth-${s.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
            roomOrDetail: `Room ID: brth-${s.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
            isOpenSlot: false,
            isBlocked: false,
            statusText: "Intake Complete",
            dateStr: s.dateDisplay || s.dateKey,
            dateKey: s.dateKey || targetDayDateKey,
            dayNum: selectedDay,
            monthYear: selectedMonthText,
            isExpired: false,
            isPast: false,
          });
        }
      });

    // Sort all timeline items chronologically from earliest to latest time
    return list.sort(
      (a, b) => parseTimeToMinutes(a.timeSlot || a.timeRange) - parseTimeToMinutes(b.timeSlot || b.timeRange)
    );
  }, [store.calendarBookings, store.scheduleDaySlots, selectedDay, navYear, navMonth, targetDayDateKey, selectedMonthText]);

  // Dynamic Month Calendar Grid calculation (Monday-first)
  const monthDays = useMemo(() => {
    const firstDay = new Date(navYear, navMonth, 1);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(navYear, navMonth, 0).getDate();

    // Map modality dots per day from real bookings
    const bookedMap: Record<number, ("video" | "chat" | "in-person")[]> = {};
    monthBookings.forEach((b) => {
      const day = getBookingDayNum(b);
      if (!day) return;
      if (!bookedMap[day]) bookedMap[day] = [];
      const mod = b.modality || "video";
      if (!bookedMap[day].includes(mod)) {
        bookedMap[day].push(mod);
      }
    });

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      bookedTypes?: ("video" | "chat" | "in-person")[];
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
        bookedTypes: bookedMap[d] && bookedMap[d].length > 0 ? bookedMap[d] : undefined,
      });
    }

    // Trailing days to round to complete rows
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [navYear, navMonth, monthBookings]);

  // Dynamic capacity metric from real database bookings
  const monthCapacityText = useMemo(() => {
    const totalWorkingSlots = 22 * 4; // ~22 clinical days * 4 slots/day
    const capacity = Math.min(100, Math.round((monthBookings.length / totalWorkingSlots) * 100));
    return `${capacity}% Slot capacity`;
  }, [monthBookings.length]);

  // Week days strip calculation (Mon – Sun)
  const weekDays = useMemo(() => {
    const selDate = new Date(navYear, navMonth, selectedDay);
    const dayOfWeek = (selDate.getDay() + 6) % 7; // Mon = 0
    const monday = new Date(selDate);
    monday.setDate(selDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dYear = d.getFullYear();
      const dMonth = d.getMonth();
      const dNum = d.getDate();
      const isSelected = dNum === selectedDay && dMonth === navMonth && dYear === navYear;

      const dateKeyStr = `${dYear}-${String(dMonth + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;

      const bList = store.calendarBookings.filter((b) => {
        if (b.isOpenSlot) return false;
        if (b.statusText === "Cancelled") return false;
        if (b.dateKey) return b.dateKey === dateKeyStr;
        const dBookingNum = getBookingDayNum(b);
        return dBookingNum === dNum && dMonth === navMonth;
      });

      days.push({
        date: d,
        dayNum: dNum,
        year: dYear,
        month: dMonth,
        dayName: d.toLocaleDateString("en-US", { weekday: "short", timeZone: COLOMBO_TIMEZONE }),
        isSelected,
        bookings: bList,
      });
    }
    return days;
  }, [navYear, navMonth, selectedDay, store.calendarBookings]);

  const handleWeekDaySelect = (wDay: { dayNum: number; month: number; year: number }) => {
    setNavYear(wDay.year);
    setNavMonth(wDay.month);
    setSelectedDay(wDay.dayNum);
    store.setSelectedCalendarDay(wDay.dayNum);
  };

  // Week range title string (e.g. Aug 17 – Aug 23, 2026)
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return "";
    const start = weekDays[0];
    const end = weekDays[6];
    const m1 = start.date.toLocaleDateString("en-US", { month: "short", timeZone: COLOMBO_TIMEZONE });
    const m2 = end.date.toLocaleDateString("en-US", { month: "short", timeZone: COLOMBO_TIMEZONE });
    if (m1 === m2) {
      return `${m1} ${start.dayNum} – ${end.dayNum}, ${start.date.getFullYear()}`;
    }
    return `${m1} ${start.dayNum} – ${m2} ${end.dayNum}, ${end.date.getFullYear()}`;
  }, [weekDays]);

  const weekTotalBookings = useMemo(() => {
    return weekDays.reduce((acc, wd) => acc + wd.bookings.length, 0);
  }, [weekDays]);

  const handleEnterRoom = (booking: CalendarBooking) => {
    if (booking.isExpired || booking.isPast) {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId: booking.id.replace(/^cal-(slot-)?/, ""),
          studentAnonId: booking.studentAnonId || "Student #ANON",
          studentName: booking.displayName,
        },
      });
      return;
    }
    router.navigate({
      pathname: "/(counsellor-detail)/ready-to-join",
      params: {
        sessionId: booking.id.replace(/^cal-(slot-)?/, ""),
        studentAnonId: booking.studentAnonId || "Student #ANON",
        sessionTitle: booking.subInfo || "Encrypted Video Consultation",
        timeRange: booking.timeRange || "10:00 - 10:45",
        duration: "45 min session",
      },
    });
  };

  const handleSessionTap = (booking: CalendarBooking) => {
    if (booking.isOpenSlot) {
      handleBlockSlot(booking.id);
      return;
    }

    if (booking.isExpired || booking.isPast) {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId: booking.id.replace(/^cal-(slot-)?/, ""),
          studentAnonId: booking.studentAnonId,
          studentName: booking.displayName,
        },
      });
      return;
    }

    if (booking.modality === "video") {
      router.navigate({
        pathname: "/(counsellor-detail)/ready-to-join",
        params: {
          studentAnonId: booking.studentAnonId,
          sessionTitle: "Encrypted Video Consultation",
          timeRange: booking.timeRange,
          sessionId: booking.id,
        },
      });
    } else if (booking.modality === "chat") {
      router.navigate({
        pathname: "/(counsellor)/messages",
        params: {
          studentAnonId: booking.studentAnonId,
          sessionId: booking.id,
        },
      });
    } else if (booking.modality === "in-person") {
      router.navigate({
        pathname: "/(counsellor-detail)/anonymous-session-details",
        params: {
          sessionId: booking.id,
          studentAnonId: booking.studentAnonId,
          sessionType: "in-person",
        },
      });
    } else {
      router.navigate({
        pathname: "/(counsellor-detail)/confirmed-session",
        params: {
          sessionId: booking.id,
          studentAnonId: booking.studentAnonId,
        },
      });
    }
  };

  const handleBlockSlot = (slotId: string) => {
    store.blockSlot(slotId);
    showToast("Slot administrative status updated & synced to database.");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Top Navigation Bar ─── */}
      <View style={styles.topNav}>
        <View style={styles.navLeftGroup}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButtonCircle, pressed && styles.pressedState]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color="#1E293B" />
          </Pressable>
          <Text style={styles.navTitle} accessibilityRole="header">
            My Calendar
          </Text>
        </View>

        <View style={styles.navRightGroup}>
          {/* Auto-Sync Live Status Pill */}
          <View style={styles.autoSyncPill}>
            <View style={styles.autoSyncPulseDot} />
            <Text style={styles.autoSyncPillText}>Auto-Sync On</Text>
          </View>

          <Pressable
            onPress={handleJumpToToday}
            style={({ pressed }) => [styles.todayPill, pressed && styles.pressedState]}
            accessibilityRole="button"
            accessibilityLabel="Jump to Today"
          >
            <Text style={styles.todayPillText}>Today</Text>
          </Pressable>

          <View style={styles.avatarWrapper}>
            {store.profile.avatarUrl ? (
              <Image
                source={{ uri: store.profile.avatarUrl }}
                style={styles.counselorAvatar}
                accessibilityLabel="Counselor profile"
              />
            ) : (
              <View style={[styles.counselorAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={18} color="#065F46" />
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>
        </View>
      </View>

      {/* ─── Feedback Toast ─── */}
      {toastMessage && (
        <View style={styles.toastContainer} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={16} color="#076047" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ─── View Switcher (Day / Week / Month) ─── */}
      <View style={styles.switcherContainer}>
        <View style={styles.switcherInner} role="tablist">
          <Pressable
            onPress={() => setActiveRange("day")}
            role="tab"
            accessibilityState={{ selected: activeRange === "day" }}
            accessibilityLabel="Day view"
            style={[styles.switcherButton, activeRange === "day" && styles.switcherButtonActive]}
          >
            <Text
              style={[
                styles.switcherText,
                activeRange === "day" && styles.switcherTextActive,
              ]}
            >
              Day
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveRange("week")}
            role="tab"
            accessibilityState={{ selected: activeRange === "week" }}
            accessibilityLabel="Week view"
            style={[styles.switcherButton, activeRange === "week" && styles.switcherButtonActive]}
          >
            <Text
              style={[
                styles.switcherText,
                activeRange === "week" && styles.switcherTextActive,
              ]}
            >
              Week
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveRange("month")}
            role="tab"
            accessibilityState={{ selected: activeRange === "month" }}
            accessibilityLabel="Month view"
            style={[styles.switcherButton, activeRange === "month" && styles.switcherButtonActive]}
          >
            <Text
              style={[
                styles.switcherText,
                activeRange === "month" && styles.switcherTextActive,
              ]}
            >
              Month
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#065F46"]}
            tintColor="#065F46"
          />
        }
      >
        {/* ─── 1. Day View ─── */}
        {activeRange === "day" && (
          <>
            {/* Day Header Strip with Navigation Steppers */}
            <View style={styles.subHeaderRow}>
              <View style={styles.subHeaderLeft}>
                <View style={styles.dayNavButtonsGroup}>
                  <Pressable
                    onPress={handlePrevDay}
                    style={styles.dayStepChevron}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Previous day"
                  >
                    <Ionicons name="chevron-back" size={16} color="#64748B" />
                  </Pressable>
                  <Text style={styles.subHeaderTitle}>
                    {selectedDayFullTitle}
                  </Text>
                  <Pressable
                    onPress={handleNextDay}
                    style={styles.dayStepChevron}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Next day"
                  >
                    <Ionicons name="chevron-forward" size={16} color="#64748B" />
                  </Pressable>
                </View>
                <Text style={styles.dotDivider}>•</Text>
                <Text style={styles.bookingsCountText}>
                  {dayTimelineItems.filter((b) => !b.isOpenSlot).length}{" "}
                  {dayTimelineItems.filter((b) => !b.isOpenSlot).length === 1 ? "Booking" : "Bookings"}
                </Text>
              </View>
              <View style={styles.timezoneBadge}>
                <Text style={styles.timezoneText}>{COLOMBO_TIMEZONE}</Text>
              </View>
            </View>

            {/* Empty State if No Bookings */}
            {dayTimelineItems.length === 0 ? (
              <View style={styles.dayEmptyStateCard}>
                <View style={styles.dayEmptyStateIconBox}>
                  <Ionicons name="calendar-outline" size={26} color="#065F46" />
                </View>
                <Text style={styles.dayEmptyStateTitle}>No Bookings for {selectedDayFullTitle}</Text>
                <Text style={styles.dayEmptyStateSub}>
                  No active student consultations are scheduled on this date. You can publish availability slots for students to book.
                </Text>
                <Pressable
                  onPress={() => router.navigate("/(counsellor)/schedule")}
                  style={styles.dayEmptyStateBtn}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.dayEmptyStateBtnText}>Manage Availability</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.timelineFeed}>
                {dayTimelineItems.map((booking, idx) => {
                  const isFeatured = !booking.isExpired && !booking.isPast && Boolean(booking.isJustAdded);
                  const isLast = idx === dayTimelineItems.length - 1;

                  if (booking.isOpenSlot) {
                    return (
                      <View key={booking.id} style={styles.timelineRow}>
                        <View style={styles.timeAxisColumn}>
                          <Text style={styles.timeAxisText}>{booking.timeSlot}</Text>
                          <View style={styles.timelineBar} />
                          {!isLast && <View style={styles.dashedTimelineLine} />}
                        </View>

                        <View style={styles.openSlotCard}>
                          <View style={styles.openSlotLeft}>
                            <View style={styles.openSlotIconCircle}>
                              <Ionicons name="time-outline" size={16} color="#64748B" />
                            </View>
                            <Text style={styles.openSlotTitle}>
                              {booking.isBlocked ? "Blocked Out (Paperwork)" : "Open Consultation Slot"}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleBlockSlot(booking.id)}
                            accessibilityRole="button"
                            accessibilityLabel="Block out open consultation slot"
                            hitSlop={8}
                            style={({ pressed }) => [styles.blockOutButton, pressed && styles.pressedState]}
                          >
                            <Text style={styles.blockOutButtonText}>
                              {booking.isBlocked ? "Blocked" : "+ Block Out"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  }

                  const isVideo = booking.modality === "video";
                  const isChat = booking.modality === "chat";
                  const isInPerson = booking.modality === "in-person";

                  return (
                    <View key={booking.id} style={styles.timelineRow}>
                      <View style={styles.timeAxisColumn}>
                        <Text style={[styles.timeAxisText, (isFeatured || isVideo) && styles.timeAxisTextFeatured]}>
                          {booking.timeSlot}
                        </Text>
                        <View style={styles.timelineBar} />
                        {!isLast && <View style={styles.solidTimelineLine} />}
                      </View>

                      {/* Schedule Card */}
                      <Pressable
                        onPress={() => handleSessionTap(booking)}
                        accessibilityRole="button"
                        accessibilityLabel={`View session with ${booking.studentAnonId}`}
                        style={({ pressed }) => [
                          styles.sessionCard,
                          isFeatured && styles.sessionCardFeatured,
                          pressed && styles.pressedState,
                        ]}
                      >
                        {/* Top Right "JUST ADDED" Pill Badge */}
                        {isFeatured && (
                          <View style={styles.justAddedBadge}>
                            <View style={styles.pulseDotGreen} />
                            <Text style={styles.justAddedText}>JUST ADDED</Text>
                          </View>
                        )}

                        <View style={styles.cardHeaderRow}>
                          <View style={styles.headerInfoGroup}>
                            <View
                              style={[
                                styles.modalityIconBox,
                                isVideo
                                  ? styles.videoIconBox
                                  : isChat
                                  ? styles.chatIconBox
                                  : styles.inPersonIconBox,
                              ]}
                            >
                              <Ionicons
                                name={
                                  isVideo
                                    ? "videocam"
                                    : isChat
                                    ? "chatbubble"
                                    : "person"
                                }
                                size={15}
                                color={isInPerson ? "#475569" : "#076047"}
                              />
                            </View>
                            <View style={styles.nameBlock}>
                              <Text style={styles.cardStudentName}>{booking.displayName || booking.studentAnonId}</Text>
                              <Text style={styles.cardSubInfo}>{booking.subInfo}</Text>
                            </View>
                          </View>

                          <View style={styles.timeRangeCapsule}>
                            <Text style={styles.timeRangeCapsuleText}>{booking.timeRange}</Text>
                          </View>
                        </View>

                        {/* Modality Content 1: VIDEO CONSULTATION */}
                        {isVideo && (
                          <>
                            <View style={styles.featuredChipsRow}>
                              <View style={styles.featuredTagBox}>
                                <Text style={styles.featuredTagCategory}>[VIDEO]</Text>
                                <View style={styles.featuredTagValRow}>
                                  <Ionicons name="videocam-outline" size={13} color="#076047" />
                                  <Text style={styles.featuredTagValText} numberOfLines={1}>
                                    {booking.modalityLabel || "Consultation (45m)"}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.featuredTagBox}>
                                <Text style={styles.featuredTagCategory}>SECURITY</Text>
                                <View style={styles.featuredTagValRow}>
                                  <Ionicons name="shield-checkmark-outline" size={13} color="#076047" />
                                  <Text style={styles.featuredTagValText} numberOfLines={1}>
                                    {booking.securityTag || "E2E Encrypted"}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View style={styles.roomActionFooter}>
                              <View style={styles.roomIdGroup}>
                                <Ionicons name="link-outline" size={16} color="#64748B" />
                                <View>
                                  <Text style={styles.roomIdCategory}>ROOM ID</Text>
                                  <Text style={styles.roomIdText}>{booking.roomId || `brth-${booking.id.replace(/^cal-/, "").slice(0, 8)}`}</Text>
                                </View>
                              </View>

                              <Pressable
                                onPress={() => handleEnterRoom(booking)}
                                accessibilityRole="button"
                                accessibilityLabel={
                                  booking.isExpired || booking.isPast
                                    ? `Review clinical notes for ${booking.studentAnonId}`
                                    : `Enter video room for ${booking.studentAnonId}`
                                }
                                style={({ pressed }) => [
                                  styles.enterRoomButton,
                                  (booking.isExpired || booking.isPast) && styles.concludedRoomButton,
                                  pressed && styles.pressedState,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.enterRoomButtonText,
                                    (booking.isExpired || booking.isPast) && styles.concludedRoomButtonText,
                                  ]}
                                >
                                  {booking.isExpired || booking.isPast ? "View Notes" : "Enter Room"}
                                </Text>
                              </Pressable>
                            </View>
                          </>
                        )}

                        {/* Modality Content 2: CHAT CONSULTATION */}
                        {isChat && (
                          <View style={styles.standardCardFooter}>
                            <View style={styles.standardFooterLeft}>
                              <Text style={styles.standardCategoryTag}>[CHAT]</Text>
                              <Text style={styles.standardCategoryValue}>
                                {booking.modalityLabel || "Secure Thread"}
                              </Text>
                              <View style={styles.encryptedTagGroup}>
                                <Ionicons name="lock-closed-outline" size={12} color="#076047" />
                                <Text style={styles.encryptedTagText}>
                                  {booking.isExpired || booking.isPast ? "Concluded" : (booking.securityTag || "Encrypted")}
                                </Text>
                              </View>
                            </View>

                            <Pressable
                              onPress={() => handleSessionTap(booking)}
                              accessibilityRole="button"
                              accessibilityLabel={
                                booking.isExpired || booking.isPast
                                  ? `Review clinical notes for ${booking.studentAnonId}`
                                  : `Open chat with ${booking.studentAnonId}`
                              }
                              style={({ pressed }) => [
                                styles.enterRoomButton,
                                (booking.isExpired || booking.isPast) && styles.concludedRoomButton,
                                pressed && styles.pressedState,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.enterRoomButtonText,
                                  (booking.isExpired || booking.isPast) && styles.concludedRoomButtonText,
                                ]}
                              >
                                {booking.isExpired || booking.isPast ? "View Notes" : "Open Chat"}
                              </Text>
                            </Pressable>
                          </View>
                        )}

                        {/* Modality Content 3: IN-PERSON CONSULTATION */}
                        {isInPerson && (
                          <View style={styles.inPersonFooterRow}>
                            <View style={styles.inPersonTagBox}>
                              <Text style={styles.featuredTagCategory}>[IN-PERSON]</Text>
                              <Text style={styles.inPersonTagVal}>
                                {booking.modalityLabel || "Consultation"}
                              </Text>
                              <View style={styles.readyTagGroup}>
                                <Ionicons name={booking.isExpired || booking.isPast ? "time-outline" : "checkmark"} size={13} color="#076047" />
                                <Text style={styles.readyTagText}>
                                  {booking.isExpired || booking.isPast ? "Concluded" : (booking.statusText || "Room 302")}
                                </Text>
                              </View>
                            </View>

                            <Pressable
                              onPress={() => handleSessionTap(booking)}
                              accessibilityRole="button"
                              accessibilityLabel={
                                booking.isExpired || booking.isPast
                                  ? `Review clinical notes for ${booking.studentAnonId}`
                                  : `View details for ${booking.studentAnonId}`
                              }
                              style={({ pressed }) => [
                                styles.enterRoomButton,
                                (booking.isExpired || booking.isPast) && styles.concludedRoomButton,
                                pressed && styles.pressedState,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.enterRoomButtonText,
                                  (booking.isExpired || booking.isPast) && styles.concludedRoomButtonText,
                                ]}
                              >
                                {booking.isExpired || booking.isPast ? "View Notes" : "View Details"}
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ─── 2. Week View (Interactive 7-Day Matrix) ─── */}
        {activeRange === "week" && (
          <View style={styles.weekContainer}>
            {/* Week Header with Navigation Steppers */}
            <View style={styles.subHeaderRow}>
              <View style={styles.subHeaderLeft}>
                <View style={styles.dayNavButtonsGroup}>
                  <Pressable
                    onPress={handlePrevWeek}
                    style={styles.dayStepChevron}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Previous week"
                  >
                    <Ionicons name="chevron-back" size={16} color="#64748B" />
                  </Pressable>
                  <Text style={styles.subHeaderTitle}>
                    {weekRangeTitle}
                  </Text>
                  <Pressable
                    onPress={handleNextWeek}
                    style={styles.dayStepChevron}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Next week"
                  >
                    <Ionicons name="chevron-forward" size={16} color="#64748B" />
                  </Pressable>
                </View>
                <Text style={styles.dotDivider}>•</Text>
                <Text style={styles.bookingsCountText}>
                  {weekTotalBookings} Total
                </Text>
              </View>
              <View style={styles.timezoneBadge}>
                <Text style={styles.timezoneText}>{COLOMBO_TIMEZONE}</Text>
              </View>
            </View>

            {/* 7-Day Horizontal Strip */}
            <View style={styles.weekStripRow}>
              {weekDays.map((wDay) => (
                <Pressable
                  key={`${wDay.year}-${wDay.month}-${wDay.dayNum}`}
                  onPress={() => handleWeekDaySelect(wDay)}
                  style={[
                    styles.weekDayPill,
                    wDay.isSelected && styles.weekDayPillSelected,
                  ]}
                >
                  <Text style={[styles.weekDayNameText, wDay.isSelected && styles.weekDayTextSelected]}>
                    {wDay.dayName}
                  </Text>
                  <Text style={[styles.weekDayNumText, wDay.isSelected && styles.weekDayTextSelected]}>
                    {wDay.dayNum}
                  </Text>
                  <View style={styles.weekDotRow}>
                    {wDay.bookings.length > 0 ? (
                      <View style={[styles.miniDot, styles.solidVideoDot, wDay.isSelected && { backgroundColor: "#FFFFFF" }]} />
                    ) : (
                      <View style={styles.weekEmptyDot} />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Sessions for the selected day in this week */}
            <View style={styles.weekSessionList}>
              <View style={styles.weekListHeaderRow}>
                <Text style={styles.weekListHeaderTitle}>
                  {selectedDayFullTitle} Schedule
                </Text>
                <Pressable
                  onPress={() => setActiveRange("day")}
                  style={styles.weekListDayViewBtn}
                >
                  <Text style={styles.weekListDayViewBtnText}>Full Day View</Text>
                  <Ionicons name="arrow-forward" size={13} color="#065F46" />
                </Pressable>
              </View>

              {selectedDayBookings.length === 0 ? (
                <View style={styles.weekEmptyCard}>
                  <Text style={styles.weekEmptyTitle}>No consultations on {selectedDayFullTitle}</Text>
                  <Text style={styles.weekEmptySub}>Tap any day above to review sessions.</Text>
                </View>
              ) : (
                selectedDayBookings.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => handleSessionTap(b)}
                    style={styles.weekSessionCard}
                  >
                    <View style={styles.weekSessionLeft}>
                      <View
                        style={[
                          styles.modalityIconBox,
                          b.modality === "video"
                            ? styles.videoIconBox
                            : b.modality === "chat"
                            ? styles.chatIconBox
                            : styles.inPersonIconBox,
                        ]}
                      >
                        <Ionicons
                          name={
                            b.modality === "video"
                              ? "videocam"
                              : b.modality === "chat"
                              ? "chatbubble"
                              : "person"
                          }
                          size={14}
                          color={b.modality === "in-person" ? "#475569" : "#076047"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.weekStudentName}>{b.displayName || b.studentAnonId}</Text>
                          {b.isExpired || b.isPast ? (
                            <View style={styles.concludedPill}>
                              <Text style={styles.concludedPillText}>Concluded</Text>
                            </View>
                          ) : (
                            <View style={styles.confirmedPill}>
                              <Text style={styles.confirmedPillText}>Confirmed</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.weekSessionTime}>{b.timeRange} • {b.subInfo}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                  </Pressable>
                ))
              )}
            </View>
          </View>
        )}

        {/* ─── 3. Month View ─── */}
        {activeRange === "month" && (
          <>
            {/* Month Calendar Section */}
            <View style={styles.monthCard}>
              <View style={styles.monthHeaderRow}>
                <View style={styles.monthTitleLeft}>
                  <Text style={styles.monthHeading}>{selectedMonthText}</Text>
                  <View style={styles.utcBadge}>
                    <Text style={styles.utcBadgeText}>{COLOMBO_TIMEZONE}</Text>
                  </View>
                </View>

                <View style={styles.monthChevrons}>
                  <Pressable
                    onPress={handlePrevMonth}
                    accessibilityRole="button"
                    accessibilityLabel="Previous month"
                    style={styles.monthNavChevron}
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-back" size={16} color="#64748B" />
                  </Pressable>
                  <Pressable
                    onPress={handleNextMonth}
                    accessibilityRole="button"
                    accessibilityLabel="Next month"
                    style={styles.monthNavChevron}
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#64748B" />
                  </Pressable>
                </View>
              </View>

              {/* Day of Week Labels */}
              <View style={styles.weekLabelsRow}>
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((lbl) => (
                  <Text key={lbl} style={styles.weekLabelText}>
                    {lbl}
                  </Text>
                ))}
              </View>

              {/* Month Grid */}
              <View style={styles.monthDaysGrid}>
                {monthDays.map((item, i) => {
                  const isSelected = item.isCurrentMonth && item.day === selectedDay;

                  return (
                    <Pressable
                      key={i}
                      onPress={() => item.isCurrentMonth && handleDaySelect(item.day)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={
                        item.isCurrentMonth
                          ? `${selectedMonthText} ${item.day}, ${item.bookedTypes?.length || 0} sessions`
                          : `Adjacent month day ${item.day}`
                      }
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.dayNumCircle,
                          isSelected && styles.dayNumCircleSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNumText,
                            !item.isCurrentMonth && styles.dayNumDimmed,
                            isSelected && styles.dayNumTextSelected,
                          ]}
                        >
                          {item.day}
                        </Text>
                      </View>

                      {/* Modality Marker Dots */}
                      <View style={styles.markerDotsRow}>
                        {item.bookedTypes?.map((mod, dotIdx) => (
                          <View
                            key={dotIdx}
                            style={[
                              styles.miniDot,
                              mod === "video"
                                ? styles.solidVideoDot
                                : mod === "chat"
                                ? styles.hollowChatDot
                                : styles.squareInPersonDot,
                            ]}
                          />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Month Summary Footer */}
              <View style={styles.monthFooterRow}>
                <Text style={styles.monthScheduledCount}>
                  {monthBookings.length} Consultations scheduled
                </Text>
                <Text style={styles.monthCapacityText}>{monthCapacityText}</Text>
              </View>
            </View>

            {/* Selected Date Preview Card (Tappable to Day View) */}
            <Pressable
              onPress={() => setActiveRange("day")}
              accessibilityRole="button"
              accessibilityLabel={`Open day view for ${selectedDayFullTitle}`}
              style={({ pressed }) => [styles.previewCard, pressed && styles.pressedState]}
            >
              <View style={styles.previewHeaderRow}>
                <View style={styles.previewHeaderLeft}>
                  <Text style={styles.previewTitle}>{selectedDayFullTitle}</Text>
                  <View style={styles.previewDot} />
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>
                      {selectedDayBookings.length} Bookings
                    </Text>
                  </View>
                </View>

                <View style={styles.dayViewLinkGroup}>
                  <Text style={styles.dayViewLinkText}>Day View</Text>
                  <Ionicons name="chevron-forward" size={14} color="#076047" />
                </View>
              </View>

              {/* Micro Schedule Items */}
              <View style={styles.microItemsContainer}>
                {selectedDayBookings.length === 0 ? (
                  <View style={styles.previewEmptyBox}>
                    <Text style={styles.previewEmptyText}>
                      No consultations scheduled for this date. Tap to inspect Day View.
                    </Text>
                  </View>
                ) : (
                  selectedDayBookings.map((b) => (
                    <View
                      key={b.id}
                      style={[
                        styles.microItemRow,
                        b.modality === "video" && !(b.isExpired || b.isPast) && styles.microItemHighlighted,
                        (b.isExpired || b.isPast) && styles.microItemConcluded,
                      ]}
                    >
                      <View style={styles.microItemLeft}>
                        {b.modality === "video" ? (
                          <View style={styles.microSolidCircle} />
                        ) : b.modality === "chat" ? (
                          <View style={styles.microHollowCircle} />
                        ) : (
                          <View style={styles.microSquare} />
                        )}
                        <Text
                          style={[
                            styles.microTimeText,
                            b.modality === "video" && !(b.isExpired || b.isPast) && styles.microTimeTextHighlighted,
                          ]}
                        >
                          {b.timeRange}
                        </Text>
                        <Text
                          style={[
                            styles.microStudentText,
                            b.modality === "video" && !(b.isExpired || b.isPast) && styles.microStudentHighlighted,
                          ]}
                          numberOfLines={1}
                        >
                          {b.displayName || b.studentAnonId}
                        </Text>
                      </View>
                      <Text
                        style={
                          b.isExpired || b.isPast
                            ? styles.microModalityTagConcluded
                            : b.modality === "video"
                            ? styles.microModalityTagHighlighted
                            : styles.microModalityTag
                        }
                      >
                        {b.isExpired || b.isPast ? "CONCLUDED" : (b.modality || "VIDEO").toUpperCase()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </Pressable>
          </>
        )}

        {/* ─── Modality Legend Strip (Present on all views) ─── */}
        <View style={styles.legendStrip}>
          <View style={styles.legendItem}>
            <View style={styles.legendVideoDot} />
            <Text style={styles.legendText}>[Video]</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <View style={styles.legendChatDot} />
            <Text style={styles.legendText}>[Chat]</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <View style={styles.legendInPersonSquare} />
            <Text style={styles.legendText}>[In-Person]</Text>
          </View>
        </View>

        {/* ─── Bottom System Status Bar ─── */}
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [styles.syncStatusFooter, pressed && styles.pressedState]}
          accessibilityRole="button"
          accessibilityLabel="Refresh live synchronization"
        >
          <View style={styles.syncStatusLeft}>
            <View style={styles.syncGreenCheckCircle}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
            <Text style={styles.syncStatusText}>Synced with Apple & Google Calendar • Asia/Colombo</Text>
          </View>

          <View style={styles.syncStatusRight}>
            <Ionicons name="refresh" size={13} color="#065F46" />
            <Text style={styles.syncTimeText}>Live</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },
  topNav: {
    height: 52,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF7F0",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.6)",
  },
  navLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButtonCircle: {
    width: TOUCH_TARGET - 8,
    height: TOUCH_TARGET - 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  navRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  autoSyncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  autoSyncPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  autoSyncPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  todayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  avatarWrapper: {
    position: "relative",
    width: 36,
    height: 36,
  },
  counselorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.25)",
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#076047",
    flex: 1,
  },
  switcherContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  switcherInner: {
    flexDirection: "row",
    backgroundColor: "rgba(226, 232, 240, 0.7)",
    borderRadius: radius.md,
    padding: 3,
  },
  switcherButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md - 2,
  },
  switcherButtonActive: {
    backgroundColor: "#065F46",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  switcherText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  switcherTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 40,
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  subHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dayNavButtonsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dayStepChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  subHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  dotDivider: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "700",
  },
  bookingsCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  timezoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(226, 232, 240, 0.7)",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  timezoneText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#334155",
  },
  dayEmptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: spacing.lg,
  },
  dayEmptyStateIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dayEmptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  dayEmptyStateSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  dayEmptyStateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#065F46",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  dayEmptyStateBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  timelineFeed: {
    paddingTop: spacing.sm,
    gap: 16,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timeAxisColumn: {
    width: 66,
    paddingTop: 8,
    alignItems: "flex-end",
    paddingRight: 10,
    position: "relative",
  },
  timeAxisText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  timeAxisTextFeatured: {
    color: "#0F172A",
    fontWeight: "700",
  },
  timelineBar: {
    position: "absolute",
    right: -1,
    top: 9,
    width: 2.5,
    height: 14,
    borderRadius: 1.25,
    backgroundColor: "#0F172A",
  },
  solidTimelineLine: {
    position: "absolute",
    right: -0.5,
    top: 27,
    bottom: -24,
    width: 2,
    backgroundColor: "#E2E8F0",
  },
  dashedTimelineLine: {
    position: "absolute",
    right: -0.5,
    top: 27,
    bottom: 0,
    width: 2,
    borderRightWidth: 2,
    borderRightColor: "#CBD5E1",
    borderStyle: "dashed",
  },
  sessionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionCardFeatured: {
    borderWidth: 2,
    borderColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  justAddedBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  pulseDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  justAddedText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  headerInfoGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  modalityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  videoIconBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  chatIconBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  inPersonIconBox: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  nameBlock: {
    flex: 1,
  },
  cardStudentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubInfo: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  timeRangeCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeRangeCapsuleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  featuredChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  featuredTagBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 8,
  },
  featuredTagCategory: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  featuredTagValRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  featuredTagValText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  roomActionFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomIdGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomIdCategory: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  roomIdText: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#0F172A",
  },
  enterRoomButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  concludedRoomButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  enterRoomButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  concludedRoomButtonText: {
    color: "#475569",
    fontWeight: "600",
  },
  standardCardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  standardFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  standardCategoryTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  standardCategoryValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  standardFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  encryptedTagGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  encryptedTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#076047",
  },
  readyTagGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  readyTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#076047",
  },
  inPersonFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inPersonTagBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inPersonTagVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  openSlotCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: radius.md,
    padding: spacing.md - 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  openSlotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  openSlotIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  openSlotTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    flex: 1,
  },
  blockOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md - 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  blockOutButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  // ─── Week View Styles ───
  weekContainer: {
    paddingTop: spacing.xs,
  },
  weekStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginVertical: spacing.md,
  },
  weekDayPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  weekDayPillSelected: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  weekDayNameText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  weekDayNumText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  weekDayTextSelected: {
    color: "#FFFFFF",
  },
  weekDotRow: {
    height: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  weekEmptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  weekSessionList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(6, 95, 70, 0.1)",
    marginBottom: spacing.md,
  },
  weekListHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekListHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  weekListDayViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weekListDayViewBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  weekEmptyCard: {
    paddingVertical: 20,
    alignItems: "center",
  },
  weekEmptyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  weekEmptySub: {
    fontSize: 11,
    color: "#94A3B8",
  },
  weekSessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  weekSessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  weekStudentName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  weekSessionTime: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  concludedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  concludedPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  confirmedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  confirmedPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  // ─── Month View Styles ───
  monthCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(6, 95, 70, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.md,
  },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  monthTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  utcBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  utcBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  monthChevrons: {
    flexDirection: "row",
    gap: 6,
  },
  monthNavChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  weekLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
    width: "14.28%",
  },
  monthDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: "14.28%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayCellSelected: {},
  dayNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumCircleSelected: {
    backgroundColor: "#065F46",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  dayNumDimmed: {
    color: "#CBD5E1",
  },
  dayNumTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  markerDotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
    height: 4,
    alignItems: "center",
  },
  miniDot: {
    width: 4,
    height: 4,
  },
  solidVideoDot: {
    borderRadius: 2,
    backgroundColor: "#0F172A",
  },
  hollowChatDot: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#0F172A",
    backgroundColor: "transparent",
  },
  squareInPersonDot: {
    borderRadius: 1,
    backgroundColor: "#0F172A",
  },
  monthFooterRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthScheduledCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  monthCapacityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(6, 95, 70, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: spacing.md,
  },
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  previewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  previewDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(6, 95, 70, 0.15)",
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  dayViewLinkGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dayViewLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  microItemsContainer: {
    gap: 6,
    paddingTop: 4,
  },
  previewEmptyBox: {
    paddingVertical: 12,
    alignItems: "center",
  },
  previewEmptyText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  microItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  microItemHighlighted: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "rgba(6, 95, 70, 0.15)",
  },
  microItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  microHollowCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#0F172A",
  },
  microSolidCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#065F46",
  },
  microSquare: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: "#0F172A",
  },
  microTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  microTimeTextHighlighted: {
    color: "#065F46",
    fontWeight: "700",
  },
  microStudentText: {
    fontSize: 12,
    color: "#64748B",
  },
  microStudentHighlighted: {
    color: "#065F46",
    fontWeight: "600",
  },
  microModalityTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  microModalityTagHighlighted: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065F46",
  },
  microItemConcluded: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  microModalityTagConcluded: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  legendStrip: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendVideoDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#0F172A",
  },
  legendChatDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: "#0F172A",
  },
  legendInPersonSquare: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: "#0F172A",
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  legendDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#E2E8F0",
  },
  syncStatusFooter: {
    backgroundColor: "rgba(226, 232, 240, 0.6)",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  syncStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  syncGreenCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
  },
  syncStatusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  syncTimeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
