// Counsellor Schedule types - Muaath (Member 4). Supports FR08.
// Shaped to mirror Firestore slots/{id} for future integration.

export type SlotStatus = "open" | "booked" | "closed";

export type TimeSlot = {
  id: string;
  timeRange: string;
  status: SlotStatus;
  description: string;
  /** Only set when status is "booked" */
  bookedStudentAnonId?: string;
};

export type DayInfo = {
  dayShort: string;
  dateNum: number;
  /** green dot = has open slots, amber = partial, gray = unavailable */
  dotColor: "green" | "amber" | "gray";
  isSelected: boolean;
};

export type SchedulePreference = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type WeekRange = {
  label: string; // e.g. "Aug 18 – Aug 24, 2025"
  startDate: string;
};

export type ViewMode = "week" | "month";
