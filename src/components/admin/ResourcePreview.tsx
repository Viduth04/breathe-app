// Admin panel - Viduth (Member 1).
//
// Shows a resource the way a student would see it. Ishara can reuse this
// for the student Exercises screen: import from "@/components/admin/ResourcePreview".

import Card from "@/components/common/Card";
import { colors, radius, spacing, typography } from "@/theme";
import { exerciseSteps, ResourceInput } from "@/types/resource";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = Pick<
  ResourceInput,
  "title" | "type" | "categories" | "durationMinutes" | "summary" | "content"
>;

export default function ResourcePreview({
  title,
  type,
  categories,
  durationMinutes,
  summary,
  content,
}: Props) {
  const isExercise = type === "exercise";
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const steps = exerciseSteps(content);

  return (
    <Card>
      <View style={styles.meta}>
        <View style={styles.typeBadge}>
          <Ionicons
            name={isExercise ? "leaf-outline" : "book-outline"}
            size={14}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.typeText}>{isExercise ? "Exercise" : "Article"}</Text>
        </View>
        <Text style={typography.caption}>
          {durationMinutes} min {isExercise ? "exercise" : "read"}
        </Text>
      </View>

      <Text style={[typography.heading, styles.title]} accessibilityRole="header">
        {title || "Untitled"}
      </Text>
      {categories.length ? (
        <Text style={[typography.caption, styles.categories]}>
          {categories.join(" · ")}
        </Text>
      ) : null}
      {summary ? <Text style={[typography.body, styles.summary]}>{summary}</Text> : null}

      {isExercise ? (
        <View style={styles.steps}>
          {steps.map((step, i) => (
            <View key={`${i}-${step}`} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={[typography.body, styles.flex]}>{step}</Text>
            </View>
          ))}
        </View>
      ) : (
        paragraphs.map((p, i) => (
          <Text key={`${i}-${p.slice(0, 12)}`} style={[typography.body, styles.paragraph]}>
            {p}
          </Text>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  title: { marginTop: spacing.sm },
  categories: { marginTop: spacing.xs, color: colors.primary },
  summary: { marginTop: spacing.sm, color: colors.textSecondary },
  steps: { marginTop: spacing.md, gap: spacing.sm },
  step: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.selected,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  flex: { flex: 1, lineHeight: 24 },
  paragraph: { marginTop: spacing.md, lineHeight: 24 },
});
