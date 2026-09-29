import LogoutButton from "@/components/auth/LogoutButton";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import LoadingScreen from "@/components/navigation/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { spacing, typography } from "@/theme";
import { Redirect } from "expo-router";
import { StyleSheet, Text } from "react-native";

// Entry point: sends each user to the area for their role
export default function Index() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;

  // Right after sign-up the profile document is still being written
  if (!profile) return <LoadingScreen offerLogout />;

  switch (profile.role) {
    case "student":
      return <Redirect href="/(student)/home" />;
    case "counsellor":
      return <Redirect href="/(counsellor)/dashboard" />;
    case "admin":
      return <Redirect href="/(admin)/users" />;
    default:
      // Lecturers have no area in the app yet
      return (
        <Screen style={styles.content}>
          <Text style={typography.title} accessibilityRole="header">
            Coming soon
          </Text>
          <Card>
            <Text style={typography.body}>
              The Breathe app doesn't support {profile.role} accounts yet.
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
