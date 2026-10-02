// Mood check-in - Ishara (Member 2). FR02, NFR03.
//
// Built to finish in under 2 minutes (NFR03): mood is the only required field,
// factors and the note are optional. One check-in per day; if today's already
// exists it's shown with "Edit today's check-in" instead of a second entry.
// Route param "mood" (1-5) preselects a face, e.g. when tapped on Home.
// Route param "edit" opens today's entry for editing (from the entry detail).

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/services/authService";
import {
  createCheckin,
  getTodayCheckin,
  subscribeToCheckinChanges,
  updateCheckin,
} from "@/services/checkinService";
import {
  CheckIn,
  isMoodLevel,
  MOOD_FACTORS,
  MoodFactor,
  MoodLevel,
  MOODS,
  NOTE_MAX_LENGTH,
} from "@/types/checkin";
import {
  colors,
  moodColors,
  radius,
  spacing,
  TOUCH_TARGET,
  typography,
} from "@/theme";
import { dateKey } from "@/utils/week";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Calm, non-clinical line shown with the saved mood
const SUPPORTIVE_LINES: Record<MoodLevel, string> = {
  1: "Thank you for being honest. Hard days happen, and support is here whenever you want it.",
  2: "Thanks for checking in. Be gentle with yourself today.",
  3: "Thanks for checking in. Small steps still count.",
  4: "Glad to hear it. Keep doing what helps you.",
  5: "Lovely to hear. Enjoy the good moments today.",
};

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export default function CheckInScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mood?: string; edit?: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [loadedDay, setLoadedDay] = useState<string>();
  const [today, setToday] = useState<CheckIn | null>(null);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Form state is never cleared on a failed save, so nothing typed is lost
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [factors, setFactors] = useState<MoodFactor[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(undefined);
    try {
      setToday(await getTodayCheckin(user.uid));
      setLoadedDay(dateKey(new Date()));
      setEditing(false);
      setJustSaved(false);
    } catch (e) {
      console.warn("Loading today's check-in failed", e);
      setLoadError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // The tab stays mounted, so re-check when it's opened on a new day
  useFocusEffect(
    useCallback(() => {
      if (loadedDay && loadedDay !== dateKey(new Date())) {
        setToday(null);
        setMood(null);
        setFactors([]);
        setNote("");
        load();
      }
    }, [loadedDay, load]),
  );

  // Face tapped on Home: preselect it, unless today's check-in already exists
  useEffect(() => {
    if (!params.mood || loading) return;
    const level = Number(params.mood);
    if (isMoodLevel(level) && (!today || editing)) setMood(level);
    router.setParams({ mood: undefined });
  }, [params.mood, loading, today, editing]);

  // Today's entry deleted from the entry detail screen: back to a fresh form
  useEffect(
    () =>
      subscribeToCheckinChanges((change) => {
        if (change.type === "deleted" && change.id === today?.id) {
          setToday(null);
          setEditing(false);
          setJustSaved(false);
        }
      }),
    [today?.id],
  );

  const toggleFactor = (factor: MoodFactor) =>
    setFactors((current) =>
      current.includes(factor)
        ? current.filter((f) => f !== factor)
        : [...current, factor],
    );

  const startEdit = () => {
    if (!today) return;
    setMood(today.mood);
    setFactors(today.factors ?? []);
    setNote(today.note ?? "");
    setSaveError(undefined);
    setJustSaved(false);
    setEditing(true);
  };

  // "Edit today's check-in" on the entry detail screen
  useEffect(() => {
    if (!params.edit || loading) return;
    if (today && !editing) startEdit();
    router.setParams({ edit: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.edit, loading, today, editing]);

  const cancelEdit = () => {
    setSaveError(undefined);
    setEditing(false);
  };

  const save = async () => {
    if (!user || !mood || saving) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const input = { mood, factors, note };
      const saved =
        editing && today
          ? await updateCheckin(today, input)
          : await createCheckin(user.uid, input);
      setToday(saved);
      setEditing(false);
      setJustSaved(true);
      setMood(null);
      setFactors([]);
      setNote("");
    } catch (e) {
      console.warn("Saving check-in failed", e);
      setSaveError(getAuthErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <Text style={typography.title} accessibilityRole="header">
        How are you feeling today?
      </Text>
      <Text style={[typography.body, styles.muted]}>{todayLabel()}</Text>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator
            color={colors.primary}
            accessibilityLabel="Loading today's check-in"
          />
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        {header}
        <Card>
          <Text style={typography.heading}>Couldn't load your check-in</Text>
          <Text
            style={[typography.body, styles.muted, styles.cardText]}
            accessibilityLiveRegion="polite"
          >
            {loadError}
          </Text>
          <Button title="Try Again" onPress={load} />
        </Card>
      </Screen>
    );
  }

  // Today's entry (just saved, or saved earlier today)
  if (today && !editing) {
    const saved = MOODS[today.mood - 1];
    return (
      <Screen>
        {header}
        <Card variant="success">
          <View style={styles.savedHeader}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text
              style={typography.heading}
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
            >
              {justSaved ? "Check-in saved" : "You've checked in today"}
            </Text>
          </View>

          <View
            style={[styles.savedMood, { borderLeftColor: moodColors[today.mood - 1] }]}
            accessible
            accessibilityLabel={`Today's mood: ${saved.label}`}
          >
            <Text style={styles.savedEmoji}>{saved.emoji}</Text>
            <View>
              <Text style={typography.caption}>Today's mood</Text>
              <Text style={styles.savedLabel}>{saved.label}</Text>
            </View>
          </View>

          {today.factors?.length ? (
            <Text style={[typography.body, styles.cardText]}>
              Affected by: {today.factors.join(", ")}
            </Text>
          ) : null}
          {today.note ? (
            <Text style={[typography.body, styles.cardText, styles.note]}>
              "{today.note}"
            </Text>
          ) : null}

          <Text style={[typography.body, styles.cardText]}>
            {SUPPORTIVE_LINES[today.mood]}
          </Text>

          <View style={styles.actions}>
            <Button
              title="View mood history"
              onPress={() => router.navigate("/(student)/mood-history")}
            />
            <Button
              title="Back to Home"
              variant="secondary"
              onPress={() => router.navigate("/(student)/home")}
            />
            <Pressable
              onPress={startEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit today's check-in"
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
            >
              <Text style={styles.link}>Edit today's check-in</Text>
            </Pressable>
          </View>

          <Text style={[typography.caption, styles.disclaimer]}>
            This is a personal reflection, not a medical assessment.
          </Text>
        </Card>
      </Screen>
    );
  }

  // New check-in, or editing today's
  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        {header}

        {/* 1. Mood (required) */}
        <Card>
          <Text style={typography.heading}>
            Your mood <Text style={styles.required}>(required)</Text>
          </Text>
          <View style={styles.faces} accessibilityRole="radiogroup">
            {MOODS.map((m) => {
              const selected = mood === m.level;
              return (
                <Pressable
                  key={m.level}
                  onPress={() => setMood(m.level)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={`${m.label}, ${m.level} of 5`}
                  style={({ pressed }) => [
                    styles.face,
                    selected && styles.faceSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  {selected ? (
                    <View style={styles.faceCheck}>
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={colors.white}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    </View>
                  ) : null}
                  <Text style={styles.faceEmoji}>{m.emoji}</Text>
                  <Text
                    style={[styles.faceLabel, selected && styles.faceLabelSelected]}
                    numberOfLines={2}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* 2. Factors (optional) */}
        <Card>
          <Text style={typography.heading}>What's affecting your mood?</Text>
          <Text style={[typography.caption, styles.cardSubtitle]}>
            Optional. Pick any that apply.
          </Text>
          <View style={styles.chips}>
            {MOOD_FACTORS.map((factor) => {
              const selected = factors.includes(factor);
              return (
                <Pressable
                  key={factor}
                  onPress={() => toggleFactor(factor)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={factor}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  {selected ? (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  ) : null}
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {factor}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* 3. Note (optional) */}
        <Card>
          <Text style={typography.heading}>Add a note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={NOTE_MAX_LENGTH}
            multiline
            textAlignVertical="top"
            placeholder="Anything you'd like to remember about today"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Add a note, optional"
            accessibilityHint={`Up to ${NOTE_MAX_LENGTH} characters`}
            style={styles.noteInput}
          />
          <Text
            style={[typography.caption, styles.counter]}
            accessibilityLabel={`${note.length} of ${NOTE_MAX_LENGTH} characters used`}
          >
            {note.length}/{NOTE_MAX_LENGTH}
          </Text>
        </Card>

        {saveError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {saveError} Your check-in is still here.
            </Text>
            <Button title="Try Again" variant="secondary" onPress={save} />
          </Card>
        ) : null}

        <Button
          title={editing ? "Save Changes" : "Save Check-in"}
          onPress={save}
          loading={saving}
          disabled={!mood}
        />
        {!mood ? (
          <Text style={[typography.caption, styles.hint]}>
            Pick a mood to save your check-in.
          </Text>
        ) : null}
        {editing ? (
          <Pressable
            onPress={cancelEdit}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
            style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
          >
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Right padding keeps the title clear of the floating crisis help button
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingRight: TOUCH_TARGET + spacing.sm,
  },
  muted: { color: colors.textSecondary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardText: { marginTop: spacing.sm },
  cardSubtitle: { marginTop: spacing.xs },
  required: { ...typography.caption, fontWeight: "400" },
  pressed: { opacity: 0.7 },
  faces: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  face: {
    flex: 1,
    minHeight: 84,
    minWidth: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.background,
  },
  // Selected = thick border + check badge + bold label, not colour alone
  faceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  faceCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  faceEmoji: { fontSize: 30 },
  faceLabel: { fontSize: 12, color: colors.text, textAlign: "center" },
  faceLabelSelected: { fontWeight: "700", color: colors.primary },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { fontWeight: "600", color: colors.primary },
  noteInput: {
    minHeight: 100,
    marginTop: spacing.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  counter: { alignSelf: "flex-end", marginTop: spacing.xs },
  errorCard: { backgroundColor: colors.dangerTint, gap: spacing.md },
  errorText: { ...typography.body, color: colors.danger },
  hint: { textAlign: "center", marginTop: spacing.sm },
  textButton: {
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  link: { fontSize: 16, fontWeight: "600", color: colors.primary },
  savedHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  savedMood: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderLeftWidth: 6,
  },
  savedEmoji: { fontSize: 40 },
  savedLabel: { ...typography.heading },
  note: { fontStyle: "italic" },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  disclaimer: { marginTop: spacing.md, textAlign: "center" },
});
