import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

// Student screens require a logged-in user (registered or anonymous)
export default function StudentLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/(auth)/welcome" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
