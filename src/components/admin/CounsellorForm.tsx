// Admin panel - Viduth (Member 1).

import ChipSelect from "@/components/admin/ChipSelect";
import FormModal from "@/components/admin/FormModal";
import { displayName } from "@/components/admin/RoleSheet";
import ToggleRow from "@/components/admin/ToggleRow";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import CounsellorAvatar, {
  counsellorInitials,
} from "@/components/common/CounsellorAvatar";
import Input from "@/components/common/Input";
import { createCounsellor, updateCounsellor } from "@/services/adminService";
import { getAuthErrorMessage, UserProfile } from "@/services/authService";
import { getCounsellorPhoto } from "@/services/counsellorPhotoService";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  COUNSELLOR_BIO_MAX,
  COUNSELLOR_NAME_MAX,
  COUNSELLOR_TITLE_MAX,
  CounsellorProfile,
  Language,
  LANGUAGES,
  PhotoChange,
  SPECIALTIES,
  Specialty,
} from "@/types/counsellor";
import { pickCounsellorPhoto } from "@/utils/pickCounsellorPhoto";
import {
  COUNSELLOR_FIELDS,
  CounsellorField,
  counsellorFieldError,
  CounsellorFormValues,
  validateCounsellorForm,
} from "@/utils/validateCounsellor";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Errors = Partial<Record<CounsellorField | "form", string>>;

// Names used when announcing the first error to screen readers
const FIELD_LABELS: Record<CounsellorField, string> = {
  uid: "Counsellor account",
  fullName: "Full name",
  title: "Title",
  specialties: "Specialties",
  languages: "Languages",
  experienceYears: "Years of experience",
  bio: "Short bio",
};

const fixFieldsMessage = (count: number) =>
  `Please fix ${count} ${count === 1 ? "field" : "fields"} above.`;

