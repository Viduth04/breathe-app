// Shared booking contract - used by student booking (Minhaj), the counsellor
// dashboard (Muaath) and Home (Ishara). Written by Ishara (Member 2).
//
// The only place that writes bookings/. firestore.rules checks every field,
// status change and time written here; keep the two in step.
// Queries always filter by the owner field (studentId or counsellorId) because
// the rules require it. Sorting happens here, so no composite index is needed.

import { db } from "@/firebase/config";
import type { UserProfile } from "@/services/authService";
import { deleteField } from "firebase/firestore";
import { ACTIVE_STATUSES,
  Booking,
  BOOKING_NOTES_MAX,
  BookingInput,
  BookingStatus,
  CANCEL_REASON_MAX,
  COUNSELLOR_TRANSITIONS,
  STUDENT_TRANSITIONS,
} from "@/types/booking";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type Transaction,
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

function requireSlotId(input: BookingInput) {
  if (!input.slotId) {
    throw new BookingError("Select an available date and time before booking.");
  }
  return input.slotId;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function bookingDateKey(booking: DocumentData) {
  if (typeof booking.dateKey === "string") return booking.dateKey;
  return booking.startAt && typeof booking.startAt.toDate === "function"
    ? localDateKey(booking.startAt.toDate())
    : "";
}

async function ensureNoBookingForDate(
  uid: string,
  dateKey: string,
  replacingBookingId?: string,
) {
  // Disabled: allow multiple sessions per day
}

async function hasDailyBooking(
  transaction: Transaction,
  dailyRef: ReturnType<typeof doc>,
  replacingBookingId?: string,
): Promise<boolean> {
  const dailySnapshot = await transaction.get(dailyRef);
  if (!dailySnapshot.exists()) return false;

  const linkedBookingId = dailySnapshot.data().bookingId;
  if (typeof linkedBookingId !== "string") return true;
  if (linkedBookingId === replacingBookingId) return false;

  const linkedBooking = await transaction.get(doc(db, "bookings", linkedBookingId));
  if (!linkedBooking.exists()) return false;
  const status = linkedBooking.data().status;
  return status !== "cancelled" && status !== "declined";
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  );
}

async function hasActiveSlotReservation(
  transaction: Transaction,
  slot: DocumentData,
): Promise<boolean> {
  if (slot.isBooked !== true && slot.status !== "booked") return false;
  if (typeof slot.bookingId !== "string") return true;

  try {
    const bookingSnapshot = await transaction.get(doc(db, "bookings", slot.bookingId));
    if (!bookingSnapshot.exists()) return false;

    const booking = bookingSnapshot.data();
    if (!ACTIVE_STATUSES.includes(booking.status)) return false;

    const endAt =
      booking.endAt && typeof booking.endAt.toMillis === "function"
        ? booking.endAt.toMillis()
        : null;
    return endAt === null || endAt > Date.now();
  } catch (error) {
    if (isPermissionDenied(error)) return true;
    throw error;
  }
}

// ---------- STUDENT ----------

