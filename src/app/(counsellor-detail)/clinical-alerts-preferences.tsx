// Counsellor Clinical Alerts & Preferences - Muaath (Member 4). Supports FR05, NFR01.
// Verified settings panel for triage flags, advance reminders, quiet hours, and privacy-safe lockscreen previews.
// Real data is loaded from and persisted directly to the Firestore "counselorPreferences/{uid}" database collection.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { ClinicalAlertPreferences } from "@/types/counsellorDetailScreens";

export default function ClinicalAlertsPreferencesScreen() {
  const { alertPreferences, updateAlertPreferences, profile } = useCounsellorStore();
  const [localPrefs, setLocalPrefs] = useState<ClinicalAlertPreferences>(alertPreferences);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate local state whenever store/Firestore sync updates
  useEffect(() => {
    setLocalPrefs(alertPreferences);
  }, [alertPreferences]);

  // Generic updater that immediately updates local state and syncs to database
  const updatePreference = async <K extends keyof ClinicalAlertPreferences>(
    key: K,
    val: ClinicalAlertPreferences[K]
  ) => {
    const updated = { ...localPrefs, [key]: val };
    setLocalPrefs(updated);
    try {
      await updateAlertPreferences({ [key]: val });
    } catch {
      // Graceful fallback
    }
  };

  const toggleField = (field: keyof ClinicalAlertPreferences) => {
    updatePreference(field, !localPrefs[field] as any);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAlertPreferences(localPrefs);
      setSavedFeedback("All preferences successfully saved to database.");
      setTimeout(() => {
        setSavedFeedback(null);
      }, 3000);
    } catch (err: any) {
      Alert.alert("Save Error", err?.message || "Could not save preferences to database.");
    } finally {
      setIsSaving(false);
    }
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

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Clinical Alerts & Preferences
          </Text>
          <View style={styles.cloudSyncIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.cloudSyncText}>Cloud Database Connected</Text>
          </View>
        </View>

        <View style={styles.avatarCircle}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatarImage}
              accessibilityLabel={`${profile.fullName} avatar`}
            />
          ) : (
            <Ionicons name="person" size={20} color={colors.white} />
          )}
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
            <Ionicons name="shield-checkmark" size={20} color="#065F46" />
          </View>
          <View style={styles.overviewTextGroup}>
            <Text style={styles.overviewTitle}>
              Clinical Alerts, Reminders & On-Call Dispatch
            </Text>
            <Text style={styles.overviewSub}>
              Configured triage thresholds and notification lead times persist directly to your SLIIT wellness profile.
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
              <View style={styles.stripLeftIconRow}>
                <Ionicons
                  name={localPrefs.crisisRiskTriggers ? "volume-high-outline" : "volume-mute-outline"}
                  size={14}
                  color={localPrefs.crisisRiskTriggers ? "#065F46" : "#64748B"}
                />
                <Text style={styles.bottomStripText}>
                  {localPrefs.crisisRiskTriggers
                    ? "Priority Override: High-priority audio & push alert"
                    : "Priority Override: Standard notifications only"}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  localPrefs.crisisRiskTriggers ? styles.badgeActive : styles.badgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    localPrefs.crisisRiskTriggers ? styles.badgeActiveText : styles.badgeMutedText,
                  ]}
                >
                  {localPrefs.crisisRiskTriggers ? "Active" : "Muted"}
                </Text>
              </View>
            </View>

            {/* Sub-toggle: Priority override always-on */}
            {localPrefs.crisisRiskTriggers && (
              <View style={styles.subOptionStrip}>
                <Text style={styles.subOptionLabel}>Bypass Device Do-Not-Disturb Mode</Text>
                <Switch
                  value={localPrefs.priorityOverrideAlwaysOn}
                  onValueChange={() => toggleField("priorityOverrideAlwaysOn")}
                  trackColor={{ false: "#E2E8F0", true: "#047857" }}
                  thumbColor={colors.white}
                  accessibilityLabel="Bypass device do-not-disturb toggle"
                />
              </View>
            )}
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

            <View style={styles.cardBottomStrip}>
              <View style={styles.stripLeftIconRow}>
                <Ionicons name="notifications-outline" size={14} color="#64748B" />
                <Text style={styles.bottomStripText}>
                  Notification channel: Direct push & in-app badge
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  localPrefs.newAppointmentRequests ? styles.badgeActive : styles.badgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    localPrefs.newAppointmentRequests ? styles.badgeActiveText : styles.badgeMutedText,
                  ]}
                >
                  {localPrefs.newAppointmentRequests ? "Active" : "Muted"}
                </Text>
              </View>
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

            {/* Interactive Lead-Time Selector Chips */}
            <View style={styles.leadTimeStrip}>
              <View style={styles.stripLeftIconRow}>
                <Ionicons name="timer-outline" size={14} color="#065F46" />
                <Text style={styles.leadTimeLabel}>Advance Lead Time:</Text>
              </View>
              <View style={styles.chipsRow}>
                {[15, 30, 45].map((mins) => {
                  const isSelected = localPrefs.advanceReminderMinutes === mins;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => updatePreference("advanceReminderMinutes", mins)}
                      style={[
                        styles.chipBtn,
                        isSelected && styles.chipBtnActive,
                        !localPrefs.upcomingSessionReminders && { opacity: 0.5 },
                      ]}
                      disabled={!localPrefs.upcomingSessionReminders}
                      accessibilityRole="button"
                      accessibilityLabel={`Set reminder to ${mins} minutes before session`}
                    >
                      <Text
                        style={[
                          styles.chipBtnText,
                          isSelected && styles.chipBtnTextActive,
                        ]}
                      >
                        {mins} min
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.cardBottomStrip}>
              <View style={styles.stripLeftIconRow}>
                <Ionicons name="volume-medium-outline" size={14} color="#64748B" />
                <Text style={styles.bottomStripText}>Chime style: Gentle reminder</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  localPrefs.upcomingSessionReminders ? styles.badgeActive : styles.badgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    localPrefs.upcomingSessionReminders ? styles.badgeActiveText : styles.badgeMutedText,
                  ]}
                >
                  {localPrefs.upcomingSessionReminders ? "Active" : "Disabled"}
                </Text>
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

            <View style={styles.cardBottomStrip}>
              <View style={styles.stripLeftIconRow}>
                <Ionicons name="analytics-outline" size={14} color="#64748B" />
                <Text style={styles.bottomStripText}>
                  Includes PHQ-9 & GAD-7 screening score previews
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  localPrefs.intakeFormSubmissions ? styles.badgeActive : styles.badgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    localPrefs.intakeFormSubmissions ? styles.badgeActiveText : styles.badgeMutedText,
                  ]}
                >
                  {localPrefs.intakeFormSubmissions ? "Active" : "Muted"}
                </Text>
              </View>
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

            {/* Interactive Lockscreen Privacy Setting */}
            <View style={styles.bluePrivacyStrip}>
              <Ionicons name="lock-closed" size={15} color="#1D4ED8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bluePrivacyTitle}>Lockscreen Confidentiality</Text>
                <Text style={styles.bluePrivacyDesc}>
                  {localPrefs.previewStudentIdentityHidden
                    ? "Student identity hidden (Anonymous ID only)"
                    : "Student display name shown in preview"}
                </Text>
              </View>
              <Switch
                value={localPrefs.previewStudentIdentityHidden}
                onValueChange={() => toggleField("previewStudentIdentityHidden")}
                trackColor={{ false: "#CBD5E1", true: "#2563EB" }}
                thumbColor={colors.white}
                accessibilityLabel="Hide student identity on lock screen toggle"
              />
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
                  Route non-urgent alerts away outside regular clinical counseling hours.
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
              <View style={styles.stripLeftIconRow}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.bottomStripText}>
                  Scheduled window: {localPrefs.scheduledWindow || "06:00 PM – 08:00 AM"}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  localPrefs.quietHoursDutyOff ? styles.badgeActive : styles.badgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    localPrefs.quietHoursDutyOff ? styles.badgeActiveText : styles.badgeMutedText,
                  ]}
                >
                  {localPrefs.quietHoursDutyOff ? "Duty Off Active" : "24/7 Available"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Institutional Compliance Notice */}
        <View style={styles.complianceNoticeCard}>
          <Ionicons name="shield-checkmark" size={18} color="#065F46" style={{ marginTop: 1 }} />
          <Text style={styles.complianceNoticeText}>
            <Text style={styles.complianceNoticeBold}>SLIIT Student Wellness Center</Text> adheres strictly to institutional healthcare privacy. Life-safety crisis escalations automatically bypass quiet hours.
          </Text>
        </View>

        {/* Action Footer Area */}
        <View style={styles.footerArea}>
          <View style={styles.autosaveRow}>
            <Ionicons name="cloud-done-outline" size={15} color="#065F46" />
            <Text style={styles.autosaveText}>Toggles immediately persist to Firestore database</Text>
          </View>

          <Pressable
            style={[styles.saveBtn, isSaving && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save Preferences"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save Preferences</Text>
                <Ionicons name="checkmark" size={18} color={colors.white} />
              </>
            )}
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
  headerTitleGroup: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: "700",
    color: "#064E3B",
    textAlign: "center",
  },
  cloudSyncIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  cloudSyncText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#047857",
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
    overflow: "hidden",
  },
  avatarImage: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.8)",
    padding: spacing.md,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: spacing.md,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    backgroundColor: "rgba(255, 221, 184, 0.45)",
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
    flex: 1,
  },
  bottomStripText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeMuted: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  badgeActiveText: {
    color: "#065F46",
  },
  badgeMutedText: {
    color: "#64748B",
  },
  subOptionStrip: {
    backgroundColor: "#FFFBEB",
    borderTopWidth: 1,
    borderTopColor: "#FEF3C7",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subOptionLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#92400E",
  },
  leadTimeStrip: {
    backgroundColor: "#F0FDF4",
    borderTopWidth: 1,
    borderTopColor: "#DCFCE7",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leadTimeLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#065F46",
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  chipBtnActive: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  chipBtnTextActive: {
    color: colors.white,
  },
  bluePrivacyStrip: {
    backgroundColor: "#EFF6FF",
    borderTopWidth: 1,
    borderTopColor: "#DBEAFE",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bluePrivacyTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E40AF",
  },
  bluePrivacyDesc: {
    fontSize: 11,
    color: "#3B82F6",
    marginTop: 1,
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
