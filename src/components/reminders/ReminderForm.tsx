/**
 * Supports FR05 by collecting the time and days for a new or edited check-in
 * reminder. The parent validates and saves the settings; this form only
 * collects the student's choices.
 */

import ChipSelect from "@/components/admin/ChipSelect";
import FormModal from "@/components/admin/FormModal";
import Button from "@/components/common/Button";
import TimePicker from "@/components/reminders/TimePicker";
import { reminderInputError } from "@/services/reminderService";
import { colors, spacing, typography } from "@/theme";
import {
  DAY_ORDER,
  DAY_SHORT,
  daysSummary,
  EVERY_DAY,
  Reminder,
  ReminderInput,
  Weekday,
  WEEKDAYS,
} from "@/types/reminder";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

type DayMode = "every" | "weekdays" | "custom";
const MODES: DayMode[] = ["every", "weekdays", "custom"];
const MODE_LABEL: Record<DayMode, string> = {
  every: "Every day",
  weekdays: "Weekdays",
  custom: "Choose days",
};

const sameDays = (a: Weekday[], b: Weekday[]) =>
  a.length === b.length && b.every((d) => a.includes(d));

const modeFor = (days: Weekday[]): DayMode =>
  sameDays(days, EVERY_DAY) ? "every" : sameDays(days, WEEKDAYS) ? "weekdays" : "custom";

// ChipSelect works with strings, so days travel as "0".."6"
const DAY_OPTIONS = DAY_ORDER.map(String);

/**
 * Shows the form used to set up or edit one check-in reminder.
 * @param visible Whether the form is shown.
 * @param existing Reminder being edited, or null when adding one.
 * @param saving Whether a save is in progress.
 * @param saveError Error message from the save attempt, if any.
 * @param onSave Called with the selected time, days, and enabled state.
 * @param onClose Called when the student closes the form.
 * @returns The reminder form modal.
 */
export default function ReminderForm({
  visible,
  existing,
  saving,
  saveError,
  onSave,
  onClose,
}: {
  visible: boolean;
  existing: Reminder | null; // null = new reminder
  saving: boolean;
  saveError?: string;
  onSave: (input: ReminderInput) => void;
  onClose: () => void;
}) {
  const [time, setTime] = useState(existing?.time ?? "20:00");
  const [days, setDays] = useState<Weekday[]>(existing?.days ?? EVERY_DAY);
  const [mode, setMode] = useState<DayMode>(existing ? modeFor(existing.days) : "every");
  const [daysError, setDaysError] = useState<string>();

  const pickMode = ([next]: DayMode[]) => {
    setMode(next);
    if (next === "every") setDays(EVERY_DAY);
    if (next === "weekdays") setDays(WEEKDAYS);
    setDaysError(undefined);
  };

  const pickDays = (selected: string[]) => {
    const next = selected.map(Number) as Weekday[];
    setDays(next);
    if (next.length) setDaysError(undefined);
  };

  const save = () => {
    const input: ReminderInput = { time, days, enabled: existing?.enabled ?? true };
    const problem = reminderInputError(input);
    if (problem) {
      setDaysError(problem);
      return;
    }
    onSave(input);
  };

  return (
    <FormModal
      visible={visible}
      title={existing ? "Edit reminder" : "Add reminder"}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          {saveError ? (
            <Text style={styles.error} accessibilityRole="alert" aria-live="polite">
              {saveError}
            </Text>
          ) : null}
          <Button
            title={existing ? "Save Changes" : "Save Reminder"}
            onPress={save}
            loading={saving}
          />
        </>
      }
    >
      <TimePicker value={time} onChange={setTime} />

      <ChipSelect
        label="Days"
        options={MODES}
        selected={[mode]}
        onChange={pickMode}
        multiple={false}
        optionLabel={(m) => MODE_LABEL[m]}
      />
      {mode === "custom" ? (
        <ChipSelect
          label="Which days?"
          options={DAY_OPTIONS}
          selected={days.map(String)}
          onChange={pickDays}
          error={daysError}
          optionLabel={(d) => DAY_SHORT[Number(d)]}
        />
      ) : null}

      <Text
        style={[typography.body, styles.summary]}
        accessibilityLabel={
          days.length
            ? `You'll get a reminder ${daysSummary(days, true).toLowerCase()} at the time above`
            : "No days chosen yet"
        }
      >
        {days.length
          ? `${daysSummary(days)} · ${days.length} ${days.length === 1 ? "day" : "days"} a week`
          : "No days chosen yet"}
      </Text>
      <Text style={[typography.caption, styles.note]}>
        The notification only says "Time for your daily check-in". It never
        mentions your mood.
      </Text>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  summary: { color: colors.primary, fontWeight: "600" },
  note: { marginTop: spacing.sm },
  error: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
