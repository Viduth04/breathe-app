// Admin panel - Viduth (Member 1). Supports FR01, NFR01.
//
// Admins only touch the users collection. They must never read checkins,
// bookings, chats or messages (NFR01) - do not add those here.

import { db } from "@/firebase/config";
import { Role, UserProfile } from "@/services/authService";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

// Roles an admin can hand out. "admin" itself is only set in the Firebase console.
export type AssignableRole = Exclude<Role, "admin">;

// ---------- READ ----------

export async function listUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));
}

// ---------- UPDATE ----------

// Changes only the role field; nothing else on the profile is touched
export async function updateUserRole(uid: string, role: AssignableRole) {
  await updateDoc(doc(db, "users", uid), { role });
}
