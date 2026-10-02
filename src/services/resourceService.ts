// Lecturer insights - Viduth (Member 1). Supports FR06.
//
// Read-only access to PUBLISHED resources for anyone who isn't an admin
// (lecturers now; Ishara can reuse this for the student screens).
// The where("isPublished", "==", true) filter is required by the security
// rules - without it Firestore rejects the whole query.

import { db } from "@/firebase/config";
import type { Resource } from "@/types/resource";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

export async function listPublishedResources(): Promise<Resource[]> {
  const snap = await getDocs(
    query(collection(db, "resources"), where("isPublished", "==", true)),
  );
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Resource, "id">), id: d.id }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

// Self-help resources - Ishara (Member 2). FR06.
// One published resource, or null. The rules deny reading drafts and missing
// docs, so for non-admins permission-denied means "not available".
export async function getPublishedResource(id: string): Promise<Resource | null> {
  try {
    const snap = await getDoc(doc(db, "resources", id));
    if (!snap.exists() || snap.data().isPublished !== true) return null;
    return { ...(snap.data() as Omit<Resource, "id">), id: snap.id };
  } catch (e: any) {
    if (e?.code === "permission-denied") return null;
    throw e;
  }
}
