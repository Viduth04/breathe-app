// Admin panel - Viduth (Member 1).
//
// Shape of counsellors/{uid}. Shared by the admin panel (create/edit) and the
// student booking screens (Minhaj) - import from "@/types/counsellor".

import type { Timestamp } from "firebase/firestore";

export const SPECIALTIES = [
  "Anxiety",
  "Stress",
  "Depression",
  "Academic Pressure",
  "Sleep",
  "Relationships",
] as const;
export type Specialty = (typeof SPECIALTIES)[number];

export const LANGUAGES = ["English", "Sinhala", "Tamil"] as const;
export type Language = (typeof LANGUAGES)[number];

// Field limits. firestore.rules (validCounsellorProfile) checks the same
// numbers - change both together. Checked by src/utils/validateCounsellor.ts.
export const COUNSELLOR_NAME_MIN = 2;
export const COUNSELLOR_NAME_MAX = 80;
export const COUNSELLOR_TITLE_MAX = 100;
export const COUNSELLOR_EXPERIENCE_MAX = 60;
export const COUNSELLOR_BIO_MAX = 300;

// Doc id is the counsellor's Firebase Auth uid (the security rules rely on it)
export type CounsellorProfile = {
  uid: string;
  fullName: string;
  title: string; // e.g. "Licensed Clinical Psychologist"
  specialties: Specialty[];
  languages: Language[];
  experienceYears: number;
  bio: string; // Max COUNSELLOR_BIO_MAX characters
  isAvailable: boolean; // Shown to students as bookable
  updatedAt: Timestamp | null; // null only while a local write is pending
  availableSlots?: string[];
  availableDate?: string;
};

// What the admin form edits (updatedAt is set by the service)
export type CounsellorInput = Omit<CounsellorProfile, "updatedAt">;

// counsellorPhotos/{uid}: kept out of counsellors/ so lists stay light.
// Counsellors only - students, lecturers and admins never have photos.
// Spark plan has no Firebase Storage, so the photo is a small JPEG data URL.
export type CounsellorPhoto = {
  photo: string; // "data:image/jpeg;base64,..."
  updatedAt: Timestamp | null;
};

export const PHOTO_SIZE = 256; // Square, in pixels
export const PHOTO_QUALITY = 0.6; // JPEG compression
export const PHOTO_MAX_BYTES = 150 * 1024; // Refused above this
export const PHOTO_MAX_CHARS = 200000; // The rules' limit on the data URL

// What a counsellor form save does with the photo
//   undefined - leave it as it is, null - remove it, string - new data URL
export type PhotoChange = string | null | undefined;
