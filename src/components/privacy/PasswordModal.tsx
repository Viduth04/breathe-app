import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { colors, radius, spacing, typography } from "@/theme";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  loading: boolean;
  error?: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
};

// Asks an email account for its password before deleting its data.
// Built from our Input/Button because Alert.prompt only exists on iOS.
export default function PasswordModal({
  visible,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [password, setPassword] = useState("");
  const [emptyError, setEmptyError] = useState<string>();

  // Start empty every time the modal opens
  useEffect(() => {
    if (visible) {
      setPassword("");
      setEmptyError(undefined);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!password) {
      setEmptyError("Enter your password.");
      return;
    }
    onConfirm(password);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? () => {} : onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={typography.heading} accessibilityRole="header">
            Confirm it's you
          </Text>
          <Text style={[typography.body, styles.message]}>
            Enter your password to permanently delete your data.
          </Text>

          <Input
            label="Password"
            icon="lock-closed-outline"
            placeholder="Enter your password"
            isPassword
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setEmptyError(undefined);
            }}
            error={emptyError ?? error}
            autoFocus
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            editable={!loading}
          />

          <Button
            title="Delete My Data"
            variant="danger"
            onPress={handleConfirm}
            loading={loading}
          />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            disabled={loading}
            style={styles.cancel}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  message: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  cancel: { marginTop: spacing.sm },
});
