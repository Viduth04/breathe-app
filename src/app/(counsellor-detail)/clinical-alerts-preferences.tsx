// Counsellor Clinical Alerts & Preferences - Muaath (Member 4). Supports FR05, NFR01.
// Settings panel for triage flags, advance reminders, quiet hours, and privacy-safe lockscreen previews.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { ClinicalAlertPreferences } from "@/types/counsellorDetailScreens";

export default function ClinicalAlertsPreferencesScreen() {
  const { alertPreferences, updateAlertPreferences } = useCounsellorStore();
  const [localPrefs, setLocalPrefs] = useState<ClinicalAlertPreferences>(alertPreferences);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const toggleField = (field: keyof ClinicalAlertPreferences) => {
    setLocalPrefs((prev) => {
      const updated = { ...prev, [field]: !prev[field] };
      updateAlertPreferences({ [field]: updated[field] });
      return updated;
    });
  };

  const handleSave = () => {
    updateAlertPreferences(localPrefs);
    setSavedFeedback("Clinical alert preferences saved successfully.");
    setTimeout(() => {
      setSavedFeedback(null);
    }, 2800);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Clinical Alerts & Preferences
        </Text>

        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toast Feedback */}
        {savedFeedback && (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#065F46" />
            <Text style={styles.toastText}>{savedFeedback}</Text>
          </View>
        )}

        {/* ─── Overview Banner Card ─── */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewIconBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#065F46" />
          </View>
          <View style={styles.overviewTextGroup}>
            <Text style={styles.overviewTitle}>
              Manage clinical alerts, session reminders, and student emergency notifications.
            </Text>
            <Text style={styles.overviewSub}>
              We ensure patient care is prioritized while protecting your offline hours.
            </Text>
          </View>
        </View>

        {/* ─── Section 1: Urgent & Student Alerts ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeading}>URGENT & STUDENT ALERTS</Text>

          {/* Card 1: Crisis & Risk Triggers */}
          <View style={styles.alertCard}>
            <View style={styles.cardMainRow}>
              <View style={styles.amberIconBox}>
                <Ionicons name="warning-outline" size={20} color="#92400E" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Crisis & Risk Triggers</Text>
                <Text style={styles.cardDesc}>
                  Immediate high-priority alert when student triggers triage keywords or high PHQ-9 risk scores.
                </Text>
              </View>
              <Switch
                value={localPrefs.crisisRiskTriggers}
                onValueChange={() => toggleField("crisisRiskTriggers")}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                thumbColor={colors.white}
                accessibilityLabel="Crisis and risk triggers toggle"
              />
            </View>

            <View style={styles.cardBottomStrip}>
              <Text style={styles.bottomStripText}>
                Priority Override: Emergency Sound & Vibration
              </Text>
              <View style={styles.alwaysOnBadge}>
                <Text style={styles.alwaysOnText}>Always On</Text>
              </View>
            </View>
          </View>

          {/* Card 2: New Appointment Requests */}
          <View style={styles.alertCard}>
            <View style={styles.cardMainRow}>
              <View style={styles.mintIconBox}>
                <Ionicons name="calendar-outline" size={20} color="#065F46" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>New Appointment Requests</Text>
                <Text style={styles.cardDesc}>
                  Alert when students request, reschedule, or cancel counseling appointments.
                </Text>
              </View>
              <Switch
                value={localPrefs.newAppointmentRequests}
                onValueChange={() => toggleField("newAppointmentRequests")}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                thumbColor={colors.white}
                accessibilityLabel="New appointment requests toggle"
              />
            </View>
          </View>
        </View>

        {/* ─── Section 2: Session & Schedule Notifications ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeading}>SESSION & SCHEDULE NOTIFICATIONS</Text>

          {/* Card 3: Upcoming Session Reminders */}
          <View style={styles.alertCard}>
            <View style={styles.cardMainRow}>
              <View style={styles.mintIconBox}>
                <Ionicons name="time-outline" size={20} color="#065F46" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Upcoming Session Reminders</Text>
                <Text style={styles.cardDesc}>
                  Notify before scheduled video or in-person counseling consultations.
                </Text>
              </View>
              <Switch
                value={localPrefs.upcomingSessionReminders}
                onValueChange={() => toggleField("upcomingSessionReminders")}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                thumbColor={colors.white}
                accessibilityLabel="Upcoming session reminders toggle"
              />
            </View>

            <View style={styles.cardBottomStrip}>
              <View style={styles.stripLeftIconRow}>
                <Ionicons name="time-outline" size={13} color="#64748B" />
                <Text style={styles.bottomStripText}>
                  Advance reminder: 15 mins before
                </Text>
              </View>
              <View style={styles.gentleAlertBadge}>
                <Text style={styles.gentleAlertText}>Gentle alert</Text>
              </View>
            </View>
          </View>

          {/* Card 4: Intake Form Submissions */}
          <View style={styles.alertCard}>
            <View style={styles.cardMainRow}>
              <View style={styles.mintIconBox}>
                <Ionicons name="document-text-outline" size={20} color="#065F46" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Intake Form Submissions</Text>
                <Text style={styles.cardDesc}>
                  Alert when a booked student completes their pre-session questionnaire.
                </Text>
              </View>
              <Switch
                value={localPrefs.intakeFormSubmissions}
                onValueChange={() => toggleField("intakeFormSubmissions")}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                thumbColor={colors.white}
                accessibilityLabel="Intake form submissions toggle"
              />
            </View>
          </View>
        </View>

        {/* ─── Section 3: Student Messaging ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeading}>STUDENT MESSAGING</Text>

          {/* Card 5: Secure Chat Messages */}
          <View style={styles.alertCard}>
            <View style={styles.cardMainRow}>
              <View style={styles.mintIconBox}>
                <Ionicons name="chatbubbles-outline" size={20} color="#065F46" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Secure Chat Messages</Text>
                <Text style={styles.cardDesc}>
                  Notify when an assigned student sends a direct confidential message.
                </Text>
              </View>
              <Switch
                value={localPrefs.secureChatMessages}
                onValueChange={() => toggleField("secureChatMessages")}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                thumbColor={colors.white}
                accessibilityLabel="Secure chat messages toggle"
              />
            </View>

            <View style={styles.bluePrivacyStrip}>
              <Ionicons name="lock-closed" size={13} color="#1D4ED8" />
              <Text style={styles.bluePrivacyText}>
                Preview student identity hidden on lock screen for FERPA/HIPAA privacy
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Section 4: Working Hours & On-Call ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeading}>WORKING HOURS & ON-CALL</Text>

          {/* Card 6: Quiet Hours / Duty Off */}
          <View style={styles.alertCard}>
            <View style={styles.cardMainRow}>
              <View style={styles.mintIconBox}>
                <Ionicons name="moon-outline" size={20} color="#065F46" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Quiet Hours / Duty Off</Text>
                <Text style={styles.cardDesc}>
                  Route urgent notifications to on-call campus clinic triage outside 08:00 AM – 06:00 PM.
                </Text>
              </View>
              <Switch
                value={localPrefs.quietHoursDutyOff}
                onValueChange={() => toggleField("quietHoursDutyOff")}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                thumbColor={colors.white}
                accessibilityLabel="Quiet hours duty off toggle"
              />
            </View>

            <View style={styles.cardBottomStrip}>
              <Text style={styles.bottomStripText}>Scheduled window</Text>
              <Text style={styles.windowTimeText}>06:00 PM – 08:00 AM</Text>
            </View>
          </View>
        </View>

        {/* Institutional Compliance Notice */}
        <View style={styles.complianceNoticeCard}>
          <Ionicons name="shield-checkmark" size={16} color="#065F46" style={{ marginTop: 1 }} />
          <Text style={styles.complianceNoticeText}>
            <Text style={styles.complianceNoticeBold}>MindEase Clinical Portal</Text> adheres strictly to institutional compliance. Emergency escalations bypass quiet hours.
          </Text>
        </View>

        {/* Action Footer Area */}
        <View style={styles.footerArea}>
          <View style={styles.autosaveRow}>
            <Ionicons name="checkmark-circle" size={14} color="#065F46" />
            <Text style={styles.autosaveText}>Changes saved automatically</Text>
          </View>

          <Pressable
            style={styles.saveBtn}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save Preferences"
          >
            <Text style={styles.saveBtnText}>Save Preferences</Text>
            <Ionicons name="checkmark" size={18} color={colors.white} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#064E3B",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  avatarCircle: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 12,
    borderRadius: 14,
    marginBottom: spacing.md,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
  overviewCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.7)",
    padding: spacing.md,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: spacing.md,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  overviewIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
  },
  overviewTextGroup: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 19,
    color: "#0F172A",
  },
  overviewSub: {
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
    marginTop: 3,
  },
  sectionGroup: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#64748B",
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.1)",
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardMainRow: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  amberIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 221, 184, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 185, 95, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  mintIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
    marginTop: 2,
  },
  cardBottomStrip: {
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stripLeftIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bottomStripText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  alwaysOnBadge: {
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alwaysOnText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#064E3B",
  },
  gentleAlertBadge: {
    backgroundColor: "rgba(167, 243, 208, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gentleAlertText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#064E3B",
  },
  bluePrivacyStrip: {
    backgroundColor: "rgba(239, 246, 255, 0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(191, 219, 254, 0.6)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bluePrivacyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    color: "#1E40AF",
  },
  windowTimeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  complianceNoticeCard: {
    backgroundColor: "#FFFDF7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.15)",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  complianceNoticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: "#334155",
  },
  complianceNoticeBold: {
    fontWeight: "700",
    color: "#064E3B",
  },
  footerArea: {
    paddingVertical: spacing.sm,
    gap: 10,
  },
  autosaveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  autosaveText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#064E3B",
  },
  saveBtn: {
    backgroundColor: "#065F46",
    height: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
});
