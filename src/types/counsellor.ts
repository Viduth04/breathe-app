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
};

// What the admin form edits (updatedAt is set by the service)
export type CounsellorInput = Omit<CounsellorProfile, "updatedAt">;
