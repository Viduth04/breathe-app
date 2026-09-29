import { colors, radius, spacing } from "@/theme";
import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  variant?: "default" | "success";
  style?: ViewStyle;
};

export default function Card({ children, variant = "default", style }: Props) {
  return (
    <View style={[styles.base, variant === "success" && styles.success, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  success: { backgroundColor: colors.success },
});
