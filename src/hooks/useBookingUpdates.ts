// Home notification bell - restores the notifications Minhaj (Member 3) added
// for students, as a panel on Home. Supports FR05, FR08, NFR01.
//
// Live booking updates for the signed-in student (confirmed, declined,
// cancelled), newest first, from bookings where studentId == uid (the same
// query the rules already allow for listMyBookings). Nothing new is written to
// Firestore: "last seen" lives on this device in AsyncStorage, per uid.

import { subscribeToMyBookings } from "@/services/bookingService";
import { getCounsellorName } from "@/services/homeService";
import type { Booking, BookingStatus } from "@/types/booking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const UPDATE_STATUSES = ["confirmed", "declined", "cancelled"] as const;
export type UpdateStatus = (typeof UPDATE_STATUSES)[number];

export type BookingUpdate = {
  id: string; // Booking id
  status: UpdateStatus;
  counsellorName?: string; // Missing until the counsellor profile has loaded
  startAt: Date;
  updatedAt: Date;
};

// Shown when a booking is confirmed or declined while the app is open
export type BookingBanner = { status: "confirmed" | "declined"; bookingId: string };

const lastSeenKey = (uid: string) => `breathe-notifications-last-seen-v1:${uid}`;

const isUpdate = (status: BookingStatus): status is UpdateStatus =>
  (UPDATE_STATUSES as readonly BookingStatus[]).includes(status);

// When the booking last changed (createdAt while a server timestamp is pending)
const changedAt = (b: Booking) => (b.updatedAt ?? b.createdAt)?.toDate() ?? new Date();

export function useBookingUpdates(uid: string | undefined) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null); // null = not read yet
  const [banner, setBanner] = useState<BookingBanner | null>(null);
  // Bookings this device changed itself (a student's own cancel isn't news)
  const [ownIds, setOwnIds] = useState<Set<string>>(new Set());
  const requestedNames = useRef(new Set<string>());

  // Last time the panel was opened on this device, for this student
  useEffect(() => {
    setLastSeenAt(null);
    if (!uid) return;
    let active = true;
    AsyncStorage.getItem(lastSeenKey(uid))
      .then((value) => active && setLastSeenAt(Number(value) || 0))
      .catch(() => active && setLastSeenAt(0));
    return () => {
      active = false;
    };
  }, [uid]);

  // Live bookings; a status that changes to confirmed/declined raises a banner
  useEffect(() => {
    setBookings(null);
    setError(false);
    setBanner(null);
    setOwnIds(new Set());
    if (!uid) return;

    let previous: Map<string, BookingStatus> | null = null; // null = first snapshot
    return subscribeToMyBookings(
      uid,
      (list, local) => {
        setError(false);
        setBookings(list);
        if (local.size) setOwnIds((ids) => new Set([...ids, ...local]));

        if (previous) {
          const changed = list
            .filter((b) => {
              const before = previous!.get(b.id);
              return (
                before !== undefined &&
                before !== b.status &&
                (b.status === "confirmed" || b.status === "declined") &&
                !local.has(b.id)
              );
            })
            .sort((a, b) => changedAt(b).getTime() - changedAt(a).getTime())[0];
          if (changed) {
            setBanner({ status: changed.status as BookingBanner["status"], bookingId: changed.id });
          }
        }
        previous = new Map(list.map((b) => [b.id, b.status]));
      },
      (e) => {
        console.warn("Booking updates failed to load", e);
        setError(true);
      },
    );
  }, [uid]);

  // Counsellor names, fetched once per counsellor
  useEffect(() => {
    bookings?.forEach(({ counsellorId }) => {
      if (requestedNames.current.has(counsellorId)) return;
      requestedNames.current.add(counsellorId);
      getCounsellorName(counsellorId)
        .catch(() => "Your counsellor")
        .then((name) => setNames((n) => ({ ...n, [counsellorId]: name })));
    });
  }, [bookings]);

  const updates = useMemo<BookingUpdate[]>(
    () =>
      (bookings ?? [])
        .filter((b) => isUpdate(b.status))
        .map((b) => ({
          id: b.id,
          status: b.status as UpdateStatus,
          counsellorName: names[b.counsellorId],
          startAt: b.startAt.toDate(),
          updatedAt: changedAt(b),
        }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [bookings, names],
  );

  const isUnread = useCallback(
    (u: BookingUpdate) =>
      lastSeenAt !== null && u.updatedAt.getTime() > lastSeenAt && !ownIds.has(u.id),
    [lastSeenAt, ownIds],
  );
  const unread = updates.filter(isUnread).length;

  // Opening the panel: everything shown so far counts as seen
  const markSeen = useCallback(() => {
    if (!uid) return;
    // Server time can be ahead of this device's clock, so never go below the newest update
    const seen = Math.max(Date.now(), updates[0]?.updatedAt.getTime() ?? 0);
    setLastSeenAt(seen);
    setBanner(null);
    AsyncStorage.setItem(lastSeenKey(uid), String(seen)).catch(() => {});
  }, [uid, updates]);

  return {
    updates,
    loading: bookings === null && !error,
    error,
    unread,
    isUnread,
    markSeen,
    banner,
    dismissBanner: useCallback(() => setBanner(null), []),
  };
}

// ---------- Text ----------

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Sri Lanka is UTC+05:30 all year (no daylight saving), like the rest of the
// app's Asia/Colombo times. Done by hand so it doesn't depend on Intl support.
const COLOMBO_OFFSET_MS = 330 * 60 * 1000;

// "Tue 7 Oct, 10:00 AM"
export function sessionWhen(date: Date) {
  const c = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  const hours = c.getUTCHours();
  const minutes = String(c.getUTCMinutes()).padStart(2, "0");
  return `${DAYS[c.getUTCDay()]} ${c.getUTCDate()} ${MONTHS[c.getUTCMonth()]}, ${hours % 12 || 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
}

const STATUS_TEXT: Record<UpdateStatus, { title: string; verb: string }> = {
  confirmed: { title: "Session confirmed", verb: "is confirmed" },
  declined: { title: "Session declined", verb: "was declined" },
  cancelled: { title: "Session cancelled", verb: "was cancelled" },
};

export const updateTitle = (u: BookingUpdate) => STATUS_TEXT[u.status].title;

// "Your session with Dr Anjali Perera on Tue 7 Oct, 10:00 AM is confirmed"
export function updateMessage(u: BookingUpdate) {
  const name = u.counsellorName && u.counsellorName !== "Your counsellor"
    ? u.counsellorName
    : "your counsellor";
  return `Your session with ${name} on ${sessionWhen(u.startAt)} ${STATUS_TEXT[u.status].verb}`;
}

// "Just now", "5 min ago", "2 hours ago", "Yesterday", "3 days ago", "Tue 7 Oct, 10:00 AM"
export function timeAgo(date: Date, now = Date.now()) {
  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return sessionWhen(date);
}

// Calm, neutral banner text: no counsellor name or details on screen
export const BANNER_TEXT: Record<BookingBanner["status"], string> = {
  confirmed: "Your session request has been confirmed.",
  declined: "There's an update on your session request.",
};
