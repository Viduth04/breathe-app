import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { createBooking } from "@/services/bookingService";
import { SessionType } from "@/types/booking";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { ScrollView, StyleSheet, Text, View, Pressable, Switch, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";

export default function BookSessionScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { profile } = useAuth();
  
  const [counsellor, setCounsellor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<"confirm" | "success">("confirm");
  const [newBookingId, setNewBookingId] = useState<string | null>(null);
  
    const [selectedDay, setSelectedDay] = useState("15");
  const [selectedSlot, setSelectedSlot] = useState<string>("10:00 AM");
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>("video");
  const [bookingLoading, setBookingLoading] = useState(false);
  
  useEffect(() => {
    if (uid) {
      getDoc(doc(db, "counsellors", uid)).then(snap => {
        if (snap.exists()) {
          setCounsellor({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [uid]);

  const handleBook = async () => {
    if (!profile || !counsellor) return;
    setBookingLoading(true);
    try {
      const now = new Date();
      const day = parseInt(selectedDay) || now.getDate();
      let hour = 10;
      let min = 0;
      if (selectedSlot) {
        const parts = selectedSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (parts) {
          hour = parseInt(parts[1], 10);
          min = parseInt(parts[2], 10);
          const ampm = parts[3].toUpperCase();
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
        }
      }
      const startAt = new Date(now.getFullYear(), now.getMonth(), day, hour, min);
      if (startAt.getTime() <= now.getTime()) {
        // If the selected day/time is in the past for this month, bump it to next month
        startAt.setMonth(startAt.getMonth() + 1);
      }
      const endAt = new Date(startAt.getTime() + 45 * 60000);

      const createdId = await createBooking(
        profile,
        {
          counsellorId: counsellor.id,
          startAt,
          endAt,
          sessionType: selectedSessionType,
          isAnonymous
        }
      );
      setNewBookingId(createdId);
      setModalStep('success');
    } catch (e) {
      console.error(e);
      alert('Failed to book session');
    } finally {
      setBookingLoading(false);
    }
  };

  // Helper for calendar days
  const renderDay = (day: string, state: "empty" | "available" | "selected" | "unavailable") => {
    let boxStyle: any = styles.dayBox;
    let textStyle: any = styles.dayText;

    let actualState = state;
    if (state === "available" && day === selectedDay) {
      actualState = "selected";
    } else if (state === "selected" && day !== selectedDay) {
      actualState = "available";
    }

    if (actualState === "available") {
      boxStyle = [styles.dayBox, styles.dayAvailable];
    } else if (actualState === "selected") {
      boxStyle = [styles.dayBox, styles.daySelected];
      textStyle = [styles.dayText, styles.dayTextSelected];
    } else if (actualState === "unavailable") {
      boxStyle = [styles.dayBox, styles.dayUnavailable];
      textStyle = [styles.dayText, styles.dayTextUnavailable];
    } else if (actualState === "empty") {
      textStyle = [styles.dayText, styles.dayTextEmpty];
    }

    return (
      <View key={day + actualState} style={styles.dayWrapper}>
        <Pressable style={boxStyle} onPress={() => { if (actualState === 'available' || actualState === 'selected') setSelectedDay(day); }}>
          <Text style={textStyle}>{day}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.push("/(student)/session/dashboard"); } }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Counselor Booking</Text>
        <View style={styles.headerRightIcon}>
          <Ionicons name="person-outline" size={20} color="#FFF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Info Card */}
        <Card style={styles.topInfoCard}>
          <View style={styles.doctorInfoLeft}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=5" }}
              style={styles.smallAvatar}
            />
            <View>
              <Text style={styles.doctorName}>{counsellor?.fullName || "Dr. Anjali Perera"}</Text>
              <View style={styles.doctorSubtitleRow}>
                <View style={styles.subtitleDot} />
                <Text style={styles.doctorSubtitle}>Clinical Psychologist</Text>
              </View>
            </View>
          </View>
          
        </Card>

        {/* Calendar Card */}
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.monthTitle}>August 2026</Text>
              <Text style={styles.monthSubtitle}>Select your consultation day</Text>
            </View>
            <View style={styles.monthNav}>
              <Pressable style={styles.navBtn}>
                <Ionicons name="chevron-back" size={16} color={colors.text} />
              </Pressable>
              <Pressable style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Days of week */}
          <View style={styles.weekDaysRow}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <Text key={i} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {/* Row 1 */}
                  {renderDay("27", "empty")}
                  {renderDay("28", "empty")}
                  {renderDay("29", "empty")}
                  {renderDay("30", "empty")}
                  {renderDay("01", "unavailable")}
                  {renderDay("02", "unavailable")}
                  {renderDay("03", "unavailable")}
                  {/* Row 2 */}
                  {renderDay("04", "unavailable")}
                  {renderDay("05", "unavailable")}
                  {renderDay("06", "unavailable")}
                  {renderDay("07", "unavailable")}
                  {renderDay("08", "unavailable")}
                  {renderDay("09", "unavailable")}
                  {renderDay("10", "unavailable")}
                  {/* Row 3 */}
                  {renderDay("11", "unavailable")}
                  {renderDay("12", "unavailable")}
                  {renderDay("13", "unavailable")}
                  {renderDay("14", "unavailable")}
                  {renderDay("15", "available")}
                  {renderDay("16", "unavailable")}
                  {renderDay("17", "unavailable")}
                  {/* Row 4 */}
                  {renderDay("18", "available")}
                  {renderDay("19", "unavailable")}
                  {renderDay("20", "unavailable")}
                  {renderDay("21", "unavailable")}
                  {renderDay("22", "available")}
                  {renderDay("23", "unavailable")}
                  {renderDay("24", "unavailable")}
                </View>

          
        </Card>

        {/* Available Times */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Available Times for Aug {selectedDay}</Text>
          <View style={styles.timezoneBadge}>
            <Text style={styles.timezoneText}>GMT+5:30</Text>
          </View>
        </View>
        <View style={styles.timesGrid}>
          {["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"].map((slot) => (
            <Pressable 
              key={slot} 
              style={[styles.timePill, selectedSlot === slot && styles.timePillActive]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.timeText, selectedSlot === slot && styles.timeTextActive]}>{slot}</Text>
            </Pressable>
          ))}
        </View>

        {/* Session Type */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          <Text style={styles.durationText}>50 mins</Text>
        </View>
        <View style={styles.sessionTypeGrid}>
          
          {/* Video Call */}
          <Pressable 
            style={[styles.typeCard, selectedSessionType === "video" && styles.typeCardActive]} 
            onPress={() => setSelectedSessionType("video")}
          >
            <View style={[styles.typeIconBox, selectedSessionType === "video" && styles.typeIconBoxActive]}>
              <Ionicons name="videocam" size={18} color={selectedSessionType === "video" ? "#FFF" : colors.primary} />
            </View>
            <View style={styles.typeRadio}>
              <View style={[styles.radioOuter, selectedSessionType === "video" && styles.radioOuterActive]}>
                {selectedSessionType === "video" && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.typeTitle}>Video Call</Text>
            <Text style={[styles.typeSub, selectedSessionType === "video" && { color: colors.primary }]}>Encrypted HD Link</Text>
          </Pressable>

          {/* Live Chat */}
          <Pressable 
            style={[styles.typeCard, selectedSessionType === "chat" && styles.typeCardActive]} 
            onPress={() => setSelectedSessionType("chat")}
          >
            <View style={[styles.typeIconBox, selectedSessionType === "chat" && styles.typeIconBoxActive]}>
              <Ionicons name="chatbubbles" size={18} color={selectedSessionType === "chat" ? "#FFF" : colors.primary} />
            </View>
            <View style={styles.typeRadio}>
              <View style={[styles.radioOuter, selectedSessionType === "chat" && styles.radioOuterActive]}>
                {selectedSessionType === "chat" && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.typeTitle}>Live Chat</Text>
            <Text style={[styles.typeSub, selectedSessionType === "chat" && { color: colors.primary }]}>Real-time text</Text>
          </Pressable>

        </View>

        {/* Book Anonymously */}
        <Card style={styles.anonymousCard}>
          <View style={styles.anonIconBox}>
            <Ionicons name="eye-off-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.anonTextContainer}>
            <Text style={styles.anonTitle}>Book Anonymously</Text>
            <Text style={styles.anonSub}>Your name will be hidden until the session starts</Text>
          </View>
          <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ true: colors.primary }} />
        </Card>

      </ScrollView>

      {/* Floating Bottom Button */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.continueBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </Pressable>
      </View>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setModalStep("confirm");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {modalStep === "confirm" ? (
              <>
                <View style={styles.modalIconBox}>
                  <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                </View>
                
                <Text style={styles.modalTitle}>Confirm Booking?</Text>
                <Text style={styles.modalSub}>
                  Please review your appointment details before confirming with {counsellor?.fullName || "your counselor"}.
                </Text>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Counselor</Text>
                    <Text style={styles.modalDetailValueGreen}>{counsellor?.fullName || "Dr. Anjali Perera"}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date & Time</Text>
                    <Text style={styles.modalDetailValueDark}>Mon, {selectedDay || "15"} Oct 2026 • {selectedSlot || "10:00 AM"}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Session Type</Text>
                    <View style={styles.modalDetailIconRow}>
                      <Ionicons name={selectedSessionType === 'chat' ? 'chatbubbles' : selectedSessionType === 'in-person' ? 'business' : 'videocam'} size={14} color={colors.primary} />
                        <Text style={styles.modalDetailValueGreen}>
                          {selectedSessionType === 'chat' ? 'Live Chat' : selectedSessionType === 'in-person' ? 'In-Person' : 'Video Call'}
                        </Text>
                    </View>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Mode</Text>
                      <View style={styles.modalDetailIconRow}>
                        <View style={[styles.modalDetailDot, !isAnonymous && { backgroundColor: colors.textSecondary }]} />
                        <Text style={[styles.modalDetailValueGreen, !isAnonymous && { color: colors.textSecondary }]}>
                          {isAnonymous ? "Anonymous Booking" : "Standard Booking"}
                        </Text>
                      </View>
                    </View>
                </View>

                <Text style={styles.modalFooterText}>Free cancellation up to 2 hours before session</Text>

                <Pressable 
                  style={styles.modalConfirmBtn} 
                  onPress={handleBook}
                >
                  {bookingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Confirm & Book Session</Text>}
                </Pressable>

                <Pressable 
                  style={styles.modalCancelBtn} 
                  onPress={() => {
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Review / Go Back</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.modalIconBoxSuccess}>
                  <Ionicons name="checkmark" size={32} color="#FFF" />
                </View>
                
                <Text style={styles.modalTitle}>Booking Confirmed!</Text>
                <Text style={styles.modalSub}>
                  Your appointment has been successfully scheduled. A confirmation email and calendar invite have been sent.
                </Text>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Counselor</Text>
                    <Text style={styles.modalDetailValueGreen}>{counsellor?.fullName || "Dr. Anjali Perera"}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date & Time</Text>
                    <Text style={styles.modalDetailValueDark}>Mon, {selectedDay || "15"} Oct 2026 • {selectedSlot || "10:00 AM"}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Session Type</Text>
                    <View style={styles.modalDetailIconRow}>
                      <Ionicons name={selectedSessionType === 'chat' ? 'chatbubbles' : selectedSessionType === 'in-person' ? 'business' : 'videocam'} size={14} color={colors.primary} />
                        <Text style={styles.modalDetailValueGreen}>
                          {selectedSessionType === 'chat' ? 'Live Chat' : selectedSessionType === 'in-person' ? 'In-Person' : 'Video Call'}
                        </Text>
                    </View>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Booking ID</Text>
                    <Text style={styles.modalDetailValueGreen}>{newBookingId ? `#${newBookingId.substring(0, 5).toUpperCase()}` : "..."}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Status</Text>
                    <View style={styles.modalStatusPill}>
                      <View style={styles.modalDetailDot} />
                      <Text style={styles.modalStatusText}>Confirmed</Text>
                    </View>
                  </View>
                </View>

                <Pressable 
                  style={styles.modalConfirmBtn} 
                  onPress={() => {
                    setModalVisible(false);
                    setModalStep("confirm");
                    router.replace({ pathname: "/(student)/session/details", params: { id: newBookingId } });
                  }}
                >
                  <Text style={styles.modalConfirmText}>View Session Details</Text>
                </Pressable>

                <Pressable 
                  style={styles.modalSecondaryBtn} 
                  onPress={() => {
                    setModalVisible(false);
                    setModalStep("confirm");
                    router.push("/(student)/home");
                  }}
                >
                  <Text style={styles.modalSecondaryBtnText}>Done / Return to Home</Text>
                </Pressable>
              </>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    // Keeps the right-hand icon clear of the floating crisis help button
    paddingRight: FLOATING_HELP_CLEARANCE,
    paddingVertical: spacing.sm,
    backgroundColor: "#F8F7F3",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  headerRightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  topInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  doctorInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  smallAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  doctorSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subtitleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  doctorSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  stepBadge: {
    backgroundColor: "#E5F8E4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  stepText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  calendarCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  monthSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monthNav: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F0E6",
    alignItems: "center",
    justifyContent: "center",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  weekDayText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  dayWrapper: {
    width: `${100 / 7}%`,
    alignItems: "center",
  },
  dayBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayAvailable: {
    backgroundColor: "#F3F0E6",
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayUnavailable: {
    backgroundColor: "#F3F3F3",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  dayTextEmpty: {
    color: "#E0E0E0",
  },
  dayTextSelected: {
    color: "#FFF",
  },
  dayTextUnavailable: {
    color: "#B4B4B4",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  timezoneBadge: {
    backgroundColor: "#F3F0E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  timezoneText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: spacing.lg,
  },
  timePill: {
    width: "31%",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  timePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  timeTextActive: {
    color: "#FFF",
  },
  durationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sessionTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: spacing.lg,
  },
  typeCard: {
    width: "48%",
    backgroundColor: "#FFF",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeCardActive: {
    backgroundColor: "#E5F8E4",
    borderColor: "#E5F8E4",
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  typeIconBoxActive: {
    backgroundColor: colors.primary,
  },
  typeRadio: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  typeSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  anonymousCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  anonIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  anonTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  anonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  anonSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: "#F8F7F3",
    paddingBottom: spacing.xl,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  modalSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  modalDetailsBox: {
    width: "100%",
    backgroundColor: "#FFF9EE",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalDetailValueGreen: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  modalDetailValueDark: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  modalDetailIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  modalFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalConfirmBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalIconBoxSuccess: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F8E4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  modalSecondaryBtn: {
    width: "100%",
    backgroundColor: "#F0FAF2",
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 75, 59, 0.1)",
  },
  modalSecondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
});
