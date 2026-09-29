import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

// Logged-in users never see the auth screens; index routes them by role
export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
