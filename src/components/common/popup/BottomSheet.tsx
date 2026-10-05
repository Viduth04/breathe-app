// Counsellor BottomSheet Component - Member 4. Supports FR01, FR08, NFR06.
// Reusable bottom sheet drawer for option selections, decline reasons, and filter pickers.

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

export interface BottomSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: BottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: reduced ? 0 : 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 9,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      slideAnim.setValue(300);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.scrimBackdrop}>
        {/* Scrim tap dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss bottom sheet"
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          accessibilityViewIsModal={true}
        >
          {/* Top Grab Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.titleText}>{title}</Text>
              {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close sheet"
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Sheet Body */}
          <View style={styles.contentBody}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrimBackdrop: {
    flex: 1,
    backgroundColor: popupColors.scrim,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  titleColumn: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2B24",
  },
  subtitleText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  contentBody: {
    paddingBottom: spacing.sm,
  },
});
