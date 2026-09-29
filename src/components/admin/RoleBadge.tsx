// Admin panel - Viduth (Member 1). Supports FR01, NFR01.

import { Role } from "@/services/authService";
import { radius, roleColors, spacing } from "@/theme";
import { StyleSheet, Text, View } from "react-native";

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  counsellor: "Counsellor",
  lecturer: "Lecturer",
  admin: "Admin",
};

export default function RoleBadge({ role }: { role: Role }) {
  const { background, text } = roleColors[role];
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.text, { color: text }]}>{ROLE_LABELS[role]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontWeight: "600" },
});
