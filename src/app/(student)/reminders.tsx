// Check-in reminders - Ishara (Member 2). Supports FR05, NFR01.
//
// Gentle check-in reminders at times the student picks: add, list, edit,
// switch on/off and delete (users/{uid}/reminders, owner only). Each one is a
// weekly local notification on this device with neutral text. Guests can use
// it too. On web the reminders are saved but no notifications are shown.

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import MoodHeader from "@/components/checkin/MoodHeader";
import ReminderForm from "@/components/reminders/ReminderForm";
import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/services/authService";
import {
  getReminderPermission,
  ReminderPermission,
  remindersSupported,
  requestReminderPermission,
  syncReminderNotifications,
} from "@/services/reminderNotifications";
import {
  createReminder,
  deleteReminder,
  listReminders,
  REMINDER_LIMIT_ERROR,
  updateReminder,
} from "@/services/reminderService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  daysSummary,
  formatTime,
  MAX_REMINDERS,
  Reminder,
  ReminderInput,
} from "@/types/reminder";
import { confirmAction } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

// `key` changes on every open so the form starts fresh; `existing` is kept
// while closing so the title doesn't flip during the slide-out
type FormState = { open: boolean; existing: Reminder | null; key: number };

const errorMessage = (e: unknown) =>
  (e as { code?: string })?.code === REMINDER_LIMIT_ERROR
    ? `You can have up to ${MAX_REMINDERS} reminders. Edit or delete one to add another.`
    : getAuthErrorMessage(e);

const announce = (message: string) => {
  if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(message);
};

