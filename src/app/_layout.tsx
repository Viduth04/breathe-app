import LoadingScreen from "@/components/navigation/LoadingScreen";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function RootNavigator() {
  const { loading } = useAuth();

  // Wait until Firebase tells us whether someone is logged in
  if (loading) return <LoadingScreen />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
