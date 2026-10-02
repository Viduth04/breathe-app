// Self-help resources - Ishara (Member 2). FR06.
//
// Published articles and exercises (the rules only let students read
// isPublished == true). Search, type and category filters, and a
// "Recommended for you" section driven by today's check-in factors.

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import ResourceCard from "@/components/resources/ResourceCard";
import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/services/authService";
import { getTodayCheckin } from "@/services/checkinService";
import { listPublishedResources } from "@/services/resourceService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import type { MoodFactor } from "@/types/checkin";
import {
  Resource,
  RESOURCE_CATEGORIES,
  ResourceCategory,
  ResourceType,
} from "@/types/resource";
import { recommendResources } from "@/utils/recommendResources";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const TYPE_FILTERS: { key: ResourceType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "article", label: "Articles" },
  { key: "exercise", label: "Exercises" },
];

// Filter chip: selected = border + check + bold, not colour alone
function Chip({
  label,
  selected,
  onPress,
  a11yLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  a11yLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
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
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function Exercises() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [todayFactors, setTodayFactors] = useState<MoodFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [category, setCategory] = useState<ResourceCategory | null>(null);

  const load = useCallback(async () => {
    setError(undefined);
    try {
      const [list, today] = await Promise.all([
        listPublishedResources(),
        // Recommendations are a bonus: never fail the list because of them
        user ? getTodayCheckin(user.uid).catch(() => null) : Promise.resolve(null),
      ]);
      setResources(list);
      setTodayFactors(today?.factors ?? []);
    } catch (e) {
      console.warn("Loading resources failed", e);
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // First load, and again on return so a new check-in updates the recommendations
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const retry = () => {
    setLoading(true);
    load();
  };

  const filtering = search.trim() !== "" || type !== "all" || category !== null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resources.filter(
      (r) =>
        (type === "all" || r.type === type) &&
        (!category || r.categories.includes(category)) &&
        (!term ||
          r.title.toLowerCase().includes(term) ||
          r.summary.toLowerCase().includes(term) ||
          r.categories.some((c) => c.toLowerCase().includes(term))),
    );
  }, [resources, search, type, category]);

  const recommended = useMemo(
    () => recommendResources(resources, todayFactors),
    [resources, todayFactors],
  );

  const clearFilters = () => {
    setSearch("");
    setType("all");
    setCategory(null);
  };

  let body;
  if (loading) {
    body = (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.state}
        accessibilityLabel="Loading resources"
      />
    );
  } else if (error) {
    body = (
      <Card>
        <Text style={typography.heading}>Couldn't load resources</Text>
        <Text style={[typography.body, styles.muted, styles.cardText]} accessibilityLiveRegion="polite">
          {error}
        </Text>
        <Button title="Try Again" onPress={retry} />
      </Card>
    );
  } else {
    body = (
      <>
        {/* Recommended (only when not searching or filtering) */}
        {!filtering && recommended.items.length ? (
          <View style={styles.section}>
            <Text style={typography.heading} accessibilityRole="header">
              Recommended for you
            </Text>
            <Text style={[typography.caption, styles.sectionCaption]}>{recommended.reason}</Text>
            {recommended.items.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </View>
        ) : null}

        <Text style={[typography.heading, styles.listTitle]} accessibilityRole="header">
          {filtering ? `Results (${filtered.length})` : "All resources"}
        </Text>
        {filtered.length ? (
          filtered.map((r) => <ResourceCard key={r.id} resource={r} />)
        ) : (
          <Card style={styles.empty}>
            <Ionicons
              name="search-outline"
              size={32}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[typography.body, styles.muted, styles.centerText]}>
              {resources.length ? "No resources match." : "No resources yet. Check back soon."}
            </Text>
            {filtering ? (
              <Button title="Clear filters" variant="secondary" onPress={clearFilters} />
            ) : null}
          </Card>
        )}
      </>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={typography.title} accessibilityRole="header">
            Self-Help Resources
          </Text>
          <Text style={[typography.body, styles.muted]}>
            Small steps that can help, whenever you need them.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search resources"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Search resources"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search ? (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={styles.clear}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Type */}
        <View style={styles.chipRow}>
          {TYPE_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              selected={type === f.key}
              onPress={() => setType(f.key)}
              a11yLabel={`Show ${f.label.toLowerCase()}`}
            />
          ))}
        </View>

        {/* Category (tap again to clear) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          style={styles.categoryScroll}
        >
          {RESOURCE_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={category === c}
              onPress={() => setCategory(category === c ? null : c)}
              a11yLabel={`${c} category${category === c ? ", tap to clear" : ""}`}
            />
          ))}
        </ScrollView>

        {body}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1 },
  // Right padding keeps the title clear of the floating crisis help button
  header: { gap: spacing.xs, marginBottom: spacing.lg, paddingRight: TOUCH_TARGET + spacing.sm },
  muted: { color: colors.textSecondary },
  centerText: { textAlign: "center" },
  cardText: { marginVertical: spacing.sm },
  pressed: { opacity: 0.7 },
  state: { marginTop: spacing.xl },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingLeft: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
  clear: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  categoryRow: { flexDirection: "row", gap: spacing.sm },
  categoryScroll: { marginTop: spacing.sm, marginBottom: spacing.lg, flexGrow: 0 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.selected },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { fontWeight: "700", color: colors.primary },
  section: { marginBottom: spacing.md },
  sectionCaption: { marginTop: spacing.xs, marginBottom: spacing.md },
  listTitle: { marginBottom: spacing.md },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
});
