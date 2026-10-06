// Add Session Screen = Multi-Slot Availability Publisher - Muaath (Member 4). Supports FR08, NFR01, NFR06.
// Live clinical availability publisher: allows counsellors to publish open slots for specific dates and times
// (Single, Multi-Time, Date Range, Recurring) so students can view and book them anonymously.
// Real Firestore batch writes to slots/{slotId} and counsellors/{uid}.

import React, { useMemo, useState } from "react";
import {
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { PublishSlotInput, useCounsellorStore } from "@/services/counsellorStore";
import { SessionType } from "@/types/counsellorDashboard";

type PublisherMode = "single" | "multi_time" | "date_range" | "recurring";
type DurationOption = "15m" | "30m" | "45m" | "60m";

const QUICK_TIMES = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

const WEEKDAYS = [
  { key: "1", label: "Mon" },
  { key: "2", label: "Tue" },
  { key: "3", label: "Wed" },
  { key: "4", label: "Thu" },
  { key: "5", label: "Fri" },
  { key: "6", label: "Sat" },
];

export default function AddSessionScreen() {
  const store = useCounsellorStore();

  // Mode selection
  const [publisherMode, setPublisherMode] = useState<PublisherMode>("single");

  // Dynamic Colombo date generation
  const todayColombo = useMemo(() => {
    return new Date();
  }, []);

  const upcomingDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayColombo);
      d.setDate(d.getDate() + i);
      const dayNum = d.getDate();
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        dateKey,
        dayNum,
        weekday,
        month,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${weekday}, ${month} ${dayNum}`,
        dateObj: d,
      });
    }
    return days;
  }, [todayColombo]);

  const [selectedDayKey, setSelectedDayKey] = useState<string>(upcomingDays[1].dateKey);
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [weeksToExpand, setWeeksToExpand] = useState<number>(2);

  // Time & Duration
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["10:00 AM"]);
  const [duration, setDuration] = useState<DurationOption>("45m");
  const [sessionModality, setSessionModality] = useState<SessionType>("video");
  const [customTime, setCustomTime] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Calculate slots to publish based on mode
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

    const activeTimes = selectedTimes.length > 0 ? selectedTimes : ["10:00 AM"];

    if (publisherMode === "single" || publisherMode === "multi_time") {
      const dayObj = upcomingDays.find((d) => d.dateKey === selectedDayKey) || upcomingDays[1];
      activeTimes.forEach((t) => {
        const { start, end } = makeDate(dayObj.dateKey, t);
        slots.push({
          dateKey: dayObj.dateKey,
          dateDisplay: dayObj.label,
          startTime: t,
          endTime: getEndTime(t),
          startAt: start,
          endAt: end,
          sessionTypes: [sessionModality],
        });
      });
    } else if (publisherMode === "date_range" || publisherMode === "recurring") {
      const daysCount = publisherMode === "recurring" ? weeksToExpand * 7 : 7;
      for (let i = 0; i < daysCount; i++) {
        const d = new Date(todayColombo);
        d.setDate(d.getDate() + i);
        const dayOfWeekStr = String(d.getDay() === 0 ? 7 : d.getDay());

        if (selectedWeekdays.includes(dayOfWeekStr)) {
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const dateDisplay = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

          activeTimes.forEach((t) => {
            const { start, end } = makeDate(dateKey, t);
            slots.push({
              dateKey,
              dateDisplay,
              startTime: t,
              endTime: getEndTime(t),
              startAt: start,
              endAt: end,
              sessionTypes: [sessionModality],
            });
          });
        }
      }
    }

    return slots;
  }, [publisherMode, selectedDayKey, upcomingDays, selectedTimes, duration, sessionModality, selectedWeekdays, weeksToExpand, todayColombo]);

  const toggleTimeSelection = (time: string) => {
    if (publisherMode === "single") {
      setSelectedTimes([time]);
    } else {
      if (selectedTimes.includes(time)) {
        if (selectedTimes.length > 1) {
          setSelectedTimes(selectedTimes.filter((t) => t !== time));
        }
      } else {
        setSelectedTimes([...selectedTimes, time]);
      }
    }
  };

  const toggleWeekday = (key: string) => {
    if (selectedWeekdays.includes(key)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((k) => k !== key));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, key]);
    }
  };

  const handlePublishSlots = async () => {
    if (isSubmitting || computedSlotsToPublish.length === 0) return;
    setIsSubmitting(true);

    try {
      const count = await store.publishAvailabilityBatch(computedSlotsToPublish);
      setFeedbackToast(`Successfully published ${count} availability slots!`);
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      setFeedbackToast("Failed to publish slots. Please retry.");
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
          Add Session Slots
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Info Banner ─── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="calendar-outline" size={22} color="#076047" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Availability Publisher</Text>
            <Text style={styles.bannerSubtitle}>
              Publish multiple time slots for students to discover and book anonymously.
            </Text>
          </View>
        </View>

        {/* ─── Mode Selector Pills ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>PUBLISHING MODE</Text>
        </View>
        <View style={styles.modePillRow}>
          {(
            [
              { key: "single", label: "Single Slot" },
              { key: "multi_time", label: "Multi-Time" },
              { key: "date_range", label: "Date Range" },
              { key: "recurring", label: "Recurring" },
            ] as const
          ).map((m) => (
            <Pressable
              key={m.key}
              style={[styles.modePill, publisherMode === m.key && styles.modePillActive]}
              onPress={() => {
                setPublisherMode(m.key);
                if (m.key === "single" && selectedTimes.length > 1) {
                  setSelectedTimes([selectedTimes[0]]);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`Select mode ${m.label}`}
            >
              <Text style={[styles.modePillText, publisherMode === m.key && styles.modePillTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── Date Selection ─── */}
        {(publisherMode === "single" || publisherMode === "multi_time") && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SELECT DATE</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
              {upcomingDays.map((d) => {
                const isSelected = selectedDayKey === d.dateKey;
                return (
                  <Pressable
                    key={d.dateKey}
                    style={[styles.dayCard, isSelected && styles.dayCardActive]}
                    onPress={() => setSelectedDayKey(d.dateKey)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${d.label}`}
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
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ─── Weekdays Selection for Range / Recurring ─── */}
        {(publisherMode === "date_range" || publisherMode === "recurring") && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>ACTIVE WEEKDAYS</Text>
            </View>
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((w) => {
                const isActive = selectedWeekdays.includes(w.key);
                return (
                  <Pressable
                    key={w.key}
                    style={[styles.weekdayChip, isActive && styles.weekdayChipActive]}
                    onPress={() => toggleWeekday(w.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle ${w.label}`}
                  >
                    <Text style={[styles.weekdayChipText, isActive && styles.weekdayChipTextActive]}>
                      {w.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {publisherMode === "recurring" && (
              <View style={styles.recurringExpansionRow}>
                <Text style={styles.recurringLabel}>Recurring for next:</Text>
                <View style={styles.weeksPillRow}>
                  {[1, 2, 3, 4].map((w) => (
                    <Pressable
                      key={w}
                      style={[styles.weekPill, weeksToExpand === w && styles.weekPillActive]}
                      onPress={() => setWeeksToExpand(w)}
                    >
                      <Text style={[styles.weekPillText, weeksToExpand === w && styles.weekPillTextActive]}>
                        {w} {w === 1 ? "Week" : "Weeks"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ─── Time Slots ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>
            {publisherMode === "single" ? "START TIME" : "TIME SLOTS PER DAY"}
          </Text>
        </View>
        <View style={styles.timesGrid}>
          {QUICK_TIMES.map((t) => {
            const isSelected = selectedTimes.includes(t);
            return (
              <Pressable
                key={t}
                style={[styles.timeChip, isSelected && styles.timeChipActive]}
                onPress={() => toggleTimeSelection(t)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${t}`}
              >
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Duration ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>SLOT DURATION</Text>
        </View>
        <View style={styles.durationRow}>
          {(["15m", "30m", "45m", "60m"] as DurationOption[]).map((d) => (
            <Pressable
              key={d}
              style={[styles.durationChip, duration === d && styles.durationChipActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durationChipText, duration === d && styles.durationChipTextActive]}>
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── Modality ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>CONSULTATION MODALITY</Text>
        </View>
        <View style={styles.modalityRow}>
          {(
            [
              { key: "video", label: "Video Call", icon: "videocam-outline" },
              { key: "chat", label: "Secure Chat", icon: "chatbubble-ellipses-outline" },
              { key: "in-person", label: "In-Person", icon: "people-outline" },
            ] as const
          ).map((m) => {
            const isSelected = sessionModality === m.key;
            return (
              <Pressable
                key={m.key}
                style={[styles.modalityCard, isSelected && styles.modalityCardActive]}
                onPress={() => setSessionModality(m.key)}
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
            <View>
              <Text style={styles.summaryTitle}>Publish Summary</Text>
              <Text style={styles.summarySub}>
                {computedSlotsToPublish.length} slots ready for student booking
              </Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{duration} slots</Text>
            </View>
          </View>

          <Pressable
            style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
            onPress={handlePublishSlots}
            disabled={isSubmitting || computedSlotsToPublish.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Publish availability slots"
          >
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.publishButtonText}>
              {isSubmitting ? "Publishing to Cloud..." : `Publish ${computedSlotsToPublish.length} Slots`}
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
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
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#076047",
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
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#076047",
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#6B6A5E",
  },
  modePillRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    alignItems: "center",
    justifyContent: "center",
  },
  modePillActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  modePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1B2B24",
  },
  modePillTextActive: {
    color: "#FFFFFF",
  },
  daysScroll: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dayCard: {
    width: 72,
    paddingVertical: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  dayCardWeekday: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  dayCardNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2B24",
    marginVertical: 2,
  },
  dayCardMonth: {
    fontSize: 11,
    color: "#64748B",
  },
  dayCardTextActive: {
    color: "#FFFFFF",
  },
  weekdaysRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  weekdayChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    alignItems: "center",
  },
  weekdayChipActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  weekdayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B2B24",
  },
  weekdayChipTextActive: {
    color: "#FFFFFF",
  },
  recurringExpansionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    marginTop: spacing.xs,
  },
  recurringLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B2B24",
  },
  weeksPillRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  weekPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    backgroundColor: "#F8FAFC",
  },
  weekPillActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  weekPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  weekPillTextActive: {
    color: "#FFFFFF",
  },
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
  },
  timeChipActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B2B24",
  },
  timeChipTextActive: {
    color: "#FFFFFF",
  },
  durationRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    alignItems: "center",
  },
  durationChipActive: {
    backgroundColor: "#076047",
    borderColor: "#076047",
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B2B24",
  },
  durationChipTextActive: {
    color: "#FFFFFF",
  },
  modalityRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalityCard: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2DEC9",
    alignItems: "center",
    gap: 4,
  },
  modalityCardActive: {
    borderColor: "#076047",
    backgroundColor: "#E5F8E4",
  },
  modalityCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  modalityCardTextActive: {
    color: "#076047",
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
    backgroundColor: "#E5F8E4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#076047",
  },
  publishButton: {
    flexDirection: "row",
    backgroundColor: "#076047",
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
