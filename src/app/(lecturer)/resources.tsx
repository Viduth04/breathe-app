// Lecturer insights - Viduth (Member 1). Supports FR06, US05, NFR01.
//
// Read-only list of PUBLISHED resources so lecturers can point students to
// them, plus the Crisis Support screen.

import FormModal from "@/components/admin/FormModal";
import ResourcePreview from "@/components/admin/ResourcePreview";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/StateViews";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import LecturerHeader from "@/components/lecturer/LecturerHeader";
import { getAuthErrorMessage } from "@/services/authService";
import { listPublishedResources } from "@/services/resourceService";
import { colors, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Resource } from "@/types/resource";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

export default function LecturerResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState<Resource | null>(null);

  const load = useCallback(async () => {
    setError(undefined);
    try {
      setResources(await listPublishedResources());
    } catch (e) {
      setError(getAuthErrorMessage(e));
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

  const header = (
    <View>
      <LecturerHeader title="Resources" subtitle="Share these with your students" />
      <Pressable
        onPress={() => router.push("/crisis")}
        accessibilityRole="link"
        accessibilityLabel="Crisis Support. Emergency numbers and helplines to share with a student in distress"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.row}>
          <Ionicons
            name="help-buoy-outline"
            size={22}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <View style={styles.flex}>
            <Text style={styles.title}>Crisis Support</Text>
            <Text style={typography.caption}>
              Emergency numbers and helplines for a student in distress
            </Text>
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
      <Text style={[typography.heading, styles.section]} accessibilityRole="header">
        Self-help resources
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Resource }) => {
    const kind = item.type === "exercise" ? "Exercise" : "Article";
    return (
      <Pressable
        onPress={() => setOpen(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${kind}, ${item.durationMinutes} minutes. Open`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.row}>
          <Ionicons
            name={item.type === "exercise" ? "leaf-outline" : "book-outline"}
            size={20}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <View style={styles.flex}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={typography.caption}>
              {kind} · {item.durationMinutes} min · {item.categories.join(", ")}
            </Text>
            <Text style={[typography.caption, styles.summary]} numberOfLines={2}>
              {item.summary}
            </Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  const empty = loading ? (
    <LoadingState label="Loading resources" />
  ) : error ? (
    <ErrorState
      title="Couldn't load resources"
      message={error}
      onRetry={refresh}
      retrying={refreshing}
    />
  ) : (
    <EmptyState
      icon="library-outline"
      message="No resources have been published yet. An admin can add them."
    />
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={error ? [] : resources}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      {open ? (
        <FormModal visible title={open.title} onClose={() => setOpen(null)}>
          <ResourcePreview {...open} />
        </FormModal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
  },
  flex: { flex: 1, gap: 2 },
  title: { ...typography.body, fontWeight: "600" },
  summary: { marginTop: spacing.xs },
  section: { marginTop: spacing.sm, marginBottom: spacing.sm },
  pressed: { opacity: 0.7 },
});
