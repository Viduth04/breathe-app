// Admin panel - Viduth (Member 1).
//
// Shape of resources/{id}. Shared by the admin panel (create/edit) and the
// student Exercises / Home screens (Ishara) - import from "@/types/resource".
// Students should only show resources where isPublished is true.

import type { Timestamp } from "firebase/firestore";

export const RESOURCE_TYPES = ["article", "exercise"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_CATEGORIES = [
  "Stress",
  "Exam Stress",
  "Sleep",
  "Anxiety",
  "Breathing",
] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_SUMMARY_MAX = 140;

export type Resource = {
  id: string; // Firestore doc id
  title: string;
  type: ResourceType;
  categories: ResourceCategory[];
  durationMinutes: number;
  summary: string; // Max RESOURCE_SUMMARY_MAX characters
  content: string; // Articles: paragraphs. Exercises: one step per line.
  isPublished: boolean; // Drafts are only visible in the admin panel
  createdAt: Timestamp | null; // null only while a local write is pending
  updatedAt: Timestamp | null;
};

// What the admin form edits (id and timestamps are set by the service)
export type ResourceInput = Omit<Resource, "id" | "createdAt" | "updatedAt">;

// Exercise steps as shown to students: one non-empty line per step
export const exerciseSteps = (content: string) =>
  content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
