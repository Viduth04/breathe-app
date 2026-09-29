// Admin panel - Viduth (Member 1). Supports FR01, NFR01.

import LoadingScreen from "@/components/navigation/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

// Admins only: logged-out users go to Welcome, other roles go back to index.
// Admin accounts are created by setting role: "admin" in the Firebase console.
export default function AdminLayout() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <LoadingScreen offerLogout />;
  if (profile.role !== "admin") return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
