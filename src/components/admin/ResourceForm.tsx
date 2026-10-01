// Admin panel - Viduth (Member 1).

import ChipSelect from "@/components/admin/ChipSelect";
import FormModal from "@/components/admin/FormModal";
import ResourcePreview from "@/components/admin/ResourcePreview";
import ToggleRow from "@/components/admin/ToggleRow";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { createResource, updateResource } from "@/services/adminService";
import { getAuthErrorMessage } from "@/services/authService";
import { colors, spacing, typography } from "@/theme";
import {
  exerciseSteps,
  Resource,
  RESOURCE_CATEGORIES,
  RESOURCE_SUMMARY_MAX,
  RESOURCE_TYPES,
  ResourceCategory,
  ResourceType,
} from "@/types/resource";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

type Field =
  | "title"
  | "type"
  | "categories"
  | "durationMinutes"
  | "summary"
  | "content";
type Errors = Partial<Record<Field | "form", string>>;

const TYPE_LABELS: Record<ResourceType, string> = {
  article: "Article",
  exercise: "Exercise",
};

// Render this only while the form is open; it starts from `existing`
export default function ResourceForm({
  existing,
  onClose,
  onSaved,
}: {
  existing: Resource | null; // null = create
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [type, setType] = useState<ResourceType[]>(existing ? [existing.type] : []);
  const [categories, setCategories] = useState<ResourceCategory[]>(
    existing?.categories ?? [],
  );
  const [duration, setDuration] = useState(
    existing ? String(existing.durationMinutes) : "",
  );
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [isPublished, setIsPublished] = useState(existing?.isPublished ?? false);
  const [previewing, setPreviewing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const isExercise = type[0] === "exercise";

  const validate = () => {
    const next: Errors = {};
    const minutes = Number(duration);
    if (!title.trim()) next.title = "Enter a title.";
    else if (title.trim().length > 80) next.title = "Keep the title under 80 characters.";
    if (!type.length) next.type = "Choose article or exercise.";
    if (!categories.length) next.categories = "Choose at least one category.";
    if (!/^\d+$/.test(duration.trim()) || minutes < 1 || minutes > 120)
      next.durationMinutes = "Enter minutes between 1 and 120.";
    if (!summary.trim()) next.summary = "Write a short summary.";
    else if (summary.length > RESOURCE_SUMMARY_MAX)
      next.summary = `Keep the summary under ${RESOURCE_SUMMARY_MAX} characters.`;
    if (!content.trim()) next.content = "Add the content.";
    else if (isExercise && exerciseSteps(content).length < 2)
      next.content = "Add at least 2 steps, one per line.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePreview = () => {
    if (validate()) setPreviewing(true);
  };

  const handleSave = async () => {
    if (!validate()) {
      setPreviewing(false);
      return;
    }
    setSaving(true);
    const data = {
      title: title.trim(),
      type: type[0],
      categories,
      durationMinutes: Number(duration),
      summary: summary.trim(),
      content: content.trim(),
      isPublished,
    };
    try {
      if (existing) await updateResource(existing.id, data);
      else await createResource(data);
      onSaved(
        `"${data.title}" was ${existing ? "updated" : "added"}${
          data.isPublished ? " and published" : " as a draft"
        }.`,
      );
    } catch (e) {
      setErrors({ form: getAuthErrorMessage(e) });
      setSaving(false);
    }
  };

  return (
    <FormModal
      visible
      title={
        previewing ? "Student preview" : existing ? "Edit resource" : "Add resource"
      }
      onClose={onClose}
      closeDisabled={saving}
    >
      {previewing ? (
        <>
          <Text style={[typography.caption, styles.previewNote]}>
            This is how students will see it
            {isPublished ? "" : " once it's published"}.
          </Text>
          <ResourcePreview
            title={title.trim()}
            type={type[0]}
            categories={categories}
            durationMinutes={Number(duration)}
            summary={summary.trim()}
            content={content.trim()}
          />
          <Button
            title="Back to Editing"
            variant="secondary"
            onPress={() => setPreviewing(false)}
            disabled={saving}
            style={styles.gap}
          />
        </>
      ) : (
        <>
          <Input
            label="Title"
            icon="text-outline"
            placeholder="Box breathing"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            maxLength={80}
          />
          <ChipSelect
            label="Type"
            options={RESOURCE_TYPES}
            selected={type}
            onChange={setType}
            multiple={false}
            error={errors.type}
            optionLabel={(t) => TYPE_LABELS[t]}
          />
          <ChipSelect
            label="Categories"
            options={RESOURCE_CATEGORIES}
            selected={categories}
            onChange={setCategories}
            error={errors.categories}
          />
          <Input
            label="Duration (minutes)"
            icon="time-outline"
            placeholder="3"
            value={duration}
            onChangeText={(text) => setDuration(text.replace(/[^0-9]/g, ""))}
            error={errors.durationMinutes}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Input
            label="Short summary"
            placeholder="One or two sentences shown on the resource card"
            value={summary}
            onChangeText={setSummary}
            error={errors.summary}
            multiline
            maxLength={RESOURCE_SUMMARY_MAX}
            textAlignVertical="top"
          />
          <Text
            style={[typography.caption, styles.counter]}
            accessibilityLabel={`${summary.length} of ${RESOURCE_SUMMARY_MAX} characters used`}
          >
            {summary.length}/{RESOURCE_SUMMARY_MAX}
          </Text>
          <Input
            label={isExercise ? "Steps (one per line)" : "Content"}
            placeholder={
              isExercise
                ? "Breathe in for 4 seconds\nHold for 4 seconds\n…"
                : "Write the article. Leave a blank line between paragraphs."
            }
            value={content}
            onChangeText={setContent}
            error={errors.content}
            multiline
            textAlignVertical="top"
          />
          <ToggleRow
            label="Published"
            description="Only published resources are shown to students"
            value={isPublished}
            onValueChange={setIsPublished}
          />
          <Button
            title="Preview"
            variant="secondary"
            icon="eye-outline"
            onPress={handlePreview}
            style={styles.gap}
          />
        </>
      )}

      {errors.form ? (
        <Text style={styles.formError} accessibilityRole="alert">
          {errors.form}
        </Text>
      ) : null}
      <Button
        title={existing ? "Save Changes" : "Add Resource"}
        onPress={handleSave}
        loading={saving}
      />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  counter: { textAlign: "right", marginTop: -spacing.sm, marginBottom: spacing.md },
  previewNote: { marginBottom: spacing.md },
  gap: { marginVertical: spacing.md },
  formError: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
