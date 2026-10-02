// Self-help resources - Ishara (Member 2). FR06.
//
// "Recommended for you": resources whose categories match the factors the
// student tagged in today's check-in; otherwise breathing exercises first.

import type { MoodFactor } from "@/types/checkin";
import type { Resource, ResourceCategory } from "@/types/resource";

// Which resource categories help with each check-in factor
const FACTOR_CATEGORIES: Record<MoodFactor, ResourceCategory[]> = {
  Studies: ["Exam Stress", "Stress"],
  Exams: ["Exam Stress"],
  Sleep: ["Sleep"],
  Health: ["Stress", "Breathing"],
  Family: ["Stress", "Anxiety"],
  Friends: ["Anxiety"],
  Relationships: ["Anxiety", "Stress"],
  Money: ["Stress"],
  Work: ["Stress"],
  Loneliness: ["Anxiety"],
  Other: [],
};

const MAX_RECOMMENDED = 3;

export type Recommendation = {
  items: Resource[];
  reason: string; // Shown under the section title
};

export function recommendResources(
  resources: Resource[],
  todayFactors: MoodFactor[],
): Recommendation {
  const wanted = new Set(todayFactors.flatMap((f) => FACTOR_CATEGORIES[f] ?? []));

  if (wanted.size) {
    const matches = resources
      .map((r) => ({ r, score: r.categories.filter((c) => wanted.has(c)).length }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score || a.r.title.localeCompare(b.r.title))
      .map((m) => m.r)
      .slice(0, MAX_RECOMMENDED);
    if (matches.length) {
      return {
        items: matches,
        reason: `Based on today's check-in: ${todayFactors.join(", ")}`,
      };
    }
  }

  // No factors (or nothing matched): breathing exercises, then other exercises
  const breathing = (r: Resource) => r.categories.includes("Breathing");
  const items = resources
    .filter((r) => r.type === "exercise" || breathing(r))
    .sort((a, b) => Number(breathing(b)) - Number(breathing(a)))
    .slice(0, MAX_RECOMMENDED);
  return { items, reason: "A few minutes of breathing is a good place to start." };
}