export default function Reminders() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [permission, setPermission] = useState<ReminderPermission>(
    remindersSupported ? "undetermined" : "unsupported",
  );

  const [form, setForm] = useState<FormState>({ open: false, existing: null, key: 0 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [explainVisible, setExplainVisible] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoadError(undefined);
    try {
      setReminders(await listReminders(uid));
    } catch (e) {
      console.warn("Loading reminders failed", e);
      setLoadError(getAuthErrorMessage(e));
    }
  }, [uid]);

  const checkPermission = useCallback(async () => {
    try {
      setPermission(await getReminderPermission());
    } catch (e) {
      console.warn("Checking notification permission failed", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      checkPermission();
    }, [load, checkPermission]),
  );

  // Back from the phone's Settings: if notifications were just allowed,
  // schedule everything that's saved
  useEffect(() => {
    if (!remindersSupported) return;
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      const next = await getReminderPermission().catch(() => null);
      if (!next) return;
      if (permission !== "granted" && next === "granted" && reminders) {
        syncReminderNotifications(reminders).catch(() => {});
      }
      setPermission(next);
    });
    return () => sub.remove();
  }, [permission, reminders]);

  const setRowError = (id: string, message?: string) =>
    setRowErrors(({ [id]: _, ...rest }) => (message ? { ...rest, [id]: message } : rest));

  // ---------- permission ----------

  const askPermission = async () => {
    const result = await requestReminderPermission().catch(() => "denied" as const);
    setPermission(result);
    if (result === "granted" && reminders?.length) {
      await syncReminderNotifications(reminders).catch(() => {});
    }
    return result;
  };

  // ---------- form ----------

  const openForm = (existing: Reminder | null) => {
    setSaveError(undefined);
    setForm((f) => ({ open: true, existing, key: f.key + 1 }));
  };

  const closeForm = () => setForm((f) => ({ ...f, open: false }));

  // Add: before the very first ask, explain why in our own words
  const startAdd = () => {
    setSaveError(undefined);
    if (remindersSupported && permission === "undetermined") setExplainVisible(true);
    else openForm(null);
  };

  // iOS can't present the form sheet (or the permission prompt) while the
  // explanation is still fading out - it silently drops it. So the next step
  // waits for the explanation's onDismiss (iOS only; a timer covers a missed
  // one), and runs straight away elsewhere.
  const afterExplain = useRef<(() => void) | null>(null);
  const closeExplainThen = (next: () => void) => {
    setExplainVisible(false);
    if (Platform.OS !== "ios") return next();
    afterExplain.current = next;
    setTimeout(runAfterExplain, 800);
  };
  const runAfterExplain = () => {
    const next = afterExplain.current;
    afterExplain.current = null;
    next?.();
  };

  const explainContinue = () =>
    closeExplainThen(async () => {
      await askPermission();
      openForm(null);
    });

  const explainLater = () => closeExplainThen(() => openForm(null));

  // ---------- CRUD ----------

  const handleSave = async (input: ReminderInput) => {
    // Never fail silently: the form stays open with a message
    if (!uid || !reminders) {
      setSaveError(
        uid
          ? "Your reminders haven't loaded yet. Close this and try again."
          : "You're not logged in. Log in again and try again.",
      );
      return;
    }
    setSaving(true);
    setSaveError(undefined);
    try {
      const existing = form.existing;
      const saved = existing
        ? await updateReminder(uid, existing, input)
        : await createReminder(uid, input, reminders);
      setReminders((prev) =>
        [...(prev ?? []).filter((r) => r.id !== saved.id), saved].sort(
          (a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id),
        ),
      );
      closeForm();
      const message = existing
        ? "Reminder updated."
        : `Reminder set for ${formatTime(saved.time)}, ${daysSummary(saved.days, true).toLowerCase()}.`;
      setNotice(message);
      announce(message);
    } catch (e) {
      console.warn("Saving reminder failed", e);
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // Optimistic: flip now, undo if the save fails
  const toggle = async (reminder: Reminder, enabled: boolean) => {
    if (!uid) return;
    setRowError(reminder.id);
    setBusyId(reminder.id);
    setReminders((prev) => prev?.map((r) => (r.id === reminder.id ? { ...r, enabled } : r)) ?? null);
    try {
      await updateReminder(uid, reminder, { ...reminder, enabled });
      announce(enabled ? "Reminder on." : "Reminder off.");
    } catch (e) {
      setReminders(
        (prev) =>
          prev?.map((r) => (r.id === reminder.id ? { ...r, enabled: !enabled } : r)) ?? null,
      );
      setRowError(reminder.id, errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (reminder: Reminder) => {
    if (!uid) return;
    const ok = await confirmAction({
      title: "Delete this reminder?",
      message: `You won't be reminded at ${formatTime(reminder.time)} (${daysSummary(reminder.days, true).toLowerCase()}) any more.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    setRowError(reminder.id);
    setBusyId(reminder.id);
    try {
      await deleteReminder(uid, reminder.id);
      setReminders((prev) => prev?.filter((r) => r.id !== reminder.id) ?? null);
      setNotice("Reminder deleted.");
      announce("Reminder deleted.");
    } catch (e) {
      setRowError(reminder.id, errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  // ---------- view ----------

  const count = reminders?.length ?? 0;
  const atLimit = count >= MAX_REMINDERS;
  const showPermissionBanner =
    remindersSupported && count > 0 && permission !== "granted";

  return (
    <Screen>
      <MoodHeader title="Check-in reminders" fallback="/(student)/profile" />

      <Text style={[typography.body, styles.intro]}>
        A gentle nudge at times that suit you. Checking in is always your choice,
        and missing a day is completely fine.
      </Text>

      {!remindersSupported ? (
        <Card style={styles.note}>
          <View style={styles.noteRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[typography.body, styles.flex]}>
              Reminder notifications only work in the Breathe phone app. You can
              still set them up here, and they'll start on your phone once you log
              in there.
            </Text>
          </View>
        </Card>
      ) : null}

      {showPermissionBanner ? (
        <Card style={styles.note}>
          <View style={styles.noteRow} accessibilityRole="alert">
            <Ionicons
              name="notifications-off-outline"
              size={20}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[typography.body, styles.flex]}>
              Notifications are off for Breathe, so your reminders won't appear yet.
              They're saved, and will start as soon as you allow notifications.
            </Text>
          </View>
          {permission === "denied" ? (
            <Button
              title="Open settings"
              variant="secondary"
              icon="open-outline"
              onPress={() => Linking.openSettings()}
              style={styles.noteButton}
            />
          ) : (
            <Button
              title="Allow notifications"
              variant="secondary"
              onPress={askPermission}
              style={styles.noteButton}
            />
          )}
        </Card>
      ) : null}

      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[typography.body, styles.flex]}>{notice}</Text>
        </View>
      ) : null}

      {reminders === null && !loadError ? (
        <ActivityIndicator
          color={colors.primary}
          style={styles.spinner}
          accessibilityLabel="Loading your reminders"
        />
      ) : loadError ? (
        <Card>
          <Text style={[typography.body, styles.muted]} accessibilityLiveRegion="polite">
            Couldn't load your reminders. {loadError}
          </Text>
          <Button title="Try Again" variant="secondary" onPress={load} style={styles.noteButton} />
        </Card>
      ) : count === 0 ? (
        <Card style={styles.empty}>
          <Ionicons
            name="alarm-outline"
            size={40}
            color={colors.primary}
            style={styles.emptyIcon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[typography.heading, styles.center]}>No reminders yet</Text>
          <Text style={[typography.body, styles.muted, styles.center]}>
            Pick a time that fits your day, like after class or before bed, and
            Breathe will gently remind you to check in.
          </Text>
          <Button
            title="Add your first reminder"
            icon="add"
            onPress={startAdd}
            style={styles.noteButton}
          />
        </Card>
      ) : (
        <>
          {reminders!.map((reminder) => {
            const busy = busyId === reminder.id;
            const when = `${formatTime(reminder.time)}, ${daysSummary(reminder.days, true)}`;
            return (
              <Card key={reminder.id}>
                <View style={styles.row}>
                  <View style={styles.flex} accessible accessibilityLabel={`${when}. ${reminder.enabled ? "On" : "Off"}`}>
                    <Text style={[styles.time, !reminder.enabled && styles.muted]}>
                      {formatTime(reminder.time)}
                    </Text>
                    <Text style={typography.caption}>{daysSummary(reminder.days)}</Text>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={(enabled) => toggle(reminder, enabled)}
                    disabled={busy}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                    ios_backgroundColor={colors.border}
                    accessibilityLabel={`Reminder at ${when}`}
                    accessibilityHint={reminder.enabled ? "Turns this reminder off" : "Turns this reminder on"}
                  />
                </View>
                {rowErrors[reminder.id] ? (
                  <Text style={styles.rowError} accessibilityRole="alert">
                    {rowErrors[reminder.id]}
                  </Text>
                ) : null}
                <View style={styles.actions}>
                  <Button
                    title="Edit"
                    variant="secondary"
                    icon="create-outline"
                    onPress={() => openForm(reminder)}
                    disabled={busy}
                    style={styles.flex}
                  />
                  <Button
                    title="Delete"
                    variant="danger"
                    icon="trash-outline"
                    onPress={() => remove(reminder)}
                    loading={busy}
                    style={styles.flex}
                  />
                </View>
              </Card>
            );
          })}

          {atLimit ? (
            <Text style={[typography.caption, styles.center]}>
              You have {MAX_REMINDERS} reminders, which is the most you can set. Edit
              or delete one to add another.
            </Text>
          ) : (
            <Button title="Add reminder" icon="add" onPress={startAdd} />
          )}
        </>
      )}

      <ReminderForm
        key={form.key}
        visible={form.open}
        existing={form.existing}
        saving={saving}
        saveError={saveError}
        onSave={handleSave}
        onClose={closeForm}
      />

      {/* Short explanation before the system permission prompt */}
      <Modal
        visible={explainVisible}
        transparent
        animationType="fade"
        onRequestClose={explainLater}
        onDismiss={runAfterExplain}
      >
        <View style={styles.overlay}>
          <Card style={styles.dialog}>
            <View accessible accessibilityRole="header">
              <Text style={typography.heading}>Allow reminder notifications?</Text>
            </View>
            <Text style={[typography.body, styles.dialogText]}>
              Breathe can send you a gentle notification at the times you choose.
              It only ever says "Time for your daily check-in", never anything about
              how you feel. You can turn reminders off at any time.
            </Text>
            <Button title="Continue" onPress={explainContinue} />
            <Button
              title="Not now"
              variant="secondary"
              onPress={explainLater}
              style={styles.dialogSecondary}
            />
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.textSecondary, marginBottom: spacing.lg },
  flex: { flex: 1 },
  muted: { color: colors.textSecondary },
  center: { textAlign: "center" },
  spinner: { marginVertical: spacing.xl },
  note: { backgroundColor: colors.success },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  noteButton: { marginTop: spacing.md },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
    marginBottom: spacing.md,
  },
  empty: { alignItems: "stretch", gap: spacing.sm, paddingVertical: spacing.lg },
  emptyIcon: { alignSelf: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
  },
  time: { fontSize: 24, fontWeight: "700", color: colors.text },
  rowError: { fontSize: 14, color: colors.danger, marginTop: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: spacing.lg,
  },
  dialog: { gap: spacing.sm, padding: spacing.lg },
  dialogText: { marginBottom: spacing.md },
  dialogSecondary: { marginTop: spacing.xs },
});
