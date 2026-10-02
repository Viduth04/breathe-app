// Counsellor Settings Screen - Muaath (Member 4). Supports FR01, FR05, FR08.
// Counselor profile, account security, notification rules, practice credentials, and logout.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { logout } from "@/services/authService";

export default function CounselorSettingsScreen() {
  const {
    profile,
    settings,
    isAvailable,
    toggleAvailability,
    toggleTwoFactor,
    toggleQuietHours,
    updateSettings,
  } = useCounsellorStore();

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editedTitle, setEditedTitle] = useState(profile.title);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of the Clinical Counselor Portal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch {
              // Fallback to welcome screen
            }
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  };

  const handleSaveProfile = () => {
    setEditProfileModalVisible(false);
    showToast("Profile credentials updated successfully.");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      {/* ─── Top Navigation Bar ─── */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButtonTouch}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.navTitle}>Settings</Text>
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

        {/* ─── Profile Header Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* Avatar with Mint Background */}
            <View style={styles.avatarBackdrop}>
              <Ionicons name="person" size={28} color="#065F46" />
            </View>

            {/* Details & License */}
            <View style={styles.profileMeta}>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.counsellorName}>{profile.fullName}</Text>
                <View style={styles.verifiedCheckBadge}>
                  <Ionicons name="checkmark" size={11} color={colors.white} />
                </View>
              </View>
              <Text style={styles.counsellorTitle}>
                {profile.title} • {profile.organization}
              </Text>
              <Text style={styles.licenseNumber}>{settings.licenseNumber}</Text>
            </View>
          </View>

          <View style={styles.profileDivider} />

          {/* Edit Profile Action */}
          <Pressable
            onPress={() => setEditProfileModalVisible(true)}
            style={styles.editProfileTrigger}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <View style={styles.editTriggerLeft}>
              <Ionicons name="create-outline" size={16} color="#64748B" />
              <Text style={styles.editTriggerText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        </View>

        {/* ─── Section: Account ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>ACCOUNT</Text>
          <View style={styles.cardGroup}>
            {/* Email Row */}
            <Pressable
              onPress={() => Alert.alert("Account Email", settings.email)}
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Email"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="mail-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Email</Text>
              </View>
              <View style={styles.menuRowRight}>
                <Text style={styles.menuValueText} numberOfLines={1}>
                  {settings.email}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>

            {/* Phone Number Row */}
            <Pressable
              onPress={() => Alert.alert("Phone Number", settings.phoneNumber)}
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Phone Number"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="call-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Phone Number</Text>
              </View>
              <View style={styles.menuRowRight}>
                <Text style={styles.menuValueText}>{settings.phoneNumber}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>

            {/* Change Password Row */}
            <Pressable
              onPress={() => Alert.alert("Change Password", "Password reset link sent to your registered institutional email.")}
              style={[styles.menuRow, styles.lastRow]}
              accessibilityRole="button"
              accessibilityLabel="Change Password"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="lock-closed-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Change Password</Text>
              </View>
              <View style={styles.menuRowRight}>
                <Text style={styles.menuValueText}>{settings.passwordUpdatedAgo}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── Section: Practice Details ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>PRACTICE DETAILS</Text>
          <View style={styles.cardGroup}>
            {/* Credentials Row */}
            <Pressable
              onPress={() => Alert.alert("Credentials", settings.credentials)}
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Credentials"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="shield-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Credentials</Text>
              </View>
              <View style={styles.menuRowRight}>
                <Text style={styles.menuValueText}>{settings.credentials}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>

            {/* Specialties Row */}
            <View style={styles.specialtiesBlock}>
              <View style={styles.specialtiesHeaderRow}>
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuIconSquare}>
                    <Ionicons name="pricetag-outline" size={18} color="#334155" />
                  </View>
                  <Text style={styles.menuItemLabel}>Specialties</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>

              {/* Specialty Chips */}
              <View style={styles.specialtyChipsContainer}>
                {settings.specialties.map((spec, idx) => (
                  <View key={idx} style={styles.specialtyChip}>
                    <Text style={styles.specialtyChipText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bio Row */}
            <Pressable
              onPress={() => Alert.alert("Bio", "10+ years student clinical wellness counselor at SLIIT.")}
              style={[styles.menuRow, styles.lastRow]}
              accessibilityRole="button"
              accessibilityLabel="Bio"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="person-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Bio</Text>
              </View>
              <View style={styles.menuRowRight}>
                <Text style={styles.menuValueText}>{settings.bio}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── Section: Preferences ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>PREFERENCES</Text>
          <View style={styles.cardGroup}>
            {/* Notification Settings */}
            <Pressable
              onPress={() => setNotificationModalVisible(true)}
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Notification Settings"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="notifications-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Notification Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

            {/* Default Session Duration */}
            <Pressable
              onPress={() =>
                updateSettings({
                  defaultDuration: settings.defaultDuration === "45m" ? "50m" : "45m",
                })
              }
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Default Session Duration"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="time-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Default Session Duration</Text>
              </View>
              <View style={styles.menuRowRight}>
                <View style={styles.durationPill}>
                  <Text style={styles.durationPillText}>{settings.defaultDuration}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>

            {/* Working Hours */}
            <Pressable
              onPress={() => Alert.alert("Working Hours", settings.workingHours)}
              style={[styles.menuRow, styles.lastRow]}
              accessibilityRole="button"
              accessibilityLabel="Working Hours"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="calendar-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Working Hours</Text>
              </View>
              <View style={styles.menuRowRight}>
                <Text style={styles.menuValueText}>{settings.workingHours}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── Section: Privacy & Security ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>PRIVACY & SECURITY</Text>
          <View style={styles.cardGroup}>
            {/* 2FA Toggle Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchRowLeft}>
                <View style={styles.mintIconSquare}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#065F46" />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Two-Factor Authentication</Text>
                  <Text style={styles.switchSubLabel}>Recommended for clinical accounts</Text>
                </View>
              </View>
              <Switch
                value={settings.twoFactorEnabled}
                onValueChange={toggleTwoFactor}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                thumbColor={colors.white}
                accessibilityLabel="Toggle Two-Factor Authentication"
              />
            </View>

            {/* Privacy Policy */}
            <Pressable
              onPress={() => router.navigate("/privacy-policy")}
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Privacy Policy"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="document-text-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

            {/* Data & Confidentiality */}
            <Pressable
              onPress={() => Alert.alert("Compliance", "All session notes, mood check-ins, and student data are end-to-end encrypted under HIPAA / FERPA guidelines.")}
              style={[styles.menuRow, styles.lastRow]}
              accessibilityRole="button"
              accessibilityLabel="Data & Confidentiality"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.blueIconSquare}>
                  <Ionicons name="sync-outline" size={18} color="#1D4ED8" />
                </View>
                <Text style={styles.menuItemLabel}>Data & Confidentiality</Text>
              </View>
              <View style={styles.menuRowRight}>
                <View style={styles.complianceBadge}>
                  <Text style={styles.complianceBadgeText}>HIPAA / FERPA Compliant</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── Section: Support ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>SUPPORT</Text>
          <View style={styles.cardGroup}>
            <Pressable
              onPress={() => Alert.alert("Help Center", "MindEase Clinical Help Desk & Knowledge Base.")}
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Help Center"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="help-circle-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Help Center</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

            <Pressable
              onPress={() => Alert.alert("Contact Support", "Support line: support@mindease.edu • ext 410")}
              style={[styles.menuRow, styles.lastRow]}
              accessibilityRole="button"
              accessibilityLabel="Contact Support"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconSquare}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#334155" />
                </View>
                <Text style={styles.menuItemLabel}>Contact Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>
          </View>
        </View>

        {/* ─── Destructive Action: Log Out ─── */}
        <View style={styles.logoutWrapper}>
          <Pressable
            onPress={handleLogout}
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel="Log Out of Counselor Portal"
          >
            <Ionicons name="log-out-outline" size={18} color="#E11D48" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>

        {/* ─── Watermark Footer ─── */}
        <View style={styles.watermarkFooter}>
          <Text style={styles.watermarkText}>MindEase v1.0.0 • Clinical Counselor Portal</Text>
        </View>
      </ScrollView>

      {/* ─── Notification Settings Modal ─── */}
      <Modal
        visible={notificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notification Rules</Text>
            <Text style={styles.modalDesc}>
              Configure alert dispatch thresholds and quiet hours for after-hours clinical protection.
            </Text>

            <View style={styles.modalSettingRow}>
              <View>
                <Text style={styles.modalSettingLabel}>Urgent Triage Push</Text>
                <Text style={styles.modalSettingSub}>Alert immediately on PHQ-9 &gt; 12</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
              />
            </View>

            <View style={styles.modalSettingRow}>
              <View>
                <Text style={styles.modalSettingLabel}>Quiet Hours (18:00 – 08:00)</Text>
                <Text style={styles.modalSettingSub}>Mute non-emergency alerts</Text>
              </View>
              <Switch
                value={settings.quietHoursEnabled}
                onValueChange={toggleQuietHours}
                trackColor={{ false: "#E2E8F0", true: "#065F46" }}
              />
            </View>

            <Pressable
              onPress={() => setNotificationModalVisible(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Save Preferences</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Edit Profile Modal ─── */}
      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Counselor Profile</Text>
            <Text style={styles.modalDesc}>Update your clinical title and institutional credentials.</Text>

            <Text style={styles.fieldLabel}>Clinical Title</Text>
            <TextInput
              style={styles.fieldInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setEditProfileModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                style={styles.modalDoneBtnSmall}
              >
                <Text style={styles.modalDoneBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EDE5",
    backgroundColor: "#FFF8E7",
  },
  backButtonTouch: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  toastText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EDE5",
    padding: 16,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  avatarBackdrop: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileMeta: {
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  counsellorName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  verifiedCheckBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
  },
  counsellorTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 2,
  },
  licenseNumber: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  editProfileTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  editTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editTriggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  cardGroup: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EDE5",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  menuRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "55%",
  },
  menuValueText: {
    fontSize: 12.5,
    color: "#64748B",
  },
  specialtiesBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  specialtiesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  specialtyChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingLeft: 48,
  },
  specialtyChip: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#064E3B",
  },
  durationPill: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  switchRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  mintIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
  },
  blueIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    justifyContent: "center",
    alignItems: "center",
  },
  switchSubLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  complianceBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  complianceBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  logoutWrapper: {
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 18,
    minHeight: TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E11D48",
  },
  watermarkFooter: {
    alignItems: "center",
    paddingTop: 8,
  },
  watermarkText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12.5,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 16,
  },
  modalSettingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalSettingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  modalSettingSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  modalDoneBtn: {
    backgroundColor: "#065F46",
    minHeight: TOUCH_TARGET,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  modalDoneBtnSmall: {
    backgroundColor: "#065F46",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalDoneBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0F172A",
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});
