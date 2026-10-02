// Admin panel - Viduth (Member 1). Supports FR01, FR03, FR06, NFR01.
//
// Overview numbers come only from users, counsellors and resources.

import AdminHeader from "@/components/admin/AdminHeader";
import RoleBadge from "@/components/admin/RoleBadge";
import { displayName } from "@/components/admin/RoleSheet";
import {
  ErrorState,
  LoadingState,
} from "@/components/admin/StateViews";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { useAuth } from "@/context/AuthContext";
import {
  AdminStats,
  getAdminStats,
  loadDemoStats,
  removeDemoStats,
} from "@/services/adminService";
import { getAuthErrorMessage } from "@/services/authService";
import { colors, spacing, typography } from "@/theme";
import { confirmAction } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function StatCard({
  label,
  value,
  icon,
  attention = false,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  attention?: boolean; // Highlight when something needs the admin's action
}) {
  return (
    <Card
      style={StyleSheet.flatten([styles.stat, attention && styles.statAttention])}
    >
      <View accessible accessibilityLabel={`${label}: ${value}`}>
        <Ionicons
          name={icon}
          size={20}
          color={attention ? colors.danger : colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={typography.caption}>{label}</Text>
      </View>
    </Card>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [demoBusy, setDemoBusy] = useState<"load" | "remove" | null>(null);
  const [demoResult, setDemoResult] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // Sample weekly stats so the lecturer charts can be demoed (admins only)
  const runDemo = async (action: "load" | "remove") => {
    const isLoad = action === "load";
    setDemoResult(null);
    try {
      const confirmed = await confirmAction({
        title: isLoad ? "Load demo stats?" : "Remove demo stats?",
        message: isLoad
          ? "This adds sample weekly mood totals for past weeks. Existing weeks are skipped."
          : "This removes only stats marked as demo. Real stats will not be changed.",
        confirmText: isLoad ? "Load" : "Remove",
      });
      if (!confirmed) return;

      setDemoBusy(action);
      const count = action === "load" ? await loadDemoStats() : await removeDemoStats();
      setDemoResult({
        kind: "success",
        message:
          action === "load"
            ? count
              ? `Demo stats added for ${count} past ${count === 1 ? "week" : "weeks"}.`
              : "Those weeks already have data, so nothing was added."
            : count
              ? `Removed demo stats from ${count} ${count === 1 ? "week" : "weeks"}.`
              : "There were no demo stats to remove.",
      });
    } catch (e) {
      console.warn(`[Admin demo stats] ${action} failed`, e);
      setDemoResult({ kind: "error", message: getAuthErrorMessage(e) });
    } finally {
      setDemoBusy(null);
    }
  };

  const load = useCallback(async () => {
    setLoadError(undefined);
    try {
      setStats(await getAdminStats());
    } catch (e) {
      setLoadError(getAuthErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || "Admin";

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
        <AdminHeader title={`Hi, ${firstName}`} subtitle={today()} />

        {loading ? (
          <LoadingState label="Loading overview" />
        ) : loadError || !stats ? (
          <ErrorState
            title="Couldn't load the overview"
            message={loadError ?? "Something went wrong. Please try again."}
            onRetry={refresh}
            retrying={refreshing}
          />
        ) : (
          <>
            <View style={styles.grid}>
              <StatCard label="Students" value={stats.students} icon="school-outline" />
              <StatCard label="Guests" value={stats.guests} icon="eye-off-outline" />
              <StatCard label="Counsellors" value={stats.counsellors} icon="id-card-outline" />
              <StatCard label="Lecturers" value={stats.lecturers} icon="briefcase-outline" />
              <StatCard
                label="Counsellors without a profile"
                value={stats.counsellorsWithoutProfile.length}
                icon="alert-circle-outline"
                attention={stats.counsellorsWithoutProfile.length > 0}
              />
              <StatCard
                label="Published resources"
                value={stats.publishedResources}
                icon="library-outline"
              />
            </View>

            <Text style={[typography.heading, styles.section]} accessibilityRole="header">
              Quick actions
            </Text>
            <View style={styles.actions}>
              <Button
                title="Add counsellor profile"
                icon="person-add-outline"
                onPress={() =>
                  router.navigate({ pathname: "/(admin)/counsellors", params: { new: "1" } })
                }
              />
              <Button
                title="Add resource"
                variant="secondary"
                icon="add-circle-outline"
                onPress={() =>
                  router.navigate({ pathname: "/(admin)/resources", params: { new: "1" } })
                }
              />
            </View>

            <Text style={[typography.heading, styles.section]} accessibilityRole="header">
              Lecturer demo data
            </Text>
            <Card>
              <Text style={typography.caption}>
                Adds sample weekly mood totals for the 8 weeks before this one, so
                the lecturer charts can be demoed. Weeks that already have real
                data are skipped, this week is never touched, and demo weeks are
                labelled for lecturers. Remove them before real use.
              </Text>
              <View style={styles.demoButtons}>
                <Button
                  title="Load demo stats"
                  icon="stats-chart-outline"
                  onPress={() => runDemo("load")}
                  loading={demoBusy === "load"}
                  disabled={demoBusy !== null}
                />
                <Button
                  title="Remove demo stats"
                  variant="secondary"
                  onPress={() => runDemo("remove")}
                  loading={demoBusy === "remove"}
                  disabled={demoBusy !== null}
                />
              </View>
              {demoResult ? (
                <View
                  accessible
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.demoResult,
                    demoResult.kind === "success"
                      ? styles.demoSuccess
                      : styles.demoFailure,
                  ]}
                >
                  <Ionicons
                    name={demoResult.kind === "success" ? "checkmark-circle" : "alert-circle"}
                    size={20}
                    color={demoResult.kind === "success" ? colors.primary : colors.danger}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text
                    style={[
                      styles.demoResultText,
                      demoResult.kind === "success" && styles.demoSuccessText,
                    ]}
                  >
                    {demoResult.message}
                  </Text>
                </View>
              ) : null}
            </Card>

            <Text style={[typography.heading, styles.section]} accessibilityRole="header">
              Recent sign-ups
            </Text>
            {stats.recentSignUps.length === 0 ? (
              <Text style={typography.caption}>No sign-ups yet.</Text>
            ) : (
              stats.recentSignUps.map((user) => {
                const joined = user.createdAt
                  ? user.createdAt.toDate().toLocaleDateString()
                  : "Date unknown";
                return (
                  <Card key={user.uid} style={styles.userRow}>
                    <View
                      style={styles.userInfo}
                      accessible
                      accessibilityLabel={`${displayName(user)}, ${user.role}, joined ${joined}`}
                    >
                      <Text style={styles.userName}>{displayName(user)}</Text>
                      <Text style={typography.caption}>Joined {joined}</Text>
                    </View>
                    <RoleBadge role={user.role} />
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: {
    flexBasis: "47%",
    flexGrow: 1,
    marginBottom: 0,
    gap: spacing.xs,
  },
  statAttention: { backgroundColor: colors.dangerTint },
  statValue: { ...typography.title, marginTop: spacing.xs },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  actions: { gap: spacing.sm },
  demoButtons: { gap: spacing.sm, marginTop: spacing.md },
  demoResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  demoSuccess: { backgroundColor: colors.success },
  demoFailure: { backgroundColor: colors.dangerTint },
  demoResultText: { ...typography.body, color: colors.danger, flex: 1 },
  demoSuccessText: { color: colors.primary },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: { ...typography.body, fontWeight: "600" },
});
