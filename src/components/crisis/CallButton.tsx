// Crisis Support - Viduth (Member 1). Fixes Milestone 02 F9 / R9.

import { Helpline } from "@/constants/helplines";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, Platform, Pressable, StyleSheet, Text } from "react-native";

// Opens the phone dialler. If that fails (web, tablets, simulators) the
// number is shown so the person can still dial it themselves.
export async function callHelpline(helpline: Helpline) {
  try {
    await Linking.openURL(`tel:${helpline.dial}`);
  } catch {
    const message = `Please dial ${helpline.number} for ${helpline.name}.`;
    if (Platform.OS === "web") window.alert(message);
    else Alert.alert("Couldn't open your phone app", message);
  }
}

// Tap-to-call button. `large` is used for emergency numbers.
export default function CallButton({
  helpline,
  large = false,
}: {
  helpline: Helpline;
  large?: boolean;
}) {
  return (
    <Pressable
      onPress={() => callHelpline(helpline)}
      accessibilityRole="button"
      accessibilityLabel={`Call ${helpline.number}, ${helpline.name}`}
      style={({ pressed }) => [
        styles.button,
        large && styles.large,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="call"
        size={large ? 22 : 18}
        color={colors.white}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={[styles.text, large && styles.largeText]}>
        {large ? helpline.number : `Call ${helpline.number}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  large: { minHeight: 64, paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.85 },
  text: { fontSize: 16, fontWeight: "600", color: colors.white },
  largeText: { fontSize: 24, fontWeight: "700" },
});
