// Crisis Support - Viduth (Member 1). Fixes Milestone 02 F9 / R9 (high
// severity). Supports NFR01.
//
// Lives outside (auth), (student) and (counsellor) so anyone can open it,
// logged in or not. All numbers come from src/constants/helplines.ts.

import AuthHeader from "@/components/auth/AuthHeader";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import BreathingGuide from "@/components/crisis/BreathingGuide";
import CallButton from "@/components/crisis/CallButton";
import { EMERGENCY, HELPLINES } from "@/constants/helplines";
import { useAuth } from "@/context/AuthContext";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Crisis() {
  const { profile } = useAuth();

  // Students book a counsellor in Sessions; everyone else signs in first
  const talkToCounsellor = () =>
    profile?.role === "student"
      ? router.navigate("/(student)/session/dashboard")
      : router.navigate("/(auth)/login");

  return (
    <Screen>
      <AuthHeader />

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="heart"
            size={28}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          You're not alone
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          If you are in immediate danger, call now.
        </Text>
      </View>

      {/* Emergency services */}
      <Card variant="success">
        <Text style={typography.heading} accessibilityRole="header">
          Emergency
        </Text>
        <View style={styles.emergency}>
          {EMERGENCY.map((line) => (
            <View key={line.id} style={styles.emergencyItem}>
              <CallButton helpline={line} large />
              <Text style={[styles.emergencyName, styles.center]}>{line.name}</Text>
              <Text style={[typography.caption, styles.center]}>{line.description}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Helplines */}
      <Text style={[typography.heading, styles.section]} accessibilityRole="header">
        Talk to someone now
      </Text>
      {HELPLINES.map((line) => (
        <Card key={line.id}>
          <View style={styles.lineTop}>
            <Text style={styles.lineName}>{line.name}</Text>
            {line.hours ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{line.hours}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.caption, styles.lineDescription]}>
            {line.description}
          </Text>
          <CallButton helpline={line} />
        </Card>
      ))}

      {/* Campus counsellor */}
      <Card>
        <Text style={typography.heading} accessibilityRole="header">
          Talk to a campus counsellor
        </Text>
        <Text style={[typography.caption, styles.lineDescription]}>
          Book a private session. Counsellors only see your anonymous ID.
        </Text>
        <Button
          title="Talk to a campus counsellor"
          variant="secondary"
          icon="chatbubbles-outline"
          onPress={talkToCounsellor}
        />
      </Card>

      <BreathingGuide />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  subtitle: { color: colors.textSecondary, textAlign: "center" },
  emergency: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  emergencyItem: { flex: 1, gap: spacing.xs },
  emergencyName: { ...typography.body, fontWeight: "600", marginTop: spacing.xs },
  section: { marginTop: spacing.sm, marginBottom: spacing.sm },
  lineTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  lineName: { ...typography.body, fontWeight: "600", flexShrink: 1 },
  lineDescription: { marginTop: spacing.xs, marginBottom: spacing.md },
  badge: {
    backgroundColor: colors.selected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: colors.primary },
});
