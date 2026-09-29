import AuthHeader from "@/components/auth/AuthHeader";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import Screen from "@/components/common/Screen";
import { getAuthErrorMessage, resetPassword } from "@/services/authService";
import { colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await resetPassword(email);
      setSentTo(email.trim());
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AuthHeader />

      <View style={styles.header}>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          Reset Password
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          Enter your email and we'll send you a reset link
        </Text>
      </View>

      {sentTo ? (
        <Card variant="success">
          <View style={styles.successRow} accessibilityRole="alert">
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.successText}>
              If an account exists for {sentTo}, a reset link is on its way.
              Check your inbox and spam folder.
            </Text>
          </View>
        </Card>
      ) : null}

      <Input
        label="Email"
        icon="mail-outline"
        placeholder="student@university.edu"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setSentTo(null);
        }}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />

      <Button
        title={sentTo ? "Resend Reset Link" : "Send Reset Link"}
        onPress={handleSend}
        loading={loading}
        style={styles.submit}
      />

      <Pressable
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(auth)/login")
        }
        accessibilityRole="link"
        accessibilityLabel="Back to log in"
        hitSlop={12}
        style={styles.back}
      >
        <Text style={styles.link}>Back to Log In</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.xl },
  center: { textAlign: "center" },
  subtitle: { color: colors.textSecondary, textAlign: "center" },
  successRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  successText: { ...typography.body, flex: 1 },
  submit: { marginTop: spacing.sm },
  back: { alignSelf: "center", marginTop: spacing.lg },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
