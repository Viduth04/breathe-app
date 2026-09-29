import { colors, radius, spacing } from "@/theme";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number; // Height of the leaf in px; the wordmark scales with it
  showWordmark?: boolean; // "Breathe" next to the leaf
  badge?: boolean; // Leaf sits in a white circle (Login, Register, Forgot Password headers)
};

// Breathe leaf: an upright rounded leaf split into two halves by a curved
// central vein, with a short stem. viewBox is 24 x 32 (about 3:4, like the Figma mark).
export function LeafMark({ size = 24 }: { size?: number }) {
  return (
    <Svg width={(size * 24) / 32} height={size} viewBox="0 0 24 32">
      <Path
        d="M12 1C18.2 5.6 22 11 22 17.2C22 23.4 17.6 28 12 28C6.4 28 2 23.4 2 17.2C2 11 5.8 5.6 12 1Z"
        fill={colors.primary}
      />
      {/* Curved central vein, drawn in white so it reads as a split */}
      <Path
        d="M12 5.5C10.4 11 13.8 17.5 12 27"
        stroke={colors.white}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      {/* Stem */}
      <Path
        d="M12 27.5V31"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function Logo({
  size = 24,
  showWordmark = false,
  badge = false,
}: Props) {
  const mark = badge ? (
    <View
      style={[
        styles.badge,
        { width: size * 1.8, height: size * 1.8 },
      ]}
    >
      <LeafMark size={size} />
    </View>
  ) : (
    <LeafMark size={size} />
  );

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Breathe"
    >
      {mark}
      {showWordmark ? (
        <Text style={[styles.wordmark, { fontSize: size * 0.8 }]}>Breathe</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.sm,
  },
  badge: {
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: { fontWeight: "700", color: colors.primary },
});
