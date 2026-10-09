import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { colors, spacing, typography } from "@/theme";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  owner: string;
  requirements: string[]; // Milestone 01 requirement IDs, e.g. ["FR02"]
  children?: ReactNode; // Extra actions (e.g. Log Out) shown at the bottom
};

// Temporary screen body until the owner builds the real screen
export default function Placeholder({
  title,
  owner,
  requirements,
  children,
}: Props) {
  return (
    <Screen style={styles.content}>
      <Text style={typography.title} accessibilityRole="header">
        {title}
      </Text>
      <Card>
        <Text style={typography.body}>Owner: {owner}</Text>
        <Text style={[typography.caption, styles.requirements]}>
          Requirements: {requirements.join(", ")}
        </Text>
        <Text style={[typography.caption, styles.note]}>
          Placeholder. The real screen is coming soon.
        </Text>
      </Card>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  requirements: { marginTop: spacing.xs, color: colors.primary },
  note: { marginTop: spacing.sm },
  actions: { marginTop: "auto", gap: spacing.md },
});
