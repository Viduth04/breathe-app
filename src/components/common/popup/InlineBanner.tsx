// Counsellor InlineBanner Component - Member 4. Supports FR05, FR08, NFR01, NFR06.
// Contextual inline banner for offline notices, quiet hours indicators, and form error feedback.

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { popupColors, radius, spacing } from "@/theme";

export type BannerVariant = "info" | "warning" | "error" | "success";

export interface InlineBannerProps {
  title?: string;
  message: string;
  variant?: BannerVariant;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: object;
}

export function InlineBanner({
  title,
  message,
  variant = "info",
  onDismiss,
  action,
  style,
}: InlineBannerProps) {
  const getStyles = () => {
    switch (variant) {
      case "error":
        return {
          icon: "alert-circle" as const,
          iconColor: popupColors.destructiveText,
          bg: popupColors.destructiveSurface,
          border: popupColors.destructiveBorder,
          text: popupColors.destructiveText,
        };
      case "warning":
        return {
          icon: "warning" as const,
          iconColor: popupColors.warningText,
          bg: popupColors.warningSurface,
          border: popupColors.warningBorder,
          text: popupColors.warningText,
        };
      case "success":
        return {
          icon: "checkmark-circle" as const,
          iconColor: popupColors.successText,
          bg: popupColors.successSurface,
          border: popupColors.successBorder,
          text: popupColors.successText,
        };
      default:
        return {
          icon: "information-circle" as const,
          iconColor: popupColors.infoText,
          bg: popupColors.infoSurface,
          border: popupColors.infoBorder,
          text: popupColors.infoText,
        };
    }
  };

  const s = getStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: s.bg,
          borderColor: s.border,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name={s.icon} size={18} color={s.iconColor} style={styles.icon} />
      <View style={styles.textContainer}>
        {title ? (
          <Text style={[styles.titleText, { color: s.text }]}>{title}</Text>
        ) : null}
        <Text style={[styles.messageText, { color: s.text }]}>{message}</Text>
      </View>

      {action ? (
        <Pressable
          style={styles.actionBtn}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={[styles.actionBtnText, { color: s.iconColor }]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}

      {onDismiss ? (
        <Pressable
          style={styles.dismissBtn}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss banner"
          hitSlop={8}
        >
          <Ionicons name="close" size={16} color={s.iconColor} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignSelf: "center",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dismissBtn: {
    padding: 4,
    alignSelf: "flex-start",
  },
});
