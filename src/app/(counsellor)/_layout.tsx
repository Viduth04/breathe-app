import { PopupProvider, usePopup } from "@/components/common/popup";
import LoadingScreen from "@/components/navigation/LoadingScreen";
import { tabIcon, tabScreenOptions } from "@/components/navigation/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  CounsellorBadgeProvider,
  useCounsellorBadges,
} from "@/context/CounsellorBadgeContext";
import { colors } from "@/theme";
import { Redirect, router } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useCounsellorStore } from "@/services/counsellorStore";
import { useEffect, useRef } from "react";

function CounsellorTabsNavigator() {
  const { alertsUnread, messagesUnread } = useCounsellorBadges();

  return (
    <Tabs screenOptions={tabScreenOptions} backBehavior="history">
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: tabIcon("grid", "grid-outline"),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: tabIcon("calendar", "calendar-outline"),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: tabIcon("chatbubbles", "chatbubbles-outline"),
          tabBarBadge: messagesUnread > 0 ? messagesUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.white,
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: tabIcon("notifications", "notifications-outline"),
          tabBarBadge: alertsUnread > 0 ? alertsUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            color: colors.white,
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      />
    </Tabs>
  );
}

// Counsellors only: logged-out users go to Welcome, other roles go back to index
export default function CounsellorLayout() {
  const { user, profile } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <LoadingScreen offerLogout />;
  if (profile.role !== "counsellor") return <Redirect href="/" />;

  return (
    <PopupProvider>
      <CounsellorBadgeProvider>
        <CounsellorTabsNavigator />
        <CounsellorCancellationPopup />
      </CounsellorBadgeProvider>
    </PopupProvider>
  );
}

function CounsellorCancellationPopup() {
  const { alerts } = useCounsellorStore();
  const latestAlert = alerts?.[0];
  const { showToast } = usePopup();
  const shownAlertId = useRef<string | null>(null);

  useEffect(() => {
    if (!latestAlert || shownAlertId.current === latestAlert.id) return;

    shownAlertId.current = latestAlert.id;
    showToast({
      message: `${latestAlert.title}: ${latestAlert.description}`,
      variant: "warning",
      duration: 7000,
      action: {
        label: "View",
        onPress: () => router.push("/(counsellor)/alerts"),
      },
    });
  }, [latestAlert, showToast]);

  return null;
}
