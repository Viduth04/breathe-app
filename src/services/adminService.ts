// Admin panel - Viduth (Member 1). Supports FR01, FR03, FR06, NFR01.
//
// Admins only touch users, counsellors and resources. They must never read
// checkins, bookings, careLinks, chats or messages (NFR01) - do not add those here.

import { db } from "@/firebase/config";
import { Role, UserProfile } from "@/services/authService";
import type { CounsellorInput, CounsellorProfile } from "@/types/counsellor";
import type { Resource, ResourceInput } from "@/types/resource";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

// ---------- COUNSELLORS ----------

export async function listCounsellors(): Promise<CounsellorProfile[]> {
  const snap = await getDocs(collection(db, "counsellors"));
  return snap.docs
    .map((d) => ({ ...(d.data() as CounsellorProfile), uid: d.id }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

// Doc id = the counsellor's uid, which the security rules check
export async function createCounsellor(input: CounsellorInput) {
  await setDoc(doc(db, "counsellors", input.uid), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function updateCounsellor(
  uid: string,
  changes: Partial<Omit<CounsellorInput, "uid">>,
) {
  await updateDoc(doc(db, "counsellors", uid), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCounsellor(uid: string) {
  await deleteDoc(doc(db, "counsellors", uid));
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

// ---------- OVERVIEW ----------

export type AdminStats = {
  students: number; // Registered students (not guests)
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
    students: users.filter((u) => u.role === "student" && !u.isGuest).length,
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
