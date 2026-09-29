// Admin panel - Viduth (Member 1).

import LogoutButton from "@/components/auth/LogoutButton";
import Logo from "@/components/common/Logo";
import { spacing, typography } from "@/theme";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

// Logo + Log Out on top, then the tab title (shared by every admin tab)
export default function AdminHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode; // e.g. an "Add" button under the title
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <Logo size={20} showWordmark />
        <LogoutButton variant="secondary" style={styles.logout} />
      </View>
      <Text style={[typography.title, styles.title]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={typography.caption}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs, marginBottom: spacing.md },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logout: { paddingHorizontal: spacing.md },
  title: { marginTop: spacing.lg },
});
