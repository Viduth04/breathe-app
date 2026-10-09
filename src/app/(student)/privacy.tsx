import AuthHeader from "@/components/auth/AuthHeader";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import PasswordModal from "@/components/privacy/PasswordModal";
import { useAuth } from "@/context/AuthContext";
import {
  deleteMyData,
  getAuthErrorMessage,
  updatePrivacySettings,
} from "@/services/authService";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

type Settings = { anonymousMode: boolean; shareMoodWithCounsellor: boolean };

const DELETE_TITLE = "Delete all your data?";
const DELETE_MESSAGE =
  "This permanently deletes your check-ins, bookings, chats and messages, check-in reminders, and account. This can't be undone.";

// Alert.alert has no buttons on web, so fall back to the browser's confirm dialog
function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${DELETE_TITLE}\n\n${DELETE_MESSAGE}`)) onConfirm();
    return;
  }
  Alert.alert(DELETE_TITLE, DELETE_MESSAGE, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}

// Firebase reports a wrong password as either code depending on project settings
const WRONG_PASSWORD_CODES = ["auth/invalid-credential", "auth/wrong-password"];

function ToggleCard({
  title,
  description,
  value,
  onValueChange,
  disabled,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
          accessibilityLabel={title}
          accessibilityHint={description}
        />
      </View>
      <Text style={[typography.caption, styles.toggleDescription]}>
        {description}
      </Text>
    </Card>
  );
}

export default function Privacy() {
  const { user, profile } = useAuth();
  // Unsaved edits; null means "show what's saved in the profile"
  const [draft, setDraft] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();

  const current: Settings = draft ?? {
    anonymousMode: profile?.anonymousMode ?? true,
    shareMoodWithCounsellor: profile?.shareMoodWithCounsellor ?? false,
  };
  const busy = saving || deleting;

  const change = (patch: Partial<Settings>) => {
    setDraft({ ...current, ...patch });
    setSaved(false);
    setError(undefined);
  };

  const handleSave = async () => {
    if (!user) return;
    setError(undefined);
    setSaving(true);
    try {
      await updatePrivacySettings(user.uid, current);
      setDraft(null); // AuthContext's live profile now holds the saved values
      setSaved(true);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // On success the (student) layout sees no user and redirects to Welcome.
  // Email accounts pass their password; guests call this with none.
  const handleDelete = async (password?: string) => {
    setError(undefined);
    setPasswordError(undefined);
    setDeleting(true);
    try {
      await deleteMyData(password);
    } catch (e: any) {
      if (password === undefined) setError(getAuthErrorMessage(e));
      else if (WRONG_PASSWORD_CODES.includes(e?.code))
        setPasswordError("That password is incorrect. Try again.");
      else setPasswordError(getAuthErrorMessage(e));
      setDeleting(false);
    }
  };

  // Guests have no password, so they skip straight to deletion
  const handleDeletePress = () =>
    confirmDelete(() => {
      if (user?.isAnonymous) {
        handleDelete();
      } else {
        setPasswordError(undefined);
        setPasswordVisible(true);
      }
    });

  return (
    <Screen>
      <AuthHeader />

      <View style={styles.header}>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          Privacy & Data
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          Choose how your information is handled
        </Text>
      </View>

      <ToggleCard
        title="Anonymous Mode"
        description="Hide personally identifiable info and show a masked student profile during active sessions"
        value={current.anonymousMode}
        onValueChange={(anonymousMode) => change({ anonymousMode })}
        disabled={busy || !profile}
      />
      <ToggleCard
        title="Share mood data with counsellor"
        description="Let a counsellor you have a confirmed session with see your check-ins"
        value={current.shareMoodWithCounsellor}
        onValueChange={(shareMoodWithCounsellor) =>
          change({ shareMoodWithCounsellor })
        }
        disabled={busy || !profile}
      />

      <Card variant="success" style={styles.notice}>
        <View style={styles.noticeTitleRow}>
          <Ionicons
            name="lock-closed"
            size={16}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.noticeTitle}>Strict Confidentiality</Text>
        </View>
        <Text style={typography.caption}>
          Your data is never shared with faculty or lecturers.
        </Text>
      </Card>

      <Pressable
        onPress={() => router.push("/crisis")}
        accessibilityRole="link"
        accessibilityLabel="Need urgent help? Open crisis support"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.row}>
          <Ionicons
            name="help-buoy-outline"
            size={20}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.rowText}>Need urgent help?</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Card>
      </Pressable>

      <Pressable
        onPress={() => router.push("/privacy-policy")}
        accessibilityRole="link"
        accessibilityLabel="View privacy policy"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.row}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.rowText}>View Privacy Policy</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </Card>
      </Pressable>

      <Pressable
        onPress={handleDeletePress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Delete my data"
        accessibilityHint="Permanently deletes your check-ins, bookings, chats, reminders and account"
        accessibilityState={{ disabled: busy, busy: deleting }}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.row}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={colors.danger}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.rowText}>Delete My Data</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PERMANENT</Text>
          </View>
          {deleting ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          )}
        </Card>
      </Pressable>

      <View style={styles.spacer} />

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {saved ? (
        <Text style={styles.saved} accessibilityRole="alert">
          Settings saved
        </Text>
      ) : null}

      <Button
        title="Save Settings"
        onPress={handleSave}
        loading={saving}
        disabled={!draft || deleting}
        style={styles.save}
      />

      <PasswordModal
        visible={passwordVisible}
        loading={deleting}
        error={passwordError}
        onConfirm={handleDelete}
        onCancel={() => setPasswordVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  center: { textAlign: "center" },
  subtitle: { color: colors.textSecondary, textAlign: "center" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleTitle: { ...typography.body, fontWeight: "600", flexShrink: 1 },
  toggleDescription: { marginTop: spacing.xs },
  notice: { borderWidth: 1, borderColor: colors.selected, gap: spacing.xs },
  noticeTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  noticeTitle: { fontSize: 16, fontWeight: "600", color: colors.primary },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowText: { ...typography.body, flex: 1 },
  badge: {
    backgroundColor: colors.dangerTint,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.danger,
    letterSpacing: 0.5,
  },
  pressed: { opacity: 0.7 },
  spacer: { flexGrow: 1, minHeight: spacing.lg },
  error: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  saved: {
    fontSize: 14,
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  save: { marginBottom: spacing.md },
});
