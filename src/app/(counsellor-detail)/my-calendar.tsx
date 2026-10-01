// Counsellor My Calendar Screen - Muaath (Member 4). Supports FR01, FR08.
// Interactive clinical calendar view (Day/Week/Month) with timeline feed, room entry, and slot blocking.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore, CalendarBooking } from "@/services/counsellorStore";

type RangeView = "day" | "week" | "month";

export default function MyCalendarScreen() {
  const params = useLocalSearchParams<{ highlightId?: string }>();
  const { calendarBookings, blockSlot } = useCounsellorStore();

  const [activeRange, setActiveRange] = useState<RangeView>("week");
  const [selectedDay, setSelectedDay] = useState(19); // 19 = Tue Aug 19 default
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenSession = (booking: CalendarBooking) => {
    if (booking.isOpenSlot) {
      handleBlockSlot(booking.id);
      return;
    }
    // Navigate to confirmed session detail view
    router.navigate("/(counsellor-detail)/confirmed-session");
  };

  const handleEnterRoom = (booking: CalendarBooking) => {
    Alert.alert(
      "Enter Clinical Room",
      `Launching E2E encrypted room for ${booking.studentAnonId} (Room ID: ${booking.roomId || "mnd-5104-sec"}). Video and audio hardware checks passed.`
    );
  };

  const handleBlockSlot = (slotId: string) => {
    blockSlot(slotId);
    showToast("Open slot blocked out for administrative clinical paperwork.");
  };

  const handleOpenSettings = () => {
    router.navigate("/(counsellor-detail)/settings");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      {/* ─── Top Navigation Bar ─── */}
      <View style={styles.topNav}>
        <View style={styles.navLeftGroup}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButtonCircle}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </Pressable>
          <Text style={styles.navTitle}>My Calendar</Text>
        </View>

        <View style={styles.navRightGroup}>
          <Pressable
            onPress={() => {
              setSelectedDay(19);
              showToast("Jumped to Today (Tue Aug 19)");
            }}
            style={styles.todayPill}
            accessibilityRole="button"
            accessibilityLabel="Jump to Today"
          >
            <Text style={styles.todayPillText}>Today</Text>
          </Pressable>

          <Pressable
            onPress={handleOpenSettings}
            style={styles.profileAvatarButton}
            accessibilityRole="button"
            accessibilityLabel="Counselor Settings"
          >
            <Ionicons name="person" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toast Feedback */}
        {toastMessage && (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#065F46" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* ─── View Switcher Segmented Control ─── */}
        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveRange("day")}
            style={[styles.switcherTab, activeRange === "day" && styles.switcherTabActive]}
          >
            <Text style={[styles.switcherTabText, activeRange === "day" && styles.switcherTabTextActive]}>
              Day
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveRange("week")}
            style={[styles.switcherTab, activeRange === "week" && styles.switcherTabActive]}
          >
            <Text style={[styles.switcherTabText, activeRange === "week" && styles.switcherTabTextActive]}>
              Week
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveRange("month")}
            style={[styles.switcherTab, activeRange === "month" && styles.switcherTabActive]}
          >
            <Text style={[styles.switcherTabText, activeRange === "month" && styles.switcherTabTextActive]}>
              Month
            </Text>
          </Pressable>
        </View>

        {/* ─── Horizontal Weekly Date Strip ─── */}
        <View style={styles.weeklyDateStrip}>
          {[
            { day: "Mon", date: 18, dots: 1 },
            { day: "Tue", date: 19, dots: 3 },
            { day: "Wed", date: 20, dots: 2 },
            { day: "Thu", date: 21, dots: 1 },
            { day: "Fri", date: 22, dots: 2 },
            { day: "Sat", date: 23, dots: 0 },
            { day: "Sun", date: 24, dots: 0 },
          ].map((item) => {
            const isSelected = selectedDay === item.date;
            return (
              <Pressable
                key={item.date}
                onPress={() => setSelectedDay(item.date)}
                style={[styles.dayCard, isSelected && styles.dayCardActive]}
                accessibilityRole="button"
                accessibilityLabel={`${item.day} ${item.date}`}
              >
                <Text style={[styles.dayNameText, isSelected && styles.dayNameTextActive]}>
                  {item.day}
                </Text>
                <Text style={[styles.dayNumberText, isSelected && styles.dayNumberTextActive]}>
                  {item.date}
                </Text>
                <View style={styles.dotsRow}>
                  {Array.from({ length: item.dots }).map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dayDot, isSelected && styles.dayDotActive]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Section Subheader: Date & Timezone ─── */}
        <View style={styles.subHeaderRow}>
          <View style={styles.subHeaderLeft}>
            <Text style={styles.subHeaderDate}>Tuesday, Aug {selectedDay}</Text>
            <Text style={styles.subHeaderDot}>•</Text>
            <Text style={styles.subHeaderCount}>
              {calendarBookings.filter((b) => !b.isOpenSlot).length} Bookings
            </Text>
          </View>
          <View style={styles.timezoneBadge}>
            <Text style={styles.timezoneBadgeText}>UTC-4</Text>
          </View>
        </View>

        {/* ─── Schedule Timeline Feed ─── */}
        <View style={styles.timelineFeed}>
          {calendarBookings.map((booking) => {
            const isHighlight =
              params.highlightId === booking.roomId || booking.isJustAdded;

            if (booking.isOpenSlot) {
              return (
                <View key={booking.id} style={styles.timelineRow}>
                  <View style={styles.timelineAxis}>
                    <Text style={styles.timeAxisLabel}>{booking.timeSlot}</Text>
                    <View style={styles.dashedTimelineLine} />
                  </View>

                  <View style={styles.openSlotCard}>
                    <View style={styles.openSlotLeft}>
                      <View style={styles.openSlotIconBox}>
                        <Ionicons name="time-outline" size={18} color="#64748B" />
                      </View>
                      <Text style={styles.openSlotTitle}>
                        {booking.isBlocked ? "Blocked Out (Paperwork)" : "Open Consultation Slot"}
                      </Text>
                    </View>

                    {!booking.isBlocked && (
                      <Pressable
                        onPress={() => handleBlockSlot(booking.id)}
                        style={styles.blockOutBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Block Out open slot"
                      >
                        <Text style={styles.blockOutBtnText}>+ Block Out</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }

            return (
              <View key={booking.id} style={styles.timelineRow}>
                {/* Time Axis Column */}
                <View style={styles.timelineAxis}>
                  <Text style={[styles.timeAxisLabel, isHighlight && styles.timeAxisLabelBold]}>
                    {booking.timeSlot}
                  </Text>
                  <View style={styles.solidTimelineLine} />
                </View>

                {/* Schedule Card */}
                <Pressable
                  onPress={() => handleOpenSession(booking)}
                  style={[
                    styles.bookingCard,
                    isHighlight && styles.bookingCardFeatured,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Session for ${booking.studentAnonId}`}
                >
                  {/* Just Added Pulse Badge */}
                  {isHighlight && (
                    <View style={styles.justAddedBadge}>
                      <View style={styles.pulseGreenDot} />
                      <Text style={styles.justAddedBadgeText}>JUST ADDED</Text>
                    </View>
                  )}

                  {/* Header Row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.studentIdentRow}>
                      <View
                        style={[
                          styles.modalityIconBox,
                          booking.modality === "video" && styles.videoIconBg,
                        ]}
                      >
                        <Ionicons
                          name={
                            booking.modality === "video"
                              ? "videocam-outline"
                              : booking.modality === "chat"
                              ? "chatbubble-outline"
                              : "person-outline"
                          }
                          size={16}
                          color={booking.modality === "video" ? "#065F46" : "#475569"}
                        />
                      </View>

                      <View>
                        <Text style={styles.bookingStudentName}>{booking.studentAnonId}</Text>
                        <Text style={styles.bookingSubInfo}>{booking.subInfo}</Text>
                      </View>
                    </View>

                    <View style={styles.timeCapsule}>
                      <Text style={styles.timeCapsuleText}>{booking.timeRange}</Text>
                    </View>
                  </View>

                  {/* Modality Chips (If Featured) */}
                  {isHighlight ? (
                    <View style={styles.featuredChipsRow}>
                      <View style={styles.featuredChip}>
                        <Text style={styles.featuredChipCaption}>[VIDEO]</Text>
                        <View style={styles.featuredChipValRow}>
                          <Ionicons name="videocam" size={13} color="#065F46" />
                          <Text style={styles.featuredChipValText}>Consultation (45m)</Text>
                        </View>
                      </View>

                      <View style={styles.featuredChip}>
                        <Text style={styles.featuredChipCaption}>SECURITY</Text>
                        <View style={styles.featuredChipValRow}>
                          <Ionicons name="shield-checkmark" size={13} color="#065F46" />
                          <Text style={styles.featuredChipValText}>E2E Encrypted</Text>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {/* Room Details & Enter Action Button */}
                  {isHighlight ? (
                    <View style={styles.featuredBottomRow}>
                      <View style={styles.roomIdGroup}>
                        <Ionicons name="link-outline" size={15} color="#94A3B8" />
                        <View>
                          <Text style={styles.roomIdCaption}>ROOM ID</Text>
                          <Text style={styles.roomIdValue}>{booking.roomId || "mnd-5104-sec"}</Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleEnterRoom(booking)}
                        style={styles.enterRoomBlackBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Enter Room"
                      >
                        <Text style={styles.enterRoomBlackBtnText}>Enter Room</Text>
                      </Pressable>
                    </View>
                  ) : (
                    /* Standard Card Footer */
                    <View style={styles.standardCardFooter}>
                      <View style={styles.footerModalityTag}>
                        <Text style={styles.footerTagCaption}>
                          [{booking.modality === "chat" ? "CHAT" : "In-Person"}]
                        </Text>
                        <Text style={styles.footerTagValue}>
                          {booking.modalityLabel}
                        </Text>
                      </View>

                      <View style={styles.footerStatusBadge}>
                        <Ionicons
                          name={booking.modality === "chat" ? "lock-closed" : "checkmark"}
                          size={13}
                          color="#065F46"
                        />
                        <Text style={styles.footerStatusText}>
                          {booking.statusText || "Encrypted"}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* ─── Modality Legend Strip ─── */}
        <View style={styles.legendStrip}>
          <View style={styles.legendItem}>
            <View style={styles.legendCircleFilled} />
            <Text style={styles.legendText}>[Video]</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <View style={styles.legendCircleOutline} />
            <Text style={styles.legendText}>[Chat]</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <View style={styles.legendSquareFilled} />
            <Text style={styles.legendText}>[In-Person]</Text>
          </View>
        </View>

        {/* ─── Bottom System Status Bar ─── */}
        <View style={styles.systemStatusBar}>
          <View style={styles.statusLeft}>
            <View style={styles.checkCircleSmall}>
              <Ionicons name="checkmark" size={11} color={colors.white} />
            </View>
            <Text style={styles.statusTextPrimary}>Synced with Apple & Google Calendar</Text>
          </View>
          <View style={styles.statusRight}>
            <Ionicons name="sync-outline" size={12} color="#94A3B8" />
            <Text style={styles.statusTextSecondary}>Just now</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FAF7F0",
  },
  navLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  navRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todayPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  profileAvatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  toastText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
  },
  viewSwitcher: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  switcherTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
  },
  switcherTabActive: {
    backgroundColor: "#065F46",
  },
  switcherTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  switcherTabTextActive: {
    color: colors.white,
    fontWeight: "800",
  },
  weeklyDateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dayCard: {
    width: 44,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayCardActive: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
    transform: [{ scale: 1.04 }],
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  dayNameTextActive: {
    color: "#A7F3D0",
  },
  dayNumberText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 2,
  },
  dayNumberTextActive: {
    color: colors.white,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#94A3B8",
  },
  dayDotActive: {
    backgroundColor: colors.white,
  },
  subHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  subHeaderLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  subHeaderDate: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subHeaderDot: {
    color: "#94A3B8",
    fontSize: 14,
  },
  subHeaderCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  timezoneBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timezoneBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
  },
  timelineFeed: {
    gap: 14,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timelineAxis: {
    width: 64,
    alignItems: "flex-end",
    paddingTop: 8,
    position: "relative",
  },
  timeAxisLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  timeAxisLabelBold: {
    fontWeight: "800",
    color: "#0F172A",
  },
  solidTimelineLine: {
    position: "absolute",
    right: 0,
    top: 26,
    bottom: -16,
    width: 2,
    backgroundColor: "#0F172A",
  },
  dashedTimelineLine: {
    position: "absolute",
    right: 0,
    top: 26,
    bottom: -16,
    width: 2,
    borderRightWidth: 2,
    borderColor: "#94A3B8",
    borderStyle: "dashed",
  },
  bookingCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bookingCardFeatured: {
    borderWidth: 2,
    borderColor: "#0F172A",
    shadowOpacity: 0.1,
    paddingTop: 18,
    position: "relative",
  },
  justAddedBadge: {
    position: "absolute",
    top: -12,
    right: 14,
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pulseGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  justAddedBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.6,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  studentIdentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  modalityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIconBg: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  bookingStudentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  bookingSubInfo: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  timeCapsule: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeCapsuleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  featuredChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  featuredChip: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 8,
  },
  featuredChipCaption: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  featuredChipValRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  featuredChipValText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
  },
  featuredBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    marginTop: 12,
  },
  roomIdGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomIdCaption: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
  },
  roomIdValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "monospace",
  },
  enterRoomBlackBtn: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  enterRoomBlackBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
  },
  standardCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 10,
  },
  footerModalityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerTagCaption: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  footerTagValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
  },
  footerStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
  },
  openSlotCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  openSlotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  openSlotIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  openSlotTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  blockOutBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  blockOutBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  legendStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendCircleFilled: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F172A",
  },
  legendCircleOutline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#0F172A",
  },
  legendSquareFilled: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: "#1E293B",
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  legendDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#E2E8F0",
  },
  systemStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
  },
  statusTextPrimary: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusTextSecondary: {
    fontSize: 10,
    color: "#64748B",
  },
});
