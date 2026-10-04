// Admin panel - Viduth (Member 1). Supports FR01, FR03, FR06, NFR01.
//
// Admins only touch users, counsellors, resources and demo stats. They must
// never read checkins, bookings, careLinks, chats or messages (NFR01) - do not
// add those here.

import { db } from "@/firebase/config";
import { isStaffRequest, Role, StaffRole, UserProfile } from "@/services/authService";
import { setCachedCounsellorPhoto } from "@/services/counsellorPhotoService";
import type { CounsellorInput, CounsellorProfile, PhotoChange } from "@/types/counsellor";
import type { Resource, ResourceInput } from "@/types/resource";
import type { WeekStats } from "@/types/stats";
import { recentWeeks } from "@/utils/week";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

// Roles an admin can hand out. "admin" itself is only set in the Firebase console.
export type AssignableRole = Exclude<Role, "admin">;

// ---------- USERS ----------

export async function listUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));
}

// Changes only the role field; nothing else on the profile is touched.
// hideCounsellorProfile: when a counsellor gets another role, their
// counsellors/{uid} profile is switched off in the same batch, so either both
// changes happen or neither does and students can't book them any more.
export async function updateUserRole(
  uid: string,
  role: AssignableRole,
  { hideCounsellorProfile = false }: { hideCounsellorProfile?: boolean } = {},
) {
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), { role });
  if (hideCounsellorProfile) {
    batch.update(doc(db, "counsellors", uid), {
      isAvailable: false,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

// ---------- STAFF REQUESTS ----------

// Staff sign-ups waiting for a decision, oldest first
export const pendingStaffRequests = (users: UserProfile[]) =>
  users
    .filter((u) => isStaffRequest(u) && u.approvalStatus === "pending" && !!u.requestedRole)
    .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));

// Approve: role becomes the requested role and both request fields go, in one
// update (the rules accept nothing else). A new counsellor still needs a
// counsellors/{uid} profile before students can book them.
export async function approveStaffRequest(uid: string, requestedRole: StaffRole) {
  await updateDoc(doc(db, "users", uid), {
    role: requestedRole,
    requestedRole: deleteField(),
    approvalStatus: deleteField(),
  });
}

// Reject: only approvalStatus changes; the role stays "student" and the
// person sees a calm "not approved" screen
export async function rejectStaffRequest(uid: string) {
  await updateDoc(doc(db, "users", uid), { approvalStatus: "rejected" });
}

// ---------- COUNSELLORS ----------

export async function listCounsellors(): Promise<CounsellorProfile[]> {
  const snap = await getDocs(collection(db, "counsellors"));
  return snap.docs
    .map((d) => ({ ...(d.data() as CounsellorProfile), uid: d.id }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

// Photo changes ride in the same batch as the profile, so both save or neither
function addPhotoChange(batch: ReturnType<typeof writeBatch>, uid: string, photo: PhotoChange) {
  if (photo === undefined) return;
  const ref = doc(db, "counsellorPhotos", uid);
  if (photo === null) batch.delete(ref);
  else batch.set(ref, { photo, updatedAt: serverTimestamp() });
}

// Doc id = the counsellor's uid, which the security rules check
export async function createCounsellor(input: CounsellorInput, photo?: PhotoChange) {
  const batch = writeBatch(db);
  batch.set(doc(db, "counsellors", input.uid), {
    ...input,
    updatedAt: serverTimestamp(),
  });
  addPhotoChange(batch, input.uid, photo);
  await batch.commit();
  if (photo !== undefined) setCachedCounsellorPhoto(input.uid, photo);
}

export async function updateCounsellor(
  uid: string,
  changes: Partial<Omit<CounsellorInput, "uid">>,
  photo?: PhotoChange,
) {
  const batch = writeBatch(db);
  batch.update(doc(db, "counsellors", uid), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
  addPhotoChange(batch, uid, photo);
  await batch.commit();
  if (photo !== undefined) setCachedCounsellorPhoto(uid, photo);
}

// Removes the profile and its photo together
export async function deleteCounsellor(uid: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "counsellors", uid));
  batch.delete(doc(db, "counsellorPhotos", uid)); // Fine if there was none
  await batch.commit();
  setCachedCounsellorPhoto(uid, null);
}

// ---------- RESOURCES ----------

export async function listResources(): Promise<Resource[]> {
  const snap = await getDocs(collection(db, "resources"));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Resource, "id">), id: d.id }))
    .sort(
      (a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0),
    );
}

