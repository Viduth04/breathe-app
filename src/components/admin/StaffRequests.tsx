// Staff onboarding - Viduth (Member 1). Supports FR01, NFR01.
//
// "Requests" at the top of the Users tab: staff sign-ups waiting for an admin.
// Approve and Reject both ask for confirmation first.

import { displayName } from "@/components/admin/RoleSheet";
import { InlineError } from "@/components/admin/StateViews";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { approveStaffRequest, rejectStaffRequest } from "@/services/adminService";
import { getAuthErrorMessage, StaffRole, UserProfile } from "@/services/authService";
import { colors, radius, spacing, typography } from "@/theme";
import { confirmAction } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const ROLE_NAME: Record<StaffRole, string> = { counsellor: "Counsellor", lecturer: "Lecturer" };

export type RequestDecision =
  | { uid: string; approved: true; role: StaffRole }
  | { uid: string; approved: false };

export default function StaffRequests({
  requests,
  onDecided,
}: {
  requests: UserProfile[]; // Pending only, from pendingStaffRequests()
  onDecided: (decision: RequestDecision) => void;
}) {
  const [busy, setBusy] = useState<{ uid: string; action: "approve" | "reject" } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Shown after approving a counsellor: they still need a public profile
  const [newCounsellor, setNewCounsellor] = useState<string | null>(null);

  const decide = async (user: UserProfile, approve: boolean) => {
    const role = user.requestedRole!;
    const name = displayName(user);
    const ok = await confirmAction(
      approve
        ? {
            title: `Approve ${name}?`,
            message: `${name} becomes a ${role} and can use the ${role} area straight away.${
              role === "counsellor"
                ? " You'll then need to create their counsellor profile so students can book them."
                : " Lecturers only ever see anonymous totals."
            }`,
            confirmText: "Approve",
          }
        : {
            title: `Reject ${name}?`,
            message: `${name} won't get a ${role} account. They'll see a message that their request wasn't approved.`,
            confirmText: "Reject",
          },
    );
    if (!ok) return;

    setBusy({ uid: user.uid, action: approve ? "approve" : "reject" });
    setErrors(({ [user.uid]: _, ...rest }) => rest);
    try {
      if (approve) {
        await approveStaffRequest(user.uid, role);
        if (role === "counsellor") setNewCounsellor(name);
        onDecided({ uid: user.uid, approved: true, role });
      } else {
        await rejectStaffRequest(user.uid);
        onDecided({ uid: user.uid, approved: false });
      }
    } catch (e) {
      console.warn("Staff request decision failed", e);
      setErrors((prev) => ({ ...prev, [user.uid]: getAuthErrorMessage(e) }));
    } finally {
      setBusy(null);
    }
  };

  if (!requests.length && !newCounsellor) return null;

  return (
    <View style={styles.section}>
      {newCounsellor ? (
        <Card variant="success">
          <View style={styles.noticeRow} accessibilityRole="alert">
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[typography.body, styles.flex]}>
              {newCounsellor} is now a counsellor. Create their counsellor profile in
              the Counsellors tab so students can book them.
            </Text>
          </View>
          <View style={styles.noticeActions}>
            <Button
              title="Add counsellor profile"
              icon="person-add-outline"
              onPress={() => {
                setNewCounsellor(null);
                router.navigate({ pathname: "/(admin)/counsellors", params: { new: "1" } });
              }}
            />
            <Button title="Later" variant="secondary" onPress={() => setNewCounsellor(null)} />
          </View>
        </Card>
      ) : null}

      {requests.length ? (
        <>
          <View style={styles.titleRow}>
            <Text style={typography.heading} accessibilityRole="header">
              Requests
            </Text>
            <View style={styles.count} accessibilityLabel={`${requests.length} waiting`}>
              <Text style={styles.countText}>{requests.length}</Text>
            </View>
          </View>
          <Text style={[typography.caption, styles.caption]}>
            Staff sign-ups waiting for approval. Check they really work here first.
          </Text>

          {requests.map((user) => {
            const role = user.requestedRole!;
            const name = displayName(user);
            const date = user.createdAt
              ? user.createdAt.toDate().toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Date unknown";
            const isBusy = busy?.uid === user.uid;
            return (
              <Card key={user.uid} style={styles.card}>
                <View
                  accessible
                  accessibilityLabel={`${name}, ${user.email ?? "no email"}, requested ${ROLE_NAME[role]}, signed up ${date}`}
                >
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{ROLE_NAME[role]}</Text>
                    </View>
                  </View>
                  <Text style={typography.caption}>{user.email ?? "No email"}</Text>
                  <Text style={typography.caption}>Signed up {date}</Text>
                </View>
                <InlineError message={errors[user.uid]} />
                <View style={styles.actions}>
                  <Button
                    title="Reject"
                    variant="secondary"
                    onPress={() => decide(user, false)}
                    loading={isBusy && busy?.action === "reject"}
                    disabled={busy !== null}
                    style={styles.flex}
                  />
                  <Button
                    title="Approve"
                    onPress={() => decide(user, true)}
                    loading={isBusy && busy?.action === "approve"}
                    disabled={busy !== null}
                    style={styles.flex}
                  />
                </View>
              </Card>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  flex: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  count: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontSize: 13, fontWeight: "700", color: colors.white },
  caption: { marginTop: spacing.xs, marginBottom: spacing.sm },
  card: { gap: spacing.sm, marginBottom: spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  name: { ...typography.body, fontWeight: "600" },
  roleBadge: {
    backgroundColor: colors.selected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  actions: { flexDirection: "row", gap: spacing.sm },
  noticeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  noticeActions: { gap: spacing.sm, marginTop: spacing.md },
});
