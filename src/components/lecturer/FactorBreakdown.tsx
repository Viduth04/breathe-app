// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.
//
// "What's affecting students this week": the top 5 reasons students tagged,
// as a share of that week's check-ins. Anonymous totals only, and hidden for
// weeks under the privacy threshold like the other charts.

import Card from "@/components/common/Card";
import PrivacyThreshold from "@/components/lecturer/PrivacyThreshold";
import { WeekEntry } from "@/services/statsService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { FACTOR_KEYS, FACTOR_LABELS, factorCount, isSafeToShow } from "@/types/stats";
import { shortDate } from "@/utils/week";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

const TOP = 5;

type Props = {
  weeks: WeekEntry[];
  selected: number; // Shared with the other Trends charts
  onSelect: (index: number) => void;
};

export default function FactorBreakdown({ weeks, selected, onSelect }: Props) {
  const week = weeks[selected];
  if (!week) return null;

  const isLatest = selected === weeks.length - 1;
  const weekName = isLatest ? "This week" : `Week of ${shortDate(week.start)}`;
  const stats = week.stats;
  const total = stats?.total ?? 0;

  const rows =
    stats && isSafeToShow(stats)
      ? FACTOR_KEYS.map((key) => ({ key, count: factorCount(stats, key) }))
          .filter((r) => r.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, TOP)
          .map((r) => ({ ...r, percent: Math.round((r.count / total) * 100) }))
      : [];

  const step = (delta: number) => onSelect(selected + delta);

  return (
    <Card>
      <Text style={typography.heading} accessibilityRole="header">
        What's affecting students this week
      </Text>
      <Text style={[typography.caption, styles.caption]}>
        Anonymous totals only. Students can choose not to add reasons.
      </Text>

      {/* Same selected week as the charts above; arrows step through it */}
      <View style={styles.selector}>
        <Pressable
          onPress={() => step(-1)}
          disabled={selected === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          accessibilityState={{ disabled: selected === 0 }}
          style={styles.arrow}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={selected === 0 ? colors.border : colors.primary}
          />
        </Pressable>
        <Text style={[typography.body, styles.weekName]} accessibilityLiveRegion="polite">
          {weekName}
        </Text>
        <Pressable
          onPress={() => step(1)}
          disabled={isLatest}
          accessibilityRole="button"
          accessibilityLabel="Next week"
          accessibilityState={{ disabled: isLatest }}
          style={styles.arrow}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={isLatest ? colors.border : colors.primary}
          />
        </Pressable>
      </View>

      {/* Percent = share of that week's check-ins; reasons can overlap */}
      {!isSafeToShow(stats ?? null) ? (
        <PrivacyThreshold total={total} />
      ) : rows.length === 0 ? (
        <Text style={[typography.body, styles.empty]}>
          No reasons were added this week.
        </Text>
      ) : (
        <View style={styles.bars}>
          {rows.map((r) => (
            <View
              key={r.key}
              style={styles.row}
              accessible
              accessibilityLabel={`${FACTOR_LABELS[r.key]}, ${r.percent} percent`}
            >
              <Text style={[typography.body, styles.label]} numberOfLines={1}>
                {FACTOR_LABELS[r.key]}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${r.percent}%` }]} />
              </View>
              <Text style={[typography.body, styles.percent]}>{r.percent}%</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  caption: { marginTop: spacing.xs, marginBottom: spacing.sm },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  arrow: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  weekName: { fontWeight: "600", flex: 1, textAlign: "center" },
  empty: { color: colors.textSecondary },
  bars: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { width: 112 },
  track: {
    flex: 1,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.sm, backgroundColor: colors.primary },
  percent: { fontWeight: "600", minWidth: 44, textAlign: "right" },
});
