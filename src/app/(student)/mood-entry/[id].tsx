/**
 * Shows one check-in with its mood, reasons, note, and a comparison with the
 * previous three days. The entry and comparison check-ins come from
 * checkinService; the student can edit today's entry or delete any entry.
 */

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import MoodHeader from "@/components/checkin/MoodHeader";
import { getAuthErrorMessage } from "@/services/authService";
import {
  averageMood,
  dayKeyBefore,
  deleteCheckin,
  getCheckin,
  listMyCheckins,
  subscribeToCheckinChanges,
} from "@/services/checkinService";
import { colors, moodColors, radius, spacing, typography } from "@/theme";
import { CheckIn, dateFromKey, longDate, MOODS } from "@/types/checkin";
import { confirmAction } from "@/utils/confirm";
import { dateKey } from "@/utils/week";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Day = { dateKey: string; entry: CheckIn | null };

/**
 * Formats a date key as a short weekday name for the comparison.
 * @param key Date in YYYY-MM-DD format.
 * @returns The localised short weekday name.
 */
const weekday = (key: string) =>
  dateFromKey(key).toLocaleDateString(undefined, { weekday: "short" });

/**
 * Compares this mood with the average mood on earlier days with check-ins.
 * @param entry The check-in to compare.
 * @param before The three preceding days, including days without check-ins.
 * @returns A short comparison message.
 */
function compareText(entry: CheckIn, before: Day[]) {
  const prev = before.flatMap((d) => (d.entry ? [d.entry] : []));
  if (!prev.length) return "No check-ins in the 3 days before this one.";
  const avg = averageMood(prev)!;
  const diff = entry.mood - avg;
  const days = prev.length === 1 ? "the day you checked in" : `the ${prev.length} days you checked in`;
  if (diff >= 0.5) return `A brighter day than ${days} just before (average ${avg.toFixed(1)}).`;
  if (diff <= -0.5) return `A lower day than ${days} just before (average ${avg.toFixed(1)}).`;
  return `About the same as ${days} just before (average ${avg.toFixed(1)}).`;
}

/**
 * Loads and renders the check-in selected by the route's ID.
 * @returns The mood entry detail screen.
 */
