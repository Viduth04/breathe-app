import AuthHeader from "@/components/auth/AuthHeader";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Screen from "@/components/common/Screen";
import {
  getAuthErrorMessage,
  registerStudent,
  StaffRole,
} from "@/services/authService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

type Field = "fullName" | "email" | "password" | "confirm" | "terms";
type Errors = Partial<Record<Field | "form", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Joining as": students sign up as before; staff send a request to an admin (FR01)
type JoiningAs = "student" | StaffRole;
const JOINING_AS: { key: JoiningAs; label: string }[] = [
  { key: "student", label: "Student" },
  { key: "counsellor", label: "Counsellor" },
  { key: "lecturer", label: "Lecturer" },
];

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [anonymousMode, setAnonymousMode] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [joiningAs, setJoiningAs] = useState<JoiningAs>("student");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your email.";
    else if (!EMAIL_PATTERN.test(email.trim()))
      next.email = "That email address doesn't look right.";
    if (password.length < 6)
      next.password = "Use a password with at least 6 characters.";
    if (!confirm) next.confirm = "Re-enter your password.";
    else if (confirm !== password) next.confirm = "Passwords don't match.";
    if (!agreed) next.terms = "Please agree to the Terms & Privacy Policy.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // On success the (auth) layout sees the new user and redirects to Home
  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerStudent(
        fullName,
        email,
        password,
        anonymousMode,
        joiningAs === "student" ? undefined : joiningAs,
      );
    } catch (e) {
      setErrors({ form: getAuthErrorMessage(e) });
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AuthHeader />

      <Text style={typography.title} accessibilityRole="header">
        Create Your Account
      </Text>
      <Text style={[typography.body, styles.subtitle]}>Join Breathe today</Text>

      <Text style={styles.joinLabel}>Joining as</Text>
      <View style={styles.joinChips} accessibilityRole="radiogroup">
        {JOINING_AS.map(({ key, label }) => {
          const selected = joiningAs === key;
          return (
            <Pressable
              key={key}
              onPress={() => setJoiningAs(key)}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={`Joining as ${label}`}
              style={({ pressed }) => [
                styles.joinChip,
                selected && styles.joinChipSelected,
                pressed && styles.pressed,
              ]}
            >
              {selected ? (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
              <Text style={[styles.joinText, selected && styles.joinTextSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {joiningAs !== "student" ? (
        <View style={styles.staffNote} accessibilityLiveRegion="polite">
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[typography.caption, styles.staffNoteText]}>
            Staff accounts need admin approval before you can use them.
          </Text>
        </View>
      ) : null}
      <View style={styles.joinBlockEnd} />

      <Input
        label="Full name"
        icon="person-outline"
        placeholder="Taylor Jenkins"
        value={fullName}
        onChangeText={setFullName}
        error={errors.fullName}
        autoComplete="name"
        textContentType="name"
      />
      <Input
        label="Email"
        icon="mail-outline"
        placeholder="student@university.edu"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Input
        label="Password"
        icon="lock-closed-outline"
        placeholder="At least 6 characters"
        isPassword
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Input
        label="Confirm password"
        icon="lock-closed-outline"
        placeholder="Re-enter your password"
        isPassword
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <View style={styles.anonCard}>
        <View style={styles.anonRow}>
          <View style={styles.anonTitleRow}>
            <Text style={styles.anonTitle}>Anonymous Mode</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>RECOMMENDED</Text>
            </View>
          </View>
          <Switch
            value={anonymousMode}
            onValueChange={setAnonymousMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.border}
            accessibilityLabel="Anonymous Mode, recommended"
            accessibilityHint="Hides your identity from counsellors until your session starts"
          />
        </View>
        <Text style={typography.caption}>
          Hide your identity from counsellors until your session starts
        </Text>
      </View>

      {/* Checkbox and link are separate touch targets so opening the policy doesn't tick the box */}
      <View style={styles.termsRow}>
        <Pressable
          onPress={() => setAgreed(!agreed)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="I agree to the Terms and Privacy Policy"
          style={styles.termsCheck}
        >
          <Ionicons
            name={agreed ? "checkbox" : "square-outline"}
            size={24}
            color={errors.terms && !agreed ? colors.danger : colors.primary}
          />
          <Text style={styles.termsText}>I agree to the</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/privacy-policy")}
          accessibilityRole="link"
          accessibilityLabel="Read the Terms and Privacy Policy"
          hitSlop={8}
        >
          <Text style={[styles.termsText, styles.termsLink]}>
            Terms & Privacy Policy
          </Text>
        </Pressable>
      </View>
      {errors.terms ? <Text style={styles.fieldError}>{errors.terms}</Text> : null}

      {errors.form ? (
        <Text style={styles.formError} accessibilityRole="alert">
          {errors.form}
        </Text>
      ) : null}

      <Button
        title="Sign Up"
        onPress={handleSignUp}
        loading={loading}
        style={styles.submit}
      />

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <Text style={typography.caption}>Already have an account?</Text>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          accessibilityRole="link"
          accessibilityLabel="Log in"
          hitSlop={12}
        >
          <Text style={styles.link}>Log In</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  joinLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  joinChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  // Selected = thicker border + check + bold, not colour alone
  joinChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  joinChipSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  joinText: { fontSize: 14, color: colors.text },
  joinTextSelected: { fontWeight: "700", color: colors.primary },
  pressed: { opacity: 0.7 },
  staffNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  staffNoteText: { flex: 1 },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  joinBlockEnd: { marginBottom: spacing.lg },
  anonCard: {
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.selected,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  anonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  anonTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    flexShrink: 1,
  },
  anonTitle: { fontSize: 16, fontWeight: "600", color: colors.primary },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: spacing.xs,
  },
  termsCheck: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
  },
  termsText: { fontSize: 14, color: colors.text, flexShrink: 1 },
  termsLink: { color: colors.primary, textDecorationLine: "underline" },
  fieldError: { fontSize: 13, color: colors.danger, marginTop: spacing.xs },
  formError: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginTop: spacing.md,
  },
  submit: { marginTop: spacing.lg },
  spacer: { flexGrow: 1, minHeight: spacing.xl },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
