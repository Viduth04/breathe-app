// Shared booking contract - used by student booking (Minhaj), the counsellor
// dashboard (Muaath) and Home (Ishara). Written by Ishara (Member 2).
//
// Shape of bookings/{id}. firestore.rules validates exactly these fields, so
// write them through src/services/bookingService.ts rather than by hand.

import type { Timestamp } from "firebase/firestore";

export const SESSION_TYPES = ["in-person", "video", "phone", "chat"] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  "in-person": "In person",
  video: "Video call",
  phone: "Phone call",
  chat: "Chat",
};

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// Who may move a booking from one status to another (mirrored in the rules)
export const STUDENT_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending: ["cancelled"],
  confirmed: ["cancelled"],
};
export const COUNSELLOR_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending: ["confirmed", "declined"],
  confirmed: ["completed", "cancelled"], // "completed" only once the session has started
};

// Still ahead of the student: shown as upcoming
export const ACTIVE_STATUSES: BookingStatus[] = ["pending", "confirmed"];

export const CANCEL_REASON_MAX = 200;
export const BOOKING_NOTES_MAX = 500;

export type Booking = {
  id: string; // Firestore doc id
  studentId: string;
  counsellorId: string; // Also the counsellors/{id} doc id
  studentAnonId: string; // Copy of the student's anonId (counsellors never read users)
  slotId?: string; // slots/{id} this booking was made from, if any
  startAt: Timestamp;
  endAt: Timestamp; // After startAt
  sessionType: SessionType;
  status: BookingStatus;
  cancelReason?: string; // Max CANCEL_REASON_MAX; only on cancelled/declined
  notes?: string; // Student's note when booking, max BOOKING_NOTES_MAX
  createdAt: Timestamp | null; // null only while a local write is pending
  updatedAt: Timestamp | null;
};

// The field Home and lists sort by
export const BOOKING_START_FIELD = "startAt" satisfies keyof Booking;

// What the student's booking form provides (the service fills in the rest)
export type BookingInput = {
  counsellorId: string;
  startAt: Date;
  endAt: Date;
  sessionType: SessionType;
  slotId?: string;
  notes?: string;
};
