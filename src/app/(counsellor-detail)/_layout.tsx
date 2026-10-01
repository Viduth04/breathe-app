// Counsellor Detail Screens Layout - Muaath (Member 4)
// Stack navigator for detail screens, modals, calendar, and settings that sit above the tab navigator

import React from "react";
import { Stack } from "expo-router";

export default function CounsellorDetailLayout() {
  return (
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
    </Stack>
  );
}
