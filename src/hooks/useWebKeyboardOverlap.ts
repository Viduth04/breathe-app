// Admin panel - Viduth (Member 1). Supports NFR (usability).
//
// Web only: how many pixels of an on-screen keyboard cover the bottom of the
// page. iOS Safari doesn't shrink the page for the keyboard, only the
// visualViewport, so add this as paddingBottom to keep a footer visible.
// Always 0 on iOS/Android (use KeyboardAvoidingView there) and on desktop.

import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function useWebKeyboardOverlap() {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () =>
      setOverlap(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return overlap;
}