export default function MoodEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<CheckIn | null>(null);
  const [before, setBefore] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(undefined);
    setDeleteError(undefined);
    try {
      // The route's [id] parameter selects the matching check-in.
      const found = await getCheckin(id);
      setEntry(found);
      if (found) {
        // The 3 days before, oldest first. Picked from the student's own list,
        // not looked up by id: the rules deny reading a doc that doesn't exist,
        // so a day without a check-in would fail as permission-denied.
        const keys = [3, 2, 1].map((n) => dayKeyBefore(found.dateKey, n));
        const byDay = new Map((await listMyCheckins()).map((c) => [c.dateKey, c]));
        setBefore(keys.map((key) => ({ dateKey: key, entry: byDay.get(key) ?? null })));
      }
    } catch (e) {
      console.warn("Loading check-in failed", e);
      setLoadError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // The tab stays mounted, so reload whenever a different entry is opened
  useEffect(() => {
    load();
  }, [load]);

  // Reflect an edit made on the check-in screen
  useEffect(
    () =>
      subscribeToCheckinChanges((change) => {
        if (change.type === "saved" && change.checkin.id === id) setEntry(change.checkin);
        if (change.type === "deleted" && change.id === id) setEntry(null);
      }),
    [id],
  );

  const remove = async () => {
    if (!entry || deleting) return;
    const ok = await confirmAction({
      title: "Delete this check-in?",
      message: `Your check-in for ${longDate(entry.dateKey)} will be permanently deleted. This can't be undone.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteCheckin(entry.id);
      router.navigate("/(student)/mood-history");
    } catch (e) {
      console.warn("Deleting check-in failed", e);
      setDeleteError(getAuthErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const header = <MoodHeader title="Check-in" fallback="/(student)/mood-history" />;

  if (loading) {
    return (
      <Screen>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Loading check-in" />
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        {header}
        <Card>
          <Text style={typography.heading}>Couldn't load this check-in</Text>
          <Text style={[typography.body, styles.muted, styles.cardText]} accessibilityLiveRegion="polite">
            {loadError}
          </Text>
          <Button title="Try Again" onPress={load} />
        </Card>
      </Screen>
    );
  }

  if (!entry) {
    return (
      <Screen>
        {header}
        <Card>
          <Text style={typography.heading}>Check-in not found</Text>
          <Text style={[typography.body, styles.muted, styles.cardText]}>
            It may have been deleted.
          </Text>
          <Button
            title="Back to mood history"
            onPress={() => router.navigate("/(student)/mood-history")}
            style={styles.topGap}
          />
        </Card>
      </Screen>
    );
  }

  // Mood levels start at 1, so subtract one to index the mood label and face.
  const mood = MOODS[entry.mood - 1];
  const isToday = entry.dateKey === dateKey(new Date());
  const days: Day[] = [...before, { dateKey: entry.dateKey, entry }];

  return (
    <Screen>
      {header}

      {/* Entry */}
      <Card>
        {/* longDate formats the stored date key as a local full date. */}
        <Text style={typography.caption}>{longDate(entry.dateKey)}</Text>
        <View
          style={[styles.mood, { borderLeftColor: moodColors[entry.mood - 1] }]}
          accessible
          accessibilityLabel={`Mood: ${mood.label}`}
        >
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
          <Text style={typography.heading}>{mood.label}</Text>
        </View>

        <Text style={[styles.label, styles.topGap]}>What affected your mood</Text>
        {entry.factors?.length ? (
          <View style={styles.factorRow}>
            {entry.factors.map((f) => (
              <View key={f} style={styles.factor}>
                <Text style={styles.factorText}>{f}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[typography.body, styles.muted]}>Nothing tagged</Text>
        )}

        <Text style={[styles.label, styles.topGap]}>Note</Text>
        <Text style={[typography.body, !entry.note && styles.muted]}>
          {entry.note || "No note"}
        </Text>
      </Card>

      {/* Compared with the 3 days before */}
      <Card>
        <Text style={typography.heading}>Compared with the days before</Text>
        <View style={styles.compare}>
          {days.map((day) => {
            const m = day.entry ? MOODS[day.entry.mood - 1] : null;
            const current = day.dateKey === entry.dateKey;
            return (
              <View
                key={day.dateKey}
                style={[styles.compareDay, current && styles.compareCurrent]}
                accessible
                accessibilityLabel={`${current ? "This check-in, " : ""}${longDate(day.dateKey)}: ${m ? m.label : "no check-in"}`}
              >
                <Text style={[typography.caption, current && styles.currentText]}>
                  {current ? "This day" : weekday(day.dateKey)}
                </Text>
                <Text style={styles.compareEmoji}>{m ? m.emoji : "–"}</Text>
                <Text style={[styles.compareLabel, !m && styles.muted]} numberOfLines={2}>
                  {m ? m.label : "No check-in"}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[typography.body, styles.cardText]}>{compareText(entry, before)}</Text>
      </Card>

      {/* Actions */}
      {isToday ? (
        <Button
          title="Edit today's check-in"
          onPress={() =>
            router.navigate({ pathname: "/(student)/check-in", params: { edit: "1" } })
          }
          style={styles.action}
        />
      ) : (
        <View style={styles.readOnly}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[typography.caption, styles.readOnlyText]}>
            Only today's check-in can be edited, so your history stays a true record of how you
            felt on each day. You can still delete it.
          </Text>
        </View>
      )}

      {deleteError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {deleteError}
          </Text>
          <Button title="Try Again" variant="secondary" onPress={remove} />
        </Card>
      ) : null}

      <Button
        title="Delete check-in"
        variant="danger"
        icon="trash-outline"
        onPress={remove}
        loading={deleting}
      />

      <Text style={[typography.caption, styles.disclaimer]}>
        This is a personal reflection, not a medical assessment.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textSecondary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardText: { marginTop: spacing.sm },
  topGap: { marginTop: spacing.md },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.xs },
  mood: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderLeftWidth: 6,
  },
  moodEmoji: { fontSize: 40 },
  factorRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  factor: {
    backgroundColor: colors.selected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  factorText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  compare: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  compareDay: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.background,
  },
  // This day = border + bold label, not colour alone
  compareCurrent: { borderColor: colors.primary, backgroundColor: colors.selected },
  currentText: { fontWeight: "700", color: colors.primary },
  compareEmoji: { fontSize: 26, color: colors.textSecondary },
  compareLabel: { fontSize: 12, color: colors.text, textAlign: "center" },
  action: { marginBottom: spacing.md },
  readOnly: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  readOnlyText: { flex: 1 },
  errorCard: { backgroundColor: colors.dangerTint, gap: spacing.md },
  errorText: { ...typography.body, color: colors.danger },
  disclaimer: { marginTop: spacing.md, textAlign: "center" },
});
