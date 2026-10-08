/**
 * Shows the student's check-in history as a mood chart, average, patterns,
 * and a list of entries for the selected time range.
 * The check-ins and mood summaries come from checkinService.
 */

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import MoodDayChart from "@/components/checkin/MoodDayChart";
import MoodHeader from "@/components/checkin/MoodHeader";
import { getAuthErrorMessage } from "@/services/authService";
import {
  averageMood,
  dayKeyBefore,
  detectPatterns,
  listMyCheckins,
  MIN_ENTRIES_FOR_PATTERNS,
  moodByDay,
  subscribeToCheckinChanges,
} from "@/services/checkinService";
import {
  colors,
  moodColors,
  radius,
  spacing,
  TOUCH_TARGET,
  typography,
} from "@/theme";
import {
  CheckIn,
  dateFromKey,
  MOODS,
  nearestMood,
  shortDay,
} from "@/types/checkin";
import { dateKey } from "@/utils/week";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Range = "week" | "month" | "all";

const RANGES: { key: Range; label: string; days?: number }[] = [
  { key: "week", label: "Week", days: 7 },
  { key: "month", label: "Month", days: 30 },
  { key: "all", label: "All time" },
];

const PAGE_SIZE = 20;

/**
 * Calculates the day range needed to include every check-in and at least a week.
 * @param list The student's check-ins, newest first.
 * @returns Number of days from the oldest check-in through today, or seven if empty.
 */
function allTimeDays(list: CheckIn[]) {
  if (!list.length) return 7;
  const oldest = dateFromKey(list[list.length - 1].dateKey);
  const today = dateFromKey(dateKey(new Date()));
  return Math.max(7, Math.round((today.getTime() - oldest.getTime()) / 86400000) + 1);
}

/**
 * Renders the student's mood history, range filters, summaries, and entries.
 * @returns The mood history screen.
 */
