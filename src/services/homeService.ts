// Home dashboard - Ishara (Member 2). FR02, FR06.
//
// Read-only: the student's next booking for the Home "Upcoming session" card.
// Uses the shared booking contract (src/types/booking.ts, bookingService.ts).

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

// Counsellor profiles are readable by any signed-in user
export async function getCounsellorName(counsellorId: string): Promise<string> {
  const counsellor = await getDoc(doc(db, "counsellors", counsellorId));
  return counsellor.exists() ? (counsellor.data().fullName as string) : "Your counsellor";
}

// The soonest pending or confirmed booking that hasn't started, or null
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
