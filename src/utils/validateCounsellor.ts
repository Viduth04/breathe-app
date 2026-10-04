// Admin panel - Viduth (Member 1). Supports FR03.
//
// Checks for the counsellor profile form. Mirrors validCounsellorProfile() in
// firestore.rules exactly, so anything this accepts the rules accept too -
// keep the two in step.

import {
  COUNSELLOR_BIO_MAX,
  COUNSELLOR_EXPERIENCE_MAX,
  COUNSELLOR_NAME_MAX,
  COUNSELLOR_NAME_MIN,
  COUNSELLOR_TITLE_MAX,
  Language,
  Specialty,
} from "@/types/counsellor";

export type CounsellorField =
  | "uid"
  | "fullName"
  | "title"
  | "specialties"
  | "languages"
  | "experienceYears"
  | "bio";

// Top-to-bottom order on the form (first invalid one is scrolled to)
export const COUNSELLOR_FIELDS: CounsellorField[] = [
  "uid",
  "fullName",
  "title",
  "specialties",
  "languages",
  "experienceYears",
  "bio",
];

export type CounsellorFormValues = {
  uid: string;
  fullName: string;
  title: string;
  specialties: Specialty[];
  languages: Language[];
  experience: string; // As typed; saved as a whole number
  bio: string;
};

export type CounsellorFormContext = {
  creating: boolean;
  hasCandidates: boolean; // Any counsellor account without a profile yet
  hasPendingRequests?: boolean; // Counsellor sign-ups still waiting for approval
};

// The error for one field, or undefined when it's fine
export function counsellorFieldError(
  field: CounsellorField,
  v: CounsellorFormValues,
  { creating, hasCandidates, hasPendingRequests }: CounsellorFormContext,
): string | undefined {
  switch (field) {
    case "uid":
      // Rules: uid == doc id, and that user's role is "counsellor" (the
      // candidates list only holds counsellor accounts, never pending ones)
      if (!creating || v.uid) return;
      if (hasCandidates) return "Choose which counsellor this profile is for.";
      return hasPendingRequests
        ? "No counsellor account is ready yet. Approve their sign-up request first."
        : "No counsellor account is waiting for a profile. Give the person the Counsellor role in the Users tab first.";
    case "fullName": {
      const n = v.fullName.trim().length;
      if (n < COUNSELLOR_NAME_MIN) return "Enter the counsellor's full name.";
      if (n > COUNSELLOR_NAME_MAX)
        return `Keep the name to ${COUNSELLOR_NAME_MAX} characters or fewer.`;
      return;
    }
    case "title": {
      const n = v.title.trim().length;
      if (!n) return "Enter a title, e.g. Licensed Clinical Psychologist.";
      if (n > COUNSELLOR_TITLE_MAX)
        return `Keep the title to ${COUNSELLOR_TITLE_MAX} characters or fewer.`;
      return;
    }
    case "specialties":
      return v.specialties.length ? undefined : "Choose at least one specialty.";
    case "languages":
      return v.languages.length ? undefined : "Choose at least one language.";
    case "experienceYears": {
      const text = v.experience.trim();
      if (!/^\d+$/.test(text) || Number(text) > COUNSELLOR_EXPERIENCE_MAX)
        return `Enter whole years between 0 and ${COUNSELLOR_EXPERIENCE_MAX}.`;
      return;
    }
    case "bio": {
      const n = v.bio.trim().length;
      if (!n) return "Write a short bio for students.";
      if (n > COUNSELLOR_BIO_MAX)
        return `Keep the bio to ${COUNSELLOR_BIO_MAX} characters or fewer.`;
      return;
    }
  }
}

export function validateCounsellorForm(
  v: CounsellorFormValues,
  context: CounsellorFormContext,
): Partial<Record<CounsellorField, string>> {
  const errors: Partial<Record<CounsellorField, string>> = {};
  for (const field of COUNSELLOR_FIELDS) {
    const error = counsellorFieldError(field, v, context);
    if (error) errors[field] = error;
  }
  return errors;
}
