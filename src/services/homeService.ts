/**
 * Loads the student's next upcoming session for the Home dashboard.
 * Booking data comes from bookingService, and the counsellor's name comes
 * from the matching Firestore counsellor profile.
 */

import { db } from "@/firebase/config";
import { listMyBookings } from "@/services/bookingService";
import { ACTIVE_STATUSES, Booking, BOOKING_START_FIELD } from "@/types/booking";
import { doc, getDoc } from "firebase/firestore";

export type UpcomingBooking = {
  id: string;
  counsellorId: string;
  counsellorName: string;
  status: Booking["status"];
  sessionType: Booking["sessionType"];
  startAt: Date;
};

/**
 * Looks up the display name for a counsellor.
 * @param counsellorId Firestore document ID of the counsellor.
 * @returns The counsellor's full name, or a generic label if the profile is missing.
 */
export async function getCounsellorName(counsellorId: string): Promise<string> {
  const counsellor = await getDoc(doc(db, "counsellors", counsellorId));
  return counsellor.exists() ? (counsellor.data().fullName as string) : "Your counsellor";
}

/**
 * Finds the student's soonest pending or confirmed booking that has not started.
 * @param uid Firebase user ID of the student.
 * @returns The upcoming booking with its counsellor's name, or null if none exists.
 */
export async function getUpcomingBooking(uid: string): Promise<UpcomingBooking | null> {
  const now = Date.now();
  const next = (await listMyBookings(uid)) // Soonest first
    .find(
      (b) =>
        ACTIVE_STATUSES.includes(b.status) &&
        !!b[BOOKING_START_FIELD] &&
        b[BOOKING_START_FIELD].toMillis() >= now,
    );
  if (!next) return null;

  const counsellorName = await getCounsellorName(next.counsellorId);
  return {
    id: next.id,
    counsellorId: next.counsellorId,
    counsellorName,
    status: next.status,
    sessionType: next.sessionType,
    startAt: next[BOOKING_START_FIELD].toDate(),
  };
}
