import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getBooking } from "@/services/bookingService";
import { Booking } from "@/types/booking";
import { ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getBooking(id).then(data => {
        setSession(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop: 100}} /></SafeAreaView>;
  }

  if (!session) {
    return <SafeAreaView style={styles.container}><Text style={{textAlign: 'center', marginTop: 100}}>Session not found</Text></SafeAreaView>;
  }

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
        
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.topLabelRow}>
            <Text style={styles.topLabelText}>SESSION DETAILS</Text>
            <View style={styles.refBadge}>
              <Text style={styles.refBadgeText}>#ME-84920</Text>
            </View>
          </View>
          
          <Text style={styles.mainTitle}>Upcoming Session Details</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>Confirmed • In 3 Days</Text>
            </View>
            <Text style={styles.refText}>Ref: #ME-84920</Text>
          </View>
        </View>

        {/* Encrypted Banner */}
        <View style={styles.encryptedBanner}>
          <View style={styles.encryptedLeft}>
            <View style={styles.encryptedIconBox}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.encryptedTitle}>End-to-End Encrypted</Text>
              <Text style={styles.encryptedSub}>Anonymous Mode Active</Text>
            </View>
          </View>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        </View>

        {/* Doctor Card */}
        <Card style={styles.doctorCard}>
          <View style={styles.doctorInfoRow}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#FFF" />
              </View>
            </View>
            <View style={styles.doctorDetails}>
              <View style={styles.doctorNameRow}>
                <Text style={styles.doctorName}>{"Counselor"}</Text>
                <View style={styles.verifiedTextBadge}>
                  <Text style={styles.verifiedTextBadgeLabel}>VERIFIED</Text>
                </View>
              </View>
              <Text style={styles.doctorSubtitle}>Clinical Psychologist • MindEase Certified</Text>
              <Text style={styles.doctorSpecialty}>Specialty: Academic Stress & Anxiety</Text>
            </View>
          </View>
          
          <View style={styles.doctorActionRow}>
            <Pressable style={styles.messageBtn} onPress={() => router.push("/(student)/session/chat")}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              <Text style={styles.messageBtnText}>Message / Chat First</Text>
            </Pressable>
            <Pressable style={styles.notesBtn} onPress={() => router.push("/(student)/session/summary")}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </Card>

        {/* Countdown Card */}
        <Card style={styles.countdownCard}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>SESSION STARTS IN</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>[LIVE]</Text>
            </View>
          </View>

          <View style={styles.countdownBoxes}>
            <View style={styles.timeBox}>
              <Text style={styles.timeNumber}>02</Text>
              <Text style={styles.timeLabel}>Days</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeNumber}>14</Text>
              <Text style={styles.timeLabel}>Hours</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeNumber}>35</Text>
              <Text style={styles.timeLabel}>Mins</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeNumber}>19</Text>
              <Text style={styles.timeLabel}>Secs</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Waiting room unlocks automatically 5 minutes prior to start
            </Text>
          </View>
        </Card>

        {/* Pre-Session Intake Status */}
        <Card style={styles.intakeCard}>
          <View style={styles.cardHeaderBetween}>
            <Text style={styles.cardTitleDark}>Pre-Session Intake Status</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>[3 of 3 READY]</Text>
            </View>
          </View>

          <View style={styles.intakeList}>
            <View style={styles.intakeItem}>
              <View style={styles.intakeCheckCircle}>
                <Ionicons name="checkmark" size={14} color={colors.primary} />
              </View>
              <View style={styles.intakeItemTextContainer}>
                <Text style={styles.intakeItemTitle}>Mood Check-In completed</Text>
                <Text style={styles.intakeItemSub}>Reported Stress: Moderate / Overload</Text>
              </View>
            </View>

            <View style={styles.intakeItem}>
              <View style={styles.intakeCheckCircle}>
                <Ionicons name="checkmark" size={14} color={colors.primary} />
              </View>
              <View style={styles.intakeItemTextContainer}>
                <Text style={styles.intakeItemTitle}>Student Focus Agenda defined</Text>
                <Text style={styles.intakeItemSub}>Topic: Exam Anxiety & Sleep Cycle</Text>
              </View>
            </View>

            <View style={styles.intakeItem}>
              <View style={styles.intakeCheckCircle}>
                <Ionicons name="checkmark" size={14} color={colors.primary} />
              </View>
              <View style={styles.intakeItemTextContainer}>
                <Text style={styles.intakeItemTitle}>Audio, mic & connection calibrated</Text>
                <Text style={styles.intakeItemSub}>Status: Verified in Browser Sandbox</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Policies & Guidelines */}
        <Card style={styles.policiesCard}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="shield-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitleDark}>Policies & Guidelines</Text>
          </View>
          
          <View style={styles.policyItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.policyText}>
              Free cancellation or rescheduling permitted up to 2 hours before session start (by 8:00 AM, 15 Aug).
            </Text>
          </View>
          <View style={styles.policyItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.policyText}>
              If this is an immediate crisis, please tap <Text style={styles.policyLink}>Emergency Helpline (24/7)</Text>.
            </Text>
          </View>
        </Card>

        {/* Bottom Actions Area */}
        <View style={styles.bottomActionsArea}>
          <Pressable style={[styles.joinDisabledBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => router.push({ pathname: session.sessionType === 'chat' ? '/(student)/session/chat' : '/(student)/session/video-call', params: { id: session.id } })}>
            <Ionicons name={session.sessionType === 'chat' ? 'chatbubbles-outline' : 'videocam-outline'} size={20} color="#FFF" />
            <Text style={[styles.joinDisabledText, { color: '#FFF' }]}>Join {session.sessionType === 'chat' ? 'Chat' : 'Video'} Session</Text>
          </Pressable>

          <View style={styles.splitBtnRow}>
            <Pressable style={styles.rescheduleBtn}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.rescheduleBtnText}>Reschedule</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => router.push("/(student)/session/cancel")}>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {/* Floating Bottom Button */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.continueBtn} onPress={() => router.push("/(student)/session/dashboard")}>
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    // Keeps the right-hand icon clear of the floating crisis help button
    paddingRight: FLOATING_HELP_CLEARANCE,
    paddingVertical: spacing.sm,
    backgroundColor: "#FDFBF7",
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
  titleSection: {
    marginBottom: spacing.md,
  },
  topLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  topLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  refBadge: {
    backgroundColor: "#F3F0E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  refBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A3D9B1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  refText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  encryptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F0E6",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  encryptedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  encryptedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5F8E4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 75, 59, 0.1)",
  },
  encryptedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  encryptedSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  doctorCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  doctorInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  doctorDetails: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  verifiedTextBadge: {
    backgroundColor: "#A3D9B1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTextBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  doctorSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  doctorActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F0E6",
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 8,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  notesBtn: {
    width: 48,
    backgroundColor: "#F3F0E6",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  countdownCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  cardTitleDark: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A3D9B1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  countdownBoxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  timeBox: {
    width: "23%",
    backgroundColor: "#F3F0E6",
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  timeNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  intakeCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  intakeList: {
    gap: spacing.sm,
  },
  intakeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFBF7",
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  intakeCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#A3D9B1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  intakeItemTextContainer: {
    flex: 1,
  },
  intakeItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  intakeItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  policiesCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  policyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  policyLink: {
    fontWeight: "700",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  bottomActionsArea: {
    marginBottom: spacing.xl,
  },
  joinDisabledBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E1D8", // grayed out beige
    paddingVertical: 16,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: spacing.sm,
  },
  joinDisabledText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  splitBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rescheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radius.full,
    gap: 6,
  },
  rescheduleBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCE8E8",
    paddingVertical: 14,
    borderRadius: radius.full,
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.danger,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: "#FDFBF7",
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
});
