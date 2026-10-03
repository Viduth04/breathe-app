// Profile - Ishara (Member 2). Supports FR01, NFR01.
//
// Who you are in Breathe (name, email, anonymous ID), a small summary of your
// own check-ins, editing your name, links to Privacy & Data, Crisis Support
// and the Privacy Policy, and logging out. Delete My Data stays in Privacy & Data.

import RoleBadge from "@/components/admin/RoleBadge";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import Screen from "@/components/common/Screen";
import { useAuth } from "@/context/AuthContext";
import {
  FULL_NAME_MAX,
  getAuthErrorMessage,
  logout,
  updateFullName,
  validateFullName,
} from "@/services/authService";
import { currentStreak, listMyCheckins } from "@/services/checkinService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { CheckIn, longDate } from "@/types/checkin";
import { confirmAction } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { Href, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const LINKS: {
  title: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
}[] = [
  {
    title: "Privacy & Data",
    hint: "Anonymous Mode, mood sharing, delete my data",
    icon: "shield-checkmark-outline",
    href: "/(student)/privacy",
  },
  {
    title: "Crisis Support",
    hint: "Helplines and a calming breathing guide",
    icon: "help-buoy-outline",
    href: "/crisis",
  },
  {
    title: "Privacy Policy",
    hint: "How Breathe looks after your information",
    icon: "document-text-outline",
    href: "/privacy-policy",
  },
];

export default function Profile() {
  const { user, profile } = useAuth();
  const isGuest = !!profile?.isGuest || !!user?.isAnonymous;
  const savedName = profile?.fullName?.trim() ?? "";

  // Check-in summary
  const [checkins, setCheckins] = useState<CheckIn[] | null>(null);
  const [statsError, setStatsError] = useState<string>();

  // Edit name
  const [name, setName] = useState<string | null>(null); // null = not editing
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Log out
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();

  const loadStats = useCallback(async () => {
    setStatsError(undefined);
    try {
      setCheckins(await listMyCheckins());
    } catch (e) {
      console.warn("Loading check-in summary failed", e);
      setStatsError(getAuthErrorMessage(e));
    }
  }, []);

  // Refresh when the tab is opened, so a new check-in shows straight away
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const startEdit = () => {
    setName(savedName);
    setNameError(undefined);
    setSaveResult(null);
  };

  const cancelEdit = () => {
    setName(null);
    setNameError(undefined);
  };

  const saveName = async () => {
    if (!user || name === null) return;
    const problem = validateFullName(name);
    setNameError(problem);
    setSaveResult(null);
    if (problem) return;
    setSaving(true);
    try {
      await updateFullName(user.uid, name);
      setName(null);
      setSaveResult({ ok: true, message: "Your name has been updated." });
    } catch (e) {
      console.warn("Updating name failed", e);
      // Keep the form open with what they typed so they can try again
      setSaveResult({ ok: false, message: getAuthErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirmAction(
      isGuest
        ? {
            title: "Log out of guest mode?",
            message:
              "You're using Breathe without an account. Once you log out, your check-ins and anything else from this guest session can't be recovered.",
            confirmText: "Log Out",
          }
        : {
            title: "Log out?",
            message: "You can log back in any time with your email and password.",
            confirmText: "Log Out",
          },
    );
    if (!ok) return;
    setLogoutError(undefined);
    setLoggingOut(true);
    try {
      await logout(); // The (student) layout then redirects to Welcome
    } catch (e) {
      setLogoutError(getAuthErrorMessage(e));
      setLoggingOut(false);
    }
  };

  const total = checkins?.length ?? 0;
  const streak = checkins ? currentStreak(checkins) : 0;
  const last = checkins?.[0]; // listMyCheckins is newest first
  const editing = name !== null;
  const displayName = isGuest ? "Guest" : savedName || "Student";

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.title} accessibilityRole="header">
          Profile
        </Text>
      </View>

      {/* 1. Who you are */}
      <Card>
        <View style={styles.identity}>
          <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
            {isGuest || !savedName ? (
              <Ionicons name="person" size={28} color={colors.primary} />
            ) : (
              <Text style={styles.avatarText}>{initials(savedName)}</Text>
            )}
          </View>
          <View style={styles.identityText}>
            <Text style={typography.heading}>{displayName}</Text>
            <Text style={typography.caption}>
              {isGuest ? "Using Breathe without an account" : profile?.email ?? "No email"}
            </Text>
            {profile ? <RoleBadge role={profile.role} /> : null}
          </View>
        </View>

        <View
          style={styles.anonBox}
          accessible
          accessibilityLabel={`Your anonymous ID: ${profile?.anonId ?? "not set"}. Counsellors only see this ID, not your name or email, unless you choose to share them.`}
        >
          <Text style={typography.caption}>Your anonymous ID</Text>
          <Text style={styles.anonId}>{profile?.anonId ?? "–"}</Text>
          <Text style={typography.caption}>
            Counsellors only see this ID, not your name or email, unless you choose
            to share them.
          </Text>
        </View>
      </Card>

      {/* 2. Check-in summary */}
      <Card>
        <Text style={typography.heading}>Your check-ins</Text>
        {checkins === null && !statsError ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.spinner}
            accessibilityLabel="Loading your check-in summary"
          />
        ) : statsError ? (
          <View style={styles.statsError}>
            <Text style={[typography.body, styles.muted]} accessibilityLiveRegion="polite">
              Couldn't load your summary. {statsError}
            </Text>
            <Button title="Try Again" variant="secondary" onPress={loadStats} />
          </View>
        ) : total === 0 ? (
          <View style={styles.statsEmpty}>
            <Text style={[typography.body, styles.muted]}>
              No check-ins yet. Whenever you're ready, a quick check-in takes about a
              minute.
            </Text>
            <Button title="Check in now" onPress={() => router.navigate("/(student)/check-in")} />
          </View>
        ) : (
          <>
            <View style={styles.stats}>
              <View style={styles.stat} accessible accessibilityLabel={`${total} check-ins in total`}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={typography.caption}>Total</Text>
              </View>
              <View
                style={styles.stat}
                accessible
                accessibilityLabel={`Current streak: ${streak} ${streak === 1 ? "day" : "days"}`}
              >
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={typography.caption}>Day streak</Text>
              </View>
            </View>
            {last ? (
              <Text style={[typography.caption, styles.lastCheckin]}>
                Last check-in: {longDate(last.dateKey)}
              </Text>
            ) : null}
            {streak === 0 ? (
              <Text style={[typography.caption, styles.lastCheckin]}>
                Streaks are just a gentle nudge. Every check-in counts, whenever it happens.
              </Text>
            ) : null}
          </>
        )}
      </Card>

      {/* 3. Edit profile */}
      <Card>
        <Text style={typography.heading}>Your details</Text>
        {isGuest ? (
          <Text style={[typography.body, styles.muted, styles.cardText]}>
            Guest profiles can't be edited. Create an account if you'd like to add your
            name and keep your check-ins safe.
          </Text>
        ) : editing ? (
          <View style={styles.cardText}>
            <Input
              label="Full name"
              icon="person-outline"
              value={name ?? ""}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError(undefined);
              }}
              error={nameError}
              maxLength={FULL_NAME_MAX + 10} // Room to type; validation explains the limit
              autoComplete="name"
              textContentType="name"
              returnKeyType="done"
              onSubmitEditing={saveName}
              editable={!saving}
            />
            <Text style={[typography.caption, styles.counter]}>
              {name?.trim().length ?? 0}/{FULL_NAME_MAX}
            </Text>
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={cancelEdit}
                disabled={saving}
                style={styles.flex}
              />
              <Button title="Save" onPress={saveName} loading={saving} style={styles.flex} />
            </View>
          </View>
        ) : (
          <View style={styles.cardText}>
            <Text style={typography.caption}>Full name</Text>
            <Text style={typography.body}>{savedName || "Not set"}</Text>
            <Button
              title="Edit name"
              variant="secondary"
              icon="create-outline"
              onPress={startEdit}
              style={styles.editButton}
            />
          </View>
        )}
        {saveResult ? (
          <View
            style={[styles.result, saveResult.ok ? styles.resultOk : styles.resultError]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Ionicons
              name={saveResult.ok ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={saveResult.ok ? colors.primary : colors.danger}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[typography.body, styles.flex, !saveResult.ok && styles.errorText]}>
              {saveResult.message}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Companion (kept from the earlier placeholder) */}
      <Card>
        <Text style={typography.heading}>Talk to Breathe Companion</Text>
        <Text style={[typography.caption, styles.cardText]}>
          A private AI space for short, practical support.
        </Text>
        <Button
          title="Open Breathe Companion"
          icon="chatbubble-ellipses-outline"
          onPress={() => router.push("/(student)/companion")}
          style={styles.editButton}
        />
      </Card>

      {/* 4. Links */}
      <Card style={styles.links}>
        {LINKS.map((link, i) => (
          <Pressable
            key={link.title}
            onPress={() => router.push(link.href)}
            accessibilityRole="link"
            accessibilityLabel={link.title}
            accessibilityHint={link.hint}
            style={({ pressed }) => [
              styles.linkRow,
              i < LINKS.length - 1 && styles.linkDivider,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={link.icon}
              size={22}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <View style={styles.flex}>
              <Text style={styles.linkTitle}>{link.title}</Text>
              <Text style={typography.caption}>{link.hint}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
        ))}
      </Card>

      {/* 5. Log out */}
      {logoutError ? (
        <Text style={styles.logoutError} accessibilityRole="alert">
          {logoutError}
        </Text>
      ) : null}
      <Button
        title="Log Out"
        variant="secondary"
        icon="log-out-outline"
        onPress={handleLogout}
        loading={loggingOut}
      />
      {isGuest ? (
        <Text style={[typography.caption, styles.guestNote]}>
          As a guest, logging out means this session's data can't be recovered.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Right padding keeps the title clear of the floating crisis help button
  header: { marginBottom: spacing.lg, paddingRight: TOUCH_TARGET + spacing.sm },
  muted: { color: colors.textSecondary },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  cardText: { marginTop: spacing.sm },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.selected,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: colors.primary },
  identityText: { flex: 1, gap: spacing.xs },
  anonBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.success,
    gap: 2,
  },
  anonId: { ...typography.heading, color: colors.primary },
  spinner: { marginVertical: spacing.lg },
  statsError: { gap: spacing.md, marginTop: spacing.sm },
  statsEmpty: { gap: spacing.md, marginTop: spacing.sm },
  stats: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  statValue: { ...typography.title },
  lastCheckin: { marginTop: spacing.sm },
  counter: { alignSelf: "flex-end", marginTop: -spacing.sm, marginBottom: spacing.sm },
  editActions: { flexDirection: "row", gap: spacing.sm },
  editButton: { marginTop: spacing.md },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  resultOk: { backgroundColor: colors.success },
  resultError: { backgroundColor: colors.dangerTint },
  errorText: { color: colors.danger },
  links: { paddingVertical: 0 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET + spacing.md,
    paddingVertical: spacing.sm,
  },
  linkDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  linkTitle: { ...typography.body, fontWeight: "600" },
  logoutError: { fontSize: 14, color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
  guestNote: { textAlign: "center", marginTop: spacing.sm },
});
