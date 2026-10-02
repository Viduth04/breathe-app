// Mood check-in - Ishara (Member 2). FR02, NFR03.
//
// Students read and write only their own checkins/ docs (see firestore.rules).
// Admins and lecturers never touch this collection (NFR01).

import { db } from "@/firebase/config";
import { recordAnonymousMoodStat } from "@/services/statsService";
import type { CheckIn, CheckInInput } from "@/types/checkin";
import { dateKey } from "@/utils/week";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// Offline writes never resolve until the server answers, so give up after this
// and let the student try again (their input stays on screen)
const SAVE_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject({ code: "unavailable" }), // Same message as Firestore offline
      SAVE_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// One doc per student per day, so retries and edits can't create duplicates
const checkinId = (uid: string, day: string) => `${uid}_${day}`;

const clean = (input: CheckInInput): CheckInInput => ({
  mood: input.mood,
  factors: [...input.factors],
  note: input.note.trim(),
});

// ---------- READ ----------

// Today's check-in, or null if there isn't one yet. A query (not getDoc)
// because the rules deny reading a doc that doesn't exist.
export async function getTodayCheckin(uid: string): Promise<CheckIn | null> {
  const snap = await getDocs(
    query(
      collection(db, "checkins"),
      where("userId", "==", uid),
      where("dateKey", "==", dateKey(new Date())),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...(d.data() as Omit<CheckIn, "id">), id: d.id };
}

// ---------- CREATE ----------

export async function createCheckin(
  uid: string,
  input: CheckInInput,
): Promise<CheckIn> {
  const day = dateKey(new Date());
  const data = { ...clean(input), userId: uid, dateKey: day };
  const id = checkinId(uid, day);
  await withTimeout(
    setDoc(doc(db, "checkins", id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  // Anonymous weekly total for lecturers; only after the check-in is saved,
  // and never blocks the student if it fails
  recordAnonymousMoodStat(data.mood).catch(() => {});
  return { ...data, id };
}

// ---------- UPDATE ----------

// Edits today's entry. Not counted again in the weekly stats.
export async function updateCheckin(
  existing: CheckIn,
  input: CheckInInput,
): Promise<CheckIn> {
  const data = clean(input);
  await withTimeout(
    updateDoc(doc(db, "checkins", existing.id), {
      ...data,
      updatedAt: serverTimestamp(),
    }),
  );
  return { ...existing, ...data };
}
