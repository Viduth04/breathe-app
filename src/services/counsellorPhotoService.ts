// Counsellor photos - Viduth (Member 1). Supports FR03, NFR01.
//
// Read side of counsellorPhotos/{uid} (any signed-in user may read). Writes
// are admin-only and live in adminService. Cached per app session so a list
// of avatars reads each photo once; after a save or remove the cache is
// updated and every mounted avatar for that counsellor is told straight away.

import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

const cache = new Map<string, Promise<string | null>>();
const listeners = new Map<string, Set<(photo: string | null) => void>>();

// The counsellor's photo data URL, or null if they don't have one
export function getCounsellorPhoto(uid: string): Promise<string | null> {
  let pending = cache.get(uid);
  if (!pending) {
    pending = getDoc(doc(db, "counsellorPhotos", uid))
      .then((snap) => (snap.exists() ? (snap.data().photo as string) : null))
      .catch((e) => {
        cache.delete(uid); // Try again next time (e.g. was offline)
        console.warn("Loading counsellor photo failed", e);
        return null;
      });
    cache.set(uid, pending);
  }
  return pending;
}

// Called whenever this counsellor's photo changes. Returns the unsubscribe.
export function subscribeToCounsellorPhoto(
  uid: string,
  listener: (photo: string | null) => void,
) {
  let set = listeners.get(uid);
  if (!set) listeners.set(uid, (set = new Set()));
  set.add(listener);
  return () => {
    set.delete(listener);
    if (!set.size) listeners.delete(uid);
  };
}

// After a photo is saved (data URL) or removed (null): update the cache and
// every mounted avatar for this counsellor
export function setCachedCounsellorPhoto(uid: string, photo: string | null) {
  cache.set(uid, Promise.resolve(photo));
  listeners.get(uid)?.forEach((listener) => listener(photo));
}