export default function MoodHistory() {
  const [all, setAll] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [range, setRange] = useState<Range>("week");
  const [shown, setShown] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setError(undefined);
    try {
      setAll(await listMyCheckins());
    } catch (e) {
      console.warn("Loading mood history failed", e);
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Stay current when a check-in is saved, edited or deleted elsewhere
  useEffect(() => subscribeToCheckinChanges(() => load()), [load]);

  const retry = () => {
    setLoading(true);
    load();
  };

  const days = RANGES.find((r) => r.key === range)?.days ?? allTimeDays(all);
  const since = dayKeyBefore(dateKey(new Date()), days - 1);
  const inRange = useMemo(() => all.filter((c) => c.dateKey >= since), [all, since]);
  const chartDays = useMemo(() => moodByDay(inRange, days), [inRange, days]);
  const avg = averageMood(inRange);
  const patterns = useMemo(() => detectPatterns(all), [all]);

  const rangeName = range === "all" ? "all time" : `the last ${days} days`;
  const chartLabel = inRange.length
    ? `Mood per day for ${rangeName}, 1 is very low and 5 is great. ${chartDays
        .filter((d) => d.mood !== null)
        .map((d) => `${shortDay(d.dateKey)}: ${MOODS[d.mood! - 1].label}`)
        .join(", ")}. Days without a check-in are left blank.`
    : `No check-ins for ${rangeName}.`;

  const selectRange = (key: Range) => {
    setRange(key);
    setShown(PAGE_SIZE);
  };

  if (loading) {
    return (
      <Screen>
        <MoodHeader title="Mood history" fallback="/(student)/home" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Loading mood history" />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <MoodHeader title="Mood history" fallback="/(student)/home" />
        <Card>
          <Text style={typography.heading}>Couldn't load your history</Text>
          <Text style={[typography.body, styles.muted, styles.cardText]} accessibilityLiveRegion="polite">
            {error}
          </Text>
          <Button title="Try Again" onPress={retry} />
        </Card>
      </Screen>
    );
  }

  // Show a prompt to start checking in instead of an empty chart and entry list.
  if (!all.length) {
    return (
      <Screen>
        <MoodHeader title="Mood history" fallback="/(student)/home" />
        <Card style={styles.empty}>
          <Ionicons
            name="analytics-outline"
            size={40}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={typography.heading}>No check-ins yet</Text>
          <Text style={[typography.body, styles.muted, styles.centerText]}>
            Your mood history builds up as you check in. It only takes a minute.
          </Text>
          <Button
            title="Check in now"
            onPress={() => router.navigate("/(student)/check-in")}
            style={styles.emptyButton}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <MoodHeader title="Mood history" fallback="/(student)/home" />

      {/* Range */}
      <View style={styles.ranges} accessibilityRole="tablist">
        {RANGES.map((r) => {
          const selected = r.key === range;
          return (
            <Pressable
              key={r.key}
              onPress={() => selectRange(r.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show ${r.label === "All time" ? "all time" : `last ${r.label.toLowerCase()}`}`}
              style={({ pressed }) => [
                styles.rangeChip,
                selected && styles.rangeChipSelected,
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
              <Text style={[styles.rangeText, selected && styles.rangeTextSelected]}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={typography.caption}>Average mood</Text>
          <Text style={styles.statValue}>{avg === null ? "–" : avg.toFixed(1)}</Text>
          <Text style={typography.caption}>
            {avg === null ? "No check-ins" : MOODS[nearestMood(avg) - 1].label}
          </Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={typography.caption}>Check-ins</Text>
          <Text style={styles.statValue}>{inRange.length}</Text>
          <Text style={typography.caption}>
            {range === "all" ? "in total" : `in ${days} days`}
          </Text>
        </Card>
      </View>

      {/* Chart + the same data as text */}
      <Card>
        <Text style={typography.heading}>Mood per day</Text>
        <Text style={[typography.caption, styles.cardSubtitle]}>
          1 = Very low, 5 = Great. Gaps are days without a check-in.
        </Text>
        <View style={styles.chart}>
          <MoodDayChart days={chartDays} label={chartLabel} />
        </View>
        {range === "week" ? (
          <View style={styles.table}>
            {[...chartDays].reverse().map((day) => (
              <View
                key={day.dateKey}
                style={styles.tableRow}
                accessible
                accessibilityLabel={`${shortDay(day.dateKey)}: ${day.mood ? MOODS[day.mood - 1].label : "no check-in"}`}
              >
                <Text style={typography.body}>{shortDay(day.dateKey)}</Text>
                <Text style={[typography.body, !day.mood && styles.muted]}>
                  {day.mood ? `${MOODS[day.mood - 1].emoji} ${MOODS[day.mood - 1].label}` : "No check-in"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            <Text style={[typography.caption, styles.tableTitle]}>How often you felt each mood</Text>
            {[...MOODS].reverse().map((m) => {
              const count = inRange.filter((c) => c.mood === m.level).length;
              return (
                <View
                  key={m.level}
                  style={styles.tableRow}
                  accessible
                  accessibilityLabel={`${m.label}: ${count} ${count === 1 ? "day" : "days"}`}
                >
                  <Text style={typography.body}>
                    {m.emoji} {m.label}
                  </Text>
                  <Text style={typography.body}>
                    {count} {count === 1 ? "day" : "days"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Patterns (based on all check-ins, so a short range still has enough data) */}
      <Card variant="success">
        <View style={styles.patternHeader}>
          <Ionicons
            name="bulb-outline"
            size={20}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={typography.heading}>Patterns</Text>
        </View>
        {all.length < MIN_ENTRIES_FOR_PATTERNS ? (
          <Text style={[typography.body, styles.cardText]}>
            Check in a few more times to see patterns.
          </Text>
        ) : patterns.length ? (
          patterns.map((p) => (
            <Text key={p} style={[typography.body, styles.cardText]}>
              • {p}
            </Text>
          ))
        ) : (
          <Text style={[typography.body, styles.cardText]}>
            No clear patterns yet. Your mood has been fairly steady across your check-ins.
          </Text>
        )}
        <Text style={[typography.caption, styles.cardText]}>
          Based on all {all.length} of your check-ins. This is a personal reflection, not a medical
          assessment.
        </Text>
      </Card>

      {/* Entries */}
      <Text style={[typography.heading, styles.sectionTitle]} accessibilityRole="header">
        Entries
      </Text>
      {/* listMyCheckins returns newest first, so the entries stay in newest-first order. */}
      {inRange.length ? (
        inRange.slice(0, shown).map((entry) => <EntryRow key={entry.id} entry={entry} />)
      ) : (
        <Text style={[typography.body, styles.muted, styles.noEntries]}>
          No check-ins for {rangeName}. Try a longer range.
        </Text>
      )}
      {inRange.length > shown ? (
        <Button
          title="Show more"
          variant="secondary"
          onPress={() => setShown((n) => n + PAGE_SIZE)}
        />
      ) : null}
    </Screen>
  );
}

/**
 * Renders one check-in with its mood, date, reasons, and first note line.
 * @param entry The check-in to display.
 * @returns A pressable row that opens the check-in detail screen.
 */
function EntryRow({ entry }: { entry: CheckIn }) {
  // Mood levels start at 1, so subtract one to index the matching face and label.
  const mood = MOODS[entry.mood - 1];
  const firstLine = entry.note?.split("\n")[0].trim();
  const factors = entry.factors ?? [];

  return (
    <Pressable
      onPress={() =>
        router.navigate({ pathname: "/(student)/mood-entry/[id]", params: { id: entry.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={[
        shortDay(entry.dateKey),
        mood.label,
        factors.length ? `Affected by ${factors.join(", ")}` : "",
        firstLine ? `Note: ${firstLine}` : "",
      ]
        .filter(Boolean)
        .join(". ")}
      accessibilityHint="Opens this check-in"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={{ ...styles.entry, borderLeftColor: moodColors[entry.mood - 1] }}>
        <Text style={styles.entryEmoji}>{mood.emoji}</Text>
        <View style={styles.entryText}>
          <View style={styles.entryTop}>
            <Text style={styles.entryMood}>{mood.label}</Text>
            {/* shortDay formats the stored date key as a local short date. */}
            <Text style={typography.caption}>{shortDay(entry.dateKey)}</Text>
          </View>
          {factors.length ? (
            <View style={styles.factorRow}>
              {factors.map((f) => (
                <View key={f} style={styles.factor}>
                  <Text style={styles.factorText}>{f}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {firstLine ? (
            <Text style={[typography.caption, styles.entryNote]} numberOfLines={1}>
              {firstLine}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textSecondary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center" },
  cardText: { marginTop: spacing.sm },
  cardSubtitle: { marginTop: spacing.xs },
  pressed: { opacity: 0.7 },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyButton: { alignSelf: "stretch", marginTop: spacing.sm },
  ranges: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  rangeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // Selected = thicker border + check + bold text, not colour alone
  rangeChipSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  rangeText: { fontSize: 14, color: colors.text },
  rangeTextSelected: { fontWeight: "700", color: colors.primary },
  stats: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, gap: 2 },
  statValue: { fontSize: 28, fontWeight: "700", color: colors.text },
  chart: { marginTop: spacing.md },
  table: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  tableTitle: { marginTop: spacing.sm },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  patternHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { marginTop: spacing.sm, marginBottom: spacing.sm },
  noEntries: { marginBottom: spacing.md },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
    borderLeftWidth: 6,
  },
  entryEmoji: { fontSize: 30 },
  entryText: { flex: 1, gap: spacing.xs },
  entryTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  entryMood: { ...typography.body, fontWeight: "600" },
  factorRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  factor: {
    backgroundColor: colors.selected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  factorText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  entryNote: { fontStyle: "italic" },
});
