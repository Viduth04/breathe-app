// Admin panel - Viduth (Member 1).

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// Loading, error, empty and success states shared by the admin tabs

export function LoadingState({ label }: { label: string }) {
  return (
    <ActivityIndicator
      size="large"
      color={colors.primary}
      style={styles.box}
      accessibilityLabel={label}
    />
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
  retrying,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <Card style={styles.box}>
      <Text style={[typography.heading, styles.center]}>{title}</Text>
      <Text style={[typography.body, styles.center, styles.text]}>{message}</Text>
      <Button title="Try Again" onPress={onRetry} loading={retrying} />
    </Card>
  );
}

export function EmptyState({
  icon,
  message,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  children?: ReactNode; // Optional action button
}) {
  return (
    <View style={styles.box}>
      <Ionicons
        name={icon}
        size={40}
        color={colors.textSecondary}
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={[typography.body, styles.center, styles.text]}>{message}</Text>
      {children}
    </View>
  );
}

// Green confirmation banner that clears itself after a few seconds
export function SuccessNotice({
  message,
  onHide,
}: {
  message: string | null;
  onHide: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, 4000);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;
  return (
    <Card variant="success" style={styles.notice}>
      <View style={styles.noticeRow} accessibilityRole="alert">
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={[typography.body, styles.flex]}>{message}</Text>
      </View>
    </Card>
  );
}

// Inline error line (e.g. a failed toggle or delete)
export function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text style={styles.inlineError} accessibilityRole="alert">
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: spacing.xl },
  center: { textAlign: "center" },
  text: { marginVertical: spacing.sm },
  icon: { alignSelf: "center" },
  notice: { marginBottom: spacing.md },
  noticeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  inlineError: { fontSize: 14, color: colors.danger, marginBottom: spacing.sm },
});
