// Counsellor Toast Notification Component - Member 4. Supports FR05, FR07, NFR01, NFR06.
// Accessible, auto-dismissing toast adhering to WCAG 2.1 AA and Breathe design system.

import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, popupColors, radius, spacing } from "@/theme";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss: (id: string) => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function Toast({
  id,
  message,
  variant = "success",
  duration = 3200,
  onDismiss,
  action,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: reduced ? 0 : 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -30,
          duration: reduced ? 0 : 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(id);
      });
    });
  };

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: reduced ? 0 : 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });

    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Swipe up to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -10) {
          dismiss();
        }
      },
    })
  ).current;

  // Variant aesthetics
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
      case "info":
        return {
          icon: "information-circle" as const,
          iconColor: popupColors.infoText,
          bg: popupColors.infoSurface,
          border: popupColors.infoBorder,
          text: popupColors.infoText,
        };
      default:
        return {
          icon: "checkmark-circle" as const,
          iconColor: popupColors.successText,
          bg: popupColors.successSurface,
          border: popupColors.successBorder,
          text: popupColors.successText,
        };
    }
  };

  const s = getStyles();

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      {...panResponder.panHandlers}
    >
      <Pressable
        style={[
          styles.toastContainer,
          {
            backgroundColor: s.bg,
            borderColor: s.border,
          },
        ]}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss notification: ${message}`}
      >
        <Ionicons name={s.icon} size={18} color={s.iconColor} />
        <Text style={[styles.messageText, { color: s.text }]} numberOfLines={4}>
          {message}
        </Text>

        {action ? (
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              action.onPress();
              dismiss();
            }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={[styles.actionBtnText, { color: s.iconColor }]}>
              {action.label}
            </Text>
          </Pressable>
        ) : (
          <Ionicons name="close" size={16} color={s.iconColor} style={styles.closeIcon} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    width: "100%",
    paddingHorizontal: spacing.md,
    marginVertical: 4,
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  messageText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  closeIcon: {
    opacity: 0.6,
  },
});
