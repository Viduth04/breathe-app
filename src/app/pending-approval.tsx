// Staff onboarding - Viduth (Member 1). Supports FR01, NFR01.
//
// Shown instead of any app area to a staff sign-up that an admin hasn't
// approved ("pending") or has turned down ("rejected"). The profile is a live
// listener, so once an admin approves, this screen sends them to their area.

import LogoutButton from "@/components/auth/LogoutButton";
import Logo from "@/components/common/Logo";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import UrgentHelpLink from "@/components/crisis/UrgentHelpLink";
import LoadingScreen from "@/components/navigation/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { isStaffRequest } from "@/services/authService";
import { colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const ROLE_LABEL = { counsellor: "counsellor", lecturer: "lecturer" } as const;

const NEXT_STEPS = [
  "An admin checks your details. This usually takes a day or two.",
  "Once approved, this screen opens your staff area automatically, or the next time you log in.",
  "Counsellors also get a public profile set up by the admin before students can book them.",
];

export default function PendingApproval() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <LoadingScreen offerLogout />;
  // Approved (or never a staff request): index routes by role
  if (!isStaffRequest(profile)) return <Redirect href="/" />;

  const role = profile.requestedRole ? ROLE_LABEL[profile.requestedRole] : "staff";
  const rejected = profile.approvalStatus === "rejected";

  return (
    <Screen style={styles.content}>
      <View style={styles.logo}>
        <Logo size={20} showWordmark badge />
      </View>

      <Ionicons
        name={rejected ? "leaf-outline" : "hourglass-outline"}
        size={44}
        color={colors.primary}
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={[typography.title, styles.center]} accessibilityRole="header">
        {rejected ? "Request not approved" : "Waiting for approval"}
      </Text>

      {rejected ? (
        <Card>
          <Text style={typography.body}>
            Your request for a {role} account wasn't approved. If you think this
            is a mistake, please contact the student wellbeing team or your
            department and they can help.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={typography.body}>
            Thanks for signing up as a {role}. Staff accounts need an admin to
            approve them before you can use them.
          </Text>
          <Text style={[typography.heading, styles.nextTitle]}>What happens next</Text>
          {NEXT_STEPS.map((step, i) => (
            <View key={step} style={styles.step}>
              <Text style={styles.stepNumber}>{i + 1}.</Text>
              <Text style={[typography.body, styles.flex]}>{step}</Text>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.spacer} />
      <UrgentHelpLink />
      <LogoutButton variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  logo: { alignItems: "center", marginBottom: spacing.sm },
  icon: { alignSelf: "center" },
  center: { textAlign: "center" },
  nextTitle: { marginTop: spacing.md, marginBottom: spacing.sm, fontSize: 17 },
  step: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  stepNumber: { ...typography.body, fontWeight: "700", color: colors.primary },
  flex: { flex: 1 },
  spacer: { flexGrow: 1 },
});
