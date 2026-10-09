import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";

export default function SessionSummaryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Session Summary</Text>
          <Text style={styles.headerSubtitle}>Dr. Anjali Perera • 12 Jul 2026</Text>
        </View>
        <View>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=47" }}
            style={styles.avatar}
          />
          <View style={styles.onlineBadge} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Session Info Card */}
        <Card style={styles.sessionCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Completed • 12 Jul 2026</Text>
            </View>
            <Text style={styles.refText}>Ref: #ME-7420</Text>
          </View>

          <View style={styles.doctorInfo}>
            <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.doctorAvatar} />
            <View style={styles.doctorDetails}>
              <View style={styles.doctorNameRow}>
                <Text style={styles.doctorName}>Dr. Anjali Perera</Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              </View>
              <Text style={styles.doctorSpecialty}>Specialty: Stress & Academic Anxiety</Text>
            </View>
          </View>

          <View style={styles.sessionDetailsBox}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={colors.text} />
              <Text style={styles.detailTextBold}>Wed, 12 Jul 2026 • 10:00 AM </Text>
              <Text style={styles.detailTextLight}>(45 min)</Text>
            </View>
            <View style={styles.badgesRowWrap}>
              <View style={styles.infoBadge}>
                <Ionicons name="videocam-outline" size={14} color={colors.primary} />
                <Text style={styles.infoBadgeText}>Video Call</Text>
              </View>
              <View style={styles.infoBadge}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.infoBadgeTextDark}>Anonymous Mode</Text>
              </View>
              <View style={[styles.infoBadge, { borderColor: colors.primary }]}>
                <Ionicons name="checkmark-done-circle-outline" size={14} color={colors.primary} />
                <Text style={styles.infoBadgeText}>Verified Session</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Mood Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MOOD AT TIME OF SESSION</Text>
          <Text style={styles.sectionSubtitle}>Pre-session Check-In</Text>
        </View>
        <Card style={styles.moodCard}>
          <View style={styles.moodTopRow}>
            <View style={styles.moodLeft}>
              <Text style={styles.emojiText}>😐</Text>
              <View>
                <Text style={styles.moodMainText}>Okay</Text>
                <Text style={styles.moodSubText}>Reported Stress: Moderate</Text>
              </View>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>6/10</Text>
            </View>
          </View>
          <View style={styles.energyRow}>
            <Text style={styles.energyLabel}>Energy Level</Text>
            <Text style={styles.energyValue}>60%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "60%" }]} />
          </View>
        </Card>

        {/* Clinical Notes Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>COUNSELOR'S CLINICAL NOTES</Text>
          <View style={styles.confidentialBadge}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.primary} />
            <Text style={styles.confidentialText}>Confidential</Text>
          </View>
        </View>
        
        {/* Key Discussion Points */}
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="chatbox-outline" size={18} color={colors.primary} />
            <Text style={styles.notesTitle}>Key Discussion Points</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>Discussed exam-related anxiety and tailored time management strategies.</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>Explored 4-7-8 breathing techniques for evening sleep difficulties.</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>Identified triggers related to multi-subject assignment deadlines.</Text>
          </View>
        </Card>

        {/* Recommendations & Homework */}
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="list-outline" size={18} color={colors.primary} />
            <Text style={styles.notesTitle}>Recommendations & Homework</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkbox" size={20} color={colors.primary} style={styles.checkIcon} />
            <Text style={styles.bulletText}>Practice deep breathing exercises before study sessions.</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkbox" size={20} color={colors.primary} style={styles.checkIcon} />
            <Text style={styles.bulletText}>Maintain a consistent sleep routine before 11 PM.</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="square-outline" size={20} color={colors.textSecondary} style={styles.checkIcon} />
            <Text style={styles.bulletText}>Join MindEase peer academic circle for support.</Text>
          </View>
        </Card>

        {/* Follow-Up Care Plan */}
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.notesTitle}>Follow-Up Care Plan</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>Schedule a follow-up consultation in 2 weeks (late July).</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>Log daily mood and stress reflections in the Check-In tab.</Text>
          </View>
        </Card>

        {/* Prescribed Resources Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>PRESCRIBED RESOURCES</Text>
          <Text style={styles.sectionSubtitle}>3 Shared</Text>
        </View>

        <Card style={styles.resourceCard}>
          <View style={styles.resourceIconBox}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Article: Managing Exam Stress</Text>
            <Text style={styles.resourceSubtitle}>PDF Guide • 4 min read</Text>
          </View>
          <View style={styles.resourceAction}>
            <Ionicons name="eye-outline" size={14} color={colors.primary} />
            <Text style={styles.resourceActionText}>Read</Text>
          </View>
        </Card>

        <Card style={styles.resourceCard}>
          <View style={styles.resourceIconBox}>
            <Ionicons name="headset-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>5-Minute Breathing Audio</Text>
            <Text style={styles.resourceSubtitle}>Audio Track • Mindful Pacing</Text>
          </View>
          <View style={styles.resourceAction}>
            <Ionicons name="play-outline" size={14} color={colors.primary} />
            <Text style={styles.resourceActionText}>Play</Text>
          </View>
        </Card>

        <Card style={styles.resourceCard}>
          <View style={styles.resourceIconBox}>
            <Ionicons name="document-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Weekly Study Planner Sheet</Text>
            <Text style={styles.resourceSubtitle}>Interactive Worksheet</Text>
          </View>
          <View style={styles.resourceAction}>
            <Ionicons name="download-outline" size={14} color={colors.primary} />
            <Text style={styles.resourceActionText}>Save</Text>
          </View>
        </Card>

        {/* Audit Details */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>SESSION AUDIT DETAILS</Text>
        </View>
        <Card style={styles.auditCard}>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Session ID</Text>
            <Text style={styles.auditValue}>#ME-7420</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Date & Time</Text>
            <Text style={styles.auditValue}>Wed, 12 Jul 2026 • 10:00 AM</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Duration</Text>
            <Text style={styles.auditValue}>45 minutes</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Session Type</Text>
            <Text style={styles.auditValue}>Encrypted Video Call</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Assigned Counselor</Text>
            <Text style={[styles.auditValue, { color: colors.primary }]}>Dr. Anjali Perera</Text>
          </View>
        </Card>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <Button title="Book Follow-Up Session" icon="calendar-outline" onPress={() => {}} />
          <Pressable style={styles.downloadButton}>
            <Ionicons name="download-outline" size={18} color={colors.text} />
            <Text style={styles.downloadText}>Download Summary (PDF)</Text>
          </Pressable>
          <Text style={styles.reportText}>Report an issue with this session</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    // Keeps the right-hand icon clear of the floating crisis help button
    paddingRight: FLOATING_HELP_CLEARANCE,
    paddingVertical: spacing.sm,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  sessionCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
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
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  refText: {
    ...typography.caption,
    fontWeight: "600",
    color: "#B4B4B4",
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  doctorName: {
    ...typography.heading,
    fontSize: 16,
  },
  doctorSpecialty: {
    ...typography.caption,
  },
  sessionDetailsBox: {
    backgroundColor: "#F4FAF6",
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailTextBold: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  detailTextLight: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badgesRowWrap: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginTop: 4,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  infoBadgeTextDark: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  confidentialBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  confidentialText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  moodCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  moodTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  moodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emojiText: {
    fontSize: 28,
  },
  moodMainText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  moodSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  energyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  energyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  energyValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5F8E4",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  notesCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  checkIcon: {
    marginTop: -2,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  resourceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  resourceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resourceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  resourceActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  auditCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  auditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  auditLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  auditValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  footerActions: {
    gap: spacing.md,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radius.full,
    gap: 8,
  },
  downloadText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  reportText: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: "underline",
    marginTop: spacing.sm,
  },
});
