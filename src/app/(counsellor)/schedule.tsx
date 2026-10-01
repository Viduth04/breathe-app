// Counsellor Schedule - Muaath (Member 4). Supports FR08.
// Clinical calendar & availability management matching exact Figma design specifications.

import {
  MOCK_SCHEDULE_PREFERENCES,
  MOCK_TIME_SLOTS,
  MOCK_WEEK_DAYS,
  MOCK_WEEK_RANGE,
} from "@/services/mockScheduleData";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  DayInfo,
  SchedulePreference,
  TimeSlot,
  ViewMode,
} from "@/types/counsellorSchedule";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function CounsellorScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDay, setSelectedDay] = useState<number>(0);
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

  // Quick block functions
  const blockMorning = () => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i < 3 && slot.status !== "booked" ? { ...slot, status: "closed" } : slot
      )
    );
    setBlockModalVisible(false);
    setFeedbackMessage("Morning slots blocked (09:00 AM – 12:00 PM).");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const blockAfternoon = () => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i >= 3 && slot.status !== "booked" ? { ...slot, status: "closed" } : slot
      )
    );
    setBlockModalVisible(false);
    setFeedbackMessage("Afternoon slots blocked (01:00 PM – 05:00 PM).");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const blockFullDay = () => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.status !== "booked" ? { ...slot, status: "closed" } : slot
      )
    );
    setBlockModalVisible(false);
    setFeedbackMessage("All bookable slots for this day are blocked.");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Toggle open/closed for a slot (booked slots are locked)
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

  // Toggle preferences (buffers, same-day)
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

  // Mark all non-booked slots as open
  const markAllOpen = () => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.status !== "booked" ? { ...slot, status: "open" } : slot
      )
    );
    setFeedbackMessage("All bookable slots marked as open.");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Save availability handler
  const handleSave = () => {
    setFeedbackMessage("Availability saved. Changes reflected instantly.");
    setTimeout(() => setFeedbackMessage(null), 3500);
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

  // Count active stats for the day
  const availableCount = slots.filter((s) => s.status === "open").length;
  const bookedCount = slots.filter((s) => s.status === "booked").length;
  const closedCount = slots.filter((s) => s.status === "closed").length;

  const currentDay = MOCK_WEEK_DAYS[selectedDay];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.headerTitle} accessibilityRole="header">
            Clinical Schedule
          </Text>
        </View>
        {/* Counselor Profile Avatar */}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. SUBHEADER: Back Button & Auto-Sync Badge */}
        <View style={styles.subHeader}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.navigate("/(counsellor)/dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Go back to Dashboard"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.text}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => router.navigate("/(counsellor-detail)/my-calendar")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#ECFDF5",
                borderWidth: 1,
                borderColor: "#A7F3D0",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
              }}
              accessibilityRole="button"
              accessibilityLabel="Open My Calendar"
            >
              <Ionicons name="calendar-outline" size={13} color="#065F46" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#065F46" }}>My Calendar</Text>
            </Pressable>
            <View style={styles.autoSyncPill} accessibilityLabel="Auto-Sync is On">
              <View style={styles.autoSyncDot} />
              <Text style={styles.autoSyncText}>Auto-Sync On</Text>
            </View>
          </View>
        </View>

        {/* 3. TITLE BLOCK */}
        <View style={styles.titleBlock}>
          <Text style={styles.mainTitle}>Manage your availability</Text>
          <Text style={styles.subTitle}>
            Students can only book the time slots you mark as available.
          </Text>
        </View>

        {/* 4. VIEW SWITCHER: Week View vs Month View */}
        <View style={styles.viewSwitcherContainer}>
          <View style={styles.viewSwitcher} accessibilityRole="tablist">
            <Pressable
              style={[
                styles.viewSwitchBtn,
                viewMode === "week" && styles.viewSwitchBtnActive,
              ]}
              onPress={() => setViewMode("week")}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === "week" }}
              accessibilityLabel="Week view"
            >
              <Ionicons
                name="menu-outline"
                size={16}
                color={viewMode === "week" ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.viewSwitchText,
                  viewMode === "week" && styles.viewSwitchTextActive,
                ]}
              >
                Week View
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.viewSwitchBtn,
                viewMode === "month" && styles.viewSwitchBtnActive,
              ]}
              onPress={() => setViewMode("month")}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === "month" }}
              accessibilityLabel="Month view"
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={viewMode === "month" ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.viewSwitchText,
                  viewMode === "month" && styles.viewSwitchTextActive,
                ]}
              >
                Month View
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 5. DATE RANGE NAVIGATION STRIP */}
        <View style={styles.dateNav}>
          <View style={styles.dateNavArrows}>
            <Pressable
              style={styles.navArrowBtn}
              onPress={() => {
                if (selectedDay > 0) setSelectedDay(selectedDay - 1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Previous week"
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              style={styles.navArrowBtn}
              onPress={() => {
                if (selectedDay < MOCK_WEEK_DAYS.length - 1)
                  setSelectedDay(selectedDay + 1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Next week"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>
          <Text style={styles.dateNavText}>{MOCK_WEEK_RANGE.label}</Text>
          <Pressable
            style={styles.todayBtn}
            onPress={() => setSelectedDay(0)}
            accessibilityRole="button"
            accessibilityLabel="Go to today"
          >
            <Text style={styles.todayBtnText}>Today</Text>
          </Pressable>
        </View>

        {/* 6. QUICK RULES SECTION */}
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

        {/* 7. DAY SELECTOR STRIP */}
        <View style={styles.daySelectorSection}>
          <View style={styles.daySelectorHeader}>
            <Text style={styles.sectionTitle}>SELECT DAY</Text>
            <Text style={styles.sectionHint}>
              <Ionicons name="hand-left-outline" size={12} color={colors.textSecondary} />
              {" "}Tap slot to toggle state
            </Text>
          </View>
          <View style={styles.dayStrip}>
            {MOCK_WEEK_DAYS.map((day, idx) => {
              const isActive = idx === selectedDay;
              return (
                <Pressable
                  key={day.dayShort}
                  style={[
                    styles.dayItem,
                    isActive && styles.dayItemActive,
                  ]}
                  onPress={() => setSelectedDay(idx)}
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

        {/* 8. ACTIVE DAY HEADER & BATCH ACTION */}
        <View style={styles.activeDayHeader}>
          <View>
            <Text style={styles.activeDayTitle}>
              {currentDay.dayShort === "Mon" ? "Monday" : currentDay.dayShort},{" "}
              Aug {currentDay.dateNum}
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

        {/* 9. PRIMARY ACTION: SAVE AVAILABILITY BUTTON (Placed directly below Active Day Header per PNG) */}
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

        {/* 10. TIME SLOTS LIST OR SATURDAY CLOSED STATE */}
        {selectedDay === 5 ? (
          <View style={styles.weekendCard} accessibilityRole="summary">
            <View style={styles.weekendIconBox}>
              <Ionicons name="moon-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.weekendTitle}>Clinical hours closed on Saturdays</Text>
            <Text style={styles.weekendSubtitle}>
              Standard clinic consultations operate Monday through Friday. You can open an emergency half-day shift if needed.
            </Text>
            <Pressable
              style={styles.openWeekendBtn}
              onPress={markAllOpen}
              accessibilityRole="button"
              accessibilityLabel="Open Emergency Half-Day Shift"
            >
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={styles.openWeekendBtnText}>Open Emergency Half-Day Shift</Text>
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
                  style={[
                    styles.slotCard,
                    isClosed && styles.slotCardClosed,
                  ]}
                  accessibilityRole="summary"
                >
                  {/* Left Modality Icon Box */}
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

                  {/* Center Timing & Description */}
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

                  {/* Right Status / Action Pill */}
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

        {/* 11. SCHEDULING PREFERENCES SECTION */}
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

      {/* Actionable Block Time Off Modal */}
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
              Select the shift duration to block on {currentDay.dayShort === "Mon" ? "Monday" : currentDay.dayShort}, Aug {currentDay.dateNum}. Booked sessions are preserved.
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
                  <Text style={styles.blockOptionSubtitle}>09:00 AM – 12:00 PM (3 slots)</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>

              <Pressable
                style={styles.blockOptionBtn}
                onPress={blockAfternoon}
                accessibilityRole="button"
                accessibilityLabel="Block Afternoon Shifts"
              >
                <View style={styles.blockOptionIconBox}>
                  <Ionicons name="partly-sunny-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockOptionTitle}>Block Afternoon Shifts</Text>
                  <Text style={styles.blockOptionSubtitle}>01:00 PM – 05:00 PM (4 slots)</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>

              <Pressable
                style={[styles.blockOptionBtn, { borderColor: "rgba(194, 50, 50, 0.3)" }]}
                onPress={blockFullDay}
                accessibilityRole="button"
                accessibilityLabel="Block Entire Day"
              >
                <View style={[styles.blockOptionIconBox, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.blockOptionTitle, { color: colors.danger }]}>Block Entire Day</Text>
                  <Text style={styles.blockOptionSubtitle}>Mark all slots as closed</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230, 225, 211, 0.6)",
    backgroundColor: "rgba(255, 249, 236, 0.95)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  greenPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.3,
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(7, 96, 71, 0.2)",
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
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm + 4,
    marginBottom: spacing.xs,
  },
  backButton: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  autoSyncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  autoSyncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  autoSyncText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  titleBlock: {
    marginTop: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  mainTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subTitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  viewSwitcherContainer: {
    marginVertical: spacing.sm,
  },
  viewSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(230, 225, 211, 0.5)",
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewSwitchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: TOUCH_TARGET - 8,
    borderRadius: radius.sm + 4,
  },
  viewSwitchBtnActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  viewSwitchText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  viewSwitchTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
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
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  quickRulesGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm + 4,
  },
  quickRuleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickRuleIconBg: {
    width: 38,
    height: 38,
    borderRadius: radius.sm + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRuleTitle: {
    fontSize: 13,
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
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.primary,
  },
  sectionHint: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  dayStrip: {
    flexDirection: "row",
    gap: 6,
  },
  dayItem: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
  },
  dayItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dayItemName: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  dayItemDate: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginVertical: 1,
  },
  dayItemTextActive: {
    color: colors.white,
  },
  dayStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  activeDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  activeDayTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  activeDayStatsRow: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statAvailable: {
    color: "#047857",
    fontWeight: "700",
  },
  statConfirmed: {
    color: colors.text,
    fontWeight: "700",
  },
  statClosed: {
    color: "#DC2626",
    fontWeight: "700",
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  saveSection: {
    marginBottom: spacing.md,
  },
  saveBtn: {
    minHeight: TOUCH_TARGET,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnIcon: {
    marginRight: 2,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  saveHintText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
  slotsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  slotCardClosed: {
    backgroundColor: "#FBFBFA",
    borderStyle: "dashed",
    borderColor: "#D6D3D1",
    opacity: 0.9,
  },
  slotIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 2,
  },
  slotIconBoxOpen: {
    backgroundColor: "#ECFDF5",
  },
  slotIconBoxBooked: {
    backgroundColor: "#F1F5F9",
  },
  slotIconBoxClosed: {
    backgroundColor: "#F5F5F4",
  },
  slotCenter: {
    flex: 1,
  },
  slotTimeRange: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  slotTimeStrikethrough: {
    textDecorationLine: "line-through",
    color: "#78716C",
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
    minHeight: TOUCH_TARGET - 6,
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
    borderRadius: radius.md,
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
    borderRadius: radius.md + 4,
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
  weekendCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
    borderRadius: radius.md,
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
