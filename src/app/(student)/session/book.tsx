import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { createBooking, rescheduleBooking } from "@/services/bookingService";
import { SessionType } from "@/types/booking";
import { useEffect, useMemo, useState } from "react";
import CounsellorAvatar from "@/components/common/CounsellorAvatar";
import { ActivityIndicator } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { ScrollView, StyleSheet, Text, View, Pressable, Switch, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const BOOKABLE_SESSION_TYPES: SessionType[] = ["video", "chat", "in-person"];
function isBookableSessionType(value?: string): value is SessionType {
  return Boolean(value && BOOKABLE_SESSION_TYPES.includes(value as SessionType));
}

const SESSION_TYPE_OPTIONS = [
  { type: "video", title: "Video Call", subtitle: "Encrypted HD link", icon: "videocam" },
  { type: "chat", title: "Live Chat", subtitle: "Real-time text", icon: "chatbubbles" },
  { type: "in-person", title: "In Person", subtitle: "In-person session", icon: "business" },
] as const satisfies ReadonlyArray<{
  type: SessionType;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}>;

export default function BookSessionScreen() {
  const {
    uid,
    slotId: slotIdParam,
    dateKey: dateKeyParam,
    startAt: startAtParam,
    endAt: endAtParam,
    sessionType: sessionTypeParam,
    sessionTypes: sessionTypesParam,
    bookingId: bookingIdParam,
  } = useLocalSearchParams<{
    uid: string;
    slotId?: string;
    dateKey?: string;
    startAt?: string;
    endAt?: string;
    sessionType?: string;
    sessionTypes?: string;
    bookingId?: string;
  }>();
  const { profile } = useAuth();
  const slotId = firstParam(slotIdParam);
  const dateKey = firstParam(dateKeyParam);
  const routeStartAt = firstParam(startAtParam);
  const routeEndAt = firstParam(endAtParam);
  const routeSessionType = firstParam(sessionTypeParam);
  const routeSessionTypes = firstParam(sessionTypesParam);
  const previousBookingId = firstParam(bookingIdParam);
  const allowedSessionTypes = useMemo(() => {
    if (!slotId) return BOOKABLE_SESSION_TYPES;
    return (routeSessionTypes || "")
      .split(",")
      .filter((type): type is SessionType =>
        BOOKABLE_SESSION_TYPES.includes(type as SessionType)
      );
  }, [routeSessionTypes, slotId]);
  
  const [counsellor, setCounsellor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<"confirm" | "success">("confirm");
  const [newBookingId, setNewBookingId] = useState<string | null>(null);
  
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>(
    isBookableSessionType(routeSessionType)
      ? routeSessionType
      : allowedSessionTypes[0] || "video"
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const publishedStartAt = routeStartAt ? new Date(routeStartAt) : null;
  const publishedEndAt = routeEndAt ? new Date(routeEndAt) : null;
  const hasPublishedSlot = Boolean(
    slotId &&
    publishedStartAt &&
    publishedEndAt &&
    Number.isFinite(publishedStartAt.getTime()) &&
    Number.isFinite(publishedEndAt.getTime())
  );
  const appointmentDateTimeLabel = hasPublishedSlot && publishedStartAt && publishedEndAt
    ? `${new Intl.DateTimeFormat("en-LK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(publishedStartAt)} • ${new Intl.DateTimeFormat("en-LK", {
        hour: "numeric",
        minute: "2-digit",
      }).format(publishedStartAt)} – ${new Intl.DateTimeFormat("en-LK", {
        hour: "numeric",
        minute: "2-digit",
      }).format(publishedEndAt)}`
    : "Choose an available date and time";
  
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
    if (!slotId || !dateKey || !hasPublishedSlot || !publishedStartAt || !publishedEndAt) {
      alert("Choose an available date and time from the counselor's calendar.");
      return;
    }
    if (!allowedSessionTypes.includes(selectedSessionType)) {
      alert("Choose a session type offered for this availability.");
      return;
    }
    setBookingLoading(true);
    try {
      if (
        !Number.isFinite(publishedStartAt.getTime()) ||
        !Number.isFinite(publishedEndAt.getTime()) ||
        publishedStartAt.getTime() <= Date.now() ||
        publishedEndAt.getTime() <= publishedStartAt.getTime()
      ) {
        throw new Error("The selected availability has expired or contains an invalid date and time. Please choose another slot.");
      }

      const bookingInput = {
        counsellorId: counsellor.id,
        startAt: publishedStartAt,
        endAt: publishedEndAt,
        dateKey,
        sessionType: selectedSessionType,
        isAnonymous,
        slotId,
      };
      const createdId = previousBookingId
        ? await rescheduleBooking(profile, bookingInput, previousBookingId)
        : await createBooking(profile, bookingInput);
      setNewBookingId(createdId);
      setModalStep('success');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to submit the booking request.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Info Card */}
        <Card style={styles.topInfoCard}>
          <View style={styles.doctorInfoLeft}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push("/(student)/session/dashboard");
                }
              }}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back to counselor profile"
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Pressable>
            <CounsellorAvatar
              uid={counsellor?.uid || counsellor?.id || firstParam(uid)}
              name={counsellor?.fullName || "Counsellor"}
              size={44}
            />
            <View>
              <Text style={styles.doctorName}>{counsellor?.fullName || "Counsellor"}</Text>
              {counsellor?.title ? (
                <View style={styles.doctorSubtitleRow}>
                  <View style={styles.subtitleDot} />
                  <Text style={styles.doctorSubtitle}>{counsellor.title}</Text>
                </View>
              ) : null}
            </View>
          </View>
          
        </Card>

        {hasPublishedSlot && publishedStartAt && publishedEndAt ? (
          <Card style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>Selected availability</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: spacing.sm }}>
              {appointmentDateTimeLabel}
            </Text>
          </Card>
        ) : (
          <Card style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>Choose an available time</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: spacing.sm }}>
              Go back to the counselor's calendar and select an open date and time to continue.
            </Text>
          </Card>
        )}

        {/* Session Type */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          
        </View>
        <View style={styles.sessionTypeGrid}>
          {SESSION_TYPE_OPTIONS.map((option) => {
            const enabled = allowedSessionTypes.includes(option.type);
            const selected = selectedSessionType === option.type;
            return (
              <Pressable
                key={option.type}
                accessibilityRole="button"
                accessibilityState={{ disabled: !enabled, selected }}
                accessibilityLabel={`${option.title}${enabled ? "" : ", unavailable for this time"}`}
                disabled={!enabled}
                style={[
                  styles.typeCard,
                  selected && styles.typeCardActive,
                  !enabled && styles.typeCardDisabled,
                ]}
                onPress={() => setSelectedSessionType(option.type)}
              >
                <View
                  style={[
                    styles.typeIconBox,
                    selected && styles.typeIconBoxActive,
                    !enabled && styles.typeIconBoxDisabled,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={selected ? "#FFF" : enabled ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.typeRadio}>
                  <View
                    style={[
                      styles.radioOuter,
                      selected && styles.radioOuterActive,
                      !enabled && styles.radioOuterDisabled,
                    ]}
                  >
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={[styles.typeTitle, !enabled && styles.typeTextDisabled]}>
                  {option.title}
                </Text>
                <Text
                  style={[
                    styles.typeSub,
                    selected && { color: colors.primary },
                    !enabled && styles.typeTextDisabled,
                  ]}
                >
                  {enabled ? option.subtitle : "Not offered at this time"}
                </Text>
              </Pressable>
            );
          })}
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
        <Pressable
          style={[styles.continueBtn, (!hasPublishedSlot || bookingLoading) && { opacity: 0.5 }]}
          disabled={!hasPublishedSlot || bookingLoading}
          onPress={() => setModalVisible(true)}
        >
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
                    <Text style={styles.modalDetailValueDark}>{appointmentDateTimeLabel}</Text>
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

                

                <Pressable 
                  style={styles.modalConfirmBtn} 
                  onPress={handleBook}
                >
                  {bookingLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalConfirmText}>
                      {previousBookingId ? "Send Reschedule Request" : "Send Booking Request"}
                    </Text>
                  )}
                </Pressable>

                <Pressable 
                  style={styles.modalCancelBtn} 
                  onPress={() => {
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Go Back</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.modalIconBoxSuccess}>
                  <Ionicons name="checkmark" size={32} color="#FFF" />
                </View>
                
                <Text style={styles.modalTitle}>
                  {previousBookingId ? "Reschedule Request Sent" : "Booking Request Sent"}
                </Text>
                <Text style={styles.modalSub}>
                  {previousBookingId
                    ? "Your previous appointment has been cancelled. The new time is awaiting your counsellor's approval."
                    : "Your appointment request is awaiting your counsellor's confirmation."}
                </Text>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Counselor</Text>
                    <Text style={styles.modalDetailValueGreen}>{counsellor?.fullName || "Dr. Anjali Perera"}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date & Time</Text>
                    <Text style={styles.modalDetailValueDark}>{appointmentDateTimeLabel}</Text>
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
                      <Text style={styles.modalStatusText}>Awaiting Counselor</Text>
                    </View>
                  </View>
                </View>

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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    justifyContent: "flex-start",
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  doctorInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
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
  typeCardDisabled: {
    opacity: 0.45,
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
  typeIconBoxDisabled: {
    backgroundColor: colors.background,
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
  radioOuterDisabled: {
    borderColor: colors.border,
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
  typeTextDisabled: {
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
