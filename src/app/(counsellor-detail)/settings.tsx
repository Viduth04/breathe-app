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
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { logout } from "@/services/authService";
import { usePopup, POPUP_MESSAGES } from "@/components/common/popup";
import {
  SPECIALTIES,
  LANGUAGES,
  Specialty,
  Language,
} from "@/types/counsellor";
import {
  pickAvatarFromLibrary,
  takeAvatarWithCamera,
  uploadCounsellorAvatar,
  deleteCounsellorAvatar,
  persistCounsellorProfile,
  validateProfileInput,
  ProfileValidationErrors,
} from "@/services/counsellorProfileService";
import { auth } from "@/services/counsellorFirebaseConfig";

export default function CounselorSettingsScreen() {
  const {
    profile,
    settings,
    isAvailable,
    toggleAvailability,
    toggleTwoFactor,
    toggleQuietHours,
    updateSettings,
    updateProfile,
    setProfileAvatar,
    cleanupFirebaseSync,
  } = useCounsellorStore();

  const { showToast, confirm, alert } = usePopup();

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit Profile Form State
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [formFullName, setFormFullName] = useState(profile.fullName);
  const [formTitle, setFormTitle] = useState(profile.title);
  const [formBio, setFormBio] = useState(
    profile.bio || "Dedicated clinical counselor focused on student mental wellbeing and academic stress management."
  );
  const [formExperience, setFormExperience] = useState(String(profile.experienceYears ?? 8));
  const [formSpecialties, setFormSpecialties] = useState<Specialty[]>(
    (profile.specialties as Specialty[]) || ["Anxiety", "Stress", "Academic Pressure"]
  );
  const [formLanguages, setFormLanguages] = useState<Language[]>(
    (profile.languages as Language[]) || ["English", "Sinhala"]
  );
  const [formOrganization, setFormOrganization] = useState(profile.organization || "MindEase");
  const [formErrors, setFormErrors] = useState<ProfileValidationErrors>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditProfile = () => {
    setFormFullName(profile.fullName);
    setFormTitle(profile.title);
    setFormBio(profile.bio || "Dedicated clinical counselor focused on student mental wellbeing and academic stress management.");
    setFormExperience(String(profile.experienceYears ?? 8));
    setFormSpecialties((profile.specialties as Specialty[]) || ["Anxiety", "Stress", "Academic Pressure"]);
    setFormLanguages((profile.languages as Language[]) || ["English", "Sinhala"]);
    setFormOrganization(profile.organization || "MindEase");
    setFormErrors({});
    setEditProfileModalVisible(true);
  };

  const handlePickFromLibrary = async () => {
    setAvatarSheetVisible(false);
    try {
      const uri = await pickAvatarFromLibrary();
      if (!uri) return; // User cancelled

      setIsUploadingAvatar(true);
      setUploadProgress(15);
      const counsellorId = auth.currentUser?.uid || "counselor-anjali";
      const freshUrl = await uploadCounsellorAvatar(counsellorId, uri, (pct) => {
        setUploadProgress(pct);
      });

      setProfileAvatar(freshUrl);
      showToast(POPUP_MESSAGES.toasts.profileSaved, "success");
    } catch (err: any) {
      console.warn("[settings] Pick image error:", err);
      showToast(err?.message || "Could not select photo", "error");
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  const handleTakePhoto = async () => {
    setAvatarSheetVisible(false);
    try {
      const uri = await takeAvatarWithCamera();
      if (!uri) return;

      setIsUploadingAvatar(true);
      setUploadProgress(15);
      const counsellorId = auth.currentUser?.uid || "counselor-anjali";
      const freshUrl = await uploadCounsellorAvatar(counsellorId, uri, (pct) => {
        setUploadProgress(pct);
      });

      setProfileAvatar(freshUrl);
      showToast(POPUP_MESSAGES.toasts.profileSaved, "success");
    } catch (err: any) {
      console.warn("[settings] Camera photo error:", err);
      showToast(err?.message || "Could not take photo", "error");
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarSheetVisible(false);
    const confirmed = await confirm({
      title: "Remove Profile Picture",
      message: "Are you sure you want to remove your profile picture? Students will see the default clinical avatar.",
      isDestructive: true,
      variant: "destructive",
      icon: "trash-outline",
    });

    if (confirmed) {
      try {
        const counsellorId = auth.currentUser?.uid || "counselor-anjali";
        await deleteCounsellorAvatar(counsellorId);
        setProfileAvatar("");
        showToast("Profile picture removed", "info");
      } catch (err: any) {
        showToast("Failed to remove avatar", "error");
      }
    }
  };

  const toggleSpecialty = (spec: Specialty) => {
    if (formSpecialties.includes(spec)) {
      if (formSpecialties.length <= 1) {
        showToast("Please keep at least 1 specialty", "warning");
        return;
      }
      setFormSpecialties(formSpecialties.filter((s) => s !== spec));
    } else {
      if (formSpecialties.length >= 6) {
        showToast("Maximum 6 specialties allowed", "warning");
        return;
      }
      setFormSpecialties([...formSpecialties, spec]);
    }
  };

  const toggleLanguage = (lang: Language) => {
    if (formLanguages.includes(lang)) {
      if (formLanguages.length <= 1) {
        showToast("Please keep at least 1 language", "warning");
        return;
      }
      setFormLanguages(formLanguages.filter((l) => l !== lang));
    } else {
      setFormLanguages([...formLanguages, lang]);
    }
  };

  const handleSaveProfile = async () => {
    const expNum = parseInt(formExperience.trim(), 10);
    const payload = {
      fullName: formFullName.trim(),
      title: formTitle.trim(),
      bio: formBio.trim(),
      specialties: formSpecialties,
      languages: formLanguages,
      experienceYears: isNaN(expNum) ? 0 : expNum,
      organization: formOrganization.trim(),
      photoURL: profile.avatarUrl,
    };

    const errors = validateProfileInput(payload);
    if (errors) {
      setFormErrors(errors);
      showToast(
        errors.fullName || errors.title || errors.bio || errors.experienceYears || errors.general || "Please fix errors",
        "warning"
      );
      return;
    }

    try {
      setIsSavingProfile(true);
      const counsellorId = auth.currentUser?.uid || "counselor-anjali";

      // 1. Optimistic store update
      updateProfile({
        fullName: payload.fullName,
        title: payload.title,
        bio: payload.bio,
        specialties: payload.specialties,
        languages: payload.languages,
        experienceYears: payload.experienceYears,
        organization: payload.organization,
      });

      // 2. Persist to Firestore
      await persistCounsellorProfile(counsellorId, payload);

      setEditProfileModalVisible(false);
      showToast(POPUP_MESSAGES.toasts.profileSaved, "success");
    } catch (err: any) {
      console.warn("[settings] Save profile error:", err);
      showToast(err?.message || "Failed to save profile. Please try again.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    const shouldLogout = await confirm({
      ...POPUP_MESSAGES.confirmations.logOut,
      isDestructive: true,
      variant: "destructive",
      icon: "log-out",
    });

    if (shouldLogout) {
      try {
        cleanupFirebaseSync();
        await logout();
      } catch {
        // Fallback to welcome screen
      }
      router.replace("/(auth)/welcome");
    }
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
        {/* ─── Profile Header Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* Avatar with Photo & Camera Upload Trigger */}
            <Pressable
              onPress={() => setAvatarSheetVisible(true)}
              style={styles.avatarTouchContainer}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
            >
              <View style={styles.avatarBackdrop}>
                {profile.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={styles.avatarImage}
                    accessibilityLabel={`${profile.fullName} profile photo`}
                  />
                ) : (
                  <Ionicons name="person" size={28} color="#065F46" />
                )}
                {isUploadingAvatar && (
                  <View style={styles.avatarUploadOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.avatarUploadPctText}>{uploadProgress}%</Text>
                  </View>
                )}
              </View>
              <View style={styles.avatarCameraBadge}>
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              </View>
            </Pressable>

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
            onPress={handleOpenEditProfile}
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
              onPress={() => alert("Registered Clinical Email", settings.email)}
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
              onPress={() => alert("Direct Consultation Hotline", settings.phoneNumber)}
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
              onPress={() => showToast(POPUP_MESSAGES.toasts.passwordResetSent, "success")}
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
              onPress={() => alert("Academic & Clinical Accreditations", settings.credentials)}
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
              onPress={() => alert("Counselor Clinical Bio", settings.bio || "10+ years student clinical wellness counselor at SLIIT.")}
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
              onPress={() => alert("Clinical Working Hours", settings.workingHours)}
              style={styles.menuRow}
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

            {/* Patients Directory */}
            <Pressable
              onPress={() => router.navigate("/(counsellor-detail)/patients-list")}
              style={[styles.menuRow, styles.lastRow]}
              accessibilityRole="button"
              accessibilityLabel="Patients Caseload Directory"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.mintIconSquare}>
                  <Ionicons name="people-outline" size={18} color="#065F46" />
                </View>
                <Text style={styles.menuItemLabel}>Patients Directory</Text>
              </View>
              <View style={styles.menuRowRight}>
                <View style={styles.durationPill}>
                  <Text style={styles.durationPillText}>24 Caseload</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── Section: Privacy & Security ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>PRIVACY & SECURITY</Text>
          <View style={styles.cardGroup}>
            {/* Clinical Alerts & Preferences */}
            <Pressable
              onPress={() => router.navigate("/(counsellor-detail)/clinical-alerts-preferences")}
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel="Clinical Alerts and Notification Preferences"
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.mintIconSquare}>
                  <Ionicons name="notifications-outline" size={18} color="#065F46" />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Clinical Alerts & Preferences</Text>
                  <Text style={styles.switchSubLabel}>Triage flags, quiet hours & lead times</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

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
              onPress={() => alert("FERPA & HIPAA Compliance", "All session notes, mood check-ins, and student consultation records are encrypted under SLIIT healthcare guidelines.")}
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
              onPress={() => alert("Clinical Help Center", "Breathe Clinical Help Desk & SLIIT Wellness Knowledge Base.")}
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
              onPress={() => alert("Contact Support", "Counselor Help Line: support@breathe.sliit.lk • Ext 410")}
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
          <Text style={styles.watermarkText}>Breathe v1.0.0 • Clinical Counselor Portal</Text>
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

      {/* ─── Avatar Options Modal ─── */}
      <Modal
        visible={avatarSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Profile Picture</Text>
              <Pressable
                onPress={() => setAvatarSheetVisible(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>
            <Text style={styles.modalDesc}>
              Upload a clear professional photo. Photos are resized, optimized, and stripped of personal metadata.
            </Text>

            <View style={styles.sheetActionsList}>
              <Pressable
                onPress={handleTakePhoto}
                style={styles.sheetActionItem}
                accessibilityRole="button"
                accessibilityLabel="Take Photo with Camera"
              >
                <View style={styles.sheetActionIconBox}>
                  <Ionicons name="camera-outline" size={20} color="#065F46" />
                </View>
                <View style={styles.sheetActionTextBox}>
                  <Text style={styles.sheetActionTitle}>Take Photo</Text>
                  <Text style={styles.sheetActionSub}>Use your device camera</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>

              <Pressable
                onPress={handlePickFromLibrary}
                style={styles.sheetActionItem}
                accessibilityRole="button"
                accessibilityLabel="Choose from Photo Library"
              >
                <View style={styles.sheetActionIconBox}>
                  <Ionicons name="images-outline" size={20} color="#065F46" />
                </View>
                <View style={styles.sheetActionTextBox}>
                  <Text style={styles.sheetActionTitle}>Choose from Library</Text>
                  <Text style={styles.sheetActionSub}>Select from saved images</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>

              {Boolean(profile.avatarUrl) && (
                <Pressable
                  onPress={handleRemoveAvatar}
                  style={[styles.sheetActionItem, styles.sheetActionDestructive]}
                  accessibilityRole="button"
                  accessibilityLabel="Remove Profile Picture"
                >
                  <View style={[styles.sheetActionIconBox, styles.destructiveIconBox]}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </View>
                  <View style={styles.sheetActionTextBox}>
                    <Text style={[styles.sheetActionTitle, { color: "#DC2626" }]}>
                      Remove Picture
                    </Text>
                    <Text style={styles.sheetActionSub}>Revert to default clinical icon</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => setAvatarSheetVisible(false)}
              style={styles.modalCancelBtnFull}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Edit Profile Modal ─── */}
      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.editProfileModalContent]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Counselor Profile</Text>
                <Text style={styles.modalDesc}>
                  Update your public details visible to students across Breathe.
                </Text>
              </View>
              <Pressable
                onPress={() => setEditProfileModalVisible(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editProfileScrollInner}
            >
              {/* Full Name */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.fieldLabel}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    Boolean(formErrors.fullName) && styles.fieldInputError,
                  ]}
                  value={formFullName}
                  onChangeText={(val) => {
                    setFormFullName(val);
                    if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: undefined });
                  }}
                  placeholder="e.g. Dr. Anjali Perera"
                  placeholderTextColor="#94A3B8"
                  maxLength={80}
                />
                {Boolean(formErrors.fullName) && (
                  <Text style={styles.fieldErrorText}>{formErrors.fullName}</Text>
                )}
              </View>

              {/* Clinical Title */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.fieldLabel}>
                  Clinical Title <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    Boolean(formErrors.title) && styles.fieldInputError,
                  ]}
                  value={formTitle}
                  onChangeText={(val) => {
                    setFormTitle(val);
                    if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                  }}
                  placeholder="e.g. Lead Clinical Counselor"
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                />
                {Boolean(formErrors.title) && (
                  <Text style={styles.fieldErrorText}>{formErrors.title}</Text>
                )}
              </View>

              {/* Organization */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.fieldLabel}>Organization / Practice Unit</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formOrganization}
                  onChangeText={setFormOrganization}
                  placeholder="e.g. MindEase"
                  placeholderTextColor="#94A3B8"
                  maxLength={80}
                />
              </View>

              {/* Experience Years */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.fieldLabel}>
                  Years of Experience <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    Boolean(formErrors.experienceYears) && styles.fieldInputError,
                  ]}
                  value={formExperience}
                  onChangeText={(val) => {
                    setFormExperience(val.replace(/[^0-9]/g, ""));
                    if (formErrors.experienceYears) {
                      setFormErrors({ ...formErrors, experienceYears: undefined });
                    }
                  }}
                  placeholder="e.g. 8"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={2}
                />
                {Boolean(formErrors.experienceYears) && (
                  <Text style={styles.fieldErrorText}>{formErrors.experienceYears}</Text>
                )}
              </View>

              {/* Clinical Bio */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelCountRow}>
                  <Text style={styles.fieldLabel}>
                    Clinical Bio <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <Text style={styles.charCountText}>{formBio.length}/300</Text>
                </View>
                <TextInput
                  style={[
                    styles.fieldInput,
                    styles.fieldTextArea,
                    Boolean(formErrors.bio) && styles.fieldInputError,
                  ]}
                  value={formBio}
                  onChangeText={(val) => {
                    setFormBio(val);
                    if (formErrors.bio) setFormErrors({ ...formErrors, bio: undefined });
                  }}
                  placeholder="Write a welcoming summary of your practice style for students..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                />
                {Boolean(formErrors.bio) && (
                  <Text style={styles.fieldErrorText}>{formErrors.bio}</Text>
                )}
              </View>

              {/* Clinical Specialties */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.fieldLabel}>
                  Clinical Specialties (1–6) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.chipGrid}>
                  {SPECIALTIES.map((spec) => {
                    const isSelected = formSpecialties.includes(spec);
                    return (
                      <Pressable
                        key={spec}
                        onPress={() => toggleSpecialty(spec)}
                        style={[
                          styles.chipItem,
                          isSelected && styles.chipItemSelected,
                        ]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#FFFFFF"
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {spec}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Spoken Languages */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.fieldLabel}>
                  Spoken Languages <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.chipGrid}>
                  {LANGUAGES.map((lang) => {
                    const isSelected = formLanguages.includes(lang);
                    return (
                      <Pressable
                        key={lang}
                        onPress={() => toggleLanguage(lang)}
                        style={[
                          styles.chipItem,
                          isSelected && styles.chipItemSelected,
                        ]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#FFFFFF"
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {lang}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setEditProfileModalVisible(false)}
                style={styles.modalCancelBtn}
                disabled={isSavingProfile}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                style={[
                  styles.modalDoneBtnSmall,
                  isSavingProfile && { opacity: 0.7 },
                ]}
                disabled={isSavingProfile}
                accessibilityRole="button"
                accessibilityLabel="Save Profile Changes"
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDoneBtnText}>Save Profile</Text>
                )}
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
  avatarTouchContainer: {
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#065F46",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarUploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarUploadPctText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  sheetActionsList: {
    marginVertical: 10,
    gap: 8,
  },
  sheetActionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  sheetActionDestructive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  sheetActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  destructiveIconBox: {
    backgroundColor: "#FEE2E2",
  },
  sheetActionTextBox: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  sheetActionSub: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  modalCancelBtnFull: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  editProfileModalContent: {
    maxHeight: "85%",
    paddingBottom: 16,
  },
  editProfileScrollInner: {
    paddingVertical: 8,
    gap: 12,
  },
  formFieldGroup: {
    gap: 4,
  },
  requiredStar: {
    color: "#DC2626",
    fontWeight: "700",
  },
  fieldInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  fieldErrorText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "600",
    marginTop: -2,
    marginBottom: 4,
  },
  labelCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCountText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  fieldTextArea: {
    minHeight: 70,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chipItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipItemSelected: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
