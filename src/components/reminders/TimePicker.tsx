/**
 * Supports FR05 by letting the student choose when a check-in reminder runs.
 * Offers hour and minute steppers plus common time presets.
 */

import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { formatTime, parseTime, toTime } from "@/types/reminder";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const MINUTE_STEP = 5;

const PRESETS = [
  { label: "Morning", time: "08:00" },
  { label: "Lunchtime", time: "12:30" },
  { label: "Evening", time: "20:00" },
];

const native = Platform.OS !== "web";

const wrap = (value: number, size: number) => ((value % size) + size) % size;

/**
 * Displays a time control and sends changed times to its parent.
 * @param value Current time in HH:mm format.
 * @param onChange Called with the selected time in HH:mm format.
 * @returns The reminder time picker.
 */
export default function TimePicker({
  value,
  onChange,
}: {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
}) {
  const { hour, minute } = parseTime(value);
  const setHour = (h: number) => onChange(toTime(wrap(h, 24), minute));
  // Five-minute steps make the time quicker to set with fewer taps.
  // Snap to the 5-minute grid, then step
  const setMinute = (step: number) => {
    const snapped = Math.round(minute / MINUTE_STEP) * MINUTE_STEP;
    const next = snapped === minute ? minute + step : snapped;
    onChange(toTime(hour, wrap(next, 60)));
  };

  const hourLabel = formatTime(toTime(hour, 0)).replace(/:00/, "");

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Time</Text>
      <Text
        style={styles.big}
        accessibilityRole="text"
        accessibilityLabel={`Reminder time: ${formatTime(value)}`}
        aria-live="polite"
      >
        {formatTime(value)}
      </Text>

      <View style={styles.steppers}>
        <Stepper
          label="Hour"
          valueText={hourLabel}
          onDecrement={() => setHour(hour - 1)}
          onIncrement={() => setHour(hour + 1)}
        />
        <Stepper
          label="Minutes"
          valueText={String(minute).padStart(2, "0")}
          onDecrement={() => setMinute(-MINUTE_STEP)}
          onIncrement={() => setMinute(MINUTE_STEP)}
        />
      </View>

      <View style={styles.presets}>
        {PRESETS.map((p) => {
          const active = p.time === value;
          return (
            <Pressable
              key={p.time}
              onPress={() => onChange(p.time)}
              accessibilityRole="button"
              accessibilityLabel={`${p.label}, ${formatTime(p.time)}`}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.preset,
                active && styles.presetActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>
                {p.label}
              </Text>
              <Text style={typography.caption}>{formatTime(p.time)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Stepper({
  label,
  valueText,
  onDecrement,
  onIncrement,
}: {
  label: string;
  valueText: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    // On iOS/Android a screen reader treats this as one control: swipe up or
    // down to change it. On web the two buttons stay separately focusable
    // (keyboard users can't send increment/decrement actions there).
    <View
      style={styles.stepper}
      accessible={native}
      accessibilityRole={native ? "adjustable" : undefined}
      accessibilityLabel={native ? label : undefined}
      accessibilityValue={native ? { text: valueText } : undefined}
      accessibilityActions={native ? [{ name: "increment" }, { name: "decrement" }] : undefined}
      onAccessibilityAction={(e) =>
        e.nativeEvent.actionName === "increment" ? onIncrement() : onDecrement()
      }
    >
      <Pressable
        onPress={onDecrement}
        accessibilityRole="button"
        accessibilityLabel={`Earlier ${label.toLowerCase()}, now ${valueText}`}
        hitSlop={4}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Ionicons name="remove" size={22} color={colors.primary} />
      </Pressable>
      <View style={styles.stepValue}>
        <Text style={typography.caption}>{label}</Text>
        <Text style={styles.stepText}>{valueText}</Text>
      </View>
      <Pressable
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel={`Later ${label.toLowerCase()}, now ${valueText}`}
        hitSlop={4}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: spacing.xs },
  big: { ...typography.title, fontSize: 36, textAlign: "center", marginVertical: spacing.sm },
  steppers: { flexDirection: "row", gap: spacing.sm },
  stepper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stepButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { alignItems: "center" },
  stepText: { fontSize: 20, fontWeight: "600", color: colors.text },
  presets: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  preset: {
    flex: 1,
    alignItems: "center",
    minHeight: TOUCH_TARGET,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetActive: { backgroundColor: colors.selected, borderColor: colors.primary },
  presetText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  presetTextActive: { color: colors.primary },
  pressed: { opacity: 0.7 },
});
