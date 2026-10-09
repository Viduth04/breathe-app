// Lecturer insights - Viduth (Member 1). Supports NFR01.

import Card from "@/components/common/Card";
import { colors, spacing, typography } from "@/theme";
import { MIN_RESPONSES } from "@/types/stats";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

// Shown instead of a breakdown when a week has fewer than MIN_RESPONSES check-ins
export default function PrivacyThreshold({ total }: { total: number }) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Ionicons
          name="eye-off-outline"
          size={20}
          color={colors.textSecondary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={[typography.body, styles.title]}>
          Not enough responses to show safely
        </Text>
      </View>
      <Text style={[typography.caption, styles.body]}>
        {total === 0 ? "No check-ins yet this week. " : `${total} ${total === 1 ? "check-in" : "check-ins"} so far. `}
        We only show the mood breakdown once a week has at least {MIN_RESPONSES}{" "}
        check-ins. With fewer, you might be able to guess how one particular
        student is feeling, which would break their trust.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontWeight: "600", flex: 1 },
  body: { marginTop: spacing.xs, lineHeight: 20 },
});