async function prepareBookingData(
  profile: UserProfile,
  input: BookingInput,
) {
  requireSlotId(input);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateKey)) {
    throw new BookingError("Choose a valid booking date.");
  }
  const startAtMillis = input.startAt.getTime();
  const endAtMillis = input.endAt.getTime();
  if (!Number.isFinite(startAtMillis) || !Number.isFinite(endAtMillis)) {
    throw new BookingError("Choose a valid booking date and time.");
  }
  if (startAtMillis <= Date.now()) {
    throw new BookingError("Pick a time in the future.");
  }
  if (endAtMillis <= startAtMillis) {
    throw new BookingError("The session must end after it starts.");
  }
  let notes = input.notes?.trim();
  if (input.isAnonymous) {
    notes = notes ? "ANONYMOUS: " + notes : "ANONYMOUS_BOOKING";
  }
  if (notes && notes.length > BOOKING_NOTES_MAX) {
    throw new BookingError(`Keep your note under ${BOOKING_NOTES_MAX} characters.`);
  }

  return {
    studentId: profile.uid,
    counsellorId: input.counsellorId,
    studentAnonId: profile.anonId, // The rules check this matches the profile
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    dateKey: input.dateKey,
    sessionType: input.sessionType,
    slotId: input.slotId,
    
    status: "pending",
    // Optional fields are left out entirely rather than written as null
    ...(notes ? { notes } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function validateAvailableSlot(
  slot: Record<string, unknown> | undefined,
  input: BookingInput,
  hasActiveReservation: boolean,
) {
  if (!slot) {
    throw new BookingError("This availability is no longer available. Please choose another time.");
  }

  const slotStart = slot.startAt instanceof Timestamp ? slot.startAt.toMillis() : NaN;
  const slotEnd = slot.endAt instanceof Timestamp ? slot.endAt.toMillis() : NaN;
  if (
    input.startAt.getTime() <= Date.now() ||
    slot.counsellorId !== input.counsellorId ||
    slot.dateKey !== input.dateKey ||
    hasActiveReservation ||
    slot.isHeld === true ||
    slot.status === "held" ||
    slot.status === "closed" ||
    slotStart !== input.startAt.getTime() ||
    slotEnd !== input.endAt.getTime()
  ) {
    throw new BookingError("This availability is no longer available. Please choose another time.");
  }
  if (!Array.isArray(slot.sessionTypes) || !slot.sessionTypes.includes(input.sessionType)) {
    throw new BookingError("That session type is not offered for this availability.");
  }
}

// New booking, always "pending" until the counsellor confirms it
export async function createBooking(profile: UserProfile, input: BookingInput) {
  const slotId = requireSlotId(input);
  const bookingRef = doc(collection(db, "bookings"));
  const bookingData = await prepareBookingData(profile, input);
  await ensureNoBookingForDate(profile.uid, input.dateKey);
  const slotRef = doc(db, "slots", slotId);
  const dailyRef = doc(db, "studentDailyBookings", profile.uid, "dates", input.dateKey);

  await runTransaction(db, async (transaction) => {
    const slotSnapshot = await transaction.get(slotRef);
    const hasExistingDailyBooking = await hasDailyBooking(transaction, dailyRef);
    const slotData = slotSnapshot.exists() ? slotSnapshot.data() : undefined;
    const hasActiveReservation = slotData
      ? await hasActiveSlotReservation(transaction, slotData)
      : false;
    validateAvailableSlot(slotData, input, hasActiveReservation);
    // if (hasExistingDailyBooking) throw new BookingError("You can book only one session per day...");
    transaction.update(slotRef, { isBooked: true, bookingId: bookingRef.id });
    transaction.set(bookingRef, bookingData);
    transaction.set(dailyRef, {
      studentId: profile.uid,
      dateKey: input.dateKey,
      bookingId: bookingRef.id,
      updatedAt: serverTimestamp(),
    });
  });
  return bookingRef.id;
}

// Cancel the old appointment and submit its replacement request together.
export async function rescheduleBooking(
  profile: UserProfile,
  input: BookingInput,
  previousBookingId: string,
) {
  const newSlotId = requireSlotId(input);
  const previousBookingRef = doc(db, "bookings", previousBookingId);
  const newBookingData = await prepareBookingData(profile, input);
  await ensureNoBookingForDate(profile.uid, input.dateKey, previousBookingId);
  const newBookingRef = doc(collection(db, "bookings"));
  const dailyRef = doc(db, "studentDailyBookings", profile.uid, "dates", input.dateKey);

  await runTransaction(db, async (transaction) => {
    const previousBookingSnapshot = await transaction.get(previousBookingRef);
    if (!previousBookingSnapshot.exists()) {
      throw new BookingError("The session you selected to reschedule could not be found.");
    }

    const previousBooking = toBooking(
      previousBookingSnapshot.id,
      previousBookingSnapshot.data(),
    );
    if (previousBooking.studentId !== profile.uid) {
      throw new BookingError("You can only reschedule your own sessions.");
    }
    if (previousBooking.counsellorId !== input.counsellorId) {
      throw new BookingError("Choose a new time with the same counsellor.");
    }
    if (previousBooking.status !== "confirmed") {
      throw new BookingError("This session can no longer be rescheduled.");
    }

    const newSlotRef = doc(db, "slots", newSlotId);
    const newSlotSnapshot = await transaction.get(newSlotRef);
    const hasExistingDailyBooking = await hasDailyBooking(
      transaction,
      dailyRef,
      previousBookingId,
    );
    const newSlotData = newSlotSnapshot.exists() ? newSlotSnapshot.data() : undefined;
    const hasActiveReservation = newSlotData
      ? await hasActiveSlotReservation(transaction, newSlotData)
      : false;
    validateAvailableSlot(newSlotData, input, hasActiveReservation);
    // if (hasExistingDailyBooking) throw new BookingError("You can book only one session per day...");

    const previousSlotRef = previousBooking.slotId
      ? doc(db, "slots", previousBooking.slotId)
      : null;
    const previousSlotSnapshot =
      previousSlotRef && previousSlotRef.path !== newSlotRef.path
        ? await transaction.get(previousSlotRef)
        : null;

    transaction.update(previousBookingRef, {
      status: "cancelled",
      cancelledBy: "student",
      cancelReason: "Rescheduled by student",
      updatedAt: serverTimestamp(),
    });
    transaction.set(newBookingRef, newBookingData);
    transaction.update(newSlotRef, { isBooked: true, bookingId: newBookingRef.id });
    transaction.set(dailyRef, {
      studentId: profile.uid,
      dateKey: input.dateKey,
      bookingId: newBookingRef.id,
      updatedAt: serverTimestamp(),
    });

    if (
      previousSlotRef &&
      previousSlotSnapshot?.exists() &&
      previousSlotSnapshot.data().bookingId === previousBooking.id
    ) {
      transaction.update(previousSlotRef, {
        isBooked: false,
        bookingId: null,
        status: "open",
      });
    }
  });
  return newBookingRef.id;
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
  const bookingRef = doc(db, "bookings", booking.id);
  const cancellation = {
    status: "cancelled",
    cancelledBy: "student",
    ...(cancelReason ? { cancelReason } : {}),
    updatedAt: serverTimestamp(),
  };

  try {
    await runTransaction(db, async (transaction) => {
      const bookingSnapshot = await transaction.get(bookingRef);
      if (!bookingSnapshot.exists()) {
        throw new BookingError("This booking could not be found.");
      }
      const currentBooking = toBooking(bookingSnapshot.id, bookingSnapshot.data());
      if (!STUDENT_TRANSITIONS[currentBooking.status]?.includes("cancelled")) {
        throw new BookingError("This booking can't be cancelled any more.");
      }

      const slotRef = currentBooking.slotId
        ? doc(db, "slots", currentBooking.slotId)
        : null;
      const slotSnapshot = slotRef ? await transaction.get(slotRef) : null;

      transaction.update(bookingRef, cancellation);
      if (
        slotRef &&
        slotSnapshot?.exists() &&
        slotSnapshot.data().bookingId === currentBooking.id
      ) {
        transaction.update(slotRef, {
          isBooked: false,
          bookingId: null,
          status: "open",
        });
      }
    });
  } catch (error) {
    if (!isPermissionDenied(error)) throw error;
    await updateDoc(bookingRef, cancellation);
  }
}

export async function deleteCancelledBooking(studentUid: string, booking: Booking) {
  if (booking.studentId !== studentUid) {
    throw new BookingError("You can only delete your own bookings.");
  }
  if (booking.status !== "cancelled" && booking.status !== "declined") {
    throw new BookingError("Only cancelled or declined bookings can be deleted.");
  }

  await deleteDoc(doc(db, "bookings", booking.id));
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
 * A pending booking already reserves its slot. Confirming also, in the same batch:
 *   - creates the careLink counsellor_student, unless one already exists.
 *   - cancels the original confirmed booking when accepting a reschedule request.
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
      ...(status === "cancelled" ? { cancelledBy: "counsellor" as const } : {}),
      ...(cancelReason ? { cancelReason } : {}),
      ...(status === "completed" || status === "cancelled" ? { meetingLink: deleteField() } : {}),
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

    if (booking.rescheduledFrom) {
      const previousBookingRef = doc(db, "bookings", booking.rescheduledFrom);
      const previousBookingSnapshot = await getDoc(previousBookingRef);
      if (previousBookingSnapshot.exists()) {
        const previousBooking = toBooking(
          previousBookingSnapshot.id,
          previousBookingSnapshot.data(),
        );
        if (
          previousBooking.studentId !== booking.studentId ||
          previousBooking.counsellorId !== counsellorUid
        ) {
          throw new BookingError("The original session does not match this reschedule request.");
        }

        if (previousBooking.status === "confirmed") {
          batch.update(previousBookingRef, {
            status: "cancelled",
            cancelledBy: "counsellor",
            cancelReason: "Replaced by an accepted reschedule request",
            updatedAt: serverTimestamp(),
          });

          if (previousBooking.slotId) {
            const previousSlotRef = doc(db, "slots", previousBooking.slotId);
            const previousSlot = await getDoc(previousSlotRef);
            if (previousSlot.exists() && previousSlot.data().bookingId === previousBooking.id) {
              batch.update(previousSlotRef, {
                isBooked: false,
                bookingId: null,
                status: "open",
              });
            }
          }
        }
      }
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

  if ((status === "cancelled" || status === "declined") && slotRef) {
    const slot = await getDoc(slotRef);
    if (slot.exists() && slot.data().bookingId === booking.id) {
      batch.update(slotRef, { isBooked: false, bookingId: null, status: "open" });
    }
  }

  await batch.commit();
}

export async function getBooking(id: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, "bookings", id));
  if (!snap.exists()) return null;
  return toBooking(snap.id, snap.data());
}
