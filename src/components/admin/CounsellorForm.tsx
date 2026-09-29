// Admin panel - Viduth (Member 1).

import ChipSelect from "@/components/admin/ChipSelect";
import FormModal from "@/components/admin/FormModal";
import { displayName } from "@/components/admin/RoleSheet";
import ToggleRow from "@/components/admin/ToggleRow";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import { createCounsellor, updateCounsellor } from "@/services/adminService";
import { getAuthErrorMessage, UserProfile } from "@/services/authService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  COUNSELLOR_BIO_MAX,
  CounsellorProfile,
  Language,
  LANGUAGES,
  SPECIALTIES,
  Specialty,
} from "@/types/counsellor";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Field =
  | "uid"
  | "fullName"
  | "title"
  | "specialties"
  | "languages"
  | "experienceYears"
  | "bio";
type Errors = Partial<Record<Field | "form", string>>;

// Render this only while the form is open; it starts from `existing`/`initialUid`
type Props = {
  existing: CounsellorProfile | null; // null = create a new profile
  candidates: UserProfile[]; // Counsellor users without a profile (create only)
  initialUid?: string; // Pre-select a candidate (from the warning card)
  onClose: () => void;
  onSaved: (message: string) => void;
};

export default function CounsellorForm({
  existing,
  candidates,
  initialUid,
  onClose,
  onSaved,
}: Props) {
  const preset = candidates.find((c) => c.uid === initialUid);
  const [uid, setUid] = useState(existing?.uid ?? preset?.uid ?? "");
  const [fullName, setFullName] = useState(
    existing?.fullName ?? preset?.fullName ?? "",
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [specialties, setSpecialties] = useState<Specialty[]>(
    existing?.specialties ?? [],
  );
  const [languages, setLanguages] = useState<Language[]>(existing?.languages ?? []);
  const [experience, setExperience] = useState(
    existing ? String(existing.experienceYears) : "",
  );
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [isAvailable, setIsAvailable] = useState(existing?.isAvailable ?? true);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const pickUser = (user: UserProfile) => {
    setUid(user.uid);
    if (!fullName.trim()) setFullName(user.fullName);
  };

  const validate = () => {
    const next: Errors = {};
    const years = Number(experience);
    if (!existing && !uid) next.uid = "Choose which counsellor this profile is for.";
    if (fullName.trim().length < 2) next.fullName = "Enter the counsellor's full name.";
    if (!title.trim()) next.title = "Enter a title, e.g. Licensed Clinical Psychologist.";
    if (!specialties.length) next.specialties = "Choose at least one specialty.";
    if (!languages.length) next.languages = "Choose at least one language.";
    if (!/^\d+$/.test(experience.trim()) || years > 60)
      next.experienceYears = "Enter whole years between 0 and 60.";
    if (!bio.trim()) next.bio = "Write a short bio for students.";
    else if (bio.length > COUNSELLOR_BIO_MAX)
      next.bio = `Keep the bio under ${COUNSELLOR_BIO_MAX} characters.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const data = {
      fullName: fullName.trim(),
      title: title.trim(),
      specialties,
      languages,
      experienceYears: Number(experience),
      bio: bio.trim(),
      isAvailable,
    };
    try {
      if (existing) await updateCounsellor(existing.uid, data);
      else await createCounsellor({ uid, ...data });
      onSaved(
        existing
          ? `${data.fullName}'s profile was updated.`
          : `${data.fullName}'s profile was created.`,
      );
    } catch (e) {
      setErrors({ form: getAuthErrorMessage(e) });
      setSaving(false);
    }
  };

  return (
    <FormModal
      visible
      title={existing ? "Edit counsellor profile" : "Add counsellor profile"}
      onClose={onClose}
      closeDisabled={saving}
    >
      {!existing ? (
        <View style={styles.section}>
          <Text style={styles.label}>Counsellor account</Text>
          {candidates.length === 0 ? (
            <Card variant="success">
              <Text style={typography.body}>
                Every counsellor already has a profile. To add someone new, give
                their account the Counsellor role in the Users tab first.
              </Text>
            </Card>
          ) : (
            candidates.map((user) => {
              const selected = user.uid === uid;
              return (
                <Pressable
                  key={user.uid}
                  onPress={() => pickUser(user)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${displayName(user)}, ${user.email ?? "no email"}`}
                  style={[
                    styles.userOption,
                    selected && styles.userOptionSelected,
                    errors.uid && !uid ? styles.userOptionError : null,
                  ]}
                >
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={colors.primary}
                  />
                  <View style={styles.flex}>
                    <Text style={styles.userName}>{displayName(user)}</Text>
                    <Text style={typography.caption}>{user.email ?? "No email"}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
          {errors.uid ? <Text style={styles.error}>{errors.uid}</Text> : null}
        </View>
      ) : null}

      <Input
        label="Full name"
        icon="person-outline"
        placeholder="Dr. Nimali Perera"
        value={fullName}
        onChangeText={setFullName}
        error={errors.fullName}
        autoCapitalize="words"
      />
      <Input
        label="Title"
        icon="ribbon-outline"
        placeholder="Licensed Clinical Psychologist"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
      />
      <ChipSelect
        label="Specialties"
        options={SPECIALTIES}
        selected={specialties}
        onChange={setSpecialties}
        error={errors.specialties}
      />
      <ChipSelect
        label="Languages"
        options={LANGUAGES}
        selected={languages}
        onChange={setLanguages}
        error={errors.languages}
      />
      <Input
        label="Years of experience"
        icon="time-outline"
        placeholder="5"
        value={experience}
        onChangeText={(text) => setExperience(text.replace(/[^0-9]/g, ""))}
        error={errors.experienceYears}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Input
        label="Short bio"
        placeholder="What students can expect from a session with you"
        value={bio}
        onChangeText={setBio}
        error={errors.bio}
        multiline
        maxLength={COUNSELLOR_BIO_MAX}
        textAlignVertical="top"
      />
      <Text
        style={[typography.caption, styles.counter]}
        accessibilityLabel={`${bio.length} of ${COUNSELLOR_BIO_MAX} characters used`}
      >
        {bio.length}/{COUNSELLOR_BIO_MAX}
      </Text>
      <ToggleRow
        label="Available for bookings"
        description="Students can only book counsellors who are available"
        value={isAvailable}
        onValueChange={setIsAvailable}
      />

      {errors.form ? (
        <Text style={[styles.error, styles.formError]} accessibilityRole="alert">
          {errors.form}
        </Text>
      ) : null}
      <Button
        title={existing ? "Save Changes" : "Create Profile"}
        onPress={handleSave}
        loading={saving}
        disabled={!existing && candidates.length === 0}
      />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md, gap: spacing.sm },
  label: { fontSize: 14, fontWeight: "500", color: colors.text },
  userOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  userOptionSelected: { borderColor: colors.primary, backgroundColor: colors.success },
  userOptionError: { borderColor: colors.danger },
  userName: { ...typography.body, fontWeight: "600" },
  flex: { flex: 1 },
  counter: { textAlign: "right", marginTop: -spacing.sm, marginBottom: spacing.md },
  error: { fontSize: 13, color: colors.danger },
  formError: { fontSize: 14, textAlign: "center", marginBottom: spacing.md },
});
