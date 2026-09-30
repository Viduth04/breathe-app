// Crisis Support - Viduth (Member 1). Fixes Milestone 02 F9 / R9.

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { colors, radius, spacing, typography } from "@/theme";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

// Box-style breathing: in 4, hold 4, out 4 -> 12s per round, 5 rounds = 1 minute
const PHASES = [
  { label: "Breathe in", seconds: 4, scale: 1 },
  { label: "Hold", seconds: 4, scale: 1 },
  { label: "Breathe out", seconds: 4, scale: 0.6 },
] as const;
const TOTAL_SECONDS = 60;
const SMALL = 0.6;

export default function BreathingGuide() {
  const reduceMotion = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // Seconds since start
  const scale = useRef(new Animated.Value(SMALL)).current;

  const cycle = PHASES.reduce((sum, p) => sum + p.seconds, 0);
  const inCycle = elapsed % cycle;
  let phaseIndex = 0;
  let phaseStart = 0;
  while (inCycle >= phaseStart + PHASES[phaseIndex].seconds) {
    phaseStart += PHASES[phaseIndex].seconds;
    phaseIndex += 1;
  }
  const phase = PHASES[phaseIndex];
  const countdown = phase.seconds - (inCycle - phaseStart);
  const finished = elapsed >= TOTAL_SECONDS;

  // One tick per second while running
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!finished) return;
    setRunning(false);
    scale.stopAnimation();
  }, [finished, scale]);

  // Grow on "Breathe in", shrink on "Breathe out"; no movement with reduce motion
  const phaseKey = running ? `${Math.floor(elapsed / cycle)}-${phaseIndex}` : "idle";
  useEffect(() => {
    if (!running || finished || reduceMotion) return;
    if (inCycle !== phaseStart) return; // Only start the animation at the phase change
    Animated.timing(scale, {
      toValue: phase.scale,
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey, reduceMotion]);

  const start = () => {
    scale.setValue(SMALL);
    setElapsed(0);
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    scale.stopAnimation();
    scale.setValue(SMALL);
  };

  // Announced by screen readers only when it changes, so it holds the phase,
  // not the per-second countdown
  const status = !running
    ? finished
      ? "Well done. Take a moment before you carry on."
      : "A one-minute breathing exercise"
    : phase.label;

  return (
    <Card>
      <Text style={typography.heading} accessibilityRole="header">
        Breathe with me
      </Text>
      <Text style={[typography.caption, styles.hint]}>
        Breathe in for 4, hold for 4, breathe out for 4.
      </Text>

      <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no">
        <Animated.View
          style={[
            styles.circle,
            { transform: [{ scale: reduceMotion ? 1 : scale }] },
          ]}
        />
      </View>

      <Text
        style={[typography.heading, styles.status]}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
      >
        {status}
      </Text>
      {running ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.countdown}>{countdown}</Text>
          <Text style={[typography.caption, styles.center]}>
            {TOTAL_SECONDS - elapsed} seconds left
          </Text>
        </View>
      ) : null}

      <Button
        title={running ? "Stop" : finished ? "Start Again" : "Start"}
        variant={running ? "secondary" : "primary"}
        onPress={running ? stop : start}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: spacing.xs },
  stage: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: radius.full,
    backgroundColor: colors.selected,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  status: { textAlign: "center" },
  center: { textAlign: "center", marginTop: spacing.xs },
  countdown: { ...typography.title, textAlign: "center", color: colors.primary },
  button: { marginTop: spacing.md },
});
