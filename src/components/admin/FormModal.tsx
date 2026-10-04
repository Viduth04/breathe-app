// Admin panel - Viduth (Member 1).

import { useWebKeyboardOverlap } from "@/hooks/useWebKeyboardOverlap";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode, Ref, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Full-screen sheet with a title, a close button and a scrolling body.
// `footer` (e.g. the Save button) stays pinned below the body, above the
// keyboard and the home indicator, so it can never scroll or slide out of view.
export default function FormModal({
  visible,
  title,
  onClose,
  closeDisabled,
  footer,
  scrollRef,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeDisabled?: boolean; // e.g. while saving
  footer?: ReactNode;
  scrollRef?: Ref<ScrollView>; // e.g. to scroll to the first invalid field
  children: ReactNode;
}) {
  // KeyboardAvoidingView compares its own frame, which is relative to this
  // modal, with the keyboard's position on the SCREEN. An iOS page sheet
  // starts below the top of the screen (and ends at the bottom), so tell it
  // how far down the sheet starts. Measured with the keyboard closed: if
  // Android ever resizes the window for the keyboard, the offset stays put
  // and the view just finds nothing left to avoid.
  const [sheetTop, setSheetTop] = useState(0);
  const measureSheet = (e: LayoutChangeEvent) => {
    if (Keyboard.isVisible()) return;
    const top = Dimensions.get("screen").height - e.nativeEvent.layout.height;
    setSheetTop(Math.max(0, Math.round(top)));
  };
  const webKeyboardOverlap = useWebKeyboardOverlap();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeDisabled ? () => {} : onClose}
    >
      <SafeAreaView
        style={styles.safe}
        edges={["top", "bottom", "left", "right"]}
        onLayout={measureSheet}
      >
        {/* "padding" on Android too: with edge-to-edge (always on in this
            Expo SDK) the modal's window no longer shrinks for the keyboard */}
        <KeyboardAvoidingView
          style={[styles.flex, { paddingBottom: webKeyboardOverlap }]}
          behavior={Platform.OS === "web" ? undefined : "padding"}
          keyboardVerticalOffset={sheetTop}
        >
          <View style={styles.header}>
            <Text style={[typography.heading, styles.title]} accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              disabled={closeDisabled}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1 },
  close: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  body: { padding: spacing.lg, paddingBottom: spacing.xl },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
