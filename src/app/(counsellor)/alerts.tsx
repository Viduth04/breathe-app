// Counsellor Alerts - Muaath (Member 4). Supports FR05, NFR01.
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, spacing, radius, typography, TOUCH_TARGET } from "@/theme";

import { MOCK_ALERT_SECTIONS, MOCK_ALERTS_TODAY, MOCK_ALERTS_EARLIER } from "@/services/mockAlertsData";
import { AlertItem, AlertFilter, AlertSection } from "@/types/counsellorAlerts";

export default function CounsellorAlertsScreen() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  const [isAllRead, setIsAllRead] = useState(false);

  const handleMarkAllRead = () => setIsAllRead(true);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const renderBadge = (text: string, type: "outline" | "filled" | "gray") => {
    if (type === "outline") {
      return (
        <View style={styles.badgeOutline}>
          <Text style={styles.badgeOutlineText}>{text}</Text>
        </View>
      );
    }
    if (type === "gray") {
      return (
        <View style={styles.badgeGray}>
          <Text style={styles.badgeGrayText}>{text}</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeFilled}>
        <Text style={styles.badgeFilledText}>{text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable 
          style={styles.headerBtn} 
          onPress={() => router.navigate('/(counsellor)/dashboard')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable 
          style={styles.headerBtn} 
          onPress={() => showToast("Settings opened")}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CLINICAL ALERTS BANNER */}
        {!bannerDismissed && (
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Clinical Alerts & Schedule Updates</Text>
              <Text style={styles.bannerDesc}>2 pending student triage requests and 1 intake assessment awaiting clinical review.</Text>
            </View>
            <Pressable 
              style={styles.bannerClose} 
              onPress={() => setBannerDismissed(true)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss banner"
            >
              <Ionicons name="close" size={20} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {/* FILTER CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          <Pressable 
            style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
            onPress={() => setActiveFilter("all")}
            accessibilityRole="button"
            accessibilityLabel="Filter All"
          >
            <Text style={[styles.filterText, activeFilter === "all" && styles.filterTextActive]}>All</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.filterChip, activeFilter === "unread" && styles.filterChipActive]}
            onPress={() => setActiveFilter("unread")}
            accessibilityRole="button"
            accessibilityLabel="Filter Unread"
          >
            <Text style={[styles.filterText, activeFilter === "unread" && styles.filterTextActive]}>Unread</Text>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>3</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.filterChip, activeFilter === "intake" && styles.filterChipActive]}
            onPress={() => setActiveFilter("intake")}
            accessibilityRole="button"
            accessibilityLabel="Filter Intake Alerts"
          >
            <Text style={[styles.filterText, activeFilter === "intake" && styles.filterTextActive]}>Intake / Alerts</Text>
          </Pressable>

          <Pressable 
            style={[styles.filterChip, activeFilter === "schedule" && styles.filterChipActive]}
            onPress={() => setActiveFilter("schedule")}
            accessibilityRole="button"
            accessibilityLabel="Filter Schedule"
          >
            <Text style={[styles.filterText, activeFilter === "schedule" && styles.filterTextActive]}>Sche...</Text>
          </Pressable>

          <Pressable 
            style={styles.markAllReadBtn} 
            onPress={handleMarkAllRead}
            accessibilityRole="button"
            accessibilityLabel="Mark all read"
          >
            <Ionicons name="checkmark-done" size={20} color={colors.textSecondary} />
          </Pressable>
        </ScrollView>

        {/* TODAY SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Today</Text>
              {!isAllRead && <View style={styles.dotIndicator} />}
            </View>
            <Text style={styles.sectionCount}>3 priority</Text>
          </View>

          {/* Card 1 */}
          <View style={[styles.card, !isAllRead && styles.cardUnread]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="send" size={20} color={colors.text} accessibilityElementsHidden importantForAccessibility="no" />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardTitle}>New Session Request</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>10m ago</Text>
                  {!isAllRead && <View style={styles.dotIndicatorSmall} />}
                </View>
              </View>
            </View>
            <Text style={styles.cardBody}>Student #5104 requested a 45-min Anxiety Consultation for...</Text>
            <View style={styles.cardActions}>
              <View style={styles.badgeRow}>
                {renderBadge("Urgent / Triage", "outline")}
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Pressable style={styles.actionBtnFilled} onPress={() => showToast("Review Request pressed")} accessibilityRole="button" accessibilityLabel="Review Request">
                <Text style={styles.actionBtnFilledText}>Review Request</Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
          </View>

          {/* Card 2 */}
          <View style={[styles.card, !isAllRead && styles.cardUnread]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="checkmark-circle" size={20} color={colors.text} accessibilityElementsHidden importantForAccessibility="no" />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardTitle}>Intake Questionnaire Su...</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>45m ago</Text>
                  {!isAllRead && <View style={styles.dotIndicatorSmall} />}
                </View>
              </View>
            </View>
            <Text style={styles.cardBody}>Sarah Jenkins completed her pre-session PHQ-9 assessment</Text>
            <View style={styles.cardActions}>
              <View style={styles.badgeRow}>
                {renderBadge("PHQ-9 • Moderate", "outline")}
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Pressable style={styles.actionBtnGray} onPress={() => showToast("View Assessment pressed")} accessibilityRole="button" accessibilityLabel="View Assessment">
                <Text style={styles.actionBtnGrayText}>View Assessment</Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
          </View>

          {/* Card 3 */}
          <View style={[styles.card, !isAllRead && styles.cardUnread]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="videocam" size={20} color={colors.text} accessibilityElementsHidden importantForAccessibility="no" />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardTitle}>Session in 15 Minutes</Text>
                <View style={styles.timeRow}>
                  <Text style={[styles.timeText, { color: colors.primary, fontWeight: "600" }]}>Just now</Text>
                  {!isAllRead && <View style={styles.dotIndicatorSmall} />}
                </View>
              </View>
            </View>
            <Text style={styles.cardBody}>Upcoming Video Consultation with Alex Rivera at 10:00 AM....</Text>
            <View style={styles.cardFooter}>
              <Pressable style={styles.actionBtnFilled} onPress={() => showToast("Enter Room pressed")} accessibilityRole="button" accessibilityLabel="Enter Room">
                <View style={styles.pulseDot} />
                <Text style={styles.actionBtnFilledText}>Enter Room</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* EARLIER THIS WEEK SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleBold}>Earlier this week</Text>

          {/* Card 4 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="chatbubbles" size={20} color={colors.text} accessibilityElementsHidden importantForAccessibility="no" />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardTitle}>Message from Student</Text>
                <Text style={styles.timeText}>Yesterday</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>Student #4021 sent a message in secure chat regarding breathing</Text>
            <View style={styles.cardFooter}>
              <Pressable style={styles.actionBtnGray} onPress={() => showToast("Secure Chat pressed")} accessibilityRole="button" accessibilityLabel="Secure Chat">
                <Text style={styles.actionBtnGrayText}>Secure Chat</Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
          </View>

          {/* Card 5 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="calendar" size={20} color={colors.text} accessibilityElementsHidden importantForAccessibility="no" />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardTitle}>Session Cancelled / Resch</Text>
                <Text style={styles.timeText}>Tuesday</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>Student #8821 requested to reschedule Thursday's slot to...</Text>
            <View style={[styles.cardFooter, { justifyContent: "flex-end" }]}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no" />
            </View>
          </View>
        </View>

        {/* COMPLIANCE FOOTER */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color={colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no" />
          <Text style={styles.footerText}>All clinical notifications synced with portal • HIPAA compliant</Text>
        </View>
      </ScrollView>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{feedbackMessage}</Text>
        </View>
      )}
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
    paddingVertical: spacing.sm,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  banner: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  bannerDesc: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  bannerClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  markAllReadBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: "auto",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  sectionTitleBold: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
  dotIndicatorSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    backgroundColor: "#F2F9F6",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  cardTitleBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardActions: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badgeOutline: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeOutlineText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  badgeGray: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  badgeGrayText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  badgeFilled: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  badgeFilledText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionBtnFilled: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnFilledText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  actionBtnGray: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnGrayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    zIndex: 100,
  },
  toastText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
