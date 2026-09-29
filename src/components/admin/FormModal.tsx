// Admin panel - Viduth (Member 1).

import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Full-screen sheet with a title, a close button and a scrolling body
export default function FormModal({
  visible,
  title,
  onClose,
  closeDisabled,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeDisabled?: boolean; // e.g. while saving
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeDisabled ? () => {} : onClose}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
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
});
