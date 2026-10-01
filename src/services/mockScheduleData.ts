// Schedule mock data - Muaath (Member 4). Supports FR08.
// Mirrors Firestore slots/{id} structure for future integration.

import {
  DayInfo,
  SchedulePreference,
  TimeSlot,
  WeekRange,
} from "@/types/counsellorSchedule";

export const MOCK_WEEK_RANGE: WeekRange = {
  label: "Aug 18 – Aug 24, 2025",
  startDate: "2025-08-18",
};

export const MOCK_WEEK_DAYS: DayInfo[] = [
  { dayShort: "Mon", dateNum: 18, dotColor: "green", isSelected: true },
  { dayShort: "Tue", dateNum: 19, dotColor: "green", isSelected: false },
  { dayShort: "Wed", dateNum: 20, dotColor: "green", isSelected: false },
  { dayShort: "Thu", dateNum: 21, dotColor: "green", isSelected: false },
  { dayShort: "Fri", dateNum: 22, dotColor: "amber", isSelected: false },
  { dayShort: "Sat", dateNum: 23, dotColor: "gray", isSelected: false },
];

export const MOCK_TIME_SLOTS: TimeSlot[] = [
  {
    id: "slot-1",
    timeRange: "09:00 AM – 09:50 AM",
    status: "open",
    description: "Open for initial consults",
  },
  {
    id: "slot-2",
    timeRange: "10:00 AM – 10:50 AM",
    status: "booked",
    description: "Confirmed • Student #4021",
    bookedStudentAnonId: "Student #4021",
  },
  {
    id: "slot-3",
    timeRange: "11:00 AM – 11:50 AM",
    status: "open",
    description: "Open for booking",
  },
  {
    id: "slot-4",
    timeRange: "01:00 PM – 01:50 PM",
    status: "closed",
    description: "Clinical break & paperwork",
  },
  {
    id: "slot-5",
    timeRange: "02:00 PM – 02:50 PM",
    status: "open",
    description: "Open for booking",
  },
  {
    id: "slot-6",
    timeRange: "03:00 PM – 03:50 PM",
    status: "open",
    description: "Open for booking",
  },
  {
    id: "slot-7",
    timeRange: "04:00 PM – 04:50 PM",
    status: "open",
    description: "Open for booking",
  },
];

export const MOCK_SCHEDULE_PREFERENCES: SchedulePreference[] = [
  {
    id: "pref-buffer",
    title: "15-minute buffer between sessions",
    description:
      "Allows notes charting, brief recharge, and bio break.",
    enabled: true,
  },
  {
    id: "pref-sameday",
    title: "Accept same-day bookings (2 hr lead)",
    description:
      "Locks slot reservations within 2 hours of meeting time.",
    enabled: true,
  },
];
