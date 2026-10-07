// Add Session Screen - Multi-Slot Availability Publisher - Muaath (Member 4). Supports FR08, NFR01, NFR06.
// Focused, essential clinical availability publisher: allows counsellors to publish open slots for specific dates and times
// (visible in detail on both the student side for all students and on the counsellor side in Sessions, My Calendar, and Schedule).
// Real Firestore batch writes to slots/{slotId} and counsellors/{uid}.

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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { PublishSlotInput, useCounsellorStore } from "@/services/counsellorStore";
import { SessionType } from "@/types/counsellorDashboard";

type DurationOption = "30m" | "45m" | "60m";

const QUICK_TIMES = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

export default function AddSessionScreen() {
  const store = useCounsellorStore();

  // Live Asia/Colombo clock tracker (updates periodically to track time progression)
  const [nowClock, setNowClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowClock(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const colomboNowInfo = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(nowClock);
    const year = parts.find((p) => p.type === "year")?.value || `${nowClock.getFullYear()}`;
    const month = parts.find((p) => p.type === "month")?.value || `${nowClock.getMonth() + 1}`.padStart(2, "0");
    const day = parts.find((p) => p.type === "day")?.value || `${nowClock.getDate()}`.padStart(2, "0");
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || `${nowClock.getHours()}`, 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || `${nowClock.getMinutes()}`, 10);

    const dateKey = `${year}-${month}-${day}`;
    const currentMinutes = hour * 60 + minute;
    const timeDisplay = nowClock.toLocaleTimeString("en-US", {
      timeZone: "Asia/Colombo",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { dateKey, currentMinutes, hour, minute, timeDisplay };
  }, [nowClock]);

  // Helper to parse "HH:MM AM/PM" into minutes from midnight (0..1439)
  const parseTimeToMinutes = (timeStr: string): number => {
    const parts = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!parts) return -1;
    let h = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const meridiem = parts[3].toUpperCase();
    if (h < 1 || h > 12 || m < 0 || m > 59) return -1;
    if (meridiem === "PM" && h < 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  // Helper to check if a specific time on a specific date is already in the past
  const isSlotInPast = (dateKey: string, timeStr: string): boolean => {
    if (dateKey < colomboNowInfo.dateKey) return true;
    if (dateKey === colomboNowInfo.dateKey) {
      const slotMinutes = parseTimeToMinutes(timeStr);
      if (slotMinutes < 0) return true;
      return slotMinutes <= colomboNowInfo.currentMinutes;
    }
    return false;
  };

  // Dynamic Colombo date generation (next 14 days)
  const upcomingDays = useMemo(() => {
    const days = [];
    const [y, m, d] = colomboNowInfo.dateKey.split("-").map(Number);
    for (let i = 0; i < 14; i++) {
      const cur = new Date(y, m - 1, d + i);
      const dayNum = cur.getDate();
      const weekday = cur.toLocaleDateString("en-US", { weekday: "short" });
      const month = cur.toLocaleDateString("en-US", { month: "short" });
      const dateKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        dateKey,
        dayNum,
        weekday,
        month,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${weekday}, ${month} ${dayNum}`,
        dateObj: cur,
        isWeekend: cur.getDay() === 0 || cur.getDay() === 6,
      });
    }
    return days;
  }, [colomboNowInfo.dateKey]);

  // Essential state: Selected dates (multi-select), selected times, duration, modality
  const [selectedDateKeys, setSelectedDateKeys] = useState<string[]>([
    upcomingDays[1]?.dateKey || upcomingDays[0].dateKey,
  ]);

  // Check if a time slot is passed for any of the active selected dates
  const isTimeSlotPassedForSelectedDates = (timeStr: string): boolean => {
    if (selectedDateKeys.includes(colomboNowInfo.dateKey)) {
      return isSlotInPast(colomboNowInfo.dateKey, timeStr);
    }
    return selectedDateKeys.every((dKey) => isSlotInPast(dKey, timeStr));
  };

  // Check if standard daytime clinic hours have completely concluded for today
  const allTodayStandardHoursPassed = useMemo(() => {
    if (!selectedDateKeys.includes(colomboNowInfo.dateKey)) return false;
    return QUICK_TIMES.every((t) => isSlotInPast(colomboNowInfo.dateKey, t));
  }, [selectedDateKeys, colomboNowInfo]);

  // Check if a slot has already been added/created in the database for any of the selected dates
  const isSlotAlreadyAddedForSelectedDates = (timeStr: string): boolean => {
    return selectedDateKeys.some((dKey) =>
      store.scheduleDaySlots.some(
        (existing) =>
          existing.dateKey === dKey &&
          (existing.startTime === timeStr || existing.timeRange.startsWith(timeStr))
      )
    );
  };

  // Check if a slot has already been booked in the database for any of the selected dates
  const isSlotAlreadyBookedForSelectedDates = (timeStr: string): boolean => {
    return selectedDateKeys.some((dKey) =>
      store.scheduleDaySlots.some(
        (existing) =>
          existing.isBooked &&
          existing.dateKey === dKey &&
          (existing.startTime === timeStr || existing.timeRange.startsWith(timeStr))
      )
    );
  };

  const [selectedTimes, setSelectedTimes] = useState<string[]>(() => {
    const defaultDate = upcomingDays[1]?.dateKey || upcomingDays[0]?.dateKey;
    const firstValid = QUICK_TIMES.find((t) => {
      const isPast = defaultDate === colomboNowInfo.dateKey ? isSlotInPast(defaultDate, t) : false;
      const isExisting = store.scheduleDaySlots.some(
        (existing) => existing.dateKey === defaultDate && (existing.startTime === t || existing.timeRange.startsWith(t))
      );
      return !isPast && !isExisting;
    });
    return firstValid ? [firstValid] : [];
  });

  const allDisplayedTimes = useMemo(() => {
    const customList = selectedTimes.filter((t) => !QUICK_TIMES.includes(t));
    return [...QUICK_TIMES, ...customList].sort(
      (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
    );
  }, [selectedTimes]);

  const [duration, setDuration] = useState<DurationOption>("45m");
  const [selectedModalities, setSelectedModalities] = useState<SessionType[]>(["video"]);
  const [customTime, setCustomTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Auto-dismiss toast feedback
  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  const toggleDate = (dateKey: string) => {
    let nextDateKeys: string[];
    if (selectedDateKeys.includes(dateKey)) {
      if (selectedDateKeys.length > 1) {
        nextDateKeys = selectedDateKeys.filter((k) => k !== dateKey);
      } else {
        setFeedbackToast("At least one date must remain selected.");
        return;
      }
    } else {
      nextDateKeys = [...selectedDateKeys, dateKey];
    }
    setSelectedDateKeys(nextDateKeys);

    // Prune any selected times that have already passed OR already been created in the database for the dates
    const validTimes = selectedTimes.filter((t) => {
      const isPast = nextDateKeys.includes(colomboNowInfo.dateKey) && isSlotInPast(colomboNowInfo.dateKey, t);
      const isCreated = nextDateKeys.some((k) =>
        store.scheduleDaySlots.some(
          (existing) => existing.dateKey === k && (existing.startTime === t || existing.timeRange.startsWith(t))
        )
      );
      return !isPast && !isCreated;
    });

    if (validTimes.length !== selectedTimes.length) {
      setSelectedTimes(validTimes);
      setFeedbackToast(
        `Pruned time slot(s) that have already concluded or been created in the database.`
      );
    }
  };

  const selectAllWeekdays = () => {
    const weekdays = upcomingDays.filter((d) => !d.isWeekend).slice(0, 5).map((d) => d.dateKey);
    setSelectedDateKeys(weekdays);
    const validTimes = selectedTimes.filter((t) => {
      const isPast = weekdays.includes(colomboNowInfo.dateKey) && isSlotInPast(colomboNowInfo.dateKey, t);
      const isCreated = weekdays.some((k) =>
        store.scheduleDaySlots.some(
          (existing) => existing.dateKey === k && (existing.startTime === t || existing.timeRange.startsWith(t))
        )
      );
      return !isPast && !isCreated;
    });
    setSelectedTimes(validTimes);
    setFeedbackToast("Selected Mon–Fri clinical weekdays.");
  };

  const toggleModality = (modality: SessionType) => {
    if (selectedModalities.includes(modality)) {
      if (selectedModalities.length > 1) {
        setSelectedModalities(selectedModalities.filter((m) => m !== modality));
      } else {
        setFeedbackToast("At least one consultation modality must remain selected.");
      }
    } else {
      setSelectedModalities([...selectedModalities, modality]);
    }
  };

  const handleAddCustomTime = () => {
    const trimmed = customTime.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      setFeedbackToast("Time format must be 'HH:MM AM' or 'HH:MM PM' (e.g. 09:30 AM).");
      return;
    }
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const mer = match[3].toUpperCase();
    if (h < 1 || h > 12 || m < 0 || m > 59) {
      setFeedbackToast("Please enter valid hours (1-12) and minutes (00-59).");
      return;
    }
    const formatted = `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m} ${mer}`;

    // Validate that custom time is not in the past for selected dates
    if (isTimeSlotPassedForSelectedDates(formatted)) {
      setFeedbackToast(
        `Cannot add ${formatted}: this time slot has already passed today (current time: ${colomboNowInfo.timeDisplay}).`
      );
      return;
    }

    // Validate that custom time has not already been booked
    if (isSlotAlreadyBookedForSelectedDates(formatted)) {
      setFeedbackToast(
        `Cannot add ${formatted}: this slot has already been booked on the selected date. Counselor validation prevents booking a slot that is already taken.`
      );
      return;
    }

    // Validate that custom time has not already been created in the database
    if (isSlotAlreadyAddedForSelectedDates(formatted)) {
      setFeedbackToast(
        `Cannot add ${formatted}: this availability slot has already been added in the database. Slots can only be created once.`
      );
      return;
    }

    if (selectedTimes.includes(formatted)) {
      setFeedbackToast(`Time slot ${formatted} is already in the selection.`);
      return;
    }
    setSelectedTimes([...selectedTimes, formatted]);
    setCustomTime("");
    setFeedbackToast(`Added custom time slot: ${formatted}`);
  };

  const toggleTimeSelection = (time: string) => {
    if (isTimeSlotPassedForSelectedDates(time)) {
      setFeedbackToast(
        `Time slot ${time} has already passed for today (current time: ${colomboNowInfo.timeDisplay}). Please choose an upcoming time.`
      );
      return;
    }

    if (isSlotAlreadyBookedForSelectedDates(time)) {
      setFeedbackToast(
        `Time slot ${time} has already been booked on the selected date. Counselor validation prevents booking this slot again. Rescheduling is permitted.`
      );
      return;
    }

    if (isSlotAlreadyAddedForSelectedDates(time)) {
      setFeedbackToast(
        `Time slot ${time} has already been added in the database. Availability time slots can only be created once. Rescheduling is allowed multiple times.`
      );
      return;
    }

    if (selectedTimes.includes(time)) {
      if (selectedTimes.length > 1) {
        setSelectedTimes(selectedTimes.filter((t) => t !== time));
      } else {
        setFeedbackToast("At least one time slot must remain selected.");
      }
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  // Calculate slots to publish based on selected dates and times
  const computedSlotsToPublish = useMemo<PublishSlotInput[]>(() => {
    const durationMinutes = parseInt(duration.replace("m", ""), 10) || 45;
    const slots: PublishSlotInput[] = [];

    const getEndTime = (timeStr: string) => {
      const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!parts) return timeStr;
      let h = parseInt(parts[1], 10);
      let m = parseInt(parts[2], 10);
      const meridiem = parts[3].toUpperCase();
      if (meridiem === "PM" && h < 12) h += 12;
      if (meridiem === "AM" && h === 12) h = 0;

      m += durationMinutes;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
      const endMeridiem = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m < 10 ? `0${m}` : m;
      return `${displayH}:${displayM} ${endMeridiem}`;
    };

    const makeDate = (dateKey: string, timeStr: string): { start: Date; end: Date } => {
      const [year, month, day] = dateKey.split("-").map(Number);
      const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      let h = 10;
      let m = 0;
      if (parts) {
        h = parseInt(parts[1], 10);
        m = parseInt(parts[2], 10);
        const meridiem = parts[3].toUpperCase();
        if (meridiem === "PM" && h < 12) h += 12;
        if (meridiem === "AM" && h === 12) h = 0;
      }
      const start = new Date(year, month - 1, day, h, m);
      const end = new Date(start.getTime() + durationMinutes * 60000);
      return { start, end };
    };

    // Filter and sort active times
    const sortedTimes = [...selectedTimes].sort(
      (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
    );
    const activeModalities: SessionType[] =
      selectedModalities.length > 0 ? selectedModalities : ["video"];

    selectedDateKeys.forEach((dKey) => {
      const dayObj = upcomingDays.find((d) => d.dateKey === dKey);
      if (!dayObj) return;

      sortedTimes.forEach((t) => {
        // Enforce strict prevention of past slots
        if (isSlotInPast(dKey, t)) {
          return;
        }

        // Strict clinical validation: Availability slots can only be added or created once
        const alreadyExists = store.scheduleDaySlots.some(
          (existing) =>
            existing.dateKey === dKey &&
            (existing.startTime === t || existing.timeRange.startsWith(t))
        );
        if (alreadyExists) {
          return;
        }

        const { start, end } = makeDate(dayObj.dateKey, t);
        if (start.getTime() <= Date.now()) {
          return;
        }

        slots.push({
          dateKey: dayObj.dateKey,
          dateDisplay: dayObj.label,
          startTime: t,
          endTime: getEndTime(t),
          startAt: start,
          endAt: end,
          sessionTypes: activeModalities,
        });
      });
    });

    return slots;
  }, [selectedDateKeys, selectedTimes, duration, selectedModalities, upcomingDays, colomboNowInfo, store.scheduleDaySlots]);

  const handlePublishSlots = async () => {
    if (isSubmitting) return;

    if (selectedDateKeys.length === 0) {
      setFeedbackToast("Please select at least one date.");
      return;
    }

    if (selectedTimes.length === 0) {
      setFeedbackToast(
        "Please select at least one upcoming time slot. All selected slots may have already passed or been created."
      );
      return;
    }

    if (selectedModalities.length === 0) {
      setFeedbackToast("Please select at least one consultation modality.");
      return;
    }

    // Overlap validation between selected times
    if (selectedTimes.length > 1) {
      const sortedTimes = [...selectedTimes].sort(
        (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
      );
      const durationMinutes = parseInt(duration.replace("m", ""), 10) || 45;
      for (let i = 0; i < sortedTimes.length - 1; i++) {
        const m1 = parseTimeToMinutes(sortedTimes[i]);
        const m2 = parseTimeToMinutes(sortedTimes[i + 1]);
        if (m1 >= 0 && m2 >= 0 && m1 + durationMinutes > m2) {
          setFeedbackToast(
            `Time slot ${sortedTimes[i]} overlaps with ${sortedTimes[i + 1]} (${duration} duration).`
          );
          return;
        }
      }
    }

    // Strict validation: Prevent publishing past times on today's date
    const nowMs = Date.now();
    const pastSlots = computedSlotsToPublish.filter((s) => s.startAt.getTime() <= nowMs);
    if (pastSlots.length > 0) {
      setFeedbackToast(
        `Slot(s) ${pastSlots.map((s) => s.startTime).join(", ")} have already passed today. Please choose upcoming times.`
      );
      return;
    }

    // Strict validation: Availability slots can only be added or created once
    const alreadyCreatedConflicts = computedSlotsToPublish.filter((newSlot) =>
      store.scheduleDaySlots.some(
        (existing) =>
          existing.dateKey === newSlot.dateKey &&
          (existing.startTime === newSlot.startTime || existing.timeRange.startsWith(newSlot.startTime))
      )
    );
    if (alreadyCreatedConflicts.length > 0) {
      setFeedbackToast(
        `Slot on ${alreadyCreatedConflicts[0].dateDisplay || alreadyCreatedConflicts[0].dateKey} at ${alreadyCreatedConflicts[0].startTime} has already been created in the database. Slots can only be added once. Rescheduling is allowed multiple times.`
      );
      return;
    }

    // Strict validation: Prevent overwriting / re-booking existing booked slots
    const bookedConflicts = computedSlotsToPublish.filter((newSlot) =>
      store.scheduleDaySlots.some(
        (existing) =>
          existing.isBooked &&
          existing.dateKey === newSlot.dateKey &&
          (existing.startTime === newSlot.startTime || existing.timeRange.startsWith(newSlot.startTime))
      )
    );
    if (bookedConflicts.length > 0) {
      setFeedbackToast(
        `Slot on ${bookedConflicts[0].dateDisplay || bookedConflicts[0].dateKey} at ${bookedConflicts[0].startTime} has a confirmed booking and cannot be booked again. Rescheduling is permitted.`
      );
      return;
    }

    if (computedSlotsToPublish.length === 0) {
      setFeedbackToast(
        "No upcoming time slots to publish. Please choose future dates or upcoming times."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const targetDateKey = computedSlotsToPublish[0]?.dateKey;
      const count = await store.publishAvailabilityBatch(computedSlotsToPublish);
      setFeedbackToast(`Successfully published ${count} slots to the database! Redirecting...`);
      setTimeout(() => {
        router.replace({
          pathname: "/(counsellor-detail)/my-calendar",
          params: { dateKey: targetDateKey },
        });
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      console.error("[add-session] Publish slots error:", err);
      setFeedbackToast(`Failed to store slots: ${err?.message || "Check permissions"}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressedState]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#1B2B24" />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Add Availability Slots
        </Text>

        <View style={styles.headerRight}>
          {store.profile.avatarUrl ? (
            <Image
              source={{ uri: store.profile.avatarUrl }}
              style={styles.counselorAvatar}
              accessibilityLabel="Counselor profile"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>DR</Text>
            </View>
          )}
        </View>
      </View>

      {/* ─── Feedback Toast ─── */}
      {feedbackToast && (
        <View
          style={[
            styles.toastContainer,
            (feedbackToast.startsWith("Please") ||
              feedbackToast.startsWith("At least") ||
              feedbackToast.startsWith("Time slot") ||
              feedbackToast.startsWith("Slot(s)") ||
              feedbackToast.startsWith("Failed")) &&
              styles.toastContainerError,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Ionicons
            name={
              feedbackToast.startsWith("Successfully")
                ? "checkmark-circle"
                : "alert-circle"
            }
            size={18}
            color={feedbackToast.startsWith("Successfully") ? "#076047" : "#DC2626"}
          />
          <Text
            style={[
              styles.toastText,
              !feedbackToast.startsWith("Successfully") && styles.toastTextError,
            ]}
          >
            {feedbackToast}
          </Text>
          <Pressable onPress={() => setFeedbackToast(null)} hitSlop={8} style={{ marginLeft: "auto" }}>
            <Ionicons name="close" size={16} color="#64748B" />
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Info Banner ─── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="calendar-outline" size={22} color="#076047" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Publish Clinical Slots</Text>
            <Text style={styles.bannerSubtitle}>
              Students can book only the time slots you publish here. These will auto-sync to your Calendar, Schedule, and Student booking directory.
            </Text>
          </View>
        </View>

        {/* ─── 1. Date Selection (Essential) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>SELECT DATE(S)</Text>
          <Pressable onPress={selectAllWeekdays} hitSlop={6}>
            <Text style={styles.sectionActionText}>Select Mon–Fri</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {upcomingDays.map((d) => {
            const isSelected = selectedDateKeys.includes(d.dateKey);
            return (
              <Pressable
                key={d.dateKey}
                style={[styles.dayCard, isSelected && styles.dayCardActive]}
                onPress={() => toggleDate(d.dateKey)}
                accessibilityRole="button"
                accessibilityLabel={`Toggle ${d.label}`}
              >
                <Text style={[styles.dayCardWeekday, isSelected && styles.dayCardTextActive]}>
                  {d.weekday}
                </Text>
                <Text style={[styles.dayCardNum, isSelected && styles.dayCardTextActive]}>
                  {d.dayNum}
                </Text>
                <Text style={[styles.dayCardMonth, isSelected && styles.dayCardTextActive]}>
                  {d.month}
                </Text>
                {isSelected && (
                  <View style={styles.daySelectedDot}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.helperText}>
          {selectedDateKeys.length} date{selectedDateKeys.length > 1 ? "s" : ""} selected for availability. Tap any card to toggle.
        </Text>

        {/* ─── 2. Time Slots (Essential) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>AVAILABLE TIME SLOTS</Text>
          <Text style={styles.sectionHint}>{selectedTimes.length} selected</Text>
        </View>

        {allTodayStandardHoursPassed && (
          <View style={styles.passedHoursNotice}>
            <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
            <Text style={styles.passedHoursNoticeText}>
              All standard daytime clinic hours (9:00 AM – 4:00 PM) have ended for today ({colomboNowInfo.timeDisplay}). Please select tomorrow/upcoming dates or add an evening custom time below.
            </Text>
          </View>
        )}

        <View style={styles.timesGrid}>
          {allDisplayedTimes.map((t) => {
            const isPassed = isTimeSlotPassedForSelectedDates(t);
            const isAlreadyBooked = isSlotAlreadyBookedForSelectedDates(t);
            const isAlreadyAdded = isSlotAlreadyAddedForSelectedDates(t);
            const isBlocked = isPassed || isAlreadyBooked || isAlreadyAdded;
            const isSelected = selectedTimes.includes(t);
            const isCustom = !QUICK_TIMES.includes(t);
            return (
              <Pressable
                key={t}
                style={[
                  styles.timeChip,
                  isSelected && styles.timeChipActive,
                  isBlocked && styles.timeChipDisabled,
                ]}
                onPress={() => toggleTimeSelection(t)}
                accessibilityRole="button"
                accessibilityLabel={`${t}${
                  isPassed
                    ? " (passed)"
                    : isAlreadyBooked
                    ? " (booked)"
                    : isAlreadyAdded
                    ? " (already added)"
                    : isSelected
                    ? " (selected)"
                    : ""
                }`}
                accessibilityState={{ disabled: isBlocked }}
              >
                <Ionicons
                  name={
                    isPassed
                      ? "close-circle-outline"
                      : isAlreadyBooked
                      ? "lock-closed-outline"
                      : isAlreadyAdded
                      ? "checkmark-done-outline"
                      : isSelected
                      ? "checkmark-circle"
                      : "time-outline"
                  }
                  size={14}
                  color={
                    isPassed
                      ? "#94A3B8"
                      : isAlreadyBooked
                      ? "#DC2626"
                      : isAlreadyAdded
                      ? "#0284C7"
                      : isSelected
                      ? "#076047"
                      : "#64748B"
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.timeChipText,
                    isSelected && styles.timeChipTextActive,
                    isBlocked && styles.timeChipTextDisabled,
                  ]}
                >
                  {t}
                </Text>
                {isPassed && (
                  <View style={styles.passedBadge}>
                    <Text style={styles.passedBadgeText}>Passed</Text>
                  </View>
                )}
                {!isPassed && isAlreadyBooked && (
                  <View style={styles.bookedBadge}>
                    <Text style={styles.bookedBadgeText}>Booked</Text>
                  </View>
                )}
                {!isPassed && !isAlreadyBooked && isAlreadyAdded && (
                  <View style={styles.addedBadge}>
                    <Text style={styles.addedBadgeText}>Added</Text>
                  </View>
                )}
                {isCustom && !isBlocked && (
                  <Pressable
                    onPress={() => setSelectedTimes(selectedTimes.filter((x) => x !== t))}
                    hitSlop={6}
                    style={{ marginLeft: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove custom slot ${t}`}
                  >
                    <Ionicons name="close-circle" size={14} color={isSelected ? "#076047" : "#64748B"} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Custom Time Slot Input */}
        <View style={styles.customTimeRow}>
          <TextInput
            style={styles.customTimeInput}
            placeholder="Add custom time e.g. 09:30 AM"
            placeholderTextColor="#94A3B8"
            value={customTime}
            onChangeText={setCustomTime}
            autoCapitalize="characters"
            maxLength={10}
          />
          <Pressable
            style={styles.addCustomTimeBtn}
            onPress={handleAddCustomTime}
            accessibilityRole="button"
            accessibilityLabel="Add custom time slot"
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addCustomTimeBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* ─── 3. Slot Duration (Essential) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>SLOT DURATION</Text>
        </View>
        <View style={styles.durationRow}>
          {(["30m", "45m", "60m"] as DurationOption[]).map((d) => (
            <Pressable
              key={d}
              style={[styles.durationChip, duration === d && styles.durationChipActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durationChipText, duration === d && styles.durationChipTextActive]}>
                {d === "45m" ? "45m (Standard)" : d}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── 4. Consultation Modality (Essential) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>SUPPORTED MODALITIES</Text>
          <Text style={styles.sectionHint}>Visible to students</Text>
        </View>
        <View style={styles.modalityRow}>
          {(
            [
              { key: "video", label: "Video Call", icon: "videocam-outline" },
              { key: "chat", label: "Secure Chat", icon: "chatbubble-ellipses-outline" },
              { key: "in-person", label: "In-Person", icon: "people-outline" },
            ] as const
          ).map((m) => {
            const isSelected = selectedModalities.includes(m.key);
            return (
              <Pressable
                key={m.key}
                style={[styles.modalityCard, isSelected && styles.modalityCardActive]}
                onPress={() => toggleModality(m.key)}
                accessibilityRole="button"
                accessibilityLabel={`Modality ${m.label}`}
              >
                <Ionicons name={m.icon as any} size={20} color={isSelected ? "#076047" : "#64748B"} />
                <Text style={[styles.modalityCardText, isSelected && styles.modalityCardTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Summary & Batch Commit Card ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Publish Summary</Text>
              <Text style={styles.summarySub}>
                {computedSlotsToPublish.length} availability slot{computedSlotsToPublish.length > 1 ? "s" : ""} across {selectedDateKeys.length} date{selectedDateKeys.length > 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{duration}</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.publishButton,
              (isSubmitting || computedSlotsToPublish.length === 0) && styles.publishButtonDisabled,
            ]}
            onPress={handlePublishSlots}
            disabled={isSubmitting || computedSlotsToPublish.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Publish availability slots"
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.publishButtonText}>
              {isSubmitting
                ? "Publishing to Cloud..."
                : computedSlotsToPublish.length === 0
                ? "No Upcoming Slots Selected"
                : `Publish ${computedSlotsToPublish.length} Slots`}
            </Text>
          </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#FFF9EC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2DEC9",
  },
  headerButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2B24",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  counselorAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "#076047",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#076047",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: "700",
    color: "#076047",
  },
  pressedState: {
    opacity: 0.7,
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F8E4",
    borderColor: "#076047",
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  toastContainerError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#DC2626",
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#076047",
  },
  toastTextError: {
    color: "#B91C1C",
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  bannerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2DEC9",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2B24",
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#076047",
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: 12,
    color: "#64748B",
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
    textDecorationLine: "underline",
  },
  daysScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  dayCard: {
    width: 68,
    height: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#E2DEC9",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
  },
  dayCardActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  dayCardWeekday: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
  },
  dayCardNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B2B24",
    marginVertical: 2,
  },
  dayCardMonth: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94A3B8",
  },
  dayCardTextActive: {
    color: "#FFFFFF",
  },
  daySelectedDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#E2DEC9",
  },
  timeChipActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#076047",
  },
  timeChipDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    opacity: 0.65,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B2B24",
  },
  timeChipTextActive: {
    color: "#076047",
    fontWeight: "700",
  },
  timeChipTextDisabled: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  passedBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  passedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  bookedBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  bookedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  addedBadge: {
    backgroundColor: "#E0F2FE",
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  addedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369A1",
  },
  passedHoursNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  passedHoursNoticeText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
    lineHeight: 16,
  },
  customTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  customTimeInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    paddingHorizontal: spacing.md,
    fontSize: 13,
    fontWeight: "500",
    color: "#1B2B24",
  },
  addCustomTimeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: "#076047",
    borderRadius: radius.md,
    gap: 4,
  },
  addCustomTimeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  durationRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  durationChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#E2DEC9",
  },
  durationChipActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#076047",
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  durationChipTextActive: {
    color: "#076047",
    fontWeight: "800",
  },
  modalityRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  modalityCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#E2DEC9",
    gap: 4,
  },
  modalityCardActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#076047",
  },
  modalityCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  modalityCardTextActive: {
    color: "#076047",
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2B24",
  },
  summarySub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  summaryBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    backgroundColor: "#076047",
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
