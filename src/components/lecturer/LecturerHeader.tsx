// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.

import AdminHeader from "@/components/admin/AdminHeader";
import Card from "@/components/common/Card";
import { colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

// Logo, Log Out, title and the privacy note shown on every lecturer screen
export default function LecturerHeader({
  title,
  subtitle,
  hasDemoData = false,
}: {
  title: string;
  subtitle?: string;
  hasDemoData?: boolean;
}) {
  return (
    <View>
      <AdminHeader title={title} subtitle={subtitle} />
      <Card variant="success" style={styles.note}>
        <View style={styles.row}>
          <Ionicons
            name="shield-checkmark"
            size={18}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[typography.body, styles.flex]}>
            You only see anonymised totals. You never see individual students.
          </Text>
        </View>
      </Card>
      {hasDemoData ? (
        <Text style={[typography.caption, styles.demo]}>
          Some weeks shown are demo data loaded by an admin.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  demo: { marginBottom: spacing.sm },
});
