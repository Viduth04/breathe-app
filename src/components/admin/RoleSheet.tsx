// Admin panel - Viduth (Member 1). Supports FR01, NFR01.

import RoleBadge, { ROLE_LABELS } from "@/components/admin/RoleBadge";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { AssignableRole, updateUserRole } from "@/services/adminService";
import { getAuthErrorMessage, UserProfile } from "@/services/authService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const ASSIGNABLE: AssignableRole[] = ["student", "counsellor", "lecturer"];

const WITH_ARTICLE: Record<AssignableRole, string> = {
  student: "a student",
  counsellor: "a counsellor",
  lecturer: "a lecturer",
};

// What the new role can see, shown in the confirmation step
const ROLE_EFFECT: Record<AssignableRole, string> = {
  student: "They will use the student app and lose any staff access.",
  counsellor: "They will see anonymous booking requests.",
  lecturer: "They will only see anonymised totals, never individual students.",
};

export const displayName = (user: UserProfile) =>
  user.isGuest || !user.fullName?.trim() ? "Guest" : user.fullName.trim();

type Step = "choose" | "confirm" | "done";

type Props = {
  user: UserProfile | null; // Sheet is open while a user is set
  hasCounsellorProfile: boolean; // counsellors/{uid} exists for this user
  onClose: () => void;
  onRoleChanged: (uid: string, role: AssignableRole) => void;
};

// Bottom sheet: pick a role -> confirm -> saved
export default function RoleSheet({
  user,
  hasCounsellorProfile,
  onClose,
  onRoleChanged,
}: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [role, setRole] = useState<AssignableRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [profileHidden, setProfileHidden] = useState(false);

  // Start fresh each time a different user is opened
  useEffect(() => {
    setStep("choose");
    setRole(null);
    setSaving(false);
    setError(undefined);
    setProfileHidden(false);
  }, [user?.uid]);

  if (!user) return null;
  const name = displayName(user);
  // A counsellor moving to another role: their public profile gets switched off
  const hidesProfile =
    user.role === "counsellor" && hasCounsellorProfile && role !== "counsellor";

  const handleConfirm = async () => {
    if (!role) return;
    setError(undefined);
    setSaving(true);
    try {
      await updateUserRole(user.uid, role, { hideCounsellorProfile: hidesProfile });
      setProfileHidden(hidesProfile);
      onRoleChanged(user.uid, role);
      setStep("done");
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={saving ? () => {} : onClose}
    >
      <View style={styles.backdrop}>
        {/* Tapping the dimmed area closes the sheet (not while saving) */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={saving ? undefined : onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={typography.heading} accessibilityRole="header">
            {step === "done" ? "Role updated" : `Change role for ${name}`}
          </Text>
          <View style={styles.current}>
            <Text style={typography.caption}>Current role</Text>
            <RoleBadge role={user.role} />
          </View>

          {step === "choose" && user.isGuest ? (
            // Guests have no verified name or email, so staff roles are off the table
            <Card variant="success" style={styles.note}>
              <View style={styles.noteRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={[typography.body, styles.flex]}>
                  Guest accounts can't become counsellors or lecturers because
                  they have no verified name or email. Ask them to register
                  first.
                </Text>
              </View>
            </Card>
          ) : null}

          {step === "choose" && !user.isGuest ? (
            <View style={styles.options}>
              {ASSIGNABLE.map((option) => {
                const isCurrent = option === user.role;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setRole(option);
                      setStep("confirm");
                    }}
                    disabled={isCurrent}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isCurrent
                        ? `${ROLE_LABELS[option]}, current role`
                        : `Make ${name} ${WITH_ARTICLE[option]}`
                    }
                    accessibilityState={{ disabled: isCurrent }}
                    style={({ pressed }) => [
                      styles.option,
                      isCurrent && styles.optionCurrent,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.optionText}>{ROLE_LABELS[option]}</Text>
                    {isCurrent ? (
                      <Text style={typography.caption}>Current</Text>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {step === "confirm" && role ? (
            <View style={styles.confirm}>
              <Text style={typography.body}>
                Make {name} {WITH_ARTICLE[role]}? {ROLE_EFFECT[role]}
              </Text>
              {hidesProfile ? (
                <Card style={styles.warning}>
                  <View style={styles.noteRow}>
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={colors.danger}
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                    <Text style={[typography.body, styles.flex]}>
                      {name} has a counsellor profile. It will be marked as not
                      available, so students can't book new sessions with them.
                      Existing bookings aren't cancelled, so check those with
                      them. You can delete the profile in the Counsellors tab.
                    </Text>
                  </View>
                </Card>
              ) : null}
              {error ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}
              <Button
                title={`Make ${ROLE_LABELS[role]}`}
                onPress={handleConfirm}
                loading={saving}
              />
              <Button
                title="Back"
                variant="secondary"
                onPress={() => {
                  setError(undefined);
                  setStep("choose");
                }}
                disabled={saving}
              />
            </View>
          ) : null}

          {step === "done" && role ? (
            <View style={styles.confirm}>
              <View style={styles.noteRow} accessibilityRole="alert">
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={[typography.body, styles.flex]}>
                  {name} is now {WITH_ARTICLE[role]}. Their app switches to
                  the new role automatically.
                  {profileHidden
                    ? " Their counsellor profile is now hidden from booking."
                    : ""}
                </Text>
              </View>
              <Button title="Done" onPress={onClose} />
            </View>
          ) : null}

          {step === "choose" ? (
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.cancel}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  current: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  note: { marginBottom: 0 },
  warning: { marginBottom: 0, backgroundColor: colors.dangerTint },
  noteRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  flex: { flex: 1 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  optionCurrent: { backgroundColor: colors.success, borderColor: colors.selected },
  optionText: { ...typography.body, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  confirm: { gap: spacing.md },
  error: { fontSize: 14, color: colors.danger },
  cancel: { marginTop: spacing.xs },
});
