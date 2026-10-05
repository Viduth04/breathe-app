// Counsellor LoadingOverlay Component - Member 4. Supports FR01, FR08, NFR06.
// Accessible, non-blocking loading indicator for cloud commits with automatic fail-safe timeout.

import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, popupColors, radius, spacing } from "@/theme";

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  onTimeout?: () => void;
  timeoutMs?: number;
}

export function LoadingOverlay({
  visible,
  message = "Syncing with clinical portal...",
  onTimeout,
  timeoutMs = 10000,
}: LoadingOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      if (onTimeout) {
        timeoutTimer = setTimeout(onTimeout, timeoutMs);
      }
    } else {
      fadeAnim.setValue(0);
    }

    return () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.scrimBackdrop}>
        <Animated.View
          style={[styles.loadingCard, { opacity: fadeAnim }]}
          accessibilityRole="progressbar"
          accessibilityLabel={message}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.messageText}>{message}</Text>
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
  loadingCard: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B2B24",
    textAlign: "center",
  },
});
