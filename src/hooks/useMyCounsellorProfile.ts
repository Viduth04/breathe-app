// Counsellor profile - Viduth (Member 1). Supports FR03.
//
// The logged-in counsellor's own counsellors/{uid} profile, kept live so an
// admin's edits (or switching them unavailable) show straight away.
// profile is null when no profile exists yet - show something like
// "Your profile isn't set up yet. Ask the admin."
//
//   const { profile, loading, error } = useMyCounsellorProfile();

import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { getAuthErrorMessage } from "@/services/authService";
import type { CounsellorProfile } from "@/types/counsellor";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useMyCounsellorProfile() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [profile, setProfile] = useState<CounsellorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    // counsellors/ is readable by any signed-in user, and a missing doc is
    // just "doesn't exist" here (the rule doesn't look at its data)
    return onSnapshot(
      doc(db, "counsellors", uid),
      (snap) => {
        setProfile(
          snap.exists() ? { ...(snap.data() as CounsellorProfile), uid: snap.id } : null,
        );
        setError(undefined);
        setLoading(false);
      },
      (e) => {
        console.warn("Loading counsellor profile failed", e);
        setError(getAuthErrorMessage(e));
        setLoading(false);
      },
    );
  }, [uid]);

  return { profile, loading, error };
}
