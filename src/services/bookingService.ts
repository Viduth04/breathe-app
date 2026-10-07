// Shared booking contract - used by student booking (Minhaj), the counsellor
// dashboard (Muaath) and Home (Ishara). Written by Ishara (Member 2).
//
// The only place that writes bookings/. firestore.rules checks every field,
// status change and time written here; keep the two in step.
// Queries always filter by the owner field (studentId or counsellorId) because
// the rules require it. Sorting happens here, so no composite index is needed.

import { db } from "@/firebase/config";
import type { UserProfile } from "@/services/authService";
import {
  ACTIVE_STATUSES,
  Booking,
  BOOKING_NOTES_MAX,
  BookingInput,
  BookingStatus,
  CANCEL_REASON_MAX,
  COUNSELLOR_TRANSITIONS,
  STUDENT_TRANSITIONS,
} from "@/types/booking";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

// Thrown for input the rules would reject anyway, with a message to show as-is
export class BookingError extends Error {}

const toBooking = (id: string, data: object) => ({ ...(data as Omit<Booking, "id">), id });
const byStart = (a: Booking, b: Booking) => {
  const timeA = a.startAt && typeof a.startAt.toMillis === 'function' ? a.startAt.toMillis() : 0;
  const timeB = b.startAt && typeof b.startAt.toMillis === 'function' ? b.startAt.toMillis() : 0;
  return timeA - timeB;
};

function cleanReason(reason?: string) {
  const text = reason?.trim();
  if (text && text.length > CANCEL_REASON_MAX) {
    throw new BookingError(`Keep the reason under ${CANCEL_REASON_MAX} characters.`);
  }
  return text || undefined;
}

// ---------- STUDENT ----------

