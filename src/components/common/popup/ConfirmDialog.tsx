// Counsellor ConfirmDialog Component - Member 4. Supports FR01, FR05, FR08, NFR01, NFR06.
// Accessible modal dialog for confirmations, destructive guards, and informative clinical modals.

import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, popupColors, radius, spacing, TOUCH_TARGET } from "@/theme";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: "default" | "destructive" | "warning" | "info";
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  variant = isDestructive ? "destructive" : "default",
  icon,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
        Animated.timing(animValue, {
          toValue: 1,
          duration: reduced ? 0 : 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      animValue.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  // Variant aesthetics
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: icon || "warning",
          iconColor: popupColors.destructiveText,
          iconBg: popupColors.destructiveSurface,
          confirmBtnBg: popupColors.destructiveText,
          confirmBtnText: colors.white,
        };
      case "warning":
        return {
          icon: icon || "alert-circle",
          iconColor: popupColors.warningText,
          iconBg: popupColors.warningSurface,
          confirmBtnBg: colors.primary,
          confirmBtnText: colors.white,
        };
      case "info":
        return {
          icon: icon || "information-circle",
          iconColor: popupColors.infoText,
          iconBg: popupColors.infoSurface,
          confirmBtnBg: colors.primary,
          confirmBtnText: colors.white,
        };
      default:
        return {
          icon: icon || "shield-checkmark",
          iconColor: colors.primary,
          iconBg: colors.success,
          confirmBtnBg: colors.primary,
          confirmBtnText: colors.white,
        };
    }
  };

  const v = getVariantStyles();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={isDestructive ? undefined : onCancel}
      statusBarTranslucent
    >
      <View style={styles.scrimBackdrop}>
        {/* Scrim tap dismisses non-destructive dialogs */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isDestructive ? undefined : onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog overlay"
        />

        <Animated.View
          style={[
            styles.dialogCard,
            {
              opacity: animValue,
              transform: [
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
          accessibilityRole="alert"
          accessibilityViewIsModal={true}
        >
          {/* Header Icon badge */}
          <View style={[styles.iconCircle, { backgroundColor: v.iconBg }]}>
            <Ionicons name={v.icon} size={24} color={v.iconColor} />
          </View>

          {/* Title and Message */}
          <Text style={styles.titleText}>{title}</Text>
          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          {/* Optional slotted content */}
          {children}

          {/* Action Button Row */}
          <View style={styles.actionRow}>
            {cancelLabel ? (
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && styles.pressedState,
                ]}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: v.confirmBtnBg },
                pressed && styles.pressedState,
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={[styles.confirmBtnText, { color: v.confirmBtnText }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrimBackdrop: {
    flex: 1,
    backgroundColor: popupColors.scrim,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2B24",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    height: TOUCH_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1B2B24",
  },
  confirmBtn: {
    flex: 1,
    height: TOUCH_TARGET,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  pressedState: {
    opacity: 0.85,
  },
});
