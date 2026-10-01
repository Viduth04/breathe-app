// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.
//
// 100% stacked bar of the five mood levels, with a labelled table under it,
// so levels are never told apart by colour alone. Only render this for weeks
// that pass the privacy threshold (isSafeToShow).

import { colors, moodColors, radius, spacing, typography } from "@/theme";
import { MOOD_LABELS, MOOD_LEVELS, moodCount, WeekStats } from "@/types/stats";
import { StyleSheet, Text, View } from "react-native";

const GAP = 2; // Surface gap between segments

export default function MoodDistribution({ week }: { week: WeekStats }) {
  const rows = MOOD_LEVELS.map((level) => {
    const count = moodCount(week, level);
    return {
      level,
      count,
      percent: week.total ? Math.round((count / week.total) * 100) : 0,
    };
  });
  const summary = rows
    .map((r) => `${MOOD_LABELS[r.level]} ${r.percent} percent`)
    .join(", ");

  return (
    <View>
      <View
        style={styles.bar}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Mood breakdown: ${summary}`}
      >
        {rows
          .filter((r) => r.count > 0)
          .map((r) => (
            <View
              key={r.level}
              style={[
                styles.segment,
                { flexGrow: r.count, backgroundColor: moodColors[r.level - 1] },
              ]}
            />
          ))}
      </View>

      {/* Table view: every level with its label, count and share */}
      <View style={styles.table}>
        {rows.map((r) => (
          <View key={r.level} style={styles.row}>
            <View
              style={[styles.swatch, { backgroundColor: moodColors[r.level - 1] }]}
            />
            <Text style={[typography.body, styles.label]}>
              {r.level} · {MOOD_LABELS[r.level]}
            </Text>
            <Text style={[typography.body, styles.value]}>{r.count}</Text>
            <Text style={[typography.caption, styles.percent]}>{r.percent}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    height: 20,
    gap: GAP,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  segment: { flexBasis: 0, minWidth: 4 },
  table: { marginTop: spacing.md, gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: radius.sm / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { flex: 1 },
  value: { fontWeight: "600", minWidth: 28, textAlign: "right" },
  percent: { minWidth: 40, textAlign: "right" },
});
