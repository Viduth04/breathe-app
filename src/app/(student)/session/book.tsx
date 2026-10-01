import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Switch, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";

export default function BookSessionScreen() {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<"confirm" | "success">("confirm");

  // Helper for calendar days
  const renderDay = (day: string, state: "empty" | "available" | "selected" | "unavailable") => {
    let boxStyle: any = styles.dayBox;
    let textStyle: any = styles.dayText;

    if (state === "available") {
      boxStyle = [styles.dayBox, styles.dayAvailable];
    } else if (state === "selected") {
      boxStyle = [styles.dayBox, styles.daySelected];
      textStyle = [styles.dayText, styles.dayTextSelected];
    } else if (state === "unavailable") {
      boxStyle = [styles.dayBox, styles.dayUnavailable];
      textStyle = [styles.dayText, styles.dayTextUnavailable];
    } else if (state === "empty") {
      textStyle = [styles.dayText, styles.dayTextEmpty];
    }

    return (
      <View key={day + state} style={styles.dayWrapper}>
        <View style={boxStyle}>
          <Text style={textStyle}>{day}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
              <Text style={styles.doctorName}>Dr. Anjali Perera</Text>
              <View style={styles.doctorSubtitleRow}>
                <View style={styles.subtitleDot} />
                <Text style={styles.doctorSubtitle}>Clinical Psychologist</Text>
              </View>
            </View>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>STEP 1 OF 3</Text>
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
            {renderDay("01", "available")}
            {renderDay("02", "available")}
            {renderDay("03", "unavailable")}

            {/* Row 2 */}
            {renderDay("04", "available")}
            {renderDay("05", "available")}
            {renderDay("06", "available")}
            {renderDay("07", "available")}
            {renderDay("08", "available")}
            {renderDay("09", "available")}
            {renderDay("10", "unavailable")}

            {/* Row 3 */}
            {renderDay("11", "available")}
            {renderDay("12", "available")}
            {renderDay("13", "available")}
            {renderDay("14", "available")}
            {renderDay("15", "selected")}
            {renderDay("16", "available")}
            {renderDay("17", "unavailable")}

            {/* Row 4 */}
            {renderDay("18", "available")}
            {renderDay("19", "available")}
            {renderDay("20", "available")}
            {renderDay("21", "available")}
            {renderDay("22", "available")}
            {renderDay("23", "available")}
            {renderDay("24", "unavailable")}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#F3F0E6" }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#F3F3F3" }]} />
              <Text style={styles.legendText}>Unavailable</Text>
            </View>
          </View>
        </Card>

        {/* Available Times */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Available Times for Mon, 15 Aug</Text>
          <View style={styles.timezoneBadge}>
            <Text style={styles.timezoneText}>GMT+5:30</Text>
          </View>
        </View>
        <View style={styles.timesGrid}>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>09:00 AM</Text>
          </View>
          <View style={[styles.timePill, styles.timePillActive]}>
            <Text style={[styles.timeText, styles.timeTextActive]}>10:00 AM</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>11:00 AM</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>02:00 PM</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>03:00 PM</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>04:00 PM</Text>
          </View>
        </View>

        {/* Session Type */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          <Text style={styles.durationText}>50 mins</Text>
        </View>
        <View style={styles.sessionTypeGrid}>
          
          {/* In-Person */}
          <View style={styles.typeCard}>
            <View style={styles.typeIconBox}>
              <Ionicons name="business-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.typeRadio}>
              <View style={styles.radioOuter} />
            </View>
            <Text style={styles.typeTitle}>In-Person</Text>
            <Text style={styles.typeSub}>Colombo Clinic</Text>
          </View>

          {/* Video Call */}
          <View style={[styles.typeCard, styles.typeCardActive]}>
            <View style={[styles.typeIconBox, styles.typeIconBoxActive]}>
              <Ionicons name="videocam" size={18} color="#FFF" />
            </View>
            <View style={styles.typeRadio}>
              <View style={[styles.radioOuter, styles.radioOuterActive]}>
                <View style={styles.radioInner} />
              </View>
            </View>
            <Text style={styles.typeTitle}>Video Call</Text>
            <Text style={[styles.typeSub, { color: colors.primary }]}>Encrypted HD Link</Text>
          </View>

          {/* Phone Call */}
          <View style={styles.typeCard}>
            <View style={styles.typeIconBox}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.typeRadio}>
              <View style={styles.radioOuter} />
            </View>
            <Text style={styles.typeTitle}>Phone Call</Text>
            <Text style={styles.typeSub}>Voice consultation</Text>
          </View>

          {/* Live Chat */}
          <View style={styles.typeCard}>
            <View style={styles.typeIconBox}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.typeRadio}>
              <View style={styles.radioOuter} />
            </View>
            <Text style={styles.typeTitle}>Live Chat</Text>
            <Text style={styles.typeSub}>Real-time text</Text>
          </View>

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
                  Please review your appointment details before confirming with Dr. Anjali Perera.
                </Text>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Counselor</Text>
                    <Text style={styles.modalDetailValueGreen}>Dr. Anjali Perera</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date & Time</Text>
                    <Text style={styles.modalDetailValueDark}>Mon, 15 Aug 2026 • 10:00 AM</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Session Type</Text>
                    <View style={styles.modalDetailIconRow}>
                      <Ionicons name="videocam" size={14} color={colors.primary} />
                      <Text style={styles.modalDetailValueGreen}>Video Call</Text>
                    </View>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Mode</Text>
                    <View style={styles.modalDetailIconRow}>
                      <View style={styles.modalDetailDot} />
                      <Text style={styles.modalDetailValueGreen}>Anonymous Booking</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.modalFooterText}>Free cancellation up to 2 hours before session</Text>

                <Pressable 
                  style={styles.modalConfirmBtn} 
                  onPress={() => setModalStep("success")}
                >
                  <Text style={styles.modalConfirmText}>Confirm & Book Session</Text>
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
                    <Text style={styles.modalDetailValueGreen}>Dr. Anjali Perera</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date & Time</Text>
                    <Text style={styles.modalDetailValueDark}>Mon, 15 Aug 2026 • 10:00 AM</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Session Type</Text>
                    <View style={styles.modalDetailIconRow}>
                      <Ionicons name="videocam" size={14} color={colors.primary} />
                      <Text style={styles.modalDetailValueGreen}>Video Call</Text>
                    </View>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Booking ID</Text>
                    <Text style={styles.modalDetailValueGreen}>#ME-8041</Text>
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
                    router.replace("/(student)/session/details");
                  }}
                >
                  <Text style={styles.modalConfirmText}>View Session Details</Text>
                </Pressable>

                <Pressable 
                  style={styles.modalSecondaryBtn} 
                  onPress={() => {
                    setModalVisible(false);
                    setModalStep("confirm");
                    router.push("/(student)/(tabs)/home");
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
    borderRadius: radius.xl,
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
