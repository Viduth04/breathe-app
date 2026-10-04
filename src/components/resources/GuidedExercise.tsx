// Self-help resources - Ishara (Member 2). FR06.
//
// Walks through an exercise one step at a time with Back / Next and an
// optional countdown per step. The timer never moves on by itself: the
// student taps Next when they're ready.

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Suggested time per step: the exercise's duration split across its steps,
// rounded to 5 seconds, between 15 seconds and 5 minutes
export const secondsPerStep = (durationMinutes: number, steps: number) =>
  Math.min(300, Math.max(15, Math.round((durationMinutes * 60) / Math.max(steps, 1) / 5) * 5));

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function GuidedExercise({
  steps,
  durationMinutes,
  onFinish,
  onExit,
}: {
  steps: string[];
  durationMinutes: number;
  onFinish: () => void;
  onExit: () => void;
}) {
  const stepSeconds = secondsPerStep(durationMinutes, steps.length);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(stepSeconds);
  const [running, setRunning] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  // New step: fresh, stopped timer
  useEffect(() => {
    setRemaining(stepSeconds);
    setRunning(false);
    setTimeUp(false);
  }, [index, stepSeconds]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          setRunning(false);
          setTimeUp(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const isLast = index === steps.length - 1;
  const toggleTimer = () => {
    if (remaining === 0) {
      setRemaining(stepSeconds);
      setTimeUp(false);
    }
    setRunning((r) => !r);
  };

  return (
    <Card>
      <View style={styles.top}>
        <Text style={typography.caption} accessibilityLiveRegion="polite">
          Step {index + 1} of {steps.length}
        </Text>
        <Pressable
          onPress={onExit}
          accessibilityRole="button"
          accessibilityLabel="Exit guided exercise"
          style={({ pressed }) => [styles.exit, pressed && styles.pressed]}
        >
          <Text style={styles.link}>Exit</Text>
        </Pressable>
      </View>

      {/* Progress, also given as text above */}
      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no">
        <View style={[styles.fill, { width: `${((index + 1) / steps.length) * 100}%` }]} />
      </View>

      <Text style={styles.step} accessibilityRole="header">
        {steps[index]}
      </Text>

      {/* Optional timer */}
      <View style={styles.timer}>
        <Text
          style={styles.clock}
          accessibilityLabel={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds left`}
        >
          {clock(remaining)}
        </Text>
        <Pressable
          onPress={toggleTimer}
          accessibilityRole="button"
          accessibilityLabel={running ? "Pause timer" : remaining === 0 ? "Restart timer" : "Start timer"}
          style={({ pressed }) => [styles.timerButton, pressed && styles.pressed]}
        >
          <Ionicons
            name={running ? "pause" : remaining === 0 ? "refresh" : "play"}
            size={18}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.link}>
            {running ? "Pause" : remaining === 0 ? "Restart" : "Start timer"}
          </Text>
        </Pressable>
      </View>
      {timeUp ? (
        <Text style={[typography.caption, styles.timeUp]} accessibilityLiveRegion="polite">
          Time's up. Tap {isLast ? "Finish" : "Next"} when you're ready.
        </Text>
      ) : (
        <Text style={[typography.caption, styles.timeUp]}>Timer is optional. Go at your own pace.</Text>
      )}

      <View style={styles.nav}>
        <Button
          title="Back"
          variant="secondary"
          onPress={() => setIndex((i) => i - 1)}
          disabled={index === 0}
          style={styles.navButton}
        />
        <Button
          title={isLast ? "Finish" : "Next"}
          onPress={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
          style={styles.navButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exit: { minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET, alignItems: "flex-end", justifyContent: "center" },
  link: { fontSize: 16, fontWeight: "600", color: colors.primary },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: { height: 6, backgroundColor: colors.primary },
  step: { fontSize: 22, lineHeight: 32, fontWeight: "600", color: colors.text, marginVertical: spacing.xl },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  clock: { fontSize: 28, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  timeUp: { marginTop: spacing.sm },
  nav: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  navButton: { flex: 1 },
});
