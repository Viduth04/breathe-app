import { FloatingHelpButton } from "@/components/crisis/UrgentHelpLink";
import LoadingScreen from "@/components/navigation/LoadingScreen";
import { tabIcon, tabScreenOptions } from "@/components/navigation/tabs";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";

// Students only: logged-out users go to Welcome, other roles go back to index
export default function StudentLayout() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <LoadingScreen offerLogout />;
  if (profile.role !== "student") return <Redirect href="/" />;

  return (
    <View style={styles.fill}>
      <Tabs screenOptions={tabScreenOptions} backBehavior="history">
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: tabIcon("home", "home-outline"),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Sessions",
            tabBarIcon: tabIcon("calendar", "calendar-outline"),
          }}
        />
        <Tabs.Screen
          name="check-in"
          options={{
            title: "Check-in",
            tabBarIcon: tabIcon("happy", "happy-outline"),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: "Exercises",
            tabBarIcon: tabIcon("leaf", "leaf-outline"),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: tabIcon("person", "person-outline"),
          }}
        />
        {/* Reachable from Profile, but not shown in the tab bar */}
        <Tabs.Screen name="privacy" options={{ href: null }} />
      </Tabs>
      {/* Crisis support is one tap away on every student screen (F9 / R9) */}
      <FloatingHelpButton />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
