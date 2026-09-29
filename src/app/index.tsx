import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? "/(student)/home" : "/(auth)/welcome"} />;
}
