// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.
//
// Last 8 weeks: average mood and participation as two separate charts
// (one y-axis each), plus a table of the same numbers.

import { EmptyState, ErrorState, LoadingState } from "@/components/admin/StateViews";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import LecturerHeader from "@/components/lecturer/LecturerHeader";
import {
  describeWeek,
  MoodLineChart,
  ParticipationChart,
} from "@/components/lecturer/WeekCharts";
import { useWeekStats } from "@/hooks/useWeekStats";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { averageMood, isSafeToShow, MIN_RESPONSES } from "@/types/stats";
import { shortDate } from "@/utils/week";
import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const WEEKS = 8;

export default function Trends() {
  const { weeks, loading, refreshing, error, refresh, hasDemoData } = useWeekStats(WEEKS);
  const [selected, setSelected] = useState(WEEKS - 1);

  // Default to the latest week whenever the data reloads
  useEffect(() => {
    if (weeks.length) setSelected(weeks.length - 1);
  }, [weeks]);

  const hasAnyData = weeks.some((w) => (w.stats?.total ?? 0) > 0);
  const safeWeeks = weeks.filter((w) => isSafeToShow(w.stats));
  const moodSummary = safeWeeks.length
    ? `Average mood per week, 1 to 5. ${safeWeeks
        .map((w) => `${shortDate(w.start)}: ${averageMood(w.stats!)!.toFixed(1)}`)
        .join(", ")}. Weeks with fewer than ${MIN_RESPONSES} check-ins are left out.`
    : "Average mood per week. No week has enough check-ins to show yet.";
  const participationSummary = `Check-ins per week. ${weeks
    .map((w) => `${shortDate(w.start)}: ${w.stats?.total ?? 0}`)
    .join(", ")}.`;

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <LecturerHeader
          title="Trends"
          subtitle="The last 8 weeks"
          hasDemoData={hasDemoData}
        />

        {loading ? (
          <LoadingState label="Loading weekly trends" />
        ) : error ? (
          <ErrorState
            title="Couldn't load the trends"
            message={error}
            onRetry={refresh}
            retrying={refreshing}
          />
        ) : !hasAnyData ? (
          <EmptyState
            icon="stats-chart-outline"
            message="No check-ins in the last 8 weeks yet. Trends appear here once students start checking in."
          />
        ) : (
          <>
            <Card>
              <Text style={typography.heading} accessibilityRole="header">
                Average mood
              </Text>
              <Text style={[typography.caption, styles.caption]}>
                1 = Very low · 5 = Great. Gaps are weeks with fewer than{" "}
                {MIN_RESPONSES} check-ins.
              </Text>
              <MoodLineChart
                weeks={weeks}
                selected={selected}
                onSelect={setSelected}
                label={moodSummary}
              />
            </Card>

            <Card>
              <Text style={typography.heading} accessibilityRole="header">
                Participation
              </Text>
              <Text style={[typography.caption, styles.caption]}>
                Number of check-ins each week
              </Text>
              <ParticipationChart
                weeks={weeks}
                selected={selected}
                onSelect={setSelected}
                label={participationSummary}
              />
            </Card>

            {weeks[selected] ? (
              <Card variant="success">
                <Text style={typography.body} accessibilityLiveRegion="polite">
                  {describeWeek(weeks[selected])}
                </Text>
              </Card>
            ) : null}

            <Card>
              <Text style={typography.heading} accessibilityRole="header">
                Week by week
              </Text>
              <Text style={[typography.caption, styles.caption]}>
                Tap a week to highlight it in the charts.
              </Text>
              {[...weeks].reverse().map((week) => {
                const index = weeks.indexOf(week);
                const total = week.stats?.total ?? 0;
                const safe = isSafeToShow(week.stats);
                const active = index === selected;
                return (
                  <Pressable
                    key={week.id}
                    onPress={() => setSelected(index)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={describeWeek(week)}
                    style={[styles.row, active && styles.rowActive]}
                  >
                    <Text style={[typography.body, styles.week]}>
                      {index === weeks.length - 1 ? "This week" : shortDate(week.start)}
                    </Text>
                    <Text style={[typography.body, styles.count]}>{total}</Text>
                    <Text style={[typography.caption, styles.avg]}>
                      {safe ? `avg ${averageMood(week.stats!)!.toFixed(1)}` : "Not enough"}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>

            <Text style={[typography.caption, styles.footnote]}>
              Weeks with fewer than {MIN_RESPONSES} check-ins never show an average
              or breakdown, so no one can work out how an individual student felt.
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1 },
  caption: { marginTop: spacing.xs, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  rowActive: { backgroundColor: colors.success },
  week: { flex: 1 },
  count: { fontWeight: "600", minWidth: 32, textAlign: "right" },
  avg: { minWidth: 80, textAlign: "right" },
  footnote: { textAlign: "center", marginTop: spacing.sm },
});
