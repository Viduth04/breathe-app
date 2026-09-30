// Admin panel - Viduth (Member 1). Supports FR06, NFR01.
//
// Create, edit and delete self-help resources (articles and exercises)
// shown to students. Only admins can write them (see firestore.rules).

import AdminHeader from "@/components/admin/AdminHeader";
import IconButton from "@/components/admin/IconButton";
import ResourceForm from "@/components/admin/ResourceForm";
import {
  EmptyState,
  ErrorState,
  InlineError,
  LoadingState,
  SuccessNotice,
} from "@/components/admin/StateViews";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import Screen from "@/components/common/Screen";
import {
  deleteResource,
  listResources,
  loadStarterResources,
} from "@/services/adminService";
import { getAuthErrorMessage } from "@/services/authService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Resource, ResourceType } from "@/types/resource";
import { confirmAction } from "@/utils/confirm";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Filter = "all" | ResourceType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "article", label: "Articles" },
  { key: "exercise", label: "Exercises" },
];

type FormState = { existing: Resource | null };

export default function Resources() {
  const params = useLocalSearchParams<{ new?: string }>();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string>();

  const load = useCallback(async () => {
    setLoadError(undefined);
    try {
      setResources(await listResources());
    } catch (e) {
      setLoadError(getAuthErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // "Add resource" on Overview opens the form here
  useEffect(() => {
    if (params.new && !loading) {
      setForm({ existing: null });
      router.setParams({ new: undefined });
    }
  }, [params.new, loading]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hideNotice = useCallback(() => setNotice(null), []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resources.filter(
      (r) =>
        (filter === "all" || r.type === filter) &&
        (!term ||
          r.title.toLowerCase().includes(term) ||
          r.summary.toLowerCase().includes(term)),
    );
  }, [resources, search, filter]);

  const handleDelete = async (resource: Resource) => {
    const ok = await confirmAction({
      title: `Delete "${resource.title}"?`,
      message: "Students will no longer see it. This can't be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;
    setRowErrors(({ [resource.id]: _, ...rest }) => rest);
    setBusyId(resource.id);
    try {
      await deleteResource(resource.id);
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
      setNotice(`"${resource.title}" was deleted.`);
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [resource.id]: getAuthErrorMessage(e) }));
    } finally {
      setBusyId(null);
    }
  };

  const handleSeed = async () => {
    setSeedError(undefined);
    setSeeding(true);
    try {
      await loadStarterResources();
      await load();
      setNotice("4 starter resources were added and published.");
    } catch (e) {
      setSeedError(getAuthErrorMessage(e));
    } finally {
      setSeeding(false);
    }
  };

  const handleSaved = (message: string) => {
    setForm(null);
    setNotice(message);
    load();
  };

  // Passed as an element (not a component) so the search box keeps focus while typing
  const header = (
    <View>
      <AdminHeader title="Resources" subtitle="Self-help articles and exercises">
        <Button
          title="Add Resource"
          icon="add-circle-outline"
          onPress={() => setForm({ existing: null })}
          style={styles.addButton}
        />
      </AdminHeader>
      <SuccessNotice message={notice} onHide={hideNotice} />

      {resources.length > 0 ? (
        <>
          <Input
            label="Search resources"
            icon="search-outline"
            placeholder="Title or summary"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          <View style={styles.filters}>
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${label.toLowerCase()}`}
                  accessibilityState={{ selected: active }}
                  style={[styles.filter, active && styles.filterActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );

  const renderResource = ({ item }: { item: Resource }) => {
    const status = item.isPublished ? "Published" : "Draft";
    return (
      <Card>
        <View style={styles.row}>
          <Pressable
            onPress={() => setForm({ existing: item })}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.type}, ${status}. Edit`}
            style={({ pressed }) => [styles.info, pressed && styles.pressed]}
          >
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={[styles.badge, !item.isPublished && styles.badgeDraft]}>
                <Text
                  style={[styles.badgeText, !item.isPublished && styles.badgeTextDraft]}
                >
                  {status}
                </Text>
              </View>
            </View>
            <Text style={typography.caption}>
              {item.type === "exercise" ? "Exercise" : "Article"} ·{" "}
              {item.durationMinutes} min · {item.categories.join(", ")}
            </Text>
            <Text style={[typography.caption, styles.summary]} numberOfLines={2}>
              {item.summary}
            </Text>
          </Pressable>
          <IconButton
            icon="trash-outline"
            label={`Delete ${item.title}`}
            onPress={() => handleDelete(item)}
            danger
            loading={busyId === item.id}
          />
        </View>
        <InlineError message={rowErrors[item.id]} />
      </Card>
    );
  };

  const empty = loading ? (
    <LoadingState label="Loading resources" />
  ) : loadError ? (
    <ErrorState
      title="Couldn't load resources"
      message={loadError}
      onRetry={refresh}
      retrying={refreshing}
    />
  ) : resources.length === 0 ? (
    <EmptyState
      icon="library-outline"
      message="No resources yet. Load a few starter items so students have something to use right away."
    >
      <InlineError message={seedError} />
      <Button
        title="Load Starter Resources"
        icon="download-outline"
        onPress={handleSeed}
        loading={seeding}
      />
    </EmptyState>
  ) : (
    <EmptyState icon="search-outline" message="No resources match your search or filter." />
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={loadError ? [] : visible}
        keyExtractor={(r) => r.id}
        renderItem={renderResource}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      {form ? (
        <ResourceForm
          existing={form.existing}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  addButton: { marginTop: spacing.md },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filter: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  filterActive: { backgroundColor: colors.selected, borderColor: colors.primary },
  filterText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  filterTextActive: { color: colors.primary },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  info: { flex: 1, gap: 2, minHeight: TOUCH_TARGET, justifyContent: "center" },
  pressed: { opacity: 0.7 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  title: { ...typography.body, fontWeight: "600", flexShrink: 1 },
  summary: { marginTop: spacing.xs },
  badge: {
    backgroundColor: colors.selected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeDraft: { backgroundColor: colors.border },
  badgeText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  badgeTextDraft: { color: colors.text },
});
