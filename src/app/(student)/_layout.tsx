import LoadingScreen from "@/components/navigation/LoadingScreen";
import { tabIcon, tabScreenOptions } from "@/components/navigation/tabs";
import { PopupProvider, usePopup } from "@/components/common/popup";
import { useAuth } from "@/context/AuthContext";
import { useBookingUpdates, updateMessage, updateTitle } from "@/hooks/useBookingUpdates";
import { useReminderNotifications } from "@/hooks/useReminderNotifications";
import { isStaffRequest } from "@/services/authService";
import { router, Redirect, usePathname } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

// Students only: logged-out users go to Welcome, other roles go back to index
export default function StudentLayout() {
  const { user, profile } = useAuth();
  // Check-in reminders (FR05): re-sync after login, taps open Check-in
  const isStudent = !!profile && profile.role === "student" && !isStaffRequest(profile);
  useReminderNotifications(isStudent ? user?.uid : undefined);

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <LoadingScreen offerLogout />;
  // Other roles, and staff sign-ups awaiting approval, go back to index
  if (profile.role !== "student" || isStaffRequest(profile)) return <Redirect href="/" />;

  return (
    <PopupProvider>
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
            name="session/dashboard"
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
          <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="privacy" options={{ href: null }} />
          <Tabs.Screen name="companion" options={{ href: null }} />
          <Tabs.Screen name="mood-history" options={{ href: null }} />
          <Tabs.Screen name="reminders" options={{ href: null }} />
          <Tabs.Screen name="mood-entry/[id]" options={{ href: null }} />
          <Tabs.Screen name="resource/[id]" options={{ href: null }} />

          {/* Booking sub-screens, not shown in the tab bar */}
          <Tabs.Screen name="session/chat" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="session/summary" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="session/video-call" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="session/counselor" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="session/book" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="session/details" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="session/cancel" options={{ href: null, tabBarStyle: { display: "none" } }} />
          <Tabs.Screen name="session/review" options={{ href: null, tabBarStyle: { display: "none" } }} />
        </Tabs>
        <BookingAcceptancePopup />
      </View>
    </PopupProvider>
  );
}

function BookingAcceptancePopup() {
  const { user } = useAuth();
  const { showToast } = usePopup();
  const { banner, updates } = useBookingUpdates(user?.uid);
  const shownBookingId = useRef<string | null>(null);

  useEffect(() => {
    if (!banner || banner.status !== "confirmed" || shownBookingId.current === banner.bookingId) {
      return;
    }

    shownBookingId.current = banner.bookingId;
    const update = updates.find((item) => item.id === banner.bookingId);
    const message = update
      ? `${updateTitle(update)}: ${updateMessage(update)}`
      : "Your session request has been confirmed.";

    showToast({
      message,
      variant: "success",
      duration: 6000,
      action: {
        label: "View",
        onPress: () => router.push("/(student)/notifications"),
      },
    });
  }, [banner, showToast, updates]);

  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
