import LogoutButton from "@/components/auth/LogoutButton";
import { colors, spacing, typography } from "@/theme";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const SLOW_AFTER_MS = 10000;

// Full-screen spinner. With offerLogout, a Log Out escape hatch appears if
// loading takes too long (e.g. a signed-in account whose profile is missing).
export default function LoadingScreen({
  offerLogout = false,
}: {
  offerLogout?: boolean;
}) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!offerLogout) return;
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [offerLogout]);

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        accessibilityLabel="Loading"
      />
      {slow ? (
        <View style={styles.slow}>
          <Text style={[typography.body, styles.center]}>
            We couldn't load your profile. Log out and try again.
          </Text>
          <LogoutButton variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  slow: { marginTop: spacing.lg, gap: spacing.md, alignSelf: "stretch" },
  center: { textAlign: "center" },
});
