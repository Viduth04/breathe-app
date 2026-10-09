// Counsellor PermissionPrompt Component - Member 4. Supports FR07, NFR01, NFR02, NFR06.
// Contextual pre-permission dialog explaining hardware access and privacy guarantees before OS prompt.

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, popupColors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { ConfirmDialog } from "./ConfirmDialog";

export interface PermissionPromptProps {
  visible: boolean;
  type: "telehealth" | "notifications" | "calendar";
  onAllow: () => void;
  onDismiss: () => void;
}

export function PermissionPrompt({
  visible,
  type,
  onAllow,
  onDismiss,
}: PermissionPromptProps) {
  const getPromptData = () => {
    switch (type) {
      case "telehealth":
        return {
          title: "Camera & Microphone Access",
          message:
            "Breathe requires camera and microphone permissions for tele-health video consultations. Your audio and video are encrypted via TLS transport and never recorded.",
          icon: "videocam" as const,
          grantLabel: "Allow Hardware Access",
        };
      case "notifications":
        return {
          title: "Clinical Notification Access",
          message:
            "Enable notifications to receive immediate priority alerts for urgent student crisis triage and upcoming consultation reminders.",
          icon: "notifications" as const,
          grantLabel: "Enable Notifications",
        };
      case "calendar":
        return {
          title: "Calendar Sync Permissions",
          message:
            "Authorize local calendar sync to automatically align student counseling appointments with your device schedule.",
          icon: "calendar" as const,
          grantLabel: "Allow Calendar Sync",
        };
    }
  };

  const data = getPromptData();

  return (
    <ConfirmDialog
      visible={visible}
      title={data.title}
      message={data.message}
      confirmLabel={data.grantLabel}
      cancelLabel="Not Now"
      variant="default"
      icon={data.icon}
      onConfirm={onAllow}
      onCancel={onDismiss}
    >
      <View style={styles.complianceBadge}>
        <Ionicons name="lock-closed" size={14} color="#076047" />
        <Text style={styles.complianceText}>
          SLIIT Health Center • HIPAA & FERPA Confidential
        </Text>
      </View>
    </ConfirmDialog>
  );
}

const styles = StyleSheet.create({
  complianceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: popupColors.successSurface,
    borderColor: popupColors.successBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  complianceText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#076047",
  },
});
