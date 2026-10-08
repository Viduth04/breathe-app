// Counsellor Settings Screen - Muaath (Member 4). Supports FR01, FR05, FR08.
// Verified settings panel for counselor profile, practice details, account security, 2FA, and logout.
// Real data is loaded from and persisted directly to the Firestore database (counsellors/{uid} and counselorPreferences/{uid}).

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
    toggleTwoFactor,
    updateProfile,
    setProfileAvatar,
    cleanupFirebaseSync,
  } = useCounsellorStore();

  const { showToast, confirm, alert } = usePopup();

  // Avatar Management State
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Authenticated Counselor Email
  const currentEmail = auth.currentUser?.email || settings.email || "counselor@sliit.lk";

  // Two-Factor Authentication Setup Modal State
  const [twoFactorModalVisible, setTwoFactorModalVisible] = useState(false);
  const [isUpdating2FA, setIsUpdating2FA] = useState(false);

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
  const [formOrganization, setFormOrganization] = useState(profile.organization || "SLIIT Wellness Center");
  const [formErrors, setFormErrors] = useState<ProfileValidationErrors>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditProfile = () => {
    setFormFullName(profile.fullName);
    setFormTitle(profile.title);
    setFormBio(profile.bio || "Dedicated clinical counselor focused on student mental wellbeing and academic stress management.");
    setFormExperience(String(profile.experienceYears ?? 8));
    setFormSpecialties((profile.specialties as Specialty[]) || ["Anxiety", "Stress", "Academic Pressure"]);
    setFormLanguages((profile.languages as Language[]) || ["English", "Sinhala"]);
    setFormOrganization(profile.organization || "SLIIT Wellness Center");
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

      setProfileAvatar?.(freshUrl);
      showToast(POPUP_MESSAGES.toasts.profileSaved, "success");
    } catch (err: any) {
      console.warn("[settings] Pick image error:", err?.message || err);
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

      setProfileAvatar?.(freshUrl);
      showToast(POPUP_MESSAGES.toasts.profileSaved, "success");
    } catch (err: any) {
      console.warn("[settings] Camera photo error:", err?.message || err);
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
        setProfileAvatar?.("");
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

      // 1. Store update
      updateProfile?.({
        fullName: payload.fullName,
        title: payload.title,
        bio: payload.bio,
        specialties: payload.specialties,
        languages: payload.languages,
        experienceYears: payload.experienceYears,
        organization: payload.organization,
      });

      // 2. Persist to Firestore counsellors/{uid}
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

  // ─── Verified Two-Factor Authentication Logic ───
  const handleToggle2FA = async (targetValue?: boolean) => {
    const shouldEnable = typeof targetValue === "boolean" ? targetValue : !settings.twoFactorEnabled;

    if (shouldEnable) {
      // Opening informative setup sheet for verification confirmation
      setTwoFactorModalVisible(true);
    } else {
      // Confirming before disabling security
      const shouldDisable = await confirm({
        title: "Disable Two-Factor Authentication?",
        message: "Disabling 2FA reduces account security. Student clinical notes and intake assessments will no longer require secondary verification.",
        confirmLabel: "Disable 2FA",
        cancelLabel: "Keep Protected",
        isDestructive: true,
        variant: "destructive",
        icon: "shield-outline",
      });

      if (shouldDisable) {
        setIsUpdating2FA(true);
        try {
          await toggleTwoFactor(false);
          showToast("Two-Factor Authentication disabled and updated in database.", "info");
        } catch {
          showToast("Failed to update 2FA status in database.", "error");
        } finally {
          setIsUpdating2FA(false);
        }
      }
    }
  };

  const handleConfirmEnable2FA = async () => {
    setIsUpdating2FA(true);
    try {
      await toggleTwoFactor(true);
      setTwoFactorModalVisible(false);
      showToast("Two-Factor Authentication enabled and saved to database.", "success");
    } catch {
      showToast("Could not save 2FA status to database.", "error");
    } finally {
      setIsUpdating2FA(false);
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

            {/* Details & Credentials */}
            <View style={styles.profileMeta}>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.counsellorName}>{profile.fullName}</Text>
                <View style={styles.verifiedCheckBadge}>
                  <Ionicons name="checkmark" size={11} color={colors.white} />
                </View>
              </View>
              <Text style={styles.counsellorTitle}>
                {profile.title || "Licensed clinical psychologist"} • {profile.organization || "SLIIT Wellness Center"}
              </Text>
              <Text style={styles.licenseNumber}>
                {settings.credentials || "PhD, MSc Clinical Psych"}
              </Text>
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
              <Ionicons name="create-outline" size={16} color="#065F46" />
              <Text style={styles.editTriggerText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#065F46" />
          </Pressable>
        </View>

        {/* ─── Section: Account ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>ACCOUNT</Text>
          <View style={styles.cardGroup}>
            {/* Email Row */}
            <Pressable
              onPress={() => alert("Registered Clinical Email", `Signed in as ${currentEmail}`)}
              style={[styles.menuRow, styles.lastRow]}
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
                  {currentEmail}
                </Text>
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
              onPress={() => alert("Academic & Clinical Accreditations", settings.credentials || "PhD, MSc Clinical Psych")}
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
                <Text style={styles.menuValueText}>{settings.credentials || "PhD, MSc Clinical Psych"}</Text>
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
                <Pressable onPress={handleOpenEditProfile} hitSlop={8}>
                  <Ionicons name="create-outline" size={16} color="#065F46" />
                </Pressable>
              </View>

              {/* Specialty Chips */}
              <View style={styles.specialtyChipsContainer}>
                {((profile.specialties && profile.specialties.length > 0) ? profile.specialties : settings.specialties).map((spec, idx) => (
                  <View key={idx} style={styles.specialtyChip}>
                    <Text style={styles.specialtyChipText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bio Row */}
            <Pressable
              onPress={() => alert("Counselor Clinical Bio", profile.bio || settings.bio || "Dedicated clinical counselor focused on student mental wellbeing and academic stress management.")}
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
                <Text style={styles.menuValueText} numberOfLines={1}>{profile.bio || settings.bio}</Text>
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

            {/* Verified Two-Factor Authentication Row */}
            <View style={styles.twoFactorRow}>
              <View style={styles.twoFactorTopRow}>
                <View style={styles.switchRowLeft}>
                  <View style={styles.mintIconSquare}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#065F46" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemLabel}>Two-Factor Authentication</Text>
                    <Text style={styles.switchSubLabel}>
                      {settings.twoFactorEnabled
                        ? "Enforced for this clinical account (Email & SMS)"
                        : "Recommended to protect student clinical notes"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.twoFactorEnabled}
                  onValueChange={handleToggle2FA}
                  trackColor={{ false: "#E2E8F0", true: "#065F46" }}
                  thumbColor={colors.white}
                  disabled={isUpdating2FA}
                  accessibilityLabel="Toggle Two-Factor Authentication"
                />
              </View>

              {/* Status Badge Strip */}
              <View style={styles.twoFactorBadgeStrip}>
                <View
                  style={[
                    styles.twoFactorStatusBadge,
                    settings.twoFactorEnabled ? styles.badge2FAActive : styles.badge2FAWarning,
                  ]}
                >
                  <Ionicons
                    name={settings.twoFactorEnabled ? "checkmark-circle" : "alert-circle"}
                    size={13}
                    color={settings.twoFactorEnabled ? "#065F46" : "#B45309"}
                  />
                  <Text
                    style={[
                      styles.twoFactorStatusText,
                      settings.twoFactorEnabled ? styles.text2FAActive : styles.text2FAWarning,
                    ]}
                  >
                    {settings.twoFactorEnabled ? "2FA Protected • Cloud Verified" : "Action Recommended"}
                  </Text>
                </View>

                {!settings.twoFactorEnabled && (
                  <Pressable
                    onPress={() => setTwoFactorModalVisible(true)}
                    style={styles.enableNowLink}
                    hitSlop={6}
                  >
                    <Text style={styles.enableNowLinkText}>Setup ➜</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Privacy Policy */}
            <Pressable
              onPress={() => router.navigate("/privacy-policy")}
              style={[styles.menuRow, styles.lastRow]}
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
          </View>
        </View>

        {/* ─── Section: Support ─── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>SUPPORT</Text>
          <View style={styles.cardGroup}>
            <Pressable
              onPress={() => alert("Contact Support", "Counselor Help Line: support@breathe.sliit.lk • University Ext 410")}
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

      {/* ─── 2FA Setup & Verification Modal ─── */}
      <Modal
        visible={twoFactorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTwoFactorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.twoFactorIconHeader}>
              <View style={styles.twoFactorIconCircle}>
                <Ionicons name="shield-checkmark" size={32} color="#065F46" />
              </View>
            </View>

            <Text style={styles.twoFactorModalTitle}>Enable Two-Factor Authentication</Text>
            <Text style={styles.twoFactorModalDesc}>
              Strengthen the confidentiality of your student caseload. When signing in from a new browser or device, a verification passcode will be required.
            </Text>

            <View style={styles.twoFactorDetailsBox}>
              <View style={styles.twoFactorDetailRow}>
                <Ionicons name="mail" size={16} color="#065F46" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.twoFactorDetailLabel}>Verification Destination</Text>
                  <Text style={styles.twoFactorDetailValue}>{currentEmail}</Text>
                </View>
              </View>
              <View style={styles.twoFactorDetailRow}>
                <Ionicons name="lock-closed" size={16} color="#065F46" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.twoFactorDetailLabel}>Compliance Standard</Text>
                  <Text style={styles.twoFactorDetailValue}>SLIIT Mental Health Data Privacy Protocol</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleConfirmEnable2FA}
              style={[styles.modalConfirmBtn, isUpdating2FA && { opacity: 0.8 }]}
              disabled={isUpdating2FA}
              accessibilityRole="button"
              accessibilityLabel="Confirm Enable 2FA"
            >
              {isUpdating2FA ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.modalConfirmBtnText}>Enable 2FA Protection</Text>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => setTwoFactorModalVisible(false)}
              style={styles.modalCancelBtnFull}
              disabled={isUpdating2FA}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
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
              Upload a clear professional photo. Photos are resized, optimized, and saved to your profile.
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
                  placeholder="e.g. Licensed Clinical Psychologist"
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
                  placeholder="e.g. SLIIT Wellness Center"
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
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E6EDE5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarTouchContainer: {
    position: "relative",
  },
  avatarBackdrop: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarUploadPctText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    marginTop: 2,
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#065F46",
    borderWidth: 2,
    borderColor: colors.white,
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
    fontSize: 18,
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
    fontWeight: "700",
    color: "#065F46",
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
    color: "#065F46",
  },
  twoFactorRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  twoFactorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  switchSubLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  twoFactorBadgeStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingLeft: 48,
  },
  twoFactorStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badge2FAActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badge2FAWarning: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  twoFactorStatusText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  text2FAActive: {
    color: "#065F46",
  },
  text2FAWarning: {
    color: "#B45309",
  },
  enableNowLink: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  enableNowLinkText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#065F46",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    width: "100%",
    maxWidth: 420,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 12.5,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 16,
  },
  twoFactorIconHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  twoFactorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
  },
  twoFactorModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  twoFactorModalDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
    textAlign: "center",
    marginBottom: 16,
  },
  twoFactorDetailsBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 18,
  },
  twoFactorDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  twoFactorDetailLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  twoFactorDetailValue: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 1,
  },
  modalConfirmBtn: {
    backgroundColor: "#065F46",
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  modalCancelBtnFull: {
    marginTop: 10,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  sheetActionsList: {
    gap: 10,
    marginBottom: 10,
  },
  sheetActionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sheetActionDestructive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  sheetActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    marginTop: 1,
  },
  editProfileModalContent: {
    maxHeight: "88%",
  },
  editProfileScrollInner: {
    gap: 14,
    paddingBottom: 10,
  },
  formFieldGroup: {
    gap: 6,
  },
  labelCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#334155",
  },
  requiredStar: {
    color: "#DC2626",
  },
  charCountText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  fieldTextArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  fieldInputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  fieldErrorText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  chipItemSelected: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  chipTextSelected: {
    color: colors.white,
  },
  modalBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalDoneBtnSmall: {
    backgroundColor: "#065F46",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});