export async function createResource(input: ResourceInput) {
  await addDoc(collection(db, "resources"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateResource(id: string, changes: Partial<ResourceInput>) {
  await updateDoc(doc(db, "resources", id), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteResource(id: string) {
  await deleteDoc(doc(db, "resources", id));
}

// Four published sample items so the student screens have real data to show
const STARTER_RESOURCES: ResourceInput[] = [
  {
    title: "Box breathing",
    type: "exercise",
    categories: ["Breathing", "Stress"],
    durationMinutes: 3,
    summary: "A simple 4-4-4-4 breathing pattern to calm your body when stress builds up.",
    content: [
      "Sit comfortably and relax your shoulders.",
      "Breathe in slowly through your nose for 4 seconds.",
      "Hold your breath for 4 seconds.",
      "Breathe out slowly through your mouth for 4 seconds.",
      "Hold again for 4 seconds.",
      "Repeat for 4 rounds, or until you feel calmer.",
    ].join("\n"),
    isPublished: true,
  },
  {
    title: "4-7-8 breathing",
    type: "exercise",
    categories: ["Breathing", "Sleep", "Anxiety"],
    durationMinutes: 2,
    summary: "A slow breathing rhythm that can help you unwind before sleep.",
    content: [
      "Sit or lie down and rest the tip of your tongue behind your top teeth.",
      "Breathe out fully through your mouth.",
      "Breathe in quietly through your nose for 4 seconds.",
      "Hold your breath for 7 seconds.",
      "Breathe out through your mouth for 8 seconds.",
      "Repeat 4 times. Stop if you feel light-headed.",
    ].join("\n"),
    isPublished: true,
  },
  {
    title: "Coping with exam stress",
    type: "article",
    categories: ["Exam Stress", "Stress"],
    durationMinutes: 5,
    summary: "Practical ways to study, rest and stay steady during exam weeks.",
    content: [
      "Feeling stressed before exams is normal. A little pressure can help you focus, but too much makes it harder to think clearly.",
      "Break revision into short blocks of 25 to 45 minutes with a real break in between. Plan which topic each block is for.",
      "Keep sleep, food and movement steady. All-nighters usually cost more marks than they win.",
      "When worry spirals, write it down and name one small next step. Then do just that step.",
      "If stress is affecting your sleep, appetite or mood for more than a couple of weeks, book a session with a counsellor. You don't need to wait until it feels serious.",
    ].join("\n\n"),
    isPublished: true,
  },
  {
    title: "Sleep tips for students",
    type: "article",
    categories: ["Sleep"],
    durationMinutes: 4,
    summary: "Small habits that make it easier to fall asleep and wake up rested.",
    content: [
      "Try to go to bed and wake up at about the same time every day, including weekends.",
      "Put your phone away 30 minutes before bed, or at least turn the brightness down.",
      "Avoid caffeine in the late afternoon and evening.",
      "If you can't sleep after about 20 minutes, get up and do something calm in dim light, then try again.",
      "Keep your room cool, dark and quiet if you can.",
    ].join("\n\n"),
    isPublished: true,
  },
];

export async function loadStarterResources() {
  const batch = writeBatch(db);
  for (const resource of STARTER_RESOURCES) {
    batch.set(doc(collection(db, "resources")), {
      ...resource,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

// ---------- DEMO STATS (lecturer charts) ----------

// Sample mood counts [mood1..mood5] for the 8 weeks before this one, oldest
// first. Includes an exam-season dip and one quiet week under the privacy
// threshold so every lecturer state can be demoed.
const DEMO_WEEKS: [number, number, number, number, number][] = [
  [1, 3, 8, 9, 4],
  [1, 4, 9, 8, 3],
  [2, 5, 10, 7, 3],
  [0, 1, 1, 1, 0], // Only 3 check-ins: shows "Not enough responses"
  [3, 7, 11, 6, 2],
  [4, 8, 10, 5, 1],
  [2, 6, 9, 8, 3],
  [1, 3, 8, 10, 5],
];

// Writes demo stats for the 8 weeks BEFORE the current one, skipping any week
// that already has a doc (real data is never overwritten). The current week is
// left alone so real student check-ins keep working. Returns weeks written.
export async function loadDemoStats() {
  const weeks = recentWeeks(DEMO_WEEKS.length + 1).slice(0, -1);
  const existing = await Promise.all(weeks.map((w) => getDoc(doc(db, "stats", w.id))));
  const batch = writeBatch(db);
  let written = 0;
  weeks.forEach((week, i) => {
    if (existing[i].exists()) return;
    const [m1, m2, m3, m4, m5] = DEMO_WEEKS[i];
    const data: Required<WeekStats> = {
      weekStart: week.weekStart,
      total: m1 + m2 + m3 + m4 + m5,
      mood1: m1,
      mood2: m2,
      mood3: m3,
      mood4: m4,
      mood5: m5,
      demo: true,
    };
    batch.set(doc(db, "stats", week.id), data);
    written += 1;
  });
  if (written) await batch.commit();
  return written;
}

// Deletes demo weeks only (the rules refuse to delete real stats). Returns weeks removed.
export async function removeDemoStats() {
  const weeks = recentWeeks(DEMO_WEEKS.length + 1);
  const snaps = await Promise.all(weeks.map((w) => getDoc(doc(db, "stats", w.id))));
  const demo = snaps.filter((s) => s.exists() && s.data().demo === true);
  if (!demo.length) return 0;
  const batch = writeBatch(db);
  demo.forEach((s) => batch.delete(s.ref));
  await batch.commit();
  return demo.length;
}

// ---------- OVERVIEW ----------

export type AdminStats = {
  students: number; // Registered students (not guests, not staff requests)
  staffRequests: number; // Pending staff sign-ups waiting for approval
  guests: number;
  counsellors: number;
  lecturers: number;
  counsellorsWithoutProfile: UserProfile[];
  publishedResources: number;
  recentSignUps: UserProfile[]; // Newest 5
};

// Built only from users, counsellors and resources
export function computeStats(
  users: UserProfile[],
  counsellors: CounsellorProfile[],
  resources: Resource[],
): AdminStats {
  const profileIds = new Set(counsellors.map((c) => c.uid));
  const counsellorUsers = users.filter((u) => u.role === "counsellor");
  return {
    students: users.filter((u) => u.role === "student" && !u.isGuest && !isStaffRequest(u))
      .length,
    staffRequests: pendingStaffRequests(users).length,
    guests: users.filter((u) => u.isGuest).length,
    counsellors: counsellorUsers.length,
    lecturers: users.filter((u) => u.role === "lecturer").length,
    counsellorsWithoutProfile: counsellorUsers.filter((u) => !profileIds.has(u.uid)),
    publishedResources: resources.filter((r) => r.isPublished).length,
    recentSignUps: [...users]
      .sort(
        (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
      )
      .slice(0, 5),
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const [users, counsellors, resources] = await Promise.all([
    listUsers(),
    listCounsellors(),
    listResources(),
  ]);
  return computeStats(users, counsellors, resources);
}
