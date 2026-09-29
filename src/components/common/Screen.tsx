import { colors, spacing } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { ColorValue, ScrollView, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  gradient?: readonly [ColorValue, ColorValue, ...ColorValue[]]; // e.g. gradients.welcome
};

// Wrap every screen in this so all screens share the cream background and safe padding
export default function Screen({
  children,
  scroll = true,
  style,
  gradient,
}: Props) {
  const content = (
    <SafeAreaView
      style={[styles.safe, gradient && styles.transparent]}
      edges={["top", "left", "right"]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, style]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <>{children}</>
      )}
    </SafeAreaView>
  );

  // Gradient sits behind the safe area so it also fills the status bar region
  return gradient ? (
    <LinearGradient colors={gradient} style={styles.fill}>
      {content}
    </LinearGradient>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  transparent: { backgroundColor: "transparent" },
  content: { padding: spacing.lg, flexGrow: 1 },
});
