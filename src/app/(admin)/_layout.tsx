// Admin panel - Viduth (Member 1). Supports FR01, FR03, FR06, NFR01.

import LoadingScreen from "@/components/navigation/LoadingScreen";
import { tabIcon, tabScreenOptions } from "@/components/navigation/tabs";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";

// Admins only: logged-out users go to Welcome, other roles go back to index.
// Admin accounts are created by setting role: "admin" in the Firebase console.
export default function AdminLayout() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <LoadingScreen offerLogout />;
  if (profile.role !== "admin") return <Redirect href="/" />;

  return (
    <Tabs screenOptions={tabScreenOptions} backBehavior="history">
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Overview", tabBarIcon: tabIcon("grid", "grid-outline") }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: "Users", tabBarIcon: tabIcon("people", "people-outline") }}
      />
      <Tabs.Screen
        name="counsellors"
        options={{
          title: "Counsellors",
          tabBarIcon: tabIcon("id-card", "id-card-outline"),
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
