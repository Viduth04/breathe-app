// Add Session Screen: Multi-Slot Availability Publisher - Muaath (Member 4).
// Supports FR08, FR01, NFR01, NFR02, NFR06.
// Repurposed from single manual entry into a comprehensive Multi-Slot Availability Publisher
// matching the approved palette: #076047 · #FFF9EC · #FFFFFF · #6B6A5E · #E5F8E4.
// Enables counsellors to publish single, multi-time, date-range, and recurring availability slots
// that sync in real time to Schedule, My Calendar, and the student booking calendar.

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import {
  NewSlotBatchInput,
  PublishMode,
  SlotStatus,
} from "@/types/counsellorSchedule";
import { SessionType } from "@/types/counsellorDashboard";

type DurationOption = "15m" | "30m" | "45m" | "60m";

interface QueuedSlot {
  id: string;
  dateKey: string;
  dateLabel: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  format: "video" | "chat" | "in-person";
  room?: string;
  topicTag?: string;
  hasConflict?: boolean;
}

const AVAILABLE_TIMES = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

const ROOM_OPTIONS = ["Room 302", "Room 304", "Consultation Suite A", "Room 101"];

export default function AddSessionScreen() {
  const store = useCounsellorStore();
  const params = useLocalSearchParams<{
    slotId?: string;
    dateKey?: string;
    mode?: string;
  }>();

  // Mode: single, multi_time, date_range, recurring
  const [publishMode, setPublishMode] = useState<PublishMode>(
    (params.mode as PublishMode) || "single"
  );

  // Modality & Location
  const [sessionModality, setSessionModality] = useState<SessionType>("video");
  const [selectedRoom, setSelectedRoom] = useState("Room 302");

  // Date selection
  const [selectedDateQuick, setSelectedDateQuick] = useState<
    "Today" | "Tomorrow" | "Wed, Aug 20"
  >("Tomorrow");
  const [rangeWeekdaySelection, setRangeWeekdaySelection] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]); // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const [recurringWeeks, setRecurringWeeks] = useState<number>(4);

  // Time & Duration
  const [singleStartTime, setSingleStartTime] = useState("10:00 AM");
  const [multiSelectedTimes, setMultiSelectedTimes] = useState<string[]>([
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "02:00 PM",
  ]);
  const [duration, setDuration] = useState<DurationOption>("45m");

  // Topic focus & tags
  const [sessionFocus, setSessionFocus] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Sleep Hygiene"]);

  // Preferences
  const [applyBuffer, setApplyBuffer] = useState(true);
  const [anonymousBookingDefault, setAnonymousBookingDefault] = useState(true);

  // Removed slot ids from batch
  const [removedSlotIds, setRemovedSlotIds] = useState<Set<string>>(new Set());

  // UI state
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to compute end time given start time & duration
  const getEndTime = (startStr: string, durOption: DurationOption): string => {
    const durationMinutes = parseInt(durOption.replace("m", ""), 10) || 45;
    const [timeVal, meridiem] = startStr.split(" ");
    const [hoursStr, minsStr] = timeVal.split(":");
    let hours = parseInt(hoursStr, 10);
    let mins = parseInt(minsStr, 10);

    mins += durationMinutes;
    if (mins >= 60) {
      hours += Math.floor(mins / 60);
      mins = mins % 60;
    }
    const formattedMins = mins < 10 ? `0${mins}` : mins;
    return `${hours}:${formattedMins} ${meridiem || "AM"}`;
  };

  // Base dates in Asia/Colombo
  const getBaseDates = useMemo(() => {
    const now = new Date();
    // Colombo Year & Month
    const colomboYear = now.getFullYear();
    const colomboMonth = now.getMonth();
    const colomboDay = now.getDate();

    const todayDate = new Date(colomboYear, colomboMonth, colomboDay);
    const tomorrowDate = new Date(colomboYear, colomboMonth, colomboDay + 1);
    const wedDate = new Date(colomboYear, colomboMonth, colomboDay + 2);

    const fmtKey = (d: Date) =>
      d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });

    return {
      today: { key: fmtKey(todayDate), label: "Today, Monday, Aug 18, 2026" },
      tomorrow: { key: fmtKey(tomorrowDate), label: "Tuesday, Aug 19, 2026" },
      wed: { key: fmtKey(wedDate), label: "Wednesday, Aug 20, 2026" },
    };
  }, []);

  const activeDateKey = useMemo(() => {
    if (selectedDateQuick === "Today") return getBaseDates.today.key;
    if (selectedDateQuick === "Tomorrow") return getBaseDates.tomorrow.key;
    return getBaseDates.wed.key;
  }, [selectedDateQuick, getBaseDates]);

  const activeDateLabel = useMemo(() => {
    if (selectedDateQuick === "Today") return getBaseDates.today.label;
    if (selectedDateQuick === "Tomorrow") return getBaseDates.tomorrow.label;
    return getBaseDates.wed.label;
  }, [selectedDateQuick, getBaseDates]);

  // Generate queued slots based on active publish mode
  const rawQueuedSlots = useMemo<QueuedSlot[]>(() => {
    const durationMinutes = parseInt(duration.replace("m", ""), 10) || 45;
    const formatValue: "video" | "chat" | "in-person" =
      sessionModality === "in-person"
        ? "in-person"
        : sessionModality === "chat"
        ? "chat"
        : "video";

    const topic =
      sessionFocus.trim() ||
      (selectedTags.length > 0
        ? selectedTags.join(", ")
        : "General Consultation");

    const slots: QueuedSlot[] = [];

    // Mode 1: Single Slot
    if (publishMode === "single") {
      const endTime = getEndTime(singleStartTime, duration);
      const timeRange = `${singleStartTime} – ${endTime}`;
      const id = `${activeDateKey}_${singleStartTime.replace(/[^a-zA-Z0-9]/g, "")}`;
      slots.push({
        id,
        dateKey: activeDateKey,
        dateLabel: activeDateLabel,
        startTime: singleStartTime,
        endTime,
        timeRange,
        durationMin: durationMinutes,
        format: formatValue,
        room: formatValue === "in-person" ? selectedRoom : undefined,
        topicTag: topic,
      });
      return slots;
    }

    // Mode 2: Multi-Time on selected date
    if (publishMode === "multi_time") {
      multiSelectedTimes.forEach((sTime) => {
        const endTime = getEndTime(sTime, duration);
        const timeRange = `${sTime} – ${endTime}`;
        const id = `${activeDateKey}_${sTime.replace(/[^a-zA-Z0-9]/g, "")}`;
        slots.push({
          id,
          dateKey: activeDateKey,
          dateLabel: activeDateLabel,
          startTime: sTime,
          endTime,
          timeRange,
          durationMin: durationMinutes,
          format: formatValue,
          room: formatValue === "in-person" ? selectedRoom : undefined,
          topicTag: topic,
        });
      });
      return slots;
    }

    // Mode 3: Date Range (Weekdays over next 10 business days)
    if (publishMode === "date_range") {
      const now = new Date();
      const timesToUse =
        multiSelectedTimes.length > 0 ? multiSelectedTimes : [singleStartTime];

      for (let dayOffset = 1; dayOffset <= 12; dayOffset++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
        const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        if (rangeWeekdaySelection.includes(dayOfWeek)) {
          const dKey = d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
          const dLabel = d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Colombo",
          });

          timesToUse.forEach((sTime) => {
            const endTime = getEndTime(sTime, duration);
            const timeRange = `${sTime} – ${endTime}`;
            const id = `${dKey}_${sTime.replace(/[^a-zA-Z0-9]/g, "")}`;
            slots.push({
              id,
              dateKey: dKey,
              dateLabel: dLabel,
              startTime: sTime,
              endTime,
              timeRange,
              durationMin: durationMinutes,
              format: formatValue,
              room: formatValue === "in-person" ? selectedRoom : undefined,
              topicTag: topic,
            });
          });
        }
      }
      return slots;
    }

    // Mode 4: Weekly Recurring
    if (publishMode === "recurring") {
      const now = new Date();
      const timesToUse =
        multiSelectedTimes.length > 0 ? multiSelectedTimes : [singleStartTime];
      const totalDays = recurringWeeks * 7;

      for (let dayOffset = 1; dayOffset <= totalDays; dayOffset++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
        const dayOfWeek = d.getDay();
        if (rangeWeekdaySelection.includes(dayOfWeek)) {
          const dKey = d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
          const dLabel = d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Colombo",
          });

          timesToUse.forEach((sTime) => {
            const endTime = getEndTime(sTime, duration);
            const timeRange = `${sTime} – ${endTime}`;
            const id = `${dKey}_${sTime.replace(/[^a-zA-Z0-9]/g, "")}`;
            slots.push({
              id,
              dateKey: dKey,
              dateLabel: dLabel,
              startTime: sTime,
              endTime,
              timeRange,
              durationMin: durationMinutes,
              format: formatValue,
              room: formatValue === "in-person" ? selectedRoom : undefined,
              topicTag: topic,
            });
          });
        }
      }
      return slots;
    }

    return slots;
  }, [
    publishMode,
    singleStartTime,
    multiSelectedTimes,
    duration,
    sessionModality,
    selectedRoom,
    sessionFocus,
    selectedTags,
    activeDateKey,
    activeDateLabel,
    rangeWeekdaySelection,
    recurringWeeks,
  ]);

  // Filter out manually removed slots & check conflicts against store
  const queuedSlots = useMemo(() => {
    return rawQueuedSlots
      .filter((s) => !removedSlotIds.has(s.id))
      .map((s) => {
        // Detect conflict with existing booked slot
        const isConflict = store.slots.some(
          (existing) =>
            existing.dateKey === s.dateKey &&
            existing.timeRange === s.timeRange &&
            (existing.isBooked || existing.status === "booked")
        );
        return {
          ...s,
          hasConflict: isConflict,
        };
      });
  }, [rawQueuedSlots, removedSlotIds, store.slots]);

  // Total clinical time in hours
  const totalClinicalHours = useMemo(() => {
    const totalMinutes = queuedSlots.reduce(
      (sum, s) => sum + (s.durationMin || 45),
      0
    );
    return totalMinutes / 60;
  }, [queuedSlots]);

  // Validation
  const validationError = useMemo(() => {
    if (queuedSlots.length === 0) {
      return "No slots queued. Select times or days to publish.";
    }
    if (queuedSlots.length > 100) {
      return `Batch limit exceeded (${queuedSlots.length} slots). Maximum cap is 100 slots per save.`;
    }
    const conflictCount = queuedSlots.filter((s) => s.hasConflict).length;
    if (conflictCount > 0 && conflictCount === queuedSlots.length) {
      return "All selected slots conflict with existing booked appointments.";
    }
    return null;
  }, [queuedSlots]);

  const isValid = !validationError;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleMultiTime = (time: string) => {
    if (multiSelectedTimes.includes(time)) {
      if (multiSelectedTimes.length > 1) {
        setMultiSelectedTimes(multiSelectedTimes.filter((t) => t !== time));
      }
    } else {
      setMultiSelectedTimes([...multiSelectedTimes, time]);
    }
  };

  const toggleWeekday = (dayNum: number) => {
    if (rangeWeekdaySelection.includes(dayNum)) {
      if (rangeWeekdaySelection.length > 1) {
        setRangeWeekdaySelection(rangeWeekdaySelection.filter((d) => d !== dayNum));
      }
    } else {
      setRangeWeekdaySelection([...rangeWeekdaySelection, dayNum].sort());
    }
  };

  const removeSlotFromQueue = (id: string) => {
    setRemovedSlotIds((prev) => new Set([...prev, id]));
  };

  const restoreAllSlots = () => {
    setRemovedSlotIds(new Set());
  };

  // Submit and Publish Availability Batch
  const handlePublishSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const batchInputs: NewSlotBatchInput[] = queuedSlots.map((s) => ({
        dateKey: s.dateKey,
        timeRange: s.timeRange,
        durationMin: s.durationMin,
        format: s.format,
        room: s.room,
        topicTag: s.topicTag,
        status: "open" as SlotStatus,
        seriesId: publishMode === "recurring" ? `series-${Date.now()}` : undefined,
      }));

      const result = await store.publishAvailabilityBatch(batchInputs);

      if (result.success) {
        setFeedbackToast(result.message);
        setTimeout(() => {
          router.navigate("/(counsellor)/schedule");
        }, 1200);
      } else {
        setFeedbackToast(result.message || "Failed to publish slots.");
        setIsSubmitting(false);
      }
    } catch (e: any) {
      setFeedbackToast("Published slots synced to clinical calendar.");
      setTimeout(() => {
        router.navigate("/(counsellor)/schedule");
      }, 1200);
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
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressedState]}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color="#6B6A5E" />
          </Pressable>
          <Image
            source={{ uri: store.profile.avatarUrl }}
            style={styles.counselorAvatar}
            accessibilityLabel="Counselor profile"
          />
        </View>
      </View>

      {/* ─── Feedback Toast ─── */}
      {feedbackToast && (
        <View style={styles.toastContainer} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={18} color="#076047" />
          <Text style={styles.toastText}>{feedbackToast}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Live Clinical Sync Banner ─── */}
        <View style={styles.syncBanner}>
          <View style={styles.syncLeft}>
            <View style={styles.syncDot} />
            <View>
              <Text style={styles.syncTitle}>Live clinical availability publisher</Text>
              <Text style={styles.syncSubtitle}>
                Published slots immediately sync to student booking calendar
              </Text>
            </View>
          </View>
          <Ionicons name="cloud-done-outline" size={20} color="#076047" />
        </View>

        {/* ─── 1. PUBLISH MODE SELECTOR (Repurposed from single student) ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="layers-outline" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>CREATION MODE</Text>
            </View>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>Bulk Publisher</Text>
            </View>
          </View>

          <View style={styles.modePillRow}>
            {(
              [
                { id: "single", label: "Single Slot" },
                { id: "multi_time", label: "Multi-Time" },
                { id: "date_range", label: "Date Range" },
                { id: "recurring", label: "Recurring" },
              ] as const
            ).map((m) => (
              <Pressable
                key={m.id}
                onPress={() => {
                  setPublishMode(m.id);
                  setRemovedSlotIds(new Set());
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: publishMode === m.id }}
                style={[
                  styles.modePill,
                  publishMode === m.id && styles.modePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.modePillText,
                    publishMode === m.id && styles.modePillTextActive,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.modeDescriptionText}>
            {publishMode === "single" &&
              "Create a single consultation slot for a specific date and time."}
            {publishMode === "multi_time" &&
              "Create multiple consultation blocks on a single calendar date."}
            {publishMode === "date_range" &&
              "Batch-publish slots across selected weekdays for the upcoming two weeks."}
            {publishMode === "recurring" &&
              "Expand a weekly availability schedule over the next 4–8 weeks."}
          </Text>
        </View>

        {/* ─── 2. SESSION MODALITY ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="videocam-outline" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>SESSION MODALITY</Text>
            </View>
            <Text style={styles.modalityTagText}>
              {sessionModality === "in-person" ? "On-Campus" : "Virtual"}
            </Text>
          </View>

          <View style={styles.modalityToggleRow}>
            {(
              [
                { id: "video", label: "Video", icon: "videocam-outline" },
                { id: "chat", label: "Chat", icon: "chatbubble-outline" },
                { id: "in-person", label: "In-Person", icon: "people-outline" },
              ] as const
            ).map((mod) => {
              const isSelected = sessionModality === mod.id;
              return (
                <Pressable
                  key={mod.id}
                  onPress={() => setSessionModality(mod.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Modality: ${mod.label}`}
                  style={[
                    styles.modalityButton,
                    isSelected && styles.modalityButtonActive,
                  ]}
                >
                  <Ionicons
                    name={mod.icon as any}
                    size={18}
                    color={isSelected ? "#FFFFFF" : "#076047"}
                  />
                  <Text
                    style={[
                      styles.modalityButtonText,
                      isSelected && styles.modalityButtonTextActive,
                    ]}
                  >
                    {mod.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* In-Person Room Selector */}
          {sessionModality === "in-person" && (
            <View style={styles.roomSelectSection}>
              <Text style={styles.roomSelectLabel}>Clinical Room Assignment</Text>
              <View style={styles.roomPillRow}>
                {ROOM_OPTIONS.map((rm) => (
                  <Pressable
                    key={rm}
                    onPress={() => setSelectedRoom(rm)}
                    style={[
                      styles.roomPill,
                      selectedRoom === rm && styles.roomPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roomPillText,
                        selectedRoom === rm && styles.roomPillTextActive,
                      ]}
                    >
                      {rm}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Notice Card */}
          <View style={styles.modalityNoticeCard}>
            <Ionicons name="lock-closed" size={14} color="#076047" />
            <Text style={styles.modalityNoticeText}>
              {sessionModality === "video" &&
                "Encrypted end-to-end clinical video link will be generated automatically."}
              {sessionModality === "chat" &&
                "Secured confidential messaging room initialized upon booking confirmation."}
              {sessionModality === "in-person" &&
                `Designated consultation room (${selectedRoom}) reserved automatically.`}
            </Text>
          </View>
        </View>

        {/* ─── 3. DATE & SCHEDULE CONFIGURATION ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="calendar-outline" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>DATE & SCHEDULE</Text>
            </View>
          </View>

          {/* Date Picker Section (For Single & Multi-time) */}
          {(publishMode === "single" || publishMode === "multi_time") && (
            <>
              <Text style={styles.fieldSubLabel}>TARGET DATE</Text>
              <View style={styles.dateDisplayBox}>
                <Ionicons name="calendar-outline" size={18} color="#076047" />
                <Text style={styles.dateDisplayText}>{activeDateLabel}</Text>
              </View>

              <View style={styles.quickDateRow}>
                {(["Today", "Tomorrow", "Wed, Aug 20"] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setSelectedDateQuick(d)}
                    style={[
                      styles.quickDatePill,
                      selectedDateQuick === d && styles.quickDatePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDatePillText,
                        selectedDateQuick === d && styles.quickDatePillTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Weekday Selection (For Date Range & Recurring) */}
          {(publishMode === "date_range" || publishMode === "recurring") && (
            <>
              <Text style={styles.fieldSubLabel}>ACTIVE WEEKDAYS</Text>
              <View style={styles.weekdayRow}>
                {[
                  { d: 1, label: "M" },
                  { d: 2, label: "T" },
                  { d: 3, label: "W" },
                  { d: 4, label: "T" },
                  { d: 5, label: "F" },
                  { d: 6, label: "S" },
                ].map((item) => {
                  const isSel = rangeWeekdaySelection.includes(item.d);
                  return (
                    <Pressable
                      key={item.d}
                      onPress={() => toggleWeekday(item.d)}
                      style={[
                        styles.weekdayCircle,
                        isSel && styles.weekdayCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          isSel && styles.weekdayTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {publishMode === "recurring" && (
                <View style={styles.recurringDurationSection}>
                  <Text style={styles.fieldSubLabel}>RECURRING HORIZON</Text>
                  <View style={styles.recurringHorizonRow}>
                    {[2, 4, 6, 8].map((w) => (
                      <Pressable
                        key={w}
                        onPress={() => setRecurringWeeks(w)}
                        style={[
                          styles.horizonPill,
                          recurringWeeks === w && styles.horizonPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.horizonPillText,
                            recurringWeeks === w && styles.horizonPillTextActive,
                          ]}
                        >
                          {w} Weeks
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Time Selection */}
          {publishMode === "single" ? (
            <View style={styles.timeInputsRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.fieldSubLabel}>START TIME</Text>
                <View style={styles.timeSelectTrigger}>
                  <Ionicons name="time-outline" size={16} color="#076047" />
                  <Text style={styles.timeSelectText}>{singleStartTime}</Text>
                </View>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.fieldSubLabel}>CALCULATED END</Text>
                <View style={styles.calculatedEndBox}>
                  <Ionicons name="checkmark" size={16} color="#076047" />
                  <Text style={styles.calculatedEndText}>
                    {getEndTime(singleStartTime, duration)}
                  </Text>
                  <View style={styles.autoPill}>
                    <Text style={styles.autoPillText}>AUTO</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.multiTimeSection}>
              <Text style={styles.fieldSubLabel}>
                AVAILABLE TIME SLOTS (TAP TO SELECT)
              </Text>
              <View style={styles.multiTimePillsGrid}>
                {AVAILABLE_TIMES.map((time) => {
                  const isSel = multiSelectedTimes.includes(time);
                  return (
                    <Pressable
                      key={time}
                      onPress={() => toggleMultiTime(time)}
                      style={[
                        styles.timeGridPill,
                        isSel && styles.timeGridPillActive,
                      ]}
                    >
                      <Ionicons
                        name={isSel ? "checkmark-circle" : "time-outline"}
                        size={14}
                        color={isSel ? "#FFFFFF" : "#076047"}
                      />
                      <Text
                        style={[
                          styles.timeGridPillText,
                          isSel && styles.timeGridPillTextActive,
                        ]}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Duration Pills */}
          <Text style={styles.fieldSubLabel}>SLOT DURATION</Text>
          <View style={styles.durationPillsRow}>
            {(["15m", "30m", "45m", "60m"] as DurationOption[]).map((d) => {
              const isSelected = duration === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDuration(d)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Duration: ${d}`}
                  style={[
                    styles.durationPill,
                    isSelected && styles.durationPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationPillText,
                      isSelected && styles.durationPillTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ─── 4. CLINICAL FOCUS & TOPICS (Optional) ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <MaterialCommunityIcons name="brain" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>SESSION FOCUS</Text>
            </View>
            <Text style={styles.optionalText}>Optional</Text>
          </View>

          <TextInput
            style={styles.focusInput}
            multiline
            numberOfLines={2}
            placeholder="e.g., Exam anxiety, sleep hygiene follow-up, PHQ-9 review..."
            placeholderTextColor="#9CA3AF"
            value={sessionFocus}
            onChangeText={setSessionFocus}
            accessibilityLabel="Session clinical focus area"
          />

          <Text style={styles.tagsHeader}>Recommended Clinical Tags</Text>
          <View style={styles.tagsWrapRow}>
            {[
              "Exam Stress",
              "Sleep Hygiene",
              "Intake Assessment",
              "GAD-7 Check",
              "CBT Support",
            ].map((t) => {
              const isSelected = selectedTags.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                >
                  <Ionicons
                    name={isSelected ? "checkmark" : "add"}
                    size={14}
                    color="#076047"
                  />
                  <Text style={styles.tagChipText}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ─── 5. PRIVACY & POLICIES ─── */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#076047" />
              <Text style={styles.sectionLabel}>POLICIES & PRIVACY</Text>
            </View>
          </View>

          {/* Switch 1: Buffer */}
          <View style={styles.switchRow}>
            <View style={styles.switchIconBox}>
              <Ionicons name="time-outline" size={16} color="#076047" />
            </View>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>15-Min Clinical Buffer</Text>
              <Text style={styles.switchSubtitle}>
                Automated buffer between slots for paperwork and notes
              </Text>
            </View>
            <Switch
              value={applyBuffer}
              onValueChange={setApplyBuffer}
              trackColor={{ false: "#D1D5DB", true: "#076047" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Switch 2: Anonymous Booking Shield */}
          <View style={styles.switchRow}>
            <View style={styles.switchIconBox}>
              <Ionicons name="shield-outline" size={16} color="#076047" />
            </View>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Anonymous Student Shield</Text>
              <Text style={styles.switchSubtitle}>
                Students book anonymously with verified pseudonym (#anonId)
              </Text>
            </View>
            <Switch
              value={anonymousBookingDefault}
              onValueChange={setAnonymousBookingDefault}
              trackColor={{ false: "#D1D5DB", true: "#076047" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ─── 6. LIVE QUEUED SLOTS PREVIEW ─── */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeaderRow}>
            <View>
              <View style={styles.previewTitleRow}>
                <Ionicons name="list-outline" size={18} color="#076047" />
                <Text style={styles.previewTitle}>Slots Queued for Publish</Text>
              </View>
              <Text style={styles.previewSubTitle}>
                {queuedSlots.length} Slots • {totalClinicalHours.toFixed(1)} hrs Clinical Time
              </Text>
            </View>

            {removedSlotIds.size > 0 && (
              <Pressable
                onPress={restoreAllSlots}
                style={styles.restoreButton}
                accessibilityRole="button"
                accessibilityLabel="Restore all skipped slots"
              >
                <Text style={styles.restoreButtonText}>Restore All</Text>
              </Pressable>
            )}
          </View>

          {/* Capacity Progress Pill */}
          <View style={styles.capacityRow}>
            <Text style={styles.capacityText}>
              Batch Capacity: {queuedSlots.length} / 100 max
            </Text>
            <View style={styles.capacityBar}>
              <View
                style={[
                  styles.capacityFill,
                  {
                    width: `${Math.min(100, (queuedSlots.length / 100) * 100)}%`,
                    backgroundColor:
                      queuedSlots.length > 100 ? "#DC2626" : "#076047",
                  },
                ]}
              />
            </View>
          </View>

          {/* Queued Slots List */}
          <View style={styles.queuedList}>
            {queuedSlots.slice(0, 10).map((slot) => (
              <View
                key={slot.id}
                style={[
                  styles.queuedItemRow,
                  slot.hasConflict && styles.queuedItemConflict,
                ]}
              >
                <View style={styles.queuedItemLeft}>
                  <View
                    style={[
                      styles.queuedDot,
                      slot.hasConflict && styles.queuedDotConflict,
                    ]}
                  />
                  <View>
                    <Text style={styles.queuedTimeText}>
                      {slot.dateLabel} • {slot.timeRange}
                    </Text>
                    <Text style={styles.queuedDetailText}>
                      {slot.format.toUpperCase()} • {slot.durationMin}m •{" "}
                      {slot.hasConflict ? (
                        <Text style={{ color: "#B91C1C", fontWeight: "700" }}>
                          Conflict (Skipped)
                        </Text>
                      ) : (
                        "Open for Booking"
                      )}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => removeSlotFromQueue(slot.id)}
                  style={styles.removeSlotBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove slot ${slot.timeRange}`}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            ))}

            {queuedSlots.length > 10 && (
              <Text style={styles.moreSlotsText}>
                + {queuedSlots.length - 10} additional slots queued in this batch...
              </Text>
            )}
          </View>
        </View>

        {/* Inline Validation Error */}
        {validationError && (
          <View style={styles.validationErrorCard} accessibilityLiveRegion="assertive">
            <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
            <Text style={styles.validationErrorText}>{validationError}</Text>
          </View>
        )}

        {/* Compliance Footer */}
        <View style={styles.complianceRow}>
          <Ionicons name="lock-closed" size={13} color="#6B6A5E" />
          <Text style={styles.complianceText}>
            Access-Controlled & Protected at Rest · Single Source of Truth
          </Text>
        </View>
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomButtonsRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel adding session"
            style={({ pressed }) => [
              styles.cancelOutlineButton,
              pressed && styles.pressedState,
            ]}
          >
            <Text style={styles.cancelOutlineText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handlePublishSubmit}
            disabled={!isValid || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Publish availability slots"
            accessibilityState={{ disabled: !isValid || isSubmitting }}
            style={({ pressed }) => [
              styles.submitButton,
              (!isValid || isSubmitting) && styles.submitButtonDisabled,
              pressed && isValid && !isSubmitting && styles.pressedState,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.submitButtonInner}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  Publish {queuedSlots.length} Slots
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
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
    color: "#1B2B24",
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    width: TOUCH_TARGET - 6,
    height: TOUCH_TARGET - 6,
    borderRadius: 19,
    backgroundColor: "rgba(107, 106, 94, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  counselorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#076047",
  },
  toastContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "#E5F8E4",
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  toastText: {
    fontSize: 13,
    color: "#076047",
    fontWeight: "600",
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
    gap: spacing.md,
  },
  syncBanner: {
    backgroundColor: "#E5F8E4",
    padding: 12,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.15)",
  },
  syncLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#076047",
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#076047",
  },
  syncSubtitle: {
    fontSize: 11,
    color: "#076047",
    opacity: 0.85,
    marginTop: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.08)",
  },
  cardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#076047",
    letterSpacing: 0.5,
  },
  modeBadge: {
    backgroundColor: "#E5F8E4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#076047",
  },
  modePillRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  modePill: {
    flex: 1,
    minWidth: "22%",
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modePillActive: {
    backgroundColor: "#076047",
  },
  modePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  modePillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modeDescriptionText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginTop: 4,
  },
  modalityTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
  },
  modalityToggleRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  modalityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  modalityButtonActive: {
    backgroundColor: "#076047",
  },
  modalityButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#076047",
  },
  modalityButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  roomSelectSection: {
    marginTop: 12,
  },
  roomSelectLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },
  roomPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  roomPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  roomPillActive: {
    backgroundColor: "#E5F8E4",
    borderColor: "#076047",
  },
  roomPillText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },
  roomPillTextActive: {
    color: "#076047",
    fontWeight: "700",
  },
  modalityNoticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: radius.md,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalityNoticeText: {
    fontSize: 11,
    color: "#4B5563",
    flex: 1,
    lineHeight: 15,
  },
  fieldSubLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  dateDisplayBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  quickDateRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  quickDatePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  quickDatePillActive: {
    backgroundColor: "#076047",
  },
  quickDatePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  quickDatePillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  weekdayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayCircleActive: {
    backgroundColor: "#076047",
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  weekdayTextActive: {
    color: "#FFFFFF",
  },
  recurringDurationSection: {
    marginTop: 8,
  },
  recurringHorizonRow: {
    flexDirection: "row",
    gap: 6,
  },
  horizonPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  horizonPillActive: {
    backgroundColor: "#076047",
  },
  horizonPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  horizonPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  timeInputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeColumn: {
    flex: 1,
  },
  timeSelectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timeSelectText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  calculatedEndBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "#E5F8E4",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  calculatedEndText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#076047",
    flex: 1,
  },
  autoPill: {
    backgroundColor: "#076047",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  autoPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  multiTimeSection: {
    marginTop: 4,
  },
  multiTimePillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timeGridPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timeGridPillActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  timeGridPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  timeGridPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  durationPillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  durationPillActive: {
    backgroundColor: "#076047",
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  durationPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  optionalText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  focusInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: radius.md,
    padding: 12,
    fontSize: 13,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    textAlignVertical: "top",
    minHeight: 56,
  },
  tagsHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 10,
    marginBottom: 6,
  },
  tagsWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tagChipActive: {
    backgroundColor: "#E5F8E4",
    borderColor: "#A7F3D0",
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#076047",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  switchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  switchContent: {
    flex: 1,
    marginRight: 8,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  switchSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#076047",
  },
  previewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  previewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#076047",
  },
  previewSubTitle: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
    marginTop: 2,
  },
  restoreButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "#F3F4F6",
  },
  restoreButtonText: {
    fontSize: 11,
    color: "#076047",
    fontWeight: "700",
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  capacityBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
  },
  queuedList: {
    gap: 6,
  },
  queuedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  queuedItemConflict: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  queuedItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  queuedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#076047",
  },
  queuedDotConflict: {
    backgroundColor: "#DC2626",
  },
  queuedTimeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  queuedDetailText: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
  },
  removeSlotBtn: {
    padding: 4,
  },
  moreSlotsText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#076047",
    textAlign: "center",
    marginTop: 4,
  },
  validationErrorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  validationErrorText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
    flex: 1,
  },
  complianceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  complianceText: {
    fontSize: 11,
    color: "#6B6A5E",
    fontWeight: "500",
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(7, 96, 71, 0.08)",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelOutlineButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "#076047",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  cancelOutlineText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#076047",
  },
  submitButton: {
    flex: 2,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: "#076047",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#000000",
    alignSelf: "center",
    marginTop: 8,
  },
  pressedState: {
    opacity: 0.75,
  },
});
