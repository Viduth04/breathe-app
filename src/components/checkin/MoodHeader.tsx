// Mood tracking - Ishara (Member 2). FR09.

import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Back button + title for the hidden mood screens. Right padding keeps the
// top-right corner free for the floating crisis help button.
export default function MoodHeader({
  title,
  fallback,
}: {
  title: string;
  fallback: Href; // Where "back" goes when there's no history (e.g. web refresh)
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.navigate(fallback))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>
      <Text style={[typography.title, styles.title]} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingRight: TOUCH_TARGET + spacing.sm,
  },
  title: { flex: 1, fontSize: 24 },
  back: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
});
