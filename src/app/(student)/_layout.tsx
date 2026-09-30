import { FloatingHelpButton } from "@/components/crisis/UrgentHelpLink";
import LoadingScreen from "@/components/navigation/LoadingScreen";
import { tabIcon, tabScreenOptions } from "@/components/navigation/tabs";
import { useAuth } from "@/context/AuthContext";
import { router, Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
        <Tabs.Screen name="companion" options={{ href: null }} />
      </Tabs>
      {/* Crisis support is one tap away on every student screen (F9 / R9) */}
      <FloatingHelpButton />
      <FloatingCompanionButton />
    </View>
  );
}

function FloatingCompanionButton() {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => router.push("/(student)/companion")}
      accessibilityRole="button"
      accessibilityLabel="Talk to Breathe Companion"
      style={({ pressed }) => [
        styles.companionButton,
        { bottom: insets.bottom + 72, right: 16 },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="chatbubble-ellipses" size={21} color={"#FFFFFF"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  companionButton: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#076047",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pressed: { opacity: 0.75 },
});