// New booking, always "pending" until the counsellor confirms it
export async function createBooking(profile: UserProfile, input: BookingInput) {
  if (input.startAt.getTime() <= Date.now()) {
    throw new BookingError("Pick a time in the future.");
  }
  if (input.endAt.getTime() <= input.startAt.getTime()) {
    throw new BookingError("The session must end after it starts.");
  }
  let notes = input.notes?.trim();
  if (input.isAnonymous) {
    notes = notes ? "ANONYMOUS: " + notes : "ANONYMOUS_BOOKING";
  }
  if (notes && notes.length > BOOKING_NOTES_MAX) {
    throw new BookingError(`Keep your note under ${BOOKING_NOTES_MAX} characters.`);
  }

  const ref = await addDoc(collection(db, "bookings"), {
    studentId: profile.uid,
    counsellorId: input.counsellorId,
    studentAnonId: profile.anonId, // The rules check this matches the profile
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    sessionType: input.sessionType,
    
    status: "pending",
    // Optional fields are left out entirely rather than written as null
    ...(input.slotId ? { slotId: input.slotId } : {}),
    ...(notes ? { notes } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// The student's bookings, soonest first
export async function listMyBookings(uid: string): Promise<Booking[]> {
  const snap = await getDocs(
    query(collection(db, "bookings"), where("studentId", "==", uid)),
  );
  return snap.docs.map((d) => toBooking(d.id, d.data())).sort(byStart);
}

// Live version of listMyBookings (same query, so the same rules apply).
// "local" lists bookings whose latest change is this device's own pending write.
// Returns the unsubscribe function.
export function subscribeToMyBookings(
  uid: string,
  onChange: (bookings: Booking[], local: Set<string>) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(
    query(collection(db, "bookings"), where("studentId", "==", uid)),
    (snap) => {
      const local = new Set(
        snap.docs.filter((d) => d.metadata.hasPendingWrites).map((d) => d.id),
      );
      onChange(snap.docs.map((d) => toBooking(d.id, d.data())).sort(byStart), local);
    },
    onError,
  );
}

// Pending or confirmed -> cancelled, with an optional reason
export async function cancelBooking(booking: Booking, reason?: string) {
  if (!STUDENT_TRANSITIONS[booking.status]?.includes("cancelled")) {
    throw new BookingError("This booking can't be cancelled any more.");
  }
  const cancelReason = cleanReason(reason);
  // Students can't write slots; the counsellor's side frees the slot if needed
  await updateDoc(doc(db, "bookings", booking.id), {
    status: "cancelled",
    ...(cancelReason ? { cancelReason } : {}),
    updatedAt: serverTimestamp(),
  });
}

// ---------- COUNSELLOR ----------

// Bookings with this counsellor, soonest first; optionally only some statuses
export async function listCounsellorBookings(
  counsellorUid: string,
  statuses?: BookingStatus[],
): Promise<Booking[]> {
  const snap = await getDocs(
    query(collection(db, "bookings"), where("counsellorId", "==", counsellorUid)),
  );
  return snap.docs
    .map((d) => toBooking(d.id, d.data()))
    .filter((b) => !statuses || statuses.includes(b.status))
    .sort(byStart);
}

/**
 * Counsellor moves a booking on:
 *   pending   -> confirmed | declined
 *   confirmed -> completed (once the session has started) | cancelled
 *
 * Confirming also, in the same batch:
 *   - marks the slot taken (slots/{slotId}: isBooked, bookingId), and
 *   - creates the careLink counsellor_student, unless one already exists.
 * Cancelling a confirmed booking frees its slot again.
 */
export async function updateBookingStatus(
  counsellorUid: string,
  booking: Booking,
  status: "confirmed" | "declined" | "completed" | "cancelled",
  reason?: string,
) {
  if (booking.counsellorId !== counsellorUid) {
    throw new BookingError("This booking belongs to another counsellor.");
  }
  if (!COUNSELLOR_TRANSITIONS[booking.status]?.includes(status)) {
    throw new BookingError(`A ${booking.status} booking can't be marked ${status}.`);
  }
  if (status === "completed" && booking.startAt.toMillis() > Date.now()) {
    throw new BookingError("A session can only be completed after it has started.");
  }
  const cancelReason =
    status === "cancelled" || status === "declined" ? cleanReason(reason) : undefined;

  const batch = writeBatch(db);
  const bookingRef = doc(db, "bookings", booking.id);
  batch.update(bookingRef, {
    status,
    ...(cancelReason ? { cancelReason } : {}),
    updatedAt: serverTimestamp(),
  });

  const slotRef = booking.slotId ? doc(db, "slots", booking.slotId) : null;

  if (status === "confirmed") {
    if (slotRef) {
      const slot = await getDoc(slotRef);
      const takenBy: string | undefined = slot.exists() ? slot.data().bookingId : undefined;
      if (slot.exists() && slot.data().isBooked && takenBy && takenBy !== booking.id) {
        // Students can't write slots, so a booking they cancelled can still
        // hold its slot. Only an active booking really blocks it.
        // A deleted booking (Delete My Data) reads as permission-denied: free
        const holder = await getDoc(doc(db, "bookings", takenBy)).catch((e) => {
          if (e?.code === "permission-denied") return null;
          throw e;
        });
        if (holder?.exists() && ACTIVE_STATUSES.includes(holder.data().status)) {
          throw new BookingError("That time is already booked by another student.");
        }
      }
      if (slot.exists()) batch.update(slotRef, { isBooked: true, bookingId: booking.id });
    }

    // The link id is fixed per pair, so a returning student already has one.
    // Queried (not getDoc) because the rules deny reading a missing doc.
    const existing = await getDocs(
      query(
        collection(db, "careLinks"),
        where("counsellorId", "==", counsellorUid),
        where("studentId", "==", booking.studentId),
      ),
    );
    if (existing.empty) {
      batch.set(doc(db, "careLinks", `${counsellorUid}_${booking.studentId}`), {
        counsellorId: counsellorUid,
        studentId: booking.studentId,
        bookingId: booking.id,
        createdAt: serverTimestamp(),
      });
    }
  }

  if (status === "cancelled" && slotRef) {
    const slot = await getDoc(slotRef);
    if (slot.exists() && slot.data().bookingId === booking.id) {
      batch.update(slotRef, { isBooked: false, bookingId: null });
    }
  }

  await batch.commit();
}

export async function getBooking(id: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, "bookings", id));
  if (!snap.exists()) return null;
  return toBooking(snap.id, snap.data());
}