// Render this only while the form is open; it starts from `existing`/`initialUid`
type Props = {
  existing: CounsellorProfile | null; // null = create a new profile
  candidates: UserProfile[]; // Counsellor users without a profile (create only)
  initialUid?: string; // Pre-select a candidate (from the warning card)
  // Counsellor sign-ups still waiting for approval. Shown as a pointer to
  // Users > Requests, never as selectable accounts (role is still "student",
  // so the rules would refuse a profile for them).
  pendingRequests?: UserProfile[];
  onReviewRequests?: () => void;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export default function CounsellorForm({
  existing,
  candidates,
  initialUid,
  pendingRequests = [],
  onReviewRequests,
  onClose,
  onSaved,
}: Props) {
  const preset = candidates.find((c) => c.uid === initialUid);
  const [uid, setUid] = useState(existing?.uid ?? preset?.uid ?? "");
  const [fullName, setFullName] = useState(
    existing?.fullName ?? preset?.fullName ?? "",
  );
  // The name last copied from a picked account. While the field still holds
  // exactly that, picking another account replaces it; once the admin edits
  // it, it's theirs and is never overwritten.
  const [prefilledName, setPrefilledName] = useState(
    existing ? "" : (preset?.fullName ?? ""),
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [specialties, setSpecialties] = useState<Specialty[]>(
    existing?.specialties ?? [],
  );
  const [languages, setLanguages] = useState<Language[]>(
    existing?.languages ?? [],
  );
  const [experience, setExperience] = useState(
    existing ? String(existing.experienceYears) : "",
  );
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [isAvailable, setIsAvailable] = useState(existing?.isAvailable ?? true);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Photo: the saved one (edit only), plus what this save will do with it
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PhotoChange>(undefined);
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState<string>();

  useEffect(() => {
    if (existing) getCounsellorPhoto(existing.uid).then(setSavedPhoto);
  }, [existing]);

  const shownPhoto = photo !== undefined ? photo : savedPhoto;

  const choosePhoto = async () => {
    setPhotoError(undefined);
    setPicking(true);
    try {
      const result = await pickCounsellorPhoto();
      if (result.kind === "picked") setPhoto(result.photo);
      else if (result.kind === "error") setPhotoError(result.message);
    } finally {
      setPicking(false);
    }
  };

  const removePhoto = () => {
    setPhotoError(undefined);
    // Nothing saved yet: just drop the pick. Saved: delete it on save.
    setPhoto(savedPhoto ? null : undefined);
  };

  // Validation (the same checks as firestore.rules) runs when Save is
  // pressed. After that, a field showing an error is re-checked as it
  // changes, so the error goes as soon as it's fixed.
  const values: CounsellorFormValues = {
    uid,
    fullName,
    title,
    specialties,
    languages,
    experience,
    bio,
  };
  // Only matters when there's nobody to pick
  const showPending =
    !existing && candidates.length === 0 && pendingRequests.length > 0;
  const context = {
    creating: !existing,
    hasCandidates: candidates.length > 0,
    hasPendingRequests: showPending,
  };

  const recheck = (
    changed: Partial<CounsellorFormValues>,
    fields: CounsellorField[],
  ) =>
    setErrors((prev) => {
      if (!fields.some((f) => prev[f])) return prev;
      const next = { ...prev };
      for (const field of fields) {
        if (!next[field]) continue;
        const error = counsellorFieldError(
          field,
          { ...values, ...changed },
          context,
        );
        if (error) next[field] = error;
        else delete next[field];
      }
      return next;
    });

  const changeFullName = (text: string) => {
    setFullName(text);
    recheck({ fullName: text }, ["fullName"]);
  };
  const changeTitle = (text: string) => {
    setTitle(text);
    recheck({ title: text }, ["title"]);
  };
  const changeSpecialties = (next: Specialty[]) => {
    setSpecialties(next);
    recheck({ specialties: next }, ["specialties"]);
  };
  const changeLanguages = (next: Language[]) => {
    setLanguages(next);
    recheck({ languages: next }, ["languages"]);
  };
  // Kept as typed (not stripped to digits), so "2.5" or "-1" shows an error
  // instead of quietly saving 25 or 1
  const changeExperience = (text: string) => {
    setExperience(text);
    recheck({ experience: text }, ["experienceYears"]);
  };
  const changeBio = (text: string) => {
    setBio(text);
    recheck({ bio: text }, ["bio"]);
  };

  const pickUser = (user: UserProfile) => {
    const untouched = !fullName.trim() || fullName === prefilledName;
    const name =
      untouched && user.fullName?.trim() ? user.fullName.trim() : fullName;
    setUid(user.uid);
    setFullName(name);
    if (name !== fullName) setPrefilledName(name);
    recheck({ uid: user.uid, fullName: name }, ["uid", "fullName"]);
  };

  // Where each field sits in the scroll view, to scroll to the first error
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Partial<Record<CounsellorField, number>>>({});
  const trackY = (field: CounsellorField) => (e: LayoutChangeEvent) => {
    fieldY.current[field] = e.nativeEvent.layout.y;
  };

  const fieldErrorCount = COUNSELLOR_FIELDS.filter((f) => errors[f]).length;

  const handleSave = async () => {
    const next = validateCounsellorForm(values, context);
    setErrors(next);
    const invalid = COUNSELLOR_FIELDS.filter((f) => next[f]);
    if (invalid.length) {
      const first = invalid[0];
      scrollRef.current?.scrollTo({
        y: Math.max(0, (fieldY.current[first] ?? 0) - spacing.md),
        animated: true,
      });
      // Web reads the summary through its live region instead
      if (Platform.OS !== "web") {
        AccessibilityInfo.announceForAccessibility(
          `${fixFieldsMessage(invalid.length)} ${FIELD_LABELS[first]}: ${next[first]}`,
        );
      }
      return;
    }
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
      if (existing) await updateCounsellor(existing.uid, data, photo);
      else await createCounsellor({ uid, ...data }, photo);
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
      scrollRef={scrollRef}
      footer={
        <>
          {fieldErrorCount ? (
            <Text
              style={[styles.error, styles.formError]}
              accessibilityRole="alert"
              {...(Platform.OS === "web"
                ? { "aria-live": "polite" as const }
                : null)}
            >
              {fixFieldsMessage(fieldErrorCount)}
            </Text>
          ) : null}
          {errors.form ? (
            <Text
              style={[styles.error, styles.formError]}
              accessibilityRole="alert"
            >
              {errors.form}
            </Text>
          ) : null}
          {/* Never disabled (except while saving): pressing it explains what's missing */}
          <Button
            title={existing ? "Save Changes" : "Create Profile"}
            onPress={handleSave}
            loading={saving}
          />
        </>
      }
    >
      {!existing ? (
        <View style={styles.section} onLayout={trackY("uid")}>
          <Text style={styles.label}>Counsellor account</Text>
          {showPending ? (
            <Card style={styles.pendingCard}>
              <View style={styles.pendingTitle}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text
                  style={[typography.body, styles.bold, styles.flex]}
                  accessibilityRole="header"
                >
                  {pendingRequests.length === 1
                    ? "1 counsellor sign-up is waiting for approval"
                    : `${pendingRequests.length} counsellor sign-ups are waiting for approval`}
                </Text>
              </View>
              {pendingRequests.map((user) => (
                <View
                  key={user.uid}
                  accessible
                  accessibilityLabel={`${displayName(user)}, ${user.email ?? "no email"}`}
                >
                  <Text style={styles.userName}>{displayName(user)}</Text>
                  <Text style={typography.caption}>
                    {user.email ?? "No email"}
                  </Text>
                </View>
              ))}
              <Text style={typography.caption}>
                Approve {pendingRequests.length === 1 ? "it" : "them"} in Users
                first, then come back to create the profile.
              </Text>
              {onReviewRequests ? (
                <Button
                  title={
                    pendingRequests.length === 1
                      ? "Review request"
                      : "Review requests"
                  }
                  variant="secondary"
                  icon="arrow-forward"
                  onPress={onReviewRequests}
                  disabled={saving}
                />
              ) : null}
            </Card>
          ) : candidates.length === 0 ? (
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
                  accessibilityHint={
                    errors.uid ? `Error: ${errors.uid}` : undefined
                  }
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
                    <Text style={typography.caption}>
                      {user.email ?? "No email"}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
          {errors.uid ? <Text style={styles.error}>{errors.uid}</Text> : null}
        </View>
      ) : null}

      {/* Photo (counsellors only); saved together with the profile */}
      <View style={styles.photoSection}>
        <CounsellorAvatar
          name={counsellorInitials(fullName) ? fullName : "?"}
          photo={shownPhoto ?? null}
          size={96}
        />
        <View style={styles.photoActions}>
          <Button
            title={shownPhoto ? "Change photo" : "Add photo"}
            variant="secondary"
            icon="image-outline"
            onPress={choosePhoto}
            loading={picking}
            disabled={saving}
          />
          {shownPhoto ? (
            <Button
              title="Remove photo"
              variant="danger"
              onPress={removePhoto}
              disabled={saving || picking}
            />
          ) : null}
          <Text style={typography.caption}>
            {photo === null
              ? "The photo will be removed when you save."
              : photo
                ? "New photo will be saved with the profile."
                : "Optional. Square, shown to students when booking."}
          </Text>
        </View>
      </View>
      {photoError ? (
        <Text
          style={[styles.error, styles.photoError]}
          accessibilityRole="alert"
        >
          {photoError}
        </Text>
      ) : null}

      <View onLayout={trackY("fullName")}>
        <Input
          label="Full name"
          icon="person-outline"
          placeholder="e.g. Dr. Jane Silva"
          value={fullName}
          onChangeText={changeFullName}
          error={errors.fullName}
          autoCapitalize="words"
          maxLength={COUNSELLOR_NAME_MAX}
        />
      </View>
      <View onLayout={trackY("title")}>
        <Input
          label="Title"
          icon="ribbon-outline"
          placeholder="e.g. Counselling psychologist"
          value={title}
          onChangeText={changeTitle}
          error={errors.title}
          maxLength={COUNSELLOR_TITLE_MAX}
        />
      </View>
      <View onLayout={trackY("specialties")}>
        <ChipSelect
          label="Specialties"
          options={SPECIALTIES}
          selected={specialties}
          onChange={changeSpecialties}
          error={errors.specialties}
        />
      </View>
      <View onLayout={trackY("languages")}>
        <ChipSelect
          label="Languages"
          options={LANGUAGES}
          selected={languages}
          onChange={changeLanguages}
          error={errors.languages}
        />
      </View>
      <View onLayout={trackY("experienceYears")}>
        <Input
          label="Years of experience"
          icon="time-outline"
          placeholder="e.g. 5"
          value={experience}
          onChangeText={changeExperience}
          error={errors.experienceYears}
          keyboardType="number-pad"
          maxLength={3} // Room for "2.5" to show (and fail) in full
        />
      </View>
      <View onLayout={trackY("bio")}>
        <Input
          label="Short bio"
          placeholder="What students can expect from a session with you"
          value={bio}
          onChangeText={changeBio}
          error={errors.bio}
          multiline
          maxLength={COUNSELLOR_BIO_MAX}
          textAlignVertical="top"
        />
      </View>
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
    </FormModal>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md, gap: spacing.sm },
  photoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoActions: { flex: 1, gap: spacing.sm },
  photoError: { marginTop: -spacing.sm, marginBottom: spacing.md },
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
  userOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.success,
  },
  userOptionError: { borderColor: colors.danger },
  userName: { ...typography.body, fontWeight: "600" },
  pendingCard: { gap: spacing.sm, borderWidth: 1, borderColor: colors.primary },
  pendingTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bold: { fontWeight: "600" },
  flex: { flex: 1 },
  counter: {
    textAlign: "right",
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  error: { fontSize: 13, color: colors.danger },
  formError: { fontSize: 14, textAlign: "center", marginBottom: spacing.sm },
});
