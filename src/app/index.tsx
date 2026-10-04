import LogoutButton from "@/components/auth/LogoutButton";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import LoadingScreen from "@/components/navigation/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { isStaffRequest } from "@/services/authService";
import { spacing, typography } from "@/theme";
import { Redirect } from "expo-router";
import { StyleSheet, Text } from "react-native";

// Entry point: sends each user to the area for their role
export default function Index() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;

  // Right after sign-up the profile document is still being written
  if (!profile) return <LoadingScreen offerLogout />;

  // Staff sign-ups waiting for (or refused) approval never see the student tabs
  if (isStaffRequest(profile)) return <Redirect href="/pending-approval" />;

  switch (profile.role) {
    case "student":
      return <Redirect href="/(student)/home" />;
    case "counsellor":
      return <Redirect href="/(counsellor)/dashboard" />;
    case "admin":
      return <Redirect href="/(admin)/dashboard" />;
    case "lecturer":
      return <Redirect href="/(lecturer)/overview" />;
    default:
      // A role value the app doesn't know (e.g. mistyped in the console).
      // Shown here instead of redirecting, which would loop with (auth).
      return (
        <Screen style={styles.content}>
          <Text style={typography.title} accessibilityRole="header">
            Account not set up
          </Text>
          <Card>
            <Text style={typography.body}>
              Your account doesn't have a role this app recognises. Please
              contact an admin.
            </Text>
          </Card>
          <LogoutButton />
        </Screen>
      );
  }
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
});
