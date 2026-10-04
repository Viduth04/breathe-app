// Counsellor My Calendar Screen - Muaath (Member 4). Supports FR01, FR08, NFR01, NFR02.
// High-fidelity implementation matching approved prototypes media_1791024778891.png (Day View)
// and media_1791024861823.png (Month View).

import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { CalendarBooking, useCounsellorStore } from "@/services/counsellorStore";

type RangeView = "day" | "week" | "month";

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

  // Selected date state (defaults to Aug 19, 2026)
  const [selectedDay, setSelectedDay] = useState<number>(store.selectedCalendarDay || 19);
  const [selectedMonth, setSelectedMonth] = useState<string>("August 2026");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDaySelect = (dayNum: number) => {
    setSelectedDay(dayNum);
    store.setSelectedCalendarDay(dayNum);
  };

  const handleJumpToToday = () => {
    handleDaySelect(19);
    showToast("Jumped to Today (Tue, Aug 19)");
  };

  const handleEnterRoom = (booking: CalendarBooking) => {
    router.navigate({
      pathname: "/(counsellor-detail)/ready-to-join",
      params: {
        studentAnonId: booking.studentAnonId || "Student #5104",
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

    if (booking.studentAnonId === "Student #5104") {
      router.navigate({
        pathname: "/(counsellor-detail)/ready-to-join",
        params: {
          studentAnonId: booking.studentAnonId,
          sessionTitle: "Encrypted Video Consultation",
          timeRange: booking.timeRange,
        },
      });
    } else if (booking.modality === "in-person") {
      router.navigate({
        pathname: "/(counsellor-detail)/anonymous-session-details",
        params: {
          sessionId: booking.id,
          studentAnonId: booking.studentAnonId,
        },
      });
    } else {
      router.navigate({
        pathname: "/(counsellor-detail)/session-notes",
        params: {
          sessionId: booking.id,
          studentAnonId: booking.studentAnonId,
        },
      });
    }
  };

  const handleBlockSlot = (slotId: string) => {
    store.blockSlot(slotId);
    showToast("Slot blocked for administrative paperwork.");
  };

  // Month days setup: August 2026 starts Saturday Aug 1 (Row 1 has July 27-31 dimmed)
  const monthDays = useMemo(() => {
    const days: { day: number; isCurrentMonth: boolean; bookedTypes?: ("video" | "chat" | "in-person")[] }[] = [];

    // July 27-31
    for (let d = 27; d <= 31; d++) {
      days.push({ day: d, isCurrentMonth: false });
    }

    // August 1-31
    const bookedMap: Record<number, ("video" | "chat" | "in-person")[]> = {
      1: ["video"],
      3: ["video"],
      4: ["chat"],
      6: ["video", "video"],
      7: ["in-person"],
      10: ["video"],
      11: ["video", "in-person"],
      13: ["chat"],
      14: ["video"],
      18: ["video", "chat"],
      19: ["video", "chat", "in-person"],
      20: ["video"],
      21: ["video", "in-person"],
      24: ["video"],
      25: ["video", "chat"],
      27: ["in-person"],
      28: ["video"],
      31: ["video"],
    };

    for (let d = 1; d <= 31; d++) {
      days.push({
        day: d,
        isCurrentMonth: true,
        bookedTypes: bookedMap[d] || undefined,
      });
    }

    // Sept 1-6
    for (let d = 1; d <= 6; d++) {
      days.push({ day: d, isCurrentMonth: false });
    }

    return days;
  }, []);

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
          <Pressable
            onPress={handleJumpToToday}
            style={({ pressed }) => [styles.todayPill, pressed && styles.pressedState]}
            accessibilityRole="button"
            accessibilityLabel="Jump to Today"
          >
            <Text style={styles.todayPillText}>Today</Text>
          </Pressable>

          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: store.profile.avatarUrl }}
              style={styles.counselorAvatar}
              accessibilityLabel="Counselor profile"
            />
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
      >
        {activeRange === "day" && (
          <>
            {/* ─── Day Header Strip ─── */}
            <View style={styles.subHeaderRow}>
              <View style={styles.subHeaderLeft}>
                <Text style={styles.subHeaderTitle}>
                  {selectedDay === 19 ? "Tuesday, Aug 19" : `Day ${selectedDay}, Aug 2026`}
                </Text>
                <Text style={styles.dotDivider}>•</Text>
                <Text style={styles.bookingsCountText}>
                  {store.calendarBookings.filter((b) => !b.isOpenSlot).length} Bookings
                </Text>
              </View>
              <View style={styles.timezoneBadge}>
                <Text style={styles.timezoneText}>UTC-4</Text>
              </View>
            </View>

            {/* ─── Day Timeline Feed ─── */}
            <View style={styles.timelineFeed}>
              {store.calendarBookings.map((booking, idx) => {
                const isFeatured = booking.isJustAdded || booking.studentAnonId === "Student #5104";
                const isLast = idx === store.calendarBookings.length - 1;

                if (booking.isOpenSlot) {
                  return (
                    <View key={booking.id} style={styles.timelineRow}>
                      <View style={styles.timeAxisColumn}>
                        <Text style={styles.timeAxisText}>{booking.timeSlot}</Text>
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

                return (
                  <View key={booking.id} style={styles.timelineRow}>
                    <View style={styles.timeAxisColumn}>
                      <Text style={[styles.timeAxisText, isFeatured && styles.timeAxisTextFeatured]}>
                        {booking.timeSlot}
                      </Text>
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
                              booking.modality === "video"
                                ? styles.videoIconBox
                                : booking.modality === "chat"
                                ? styles.chatIconBox
                                : styles.inPersonIconBox,
                            ]}
                          >
                            <Ionicons
                              name={
                                booking.modality === "video"
                                  ? "videocam"
                                  : booking.modality === "chat"
                                  ? "chatbubble"
                                  : "person"
                              }
                              size={15}
                              color={booking.modality === "in-person" ? "#475569" : "#076047"}
                            />
                          </View>
                          <View style={styles.nameBlock}>
                            <Text style={styles.cardStudentName}>{booking.displayName}</Text>
                            <Text style={styles.cardSubInfo}>{booking.subInfo}</Text>
                          </View>
                        </View>

                        <View style={styles.timeRangeCapsule}>
                          <Text style={styles.timeRangeCapsuleText}>{booking.timeRange}</Text>
                        </View>
                      </View>

                      {/* Featured Chips Grid (Video & Security) */}
                      {isFeatured ? (
                        <>
                          <View style={styles.featuredChipsRow}>
                            <View style={styles.featuredTagBox}>
                              <Text style={styles.featuredTagCategory}>[VIDEO]</Text>
                              <View style={styles.featuredTagValRow}>
                                <Ionicons name="videocam-outline" size={13} color="#076047" />
                                <Text style={styles.featuredTagValText} numberOfLines={1}>
                                  Consultatio...
                                </Text>
                              </View>
                            </View>

                            <View style={styles.featuredTagBox}>
                              <Text style={styles.featuredTagCategory}>SECURITY</Text>
                              <View style={styles.featuredTagValRow}>
                                <Ionicons name="shield-checkmark-outline" size={13} color="#076047" />
                                <Text style={styles.featuredTagValText} numberOfLines={1}>
                                  E2E Encryp...
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Room ID and Enter Room CTA */}
                          <View style={styles.roomActionFooter}>
                            <View style={styles.roomIdGroup}>
                              <Ionicons name="link-outline" size={16} color="#64748B" />
                              <View>
                                <Text style={styles.roomIdCategory}>ROOM ID</Text>
                                <Text style={styles.roomIdText}>{booking.roomId || "mnd-5104-sec"}</Text>
                              </View>
                            </View>

                            <Pressable
                              onPress={() => handleEnterRoom(booking)}
                              accessibilityRole="button"
                              accessibilityLabel={`Enter video room for ${booking.studentAnonId}`}
                              style={({ pressed }) => [styles.enterRoomButton, pressed && styles.pressedState]}
                            >
                              <Text style={styles.enterRoomButtonText}>Enter Room</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : (
                        <View style={styles.standardCardFooter}>
                          <View style={styles.standardFooterLeft}>
                            <Text style={styles.standardCategoryTag}>
                              [{booking.modality === "chat" ? "CHAT" : "In-Person"}]
                            </Text>
                            <Text style={styles.standardCategoryValue}>
                              {booking.modalityLabel}
                            </Text>
                          </View>

                          <View style={styles.standardFooterRight}>
                            {booking.securityTag && (
                              <View style={styles.encryptedTagGroup}>
                                <Ionicons name="lock-closed-outline" size={13} color="#076047" />
                                <Text style={styles.encryptedTagText}>{booking.securityTag}</Text>
                              </View>
                            )}
                            {booking.statusText && (
                              <View style={styles.readyTagGroup}>
                                <Ionicons name="checkmark" size={14} color="#076047" />
                                <Text style={styles.readyTagText}>{booking.statusText}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ─── Month View ─── */}
        {activeRange === "month" && (
          <>
            {/* 1. Month Calendar Section */}
            <View style={styles.monthCard}>
              <View style={styles.monthHeaderRow}>
                <View style={styles.monthTitleLeft}>
                  <Text style={styles.monthHeading}>{selectedMonth}</Text>
                  <View style={styles.utcBadge}>
                    <Text style={styles.utcBadgeText}>UTC-4</Text>
                  </View>
                </View>

                <View style={styles.monthChevrons}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous month"
                    style={styles.monthNavChevron}
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-back" size={16} color="#64748B" />
                  </Pressable>
                  <Pressable
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

              {/* 31-Day Month Grid */}
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
                          ? `August ${item.day}, ${item.bookedTypes?.length || 0} sessions`
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
                <Text style={styles.monthScheduledCount}>18 Consultations scheduled</Text>
                <Text style={styles.monthCapacityText}>92% Slot capacity</Text>
              </View>
            </View>

            {/* 2. Selected Date Preview Card (Tappable to Day View) */}
            <Pressable
              onPress={() => setActiveRange("day")}
              accessibilityRole="button"
              accessibilityLabel={`Open day view for Tuesday, Aug ${selectedDay}`}
              style={({ pressed }) => [styles.previewCard, pressed && styles.pressedState]}
            >
              <View style={styles.previewHeaderRow}>
                <View style={styles.previewHeaderLeft}>
                  <Text style={styles.previewTitle}>Tuesday, Aug {selectedDay}</Text>
                  <View style={styles.previewDot} />
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>3 Bookings</Text>
                  </View>
                </View>

                <View style={styles.dayViewLinkGroup}>
                  <Text style={styles.dayViewLinkText}>Day View</Text>
                  <Ionicons name="chevron-forward" size={14} color="#076047" />
                </View>
              </View>

              {/* Micro Schedule Items */}
              <View style={styles.microItemsContainer}>
                {/* Item 1: Chat */}
                <View style={styles.microItemRow}>
                  <View style={styles.microItemLeft}>
                    <View style={styles.microHollowCircle} />
                    <Text style={styles.microTimeText}>09:00 - 09:30</Text>
                    <Text style={styles.microStudentText}>Student #4820</Text>
                  </View>
                  <Text style={styles.microModalityTag}>CHAT</Text>
                </View>

                {/* Item 2: Video (Mint Tinted) */}
                <View style={[styles.microItemRow, styles.microItemHighlighted]}>
                  <View style={styles.microItemLeft}>
                    <View style={styles.microSolidCircle} />
                    <Text style={[styles.microTimeText, styles.microTimeTextHighlighted]}>
                      10:00 - 10:45
                    </Text>
                    <Text style={[styles.microStudentText, styles.microStudentHighlighted]}>
                      Student #5104
                    </Text>
                  </View>
                  <Text style={styles.microModalityTagHighlighted}>VIDEO</Text>
                </View>

                {/* Item 3: In-Person */}
                <View style={styles.microItemRow}>
                  <View style={styles.microItemLeft}>
                    <View style={styles.microSquare} />
                    <Text style={styles.microTimeText}>11:30 - 12:15</Text>
                    <Text style={styles.microStudentText}>Student #3991</Text>
                  </View>
                  <Text style={styles.microModalityTag}>IN-PERSON</Text>
                </View>
              </View>
            </Pressable>
          </>
        )}

        {/* ─── Week View (Fallback / Transition) ─── */}
        {activeRange === "week" && (
          <View style={styles.weekPlaceholderCard}>
            <Text style={styles.weekPlaceholderTitle}>Week View: Aug 18 – Aug 24</Text>
            <Text style={styles.weekPlaceholderSub}>
              Switch to Day or Month view for high-fidelity schedule inspections.
            </Text>
            <Pressable
              onPress={() => setActiveRange("day")}
              style={styles.weekSwitchToDayBtn}
            >
              <Text style={styles.weekSwitchToDayBtnText}>Open Day View</Text>
            </Pressable>
          </View>
        )}

        {/* ─── Modality Legend Strip (Present on both Day & Month) ─── */}
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
        <View style={styles.syncStatusFooter}>
          <View style={styles.syncStatusLeft}>
            <View style={styles.syncGreenCheckCircle}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
            <Text style={styles.syncStatusText}>Synced with Apple & Google Calendar</Text>
          </View>

          <View style={styles.syncStatusRight}>
            <Ionicons name="refresh" size={13} color="#94A3B8" />
            <Text style={styles.syncTimeText}>Just now</Text>
          </View>
        </View>
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
    gap: 10,
  },
  todayPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    minHeight: 34,
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
    width: 38,
    height: 38,
  },
  counselorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
  },
  subHeaderTitle: {
    fontSize: 20,
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
    width: 64,
    paddingTop: 10,
    alignItems: "flex-end",
    position: "relative",
  },
  timeAxisText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: -0.2,
  },
  timeAxisTextFeatured: {
    color: "#0F172A",
    fontWeight: "700",
  },
  solidTimelineLine: {
    position: "absolute",
    right: -5,
    top: 32,
    bottom: -24,
    width: 2,
    backgroundColor: "#0F172A",
  },
  dashedTimelineLine: {
    position: "absolute",
    right: -5,
    top: 32,
    bottom: 0,
    width: 2,
    borderRightWidth: 2,
    borderRightColor: "#94A3B8",
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
    paddingTop: spacing.lg,
  },
  justAddedBadge: {
    position: "absolute",
    top: -11,
    right: 14,
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
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  modalityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
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
  enterRoomButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
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
    justifyContent: "space-around",
    marginBottom: 6,
  },
  weekLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
    width: 38,
  },
  monthDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  dayCell: {
    width: 44,
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
  weekPlaceholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: spacing.md,
  },
  weekPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  weekPlaceholderSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
  },
  weekSwitchToDayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#065F46",
  },
  weekSwitchToDayBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
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
    color: "#64748B",
  },
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
