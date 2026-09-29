import { BrandLogo } from "@/components/auth/AuthHeader";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { colors, gradients, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// TODO: replace the placeholder with the real artwork once
// assets/images/welcome-illustration.png is added:
//   <Image source={require("@/assets/images/welcome-illustration.png")} style={styles.illustration} resizeMode="contain" accessibilityIgnoresInvertColors />
function IllustrationPlaceholder() {
  return (
    <View style={[styles.illustration, styles.placeholder]}>
      <Ionicons name="leaf" size={96} color={colors.primary} />
    </View>
  );
}

export default function Welcome() {
  return (
    <Screen style={styles.content} gradient={gradients.welcome}>
      <BrandLogo />

      <Card style={styles.illustrationCard}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="Illustration of a student meditating among leaves"
        >
          <IllustrationPlaceholder />
        </View>
        <View style={styles.chip}>
          <Ionicons name="leaf-outline" size={14} color={colors.primary} />
          <Text style={styles.chipText}>Safe Space</Text>
        </View>
      </Card>

      <View style={styles.copy}>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          Small steps toward feeling better
        </Text>
        <Text style={[styles.subtitle, styles.center]}>
          Check in daily. Book support privately.{"\n"}Your data stays yours.
        </Text>
      </View>

      <View style={styles.spacer} />

      <Button
        title="Get Started"
        icon="arrow-forward"
        onPress={() => router.push("/(auth)/login")}
      />

      <View style={styles.privacy}>
        <Ionicons
          name="shield-checkmark"
          size={16}
          color={colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={typography.caption}>
          Support that respects your privacy
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  illustrationCard: {
    padding: spacing.sm,
    marginBottom: 0,
    marginTop: spacing.sm,
  },
  illustration: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
  },
  placeholder: {
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  copy: { gap: spacing.sm },
  center: { textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  spacer: { flexGrow: 1 },
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
});
