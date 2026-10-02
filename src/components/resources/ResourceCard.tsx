// Self-help resources - Ishara (Member 2). FR06.

import Card from "@/components/common/Card";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import type { Resource } from "@/types/resource";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export const resourceMeta = (r: Pick<Resource, "type" | "durationMinutes">) =>
  `${r.durationMinutes} min ${r.type === "exercise" ? "exercise" : "read"}`;

export const openResource = (id: string) =>
  router.navigate({ pathname: "/(student)/resource/[id]", params: { id } });

// Tappable resource: icon by type, title, summary, duration and categories
export default function ResourceCard({ resource }: { resource: Resource }) {
  const isExercise = resource.type === "exercise";
  const meta = resourceMeta(resource);

  return (
    <Pressable
      onPress={() => openResource(resource.id)}
      accessibilityRole="button"
      accessibilityLabel={`${isExercise ? "Exercise" : "Article"}: ${resource.title}. ${meta}. ${resource.summary}`}
      accessibilityHint="Opens this resource"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.card}>
        <View style={styles.icon}>
          <Ionicons
            name={isExercise ? "leaf-outline" : "book-outline"}
            size={22}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{resource.title}</Text>
          {resource.summary ? (
            <Text style={[typography.caption, styles.summary]} numberOfLines={2}>
              {resource.summary}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={typography.caption}>{meta}</Text>
          </View>
          {resource.categories.length ? (
            <View style={styles.chips}>
              {resource.categories.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </View>
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
  pressed: { opacity: 0.7 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: spacing.xs },
  title: { ...typography.body, fontWeight: "600" },
  summary: { lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    backgroundColor: colors.selected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.primary },
});
