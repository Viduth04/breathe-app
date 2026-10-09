// Crisis Support - Viduth (Member 1). Fixes Milestone 02 F9 / R9. Supports NFR01.
//
// Every phone number the app shows lives here so it's easy to update.
// All checked against official sources on HELPLINES_CHECKED_ON (Sumithrayo:
// srilankasumithrayo.lk). Re-check all of them before each release and update
// HELPLINES_CHECKED_ON, which the Crisis Support screen shows.
// Only 1926 and 1333 are confirmed 24/7.

export const HELPLINES_CHECKED_ON = "5 October 2026";

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

export const SUMITHRAYO_NUMBER = "0707 308 308";

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
    description:
      "Confidential emotional support from trained volunteers. Centres open about 9am to 4pm. WhatsApp 0767 520 620.",
  },
];
