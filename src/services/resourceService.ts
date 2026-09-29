// Lecturer insights - Viduth (Member 1). Supports FR06.
//
// Read-only access to PUBLISHED resources for anyone who isn't an admin
// (lecturers now; Ishara can reuse this for the student screens).
// The where("isPublished", "==", true) filter is required by the security
// rules - without it Firestore rejects the whole query.

import { db } from "@/firebase/config";
import type { Resource } from "@/types/resource";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function listPublishedResources(): Promise<Resource[]> {
  const snap = await getDocs(
    query(collection(db, "resources"), where("isPublished", "==", true)),
  );
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Resource, "id">), id: d.id }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
