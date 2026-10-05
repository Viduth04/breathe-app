// Counsellor Schedule - Muaath (Member 4). Supports FR08, FR01, NFR01, NFR02.
// Clinical schedule & availability management supporting Day, Week, and Month views
// matching approved prototypes media_1791025108845.png and media_1791025039763.png.

import React, { useState, useEffect, useMemo } from "react";
import {
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
  MOCK_TIME_SLOTS,
  MOCK_WEEK_DAYS,
  MOCK_WEEK_RANGE,
} from "@/services/mockScheduleData";
import {
  DayInfo,
  SchedulePreference,
  TimeSlot,
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
  }>();

  const store = useCounsellorStore();
  const { user } = useAuth();

  // View mode: day, week, month (defaults to 'day' if param specifies day, or 'week')
  const [viewMode, setViewMode] = useState<ViewMode>(
    (params.view as ViewMode) || "day"
  );

  // Selected day for Week view
  const [selectedDayWeek, setSelectedDayWeek] = useState<number>(0);

  // Selected calendar day (shared with store: default 19 for Tuesday, Aug 19)
  const selectedCalendarDay = store.selectedCalendarDay || 19;

  // Week slots & preferences
  const [slots, setSlots] = useState<TimeSlot[]>(MOCK_TIME_SLOTS);
  const [preferences, setPreferences] = useState<SchedulePreference[]>(
    MOCK_SCHEDULE_PREFERENCES
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Update view mode when params change
  useEffect(() => {
    if (params.view && (params.view === "day" || params.view === "week" || params.view === "month")) {
      setViewMode(params.view as ViewMode);
    }
  }, [params.view]);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Quick block functions for Week view
  const blockMorning = () => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i < 3 && slot.status !== "booked" ? { ...slot, status: "closed" } : slot
      )
    );
    setBlockModalVisible(false);
    showToast("Morning slots blocked (09:00 AM – 12:00 PM).");
  };

  const blockAfternoon = () => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i >= 3 && slot.status !== "booked" ? { ...slot, status: "closed" } : slot
      )
    );
    setBlockModalVisible(false);
    showToast("Afternoon slots blocked (01:00 PM – 05:00 PM).");
  };

  const blockFullDay = () => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.status !== "booked" ? { ...slot, status: "closed" } : slot
      )
    );
    setBlockModalVisible(false);
    showToast("All bookable slots for this day are blocked.");
  };

  const toggleSlotStatus = (index: number) => {
    setSlots((prev) =>
      prev.map((slot, i) => {
        if (i === index && slot.status !== "booked") {
          return {
            ...slot,
            status: slot.status === "open" ? "closed" : "open",
          };
        }
        return slot;
      })
    );
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

  const markAllOpen = () => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.status !== "booked" ? { ...slot, status: "open" } : slot
      )
    );
    showToast("All bookable slots marked as open.");
  };

  const handleSave = async () => {

    // Run upstream batch saving logic
    store.saveScheduleSlots(slots);

    // Run simple string-based saving logic for the student dashboard display


    try {
      if (user?.uid) {
        const availableTimes = store.scheduleDaySlots
          .filter(s => !s.isBooked && !store.heldScheduleSlots[s.id])
          .map(s => {
             const m = s.timeRange.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
             return m ? m[1] : s.timeRange;
          });
        
        await updateDoc(doc(db, "counsellors", user.uid), {
          availableSlots: availableTimes,
          availableDate: String(store.selectedCalendarDay || 15)
        });
      }
      showToast("Availability saved. Changes reflected instantly.");
    } catch (e) {
      console.warn("Failed to save to DB:", e);
      showToast("Error saving availability.");
    }
  };

  const handleHoldSlot = (slotId: string) => {
    const isNowHeld = store.toggleHoldScheduleSlot(slotId);
    showToast(isNowHeld ? "Slot held (hidden from student booking)" : "Slot hold released (available for students)");
  };

  const handleSelectCalendarDay = (day: number) => {
    store.setSelectedCalendarDay(day);
  };

  const getDayDotColor = (dotColor: DayInfo["dotColor"]) => {
    switch (dotColor) {
      case "green":
        return "#10B981";
      case "amber":
        return "#F59E0B";
      case "gray":
      default:
        return "#CBD5E1";
    }
  };

  const availableCount = slots.filter((s) => s.status === "open").length;
  const bookedCount = slots.filter((s) => s.status === "booked").length;
  const closedCount = slots.filter((s) => s.status === "closed").length;
  const currentWeekDay = MOCK_WEEK_DAYS[selectedDayWeek];

  // Calendar matrix for August 2026 (Aug 1 is Saturday)
  const augustCalendarDays = useMemo(() => {
    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      hasBooked?: boolean;
      hasIntake?: boolean;
      hasOpen?: boolean;
    }> = [];

    // July days trailing (Jul 26-31)
    for (let i = 26; i <= 31; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    // August days (1 to 31)
    for (let i = 1; i <= 31; i++) {
      let hasBooked = false;
      let hasIntake = false;
      let hasOpen = false;

      if (i === 18) {
        hasBooked = true;
      } else if (i === 19) {
        hasBooked = true;
        hasIntake = true;
        hasOpen = true;
      } else if (i === 20) {
        hasBooked = true;
        hasOpen = true;
      } else if (i === 21) {
        hasBooked = true;
      } else if (i === 22) {
        hasBooked = true;
        hasIntake = true;
      } else if (i % 3 === 0 && i > 5) {
        hasBooked = true;
      }

      days.push({
        day: i,
        isCurrentMonth: true,
        hasBooked,
        hasIntake,
        hasOpen,
      });
    }

    // September days padding (1-5)
    for (let i = 1; i <= 5; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return days;
  }, []);

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
            <Text style={styles.avatarText}>DR</Text>
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
            {/* Day Header Subtitle */}
            <View style={styles.daySubtitleRow}>
              <Text style={styles.dayDateTitle}>
                Tuesday, Aug {selectedCalendarDay}
              </Text>
              <Text style={styles.dayStatsSub}>
                3.5 hrs booked • 4 Sessions
              </Text>
            </View>

            {/* List of Day Slots */}
            <View style={styles.daySlotsList}>
              {store.scheduleDaySlots.map((slot) => {
                const isHeld = !!store.heldScheduleSlots[slot.id];

                if (!slot.isBooked) {
                  // OPEN SLOT CARD
                  return (
                    <View key={slot.id} style={styles.openSlotCard}>
                      <View style={styles.openSlotTopRow}>
                        <View style={styles.slotTimeBadge}>
                          <Ionicons name="time-outline" size={13} color="#065F46" />
                          <Text style={styles.slotTimeBadgeText}>{slot.timeRange}</Text>
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
                            {isHeld ? "Held" : "+ Hold Slot"}
                          </Text>
                        </Pressable>
                      </View>

                      <View style={styles.openSlotBody}>
                        <View style={styles.openSlotIconBox}>
                          <Ionicons
                            name={isHeld ? "pause-circle-outline" : "calendar-outline"}
                            size={20}
                            color={isHeld ? "#B45309" : "#065F46"}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.openSlotTitle}>
                            {isHeld ? "Slot Temporarily Held" : slot.studentName}
                          </Text>
                          <Text style={styles.openSlotSubtitle}>
                            {isHeld
                              ? "Hidden from student booking directory"
                              : slot.subtitle}
                          </Text>
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
                      if (slot.isAnonymous) {
                        router.navigate("/(counsellor-detail)/ready-to-join");
                      } else {
                        router.navigate("/(counsellor-detail)/session-notes");
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Session with ${slot.studentName}, ${slot.timeRange}`}
                  >
                    {/* Header Row: Time badge + Confirmed badge */}
                    <View style={styles.bookedSlotHeaderRow}>
                      <View style={styles.slotTimeBadge}>
                        <Ionicons name="time-outline" size={13} color="#065F46" />
                        <Text style={styles.slotTimeBadgeText}>{slot.timeRange}</Text>
                      </View>

                      <View style={styles.confirmedBadge}>
                        <View style={styles.confirmedBadgeDot} />
                        <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                      </View>
                    </View>

                    {/* Student Info Row */}
                    <View style={styles.bookedStudentRow}>
                      <View
                        style={[
                          styles.bookedModalityIconBox,
                          slot.modalityType === "voice" && { backgroundColor: "#FEF3C7" },
                          slot.modalityType === "in-person" && { backgroundColor: "#E0E7FF" },
                        ]}
                      >
                        {slot.modalityType === "video" && (
                          <Ionicons name="videocam" size={18} color="#065F46" />
                        )}
                        {slot.modalityType === "voice" && (
                          <Ionicons name="call" size={18} color="#B45309" />
                        )}
                        {slot.modalityType === "in-person" && (
                          <Ionicons name="person" size={18} color="#4338CA" />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.bookedStudentName}>
                            {slot.studentName}
                          </Text>
                          {slot.isAnonymous && (
                            <View style={styles.anonPill}>
                              <Ionicons name="shield-checkmark" size={10} color="#065F46" />
                              <Text style={styles.anonPillText}>Anonymous</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.bookedModalityText}>
                          {slot.modalityText}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </View>

                    {/* Optional Intake Note Banner (Student #5104) */}
                    {slot.intakeNote && (
                      <Pressable
                        style={styles.intakeNoteBanner}
                        onPress={() =>
                          router.navigate("/(counsellor-detail)/request-detail?id=req-5104")
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
              })}
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
        {/* VIEW 2: MONTH VIEW (media_1791025039763.png)      */}
        {/* ══════════════════════════════════════════════════ */}
        {viewMode === "month" && (
          <View style={styles.monthViewWrapper}>
            {/* Calendar Card */}
            <View style={styles.monthCalendarCard}>
              {/* Month Header Nav */}
              <View style={styles.monthNavRow}>
                <Pressable
                  style={styles.monthArrowBtn}
                  onPress={() => showToast("Previous Month")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Ionicons name="chevron-back" size={18} color="#1E293B" />
                </Pressable>

                <View style={styles.monthTitleBox}>
                  <Text style={styles.monthTitleText}>August 2026</Text>
                  <View style={styles.semesterStartBadge}>
                    <Text style={styles.semesterStartText}>Semester Start</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.monthArrowBtn}
                  onPress={() => showToast("Next Month")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Ionicons name="chevron-forward" size={18} color="#1E293B" />
                </Pressable>
              </View>

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
                {augustCalendarDays.map((item, idx) => {
                  const isSelected = item.isCurrentMonth && item.day === selectedCalendarDay;

                  return (
                    <Pressable
                      key={idx}
                      style={[
                        styles.monthCell,
                        isSelected && styles.monthCellSelected,
                      ]}
                      onPress={() => {
                        if (item.isCurrentMonth) {
                          handleSelectCalendarDay(item.day);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`August ${item.day}`}
                    >
                      <Text
                        style={[
                          styles.monthCellText,
                          !item.isCurrentMonth && styles.monthCellTextDisabled,
                          isSelected && styles.monthCellTextSelected,
                        ]}
                      >
                        {item.day}
                      </Text>

                      {/* Modality Dot Indicators */}
                      {item.isCurrentMonth && (
                        <View style={styles.cellDotsRow}>
                          {item.hasBooked && <View style={styles.bookedDotIndicator} />}
                          {item.hasIntake && <View style={styles.intakeDotIndicator} />}
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
                  <View style={styles.intakeDotIndicator} />
                  <Text style={styles.legendText}>Intake Assessment</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.openDotIndicator} />
                  <Text style={styles.legendText}>Open Slot</Text>
                </View>
              </View>
            </View>

            {/* Selected Date Summary Strip */}
            <Pressable
              style={styles.dateSummaryStrip}
              onPress={() => setViewMode("day")}
              accessibilityRole="button"
              accessibilityLabel={`View Day Schedule for Tuesday, Aug ${selectedCalendarDay}`}
            >
              <View style={styles.summaryStripHeader}>
                <View>
                  <Text style={styles.summaryStripDate}>
                    Tuesday, Aug {selectedCalendarDay}
                  </Text>
                  <Text style={styles.summaryStripSub}>
                    3.5 hrs booked • 4 Sessions scheduled
                  </Text>
                </View>
                <View style={styles.summaryChevronBtn}>
                  <Text style={styles.viewDayText}>Day View</Text>
                  <Ionicons name="chevron-forward" size={16} color="#065F46" />
                </View>
              </View>

              {/* 3 Mini Session Cards */}
              <View style={styles.miniCardsRow}>
                <View style={styles.miniCard}>
                  <Text style={styles.miniCardTime}>09:00 AM</Text>
                  <Text style={styles.miniCardName} numberOfLines={1}>
                    Sarah Jenkins
                  </Text>
                  <View style={styles.miniModalityBadge}>
                    <Text style={styles.miniModalityText}>Video</Text>
                  </View>
                </View>

                <View style={styles.miniCard}>
                  <Text style={styles.miniCardTime}>01:00 PM</Text>
                  <Text style={styles.miniCardName} numberOfLines={1}>
                    Student #5104
                  </Text>
                  <View
                    style={[styles.miniModalityBadge, { backgroundColor: "#FEF3C7" }]}
                  >
                    <Text style={[styles.miniModalityText, { color: "#B45309" }]}>
                      Voice
                    </Text>
                  </View>
                </View>

                <View style={styles.miniCard}>
                  <Text style={styles.miniCardTime}>02:30 PM</Text>
                  <Text style={styles.miniCardName} numberOfLines={1}>
                    Alex Rivera
                  </Text>
                  <View
                    style={[styles.miniModalityBadge, { backgroundColor: "#E0E7FF" }]}
                  >
                    <Text style={[styles.miniModalityText, { color: "#4338CA" }]}>
                      In-Person
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>

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
        {/* VIEW 3: WEEK VIEW (Existing Availability Manager)  */}
        {/* ══════════════════════════════════════════════════ */}
        {viewMode === "week" && (
          <View style={styles.weekViewWrapper}>
            {/* Title Block */}
            <View style={styles.titleBlock}>
              <Text style={styles.mainTitle}>Manage your availability</Text>
              <Text style={styles.subTitle}>
                Students can only book the time slots you mark as available.
              </Text>
            </View>

            {/* Date Range Navigation Strip */}
            <View style={styles.dateNav}>
              <View style={styles.dateNavArrows}>
                <Pressable
                  style={styles.navArrowBtn}
                  onPress={() => {
                    if (selectedDayWeek > 0) setSelectedDayWeek(selectedDayWeek - 1);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Previous day"
                  hitSlop={8}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                </Pressable>
                <Pressable
                  style={styles.navArrowBtn}
                  onPress={() => {
                    if (selectedDayWeek < MOCK_WEEK_DAYS.length - 1)
                      setSelectedDayWeek(selectedDayWeek + 1);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Next day"
                  hitSlop={8}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </Pressable>
              </View>
              <Text style={styles.dateNavText}>{MOCK_WEEK_RANGE.label}</Text>
              <Pressable
                style={styles.todayBtn}
                onPress={() => setSelectedDayWeek(0)}
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
                  setModalData({
                    title: "Set Recurring Rules",
                    description:
                      "Define default weekly working shifts, lunch hours, and routine buffers.",
                  })
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
                  <Text style={styles.quickRuleSubtitle}>Standard rules</Text>
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
                  <Text style={styles.quickRuleSubtitle}>Vacation or leave</Text>
                </View>
              </Pressable>
            </View>

            {/* Day Selector Strip */}
            <View style={styles.daySelectorSection}>
              <View style={styles.daySelectorHeader}>
                <Text style={styles.sectionTitle}>SELECT DAY</Text>
                <Text style={styles.sectionHint}>
                  <Ionicons
                    name="hand-left-outline"
                    size={12}
                    color={colors.textSecondary}
                  />
                  {" "}Tap slot to toggle state
                </Text>
              </View>
              <View style={styles.dayStrip}>
                {MOCK_WEEK_DAYS.map((day, idx) => {
                  const isActive = idx === selectedDayWeek;
                  return (
                    <Pressable
                      key={day.dayShort}
                      style={[
                        styles.dayItem,
                        isActive && styles.dayItemActive,
                      ]}
                      onPress={() => setSelectedDayWeek(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${day.dayShort}, Aug ${day.dateNum}`}
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
                              : getDayDotColor(day.dotColor),
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
              <View>
                <Text style={styles.activeDayTitle}>
                  {currentWeekDay.dayShort === "Mon" ? "Monday" : currentWeekDay.dayShort},{" "}
                  Aug {currentWeekDay.dateNum}
                </Text>
                <Text style={styles.activeDayStatsRow}>
                  <Text style={styles.statAvailable}>{availableCount} available</Text>
                  {" • "}
                  <Text style={styles.statConfirmed}>{bookedCount} confirmed</Text>
                  {" • "}
                  <Text style={styles.statClosed}>{closedCount} closed</Text>
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

            {/* Save Availability Button */}
            <View style={styles.saveSection}>
              <Pressable
                style={styles.saveBtn}
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Save Availability"
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color="#A7F3D0"
                  style={styles.saveBtnIcon}
                />
                <Text style={styles.saveBtnText}>Save Availability</Text>
              </Pressable>
              <Text style={styles.saveHintText}>
                Changes reflect instantly on the student booking directory.
              </Text>
            </View>

            {/* Time Slots List */}
            {selectedDayWeek === 5 ? (
              <View style={styles.weekendCard} accessibilityRole="summary">
                <View style={styles.weekendIconBox}>
                  <Ionicons name="moon-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.weekendTitle}>Clinical hours closed on Saturdays</Text>
                <Text style={styles.weekendSubtitle}>
                  Standard clinic consultations operate Monday through Friday. You can
                  open an emergency half-day shift if needed.
                </Text>
                <Pressable
                  style={styles.openWeekendBtn}
                  onPress={markAllOpen}
                  accessibilityRole="button"
                  accessibilityLabel="Open Emergency Half-Day Shift"
                >
                  <Ionicons name="flash-outline" size={16} color={colors.primary} />
                  <Text style={styles.openWeekendBtnText}>
                    Open Emergency Half-Day Shift
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.slotsList}>
                {slots.map((slot, index) => {
                  const isOpen = slot.status === "open";
                  const isBooked = slot.status === "booked";
                  const isClosed = slot.status === "closed";

                  return (
                    <View
                      key={slot.id}
                      style={[styles.slotCard, isClosed && styles.slotCardClosed]}
                      accessibilityRole="summary"
                    >
                      <View
                        style={[
                          styles.slotIconBox,
                          isOpen && styles.slotIconBoxOpen,
                          isBooked && styles.slotIconBoxBooked,
                          isClosed && styles.slotIconBoxClosed,
                        ]}
                      >
                        {isOpen && (
                          <Ionicons name="time-outline" size={20} color={colors.primary} />
                        )}
                        {isBooked && (
                          <Ionicons name="calendar-outline" size={20} color="#334155" />
                        )}
                        {isClosed && (
                          <Ionicons name="close-circle-outline" size={20} color="#78716C" />
                        )}
                      </View>

                      <View style={styles.slotCenter}>
                        <Text
                          style={[
                            styles.slotTimeRange,
                            isClosed && styles.slotTimeStrikethrough,
                          ]}
                        >
                          {slot.timeRange}
                        </Text>
                        <View style={styles.slotDescriptionRow}>
                          {isBooked && (
                            <Ionicons
                              name="person-outline"
                              size={12}
                              color="#475569"
                              style={{ marginRight: 3 }}
                            />
                          )}
                          <Text
                            style={[
                              styles.slotDescription,
                              isBooked && styles.slotDescriptionBooked,
                              isClosed && styles.slotDescriptionClosed,
                            ]}
                            numberOfLines={1}
                          >
                            {slot.description}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={[
                          styles.slotActionPill,
                          isOpen && styles.slotActionPillOpen,
                          isBooked && styles.slotActionPillBooked,
                          isClosed && styles.slotActionPillClosed,
                        ]}
                        onPress={() => !isBooked && toggleSlotStatus(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Slot ${slot.timeRange}, status: ${slot.status}. ${
                          isBooked ? "Confirmed booking" : "Tap to toggle"
                        }`}
                        disabled={isBooked}
                        hitSlop={6}
                      >
                        {isOpen && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#064E3B"
                            style={{ marginRight: 2 }}
                          />
                        )}
                        {isBooked && <View style={styles.bookedDot} />}
                        {isClosed && (
                          <Ionicons
                            name="close-circle-outline"
                            size={14}
                            color="#57534E"
                            style={{ marginRight: 2 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.slotActionPillText,
                            isOpen && styles.slotActionPillTextOpen,
                            isBooked && styles.slotActionPillTextBooked,
                            isClosed && styles.slotActionPillTextClosed,
                          ]}
                        >
                          {isOpen ? "Open" : isBooked ? "Booked" : "Closed"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

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
              Select the shift duration to block on {currentWeekDay.dayShort === "Mon" ? "Monday" : currentWeekDay.dayShort}, Aug {currentWeekDay.dateNum}. Booked sessions are preserved.
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  confirmedBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#065F46",
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  bookedStudentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  bookedModalityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  bookedStudentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  anonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  anonPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  bookedModalityText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
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
    backgroundColor: "#065F46",
  },
  intakeDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F59E0B",
  },
  openDotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#94A3B8",
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
