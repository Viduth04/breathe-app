// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.
//
// This week at a glance, from anonymous weekly totals only (stats/{weekId}).

import { ErrorState, LoadingState } from "@/components/admin/StateViews";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import LecturerHeader from "@/components/lecturer/LecturerHeader";
import MoodDistribution from "@/components/lecturer/MoodDistribution";
import PrivacyThreshold from "@/components/lecturer/PrivacyThreshold";
import { useAuth } from "@/context/AuthContext";
import { useWeekStats } from "@/hooks/useWeekStats";
import { WeekEntry } from "@/services/statsService";
import { colors, spacing, typography } from "@/theme";
import { averageMood, isSafeToShow, MOOD_LABELS, MoodLevel } from "@/types/stats";
import { Ionicons } from "@expo/vector-icons";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

const moodName = (avg: number) =>
  MOOD_LABELS[Math.min(5, Math.max(1, Math.round(avg))) as MoodLevel];

// Plain-language comparison with last week; only uses weeks that pass the threshold
function insight(thisWeek: WeekEntry, lastWeek: WeekEntry | undefined) {
  if (!isSafeToShow(thisWeek.stats)) {
    return "It's too early to compare with last week. This week needs at least 5 check-ins first.";
  }
  if (!lastWeek || !isSafeToShow(lastWeek.stats)) {
    return "Last week didn't have enough check-ins to compare with.";
  }
  const now = averageMood(thisWeek.stats!)!;
  const before = averageMood(lastWeek.stats!)!;
  const diff = now - before;
  if (Math.abs(diff) < 0.2) {
    return `Mood is about the same as last week (${now.toFixed(1)} vs ${before.toFixed(1)}).`;
  }
  if (diff < 0) {
    return `Mood is lower than last week (${now.toFixed(1)} vs ${before.toFixed(1)}). It could help to remind students about the Resources tab, counselling and Crisis Support.`;
  }
  return `Mood is higher than last week (${now.toFixed(1)} vs ${before.toFixed(1)}).`;
}

export default function Overview() {
  const { profile } = useAuth();
  const { weeks, loading, refreshing, error, refresh, hasDemoData } = useWeekStats(2);
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || "there";

  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];
  const total = thisWeek?.stats?.total ?? 0;
  const safe = isSafeToShow(thisWeek?.stats ?? null);
  const avg = safe ? averageMood(thisWeek.stats!)! : null;

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
          title={`Hi, ${firstName}`}
          subtitle="Student wellbeing this week"
          hasDemoData={hasDemoData}
        />

        {loading ? (
          <LoadingState label="Loading this week's totals" />
        ) : error || !thisWeek ? (
          <ErrorState
            title="Couldn't load the totals"
            message={error ?? "Something went wrong. Please try again."}
            onRetry={refresh}
            retrying={refreshing}
          />
        ) : (
          <>
            <View style={styles.tiles}>
              <Card style={styles.tile}>
                <View accessible accessibilityLabel={`${total} check-ins this week`}>
                  <Text style={styles.hero}>{total}</Text>
                  <Text style={typography.caption}>Check-ins this week</Text>
                </View>
              </Card>
              <Card style={styles.tile}>
                <View
                  accessible
                  accessibilityLabel={
                    avg !== null
                      ? `Average mood ${avg.toFixed(1)} out of 5, ${moodName(avg)}`
                      : "Average mood hidden: not enough responses yet"
                  }
                >
                  <Text style={styles.hero}>{avg !== null ? avg.toFixed(1) : "–"}</Text>
                  <Text style={typography.caption}>
                    {avg !== null ? `Average mood · ${moodName(avg)}` : "Average mood (hidden)"}
                  </Text>
                </View>
              </Card>
            </View>

            <Card>
              <Text style={typography.heading} accessibilityRole="header">
                How students feel this week
              </Text>
              <Text style={[typography.caption, styles.scale]}>
                1 = Very low · 5 = Great
              </Text>
              {safe ? (
                <MoodDistribution week={thisWeek.stats!} />
              ) : (
                <PrivacyThreshold total={total} />
              )}
            </Card>

            <Card variant="success">
              <View style={styles.insightRow}>
                <Ionicons
                  name="bulb-outline"
                  size={20}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={[typography.body, styles.flex]} accessibilityRole="text">
                  {insight(thisWeek, lastWeek)}
                </Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1 },
  tiles: { flexDirection: "row", gap: spacing.sm },
  tile: { flex: 1 },
  hero: { ...typography.title, fontSize: 34 },
  scale: { marginTop: spacing.xs },
  insightRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  flex: { flex: 1, lineHeight: 22 },
});
