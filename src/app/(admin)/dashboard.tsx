// Admin panel - Viduth (Member 1). Supports FR01, FR03, FR06, NFR01.
//
// Overview numbers come only from users, counsellors and resources.

import AdminHeader from "@/components/admin/AdminHeader";
import RoleBadge from "@/components/admin/RoleBadge";
import { displayName } from "@/components/admin/RoleSheet";
import { ErrorState, LoadingState } from "@/components/admin/StateViews";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { useAuth } from "@/context/AuthContext";
import { AdminStats, getAdminStats } from "@/services/adminService";
import { getAuthErrorMessage } from "@/services/authService";
import { colors, spacing, typography } from "@/theme";
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
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: { ...typography.body, fontWeight: "600" },
});
