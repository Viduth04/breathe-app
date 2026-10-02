// Self-help resources - Ishara (Member 2). FR06.
//
// One published resource. Articles read as paragraphs; exercises show their
// numbered steps and can be done as a guided, step-by-step walkthrough.
// Hidden from the tab bar; opened from the Exercises tab and Home.

import ResourcePreview from "@/components/admin/ResourcePreview";
import MoodHeader from "@/components/checkin/MoodHeader";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import GuidedExercise from "@/components/resources/GuidedExercise";
import { getAuthErrorMessage } from "@/services/authService";
import { getPublishedResource } from "@/services/resourceService";
import { colors, spacing, TOUCH_TARGET, typography } from "@/theme";
import { exerciseSteps, Resource } from "@/types/resource";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Mode = "read" | "guided" | "done";

export default function ResourceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [mode, setMode] = useState<Mode>("read");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(undefined);
    setMode("read");
    try {
      setResource(await getPublishedResource(id));
    } catch (e) {
      console.warn("Loading resource failed", e);
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // The tab stays mounted, so reload whenever a different resource is opened
  useEffect(() => {
    load();
  }, [load]);

  const header = <MoodHeader title="Resource" fallback="/(student)/exercises" />;
  const backToResources = () => router.navigate("/(student)/exercises");

  const supportLink = (
    <Pressable
      onPress={() => router.navigate("/(student)/session/dashboard")}
      accessibilityRole="link"
      accessibilityLabel="Need more support? Talk to a counsellor"
      style={({ pressed }) => [styles.support, pressed && styles.pressed]}
    >
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={18}
        color={colors.primary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={typography.body}>
        Need more support? <Text style={styles.link}>Talk to a counsellor</Text>
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <Screen>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Loading resource" />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        {header}
        <Card>
          <Text style={typography.heading}>Couldn't load this resource</Text>
          <Text style={[typography.body, styles.muted, styles.cardText]} accessibilityLiveRegion="polite">
            {error}
          </Text>
          <Button title="Try Again" onPress={load} />
        </Card>
      </Screen>
    );
  }

  if (!resource) {
    return (
      <Screen>
        {header}
        <Card>
          <Text style={typography.heading}>Resource not available</Text>
          <Text style={[typography.body, styles.muted, styles.cardText]}>
            It may have been removed or is being updated.
          </Text>
          <Button title="Back to resources" onPress={backToResources} />
        </Card>
      </Screen>
    );
  }

  const steps = exerciseSteps(resource.content);
  const canGuide = resource.type === "exercise" && steps.length > 0;

  if (mode === "guided" && canGuide) {
    return (
      <Screen>
        {header}
        <Text style={[typography.heading, styles.guidedTitle]}>{resource.title}</Text>
        <GuidedExercise
          steps={steps}
          durationMinutes={resource.durationMinutes}
          onFinish={() => setMode("done")}
          onExit={() => setMode("read")}
        />
        {supportLink}
      </Screen>
    );
  }

  if (mode === "done") {
    return (
      <Screen>
        {header}
        <Card variant="success" style={styles.done}>
          <Ionicons
            name="leaf"
            size={36}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={typography.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            Well done
          </Text>
          <Text style={[typography.body, styles.centerText]}>
            You finished {resource.title}. Take a moment to notice how you feel right now.
          </Text>
          <View style={styles.actions}>
            <Button title="Check in now" onPress={() => router.navigate("/(student)/check-in")} />
            <Button title="Back to resources" variant="secondary" onPress={backToResources} />
          </View>
        </Card>
        {supportLink}
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <ResourcePreview {...resource} />
      {canGuide ? (
        <Button
          title="Start guided exercise"
          icon="play"
          onPress={() => setMode("guided")}
          style={styles.start}
        />
      ) : null}
      {supportLink}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  muted: { color: colors.textSecondary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center" },
  cardText: { marginVertical: spacing.sm },
  link: { fontWeight: "600", color: colors.primary },
  guidedTitle: { marginBottom: spacing.md },
  start: { marginBottom: spacing.sm },
  support: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
    marginTop: spacing.sm,
  },
  done: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
});
