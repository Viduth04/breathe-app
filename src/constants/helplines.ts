// Crisis Support - Viduth (Member 1). Fixes Milestone 02 F9 / R9. Supports NFR01.
//
// Every phone number the app shows lives here so it's easy to update.
// Checked against findahelpline.com (Sri Lanka) on 2026-09-29.
// Re-check all of them before each release.

export type Helpline = {
  id: string;
  number: string; // As shown to the user
  dial: string; // What goes after tel: (digits and + only)
  name: string;
  description: string;
  hours?: string; // Only set when confirmed
};

// Emergency services: shown first, largest buttons
export const EMERGENCY: Helpline[] = [
  {
    id: "ambulance",
    number: "1990",
    dial: "1990",
    name: "Suwa Seriya Ambulance",
    description: "Free emergency ambulance",
  },
  {
    id: "police",
    number: "119",
    dial: "119",
    name: "Police Emergency",
    description: "If you or someone else is in danger",
  },
];

// TODO: verify on findahelpline.com before submission
// (listed there as +94 707 308 308 on 2026-09-29)
export const SUMITHRAYO_NUMBER = "+94 707 308 308";

export const HELPLINES: Helpline[] = [
  {
    id: "nimh-1926",
    number: "1926",
    dial: "1926",
    name: "National Mental Health Helpline",
    description: "Free and confidential. Call or text.",
    hours: "24/7",
  },
  {
    id: "ccc-1333",
    number: "1333",
    dial: "1333",
    name: "Crisis Support Line",
    description: "Free, confidential and anonymous.",
    hours: "24/7",
  },
  {
    id: "lifeline-1375",
    number: "1375",
    dial: "1375",
    name: "Lanka Life Line",
    description: "Confidential listening and counselling support.",
  },
  {
    id: "sumithrayo",
    number: SUMITHRAYO_NUMBER,
    dial: SUMITHRAYO_NUMBER.replace(/[^\d+]/g, ""),
    name: "Sri Lanka Sumithrayo",
    description: "Confidential emotional support from trained volunteers.",
  },
];
