// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.

import LoadingScreen from "@/components/navigation/LoadingScreen";
import { tabIcon, tabScreenOptions } from "@/components/navigation/tabs";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";

// Lecturers only: logged-out users go to Welcome, other roles go back to index
export default function LecturerLayout() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <LoadingScreen offerLogout />;
  if (profile.role !== "lecturer") return <Redirect href="/" />;

  return (
    <Tabs screenOptions={tabScreenOptions} backBehavior="history">
      <Tabs.Screen
        name="overview"
        options={{ title: "Overview", tabBarIcon: tabIcon("grid", "grid-outline") }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: "Trends",
          tabBarIcon: tabIcon("trending-up", "trending-up-outline"),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: "Resources",
          tabBarIcon: tabIcon("library", "library-outline"),
        }}
      />
    </Tabs>
  );
}
