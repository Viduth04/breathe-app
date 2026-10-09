import React from "react";
import { Stack } from "expo-router";
import { PopupProvider } from "@/components/common/popup";

export default function CounsellorDetailLayout() {
  return (
    <PopupProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="request-detail" />
        <Stack.Screen name="confirmed-session" />
        <Stack.Screen name="past-sessions" />
        <Stack.Screen name="notification-detail" />
        <Stack.Screen
          name="confirm-acceptance"
          options={{
            presentation: "transparentModal",
            animation: "fade",
          }}
        />
        <Stack.Screen name="request-accepted" />
        <Stack.Screen name="my-calendar" />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="decline-request"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="request-declined" />
        <Stack.Screen name="ready-to-join" />
        <Stack.Screen
          name="active-video-call"
          options={{
            gestureEnabled: false,
            animation: "fade",
          }}
        />
        <Stack.Screen name="pre-chat-empty-state" />
        <Stack.Screen name="clinical-alerts-preferences" />
        <Stack.Screen name="patients-list" />
        <Stack.Screen name="anonymous-session-details" />
        <Stack.Screen name="session-notes" />
        <Stack.Screen name="requests" />
        <Stack.Screen
          name="add-session"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </PopupProvider>
  );
}
