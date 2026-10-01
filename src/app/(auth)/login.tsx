import { BackButton } from "@/components/auth/AuthHeader";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Screen from "@/components/common/Screen";
import UrgentHelpLink from "@/components/crisis/UrgentHelpLink";
import {
  continueAnonymously,
  getAuthErrorMessage,
  login,
} from "@/services/authService";
import { colors, spacing, typography } from "@/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Errors = { email?: string; password?: string; form?: string };

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loggingIn, setLoggingIn] = useState(false);
  const [goingAnon, setGoingAnon] = useState(false);
  const busy = loggingIn || goingAnon;

  const validate = () => {
    const next: Errors = {};
    if (!email.trim()) next.email = "Enter your email or student ID.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // On success the (auth) layout sees the new user and redirects to Home
  const handleLogin = async () => {
    if (!validate()) return;
    setLoggingIn(true);
    try {
      await login(email, password);
    } catch (e) {
      setErrors({ form: getAuthErrorMessage(e) });
      setLoggingIn(false);
    }
  };

  const handleAnonymous = async () => {
    setErrors({});
    setGoingAnon(true);
    try {
      await continueAnonymously();
    } catch (e) {
      setErrors({ form: getAuthErrorMessage(e) });
      setGoingAnon(false);
    }
  };

  return (
    <Screen>
      <BackButton />

      <View style={styles.header}>
        <Logo size={20} showWordmark badge />
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          Welcome Back
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          Sign in to continue checking in
        </Text>
      </View>

      <Input
        label="Email or Student ID"
        icon="mail-outline"
        placeholder="student@university.edu"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
      />
      <Input
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        isPassword
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />

      <Pressable
        onPress={() => router.push("/(auth)/forgot-password")}
        accessibilityRole="link"
        accessibilityLabel="Forgot password?"
        hitSlop={12}
        style={styles.forgot}
      >
        <Text style={styles.link}>Forgot Password?</Text>
      </Pressable>

      {errors.form ? (
        <Text style={styles.formError} accessibilityRole="alert">
          {errors.form}
        </Text>
      ) : null}

      <Button
        title="Log In"
        onPress={handleLogin}
        loading={loggingIn}
        disabled={busy}
      />
      <Button
        title="Continue Anonymously"
        variant="secondary"
        onPress={handleAnonymous}
        loading={goingAnon}
        disabled={busy}
        style={styles.secondButton}
      />

      <View style={styles.spacer} />

      <UrgentHelpLink />
      <View style={styles.footer}>
        <Text style={typography.caption}>Don't have an account?</Text>
        <Pressable
          onPress={() => router.push("/(auth)/register")}
          accessibilityRole="link"
          accessibilityLabel="Sign up"
          hitSlop={12}
        >
          <Text style={styles.link}>Sign Up</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  center: { textAlign: "center", marginTop: spacing.md },
  subtitle: { color: colors.textSecondary, textAlign: "center" },
  forgot: { alignSelf: "flex-end", marginBottom: spacing.lg },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary },
  formError: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  secondButton: { marginTop: spacing.md },
  spacer: { flexGrow: 1, minHeight: spacing.xl },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
});
