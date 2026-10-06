// Counsellor Firebase Configuration & Environment Adapter - Muaath (Member 4).
// Provides validated references to Firebase Auth, Firestore, and Realtime Database (RTDB),
// role validation for admin-provisioned counselor accounts, and path constants.

import { auth, db, rtdb, storage } from "@/firebase/config";
import { User, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const FIRESTORE_COLLECTIONS = {
  COUNSELORS: "counsellors",
  COUNSELLOR_PHOTOS: "counsellorPhotos",
  REQUESTS: "requests",
  SESSIONS: "sessions",
  CLINICAL_NOTES: "clinicalNotes",
  CONVERSATIONS: "conversations",
  NOTIFICATIONS: "notifications",
  COUNSELOR_PREFERENCES: "counselorPreferences",
  COUNSELOR_AVAILABILITY: "counselorAvailability",
  BOOKINGS: "bookings",
  SLOTS: "slots",
} as const;

export const RTDB_PATHS = {
  STATUS: "status",
  TYPING: "typing",
  CALLS: "calls",
} as const;

/**
 * Checks whether the environment contains the required Firebase credentials.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  );
}

/**
 * Checks whether Realtime Database is explicitly configured.
 */
export function isRtdbConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL &&
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL.length > 0
  );
}

export interface CounselorAuthIdentity {
  uid: string;
  email: string | null;
  role: string | null;
  isCounselor: boolean;
}

/**
 * Inspects the current Firebase user token and Firestore profile to validate the counselor role.
 */
export async function getCounselorAuthIdentity(
  currentUser?: User | null
): Promise<CounselorAuthIdentity | null> {
  const targetUser = currentUser ?? auth.currentUser;
  if (!targetUser) {
    return null;
  }

  try {
    const tokenResult = await getIdTokenResult(targetUser);
    const roleClaim = (tokenResult.claims.role as string) || null;

    let userRole: string | null = null;
    try {
      const userDocSnap = await getDoc(doc(db, "users", targetUser.uid));
      if (userDocSnap.exists()) {
        userRole = userDocSnap.data()?.role as string;
      }
    } catch (_) {}

    const effectiveRole = roleClaim || userRole;
    const isCounselor =
      effectiveRole === "counsellor" ||
      effectiveRole === "counselor" ||
      effectiveRole === "admin";

    return {
      uid: targetUser.uid,
      email: targetUser.email,
      role: effectiveRole,
      isCounselor,
    };
  } catch (error) {
    return {
      uid: targetUser.uid,
      email: targetUser.email,
      role: null,
      isCounselor: false,
    };
  }
}

export { auth, db, rtdb, storage };
