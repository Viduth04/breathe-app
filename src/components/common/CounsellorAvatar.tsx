// Counsellor photos - Viduth (Member 1). Supports FR03, NFR01.
//
// A counsellor's photo if they have one, otherwise their initials. For
// COUNSELLORS ONLY - students, lecturers and admins never get photos.
// Usage: <CounsellorAvatar uid={c.uid} name={c.fullName} />

import {
  getCounsellorPhoto,
  subscribeToCounsellorPhoto,
} from "@/services/counsellorPhotoService";
import { colors, radius } from "@/theme";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// "Dr. Nimali Perera" -> "NP" (titles skipped)
export const counsellorInitials = (name: string) =>
  name
    .trim()
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

type Props = {
  uid?: string; // Loads the saved photo
  name: string;
  size?: number;
  // Shows this instead of the saved photo (e.g. an unsaved pick in the form):
  // a data URL, or null to force initials
  photo?: string | null;
};

export default function CounsellorAvatar({ uid, name, size = 48, photo }: Props) {
  const [saved, setSaved] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    if (!uid || photo !== undefined) return;
    let active = true;
    let changed = false; // A save/remove beat the first load: keep the newer photo
    setSaved(null); // Don't show another counsellor's photo while loading
    getCounsellorPhoto(uid).then((p) => active && !changed && setSaved(p));
    // A save or remove elsewhere (e.g. the admin form) updates this avatar now
    const unsubscribe = subscribeToCounsellorPhoto(uid, (p) => {
      changed = true;
      if (active) setSaved(p);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid, photo]);

  const source = photo !== undefined ? photo : saved;
  const box = { width: size, height: size, borderRadius: radius.full };
  const showPhoto = Boolean(source) && !imageFailed;

  // Decorative: the name is always shown or announced next to it
  return (
    <View
      style={[styles.base, box]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {showPhoto && source ? (
        <Image
          source={{ uri: source }}
          style={box}
          contentFit="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size / 3) }]}>
          {counsellorInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.selected,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: { fontWeight: "700", color: colors.primary },
});
