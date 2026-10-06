// Counsellor Schedule types - Muaath (Member 4). Supports FR08.
// Shaped to mirror Firestore slots/{id} for future integration.

export type SlotStatus = "open" | "booked" | "closed" | "held" | "blocked";

export type TimeSlot = {
  id: string;
  timeRange: string;
  status: SlotStatus;
  description: string;
  /** Only set when status is "booked" */
  bookedStudentAnonId?: string;
  /** Date key in Asia/Colombo YYYY-MM-DD */
  dateKey?: string;
  /** Linked booking reference */
  bookingId?: string | null;
};

/** Canonical slot model stored in Firestore `slots/{id}` */
export type FirestoreSlot = {
  id: string;
  counsellorId: string;
  dateKey: string; // YYYY-MM-DD in Asia/Colombo
  timeRange: string; // e.g. "09:00 AM – 09:45 AM"
  startAt?: any;
  endAt?: any;
  status: SlotStatus;
  isBooked: boolean;
  bookingId?: string | null;
  bookedStudentAnonId?: string | null;
  createdAt?: any;
  updatedAt?: any;
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

export type ViewMode = "day" | "week" | "month";

export type PublishMode = "single" | "multi_time" | "date_range" | "recurring";

export type NewSlotBatchInput = {
  dateKey: string; // YYYY-MM-DD in Asia/Colombo
  timeRange: string; // "10:00 AM – 10:45 AM"
  startAt?: Date | any;
  endAt?: Date | any;
  durationMin: number;
  format: "video" | "chat" | "in-person";
  room?: string;
  topicTag?: string;
  status?: SlotStatus;
  seriesId?: string;
};

export type SlotPublishResult = {
  success: boolean;
  createdCount: number;
  skippedCount: number;
  message: string;
};
