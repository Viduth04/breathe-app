// Counsellor photos - Viduth (Member 1). Supports FR03.
//
// Pick an image, crop it to a centred square, resize to 256x256 and compress
// to JPEG, then return it as a data URL small enough for Firestore (Spark plan:
// no Storage). Anything still over 150 KB is refused with a clear message.

import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_CHARS,
  PHOTO_QUALITY,
  PHOTO_SIZE,
} from "@/types/counsellor";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type PickResult =
  | { kind: "picked"; photo: string }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

// Real size of base64 data in bytes (each 4 chars = 3 bytes, minus padding)
const base64Bytes = (b64: string) =>
  Math.floor((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);

export async function pickCounsellorPhoto(): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      kind: "error",
      message: "Breathe needs access to your photos to add one. You can allow it in Settings.",
    };
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true, // Lets the admin choose the square on iOS/Android
    aspect: [1, 1],
    quality: 1,
  });
  if (picked.canceled || !picked.assets?.length) return { kind: "cancelled" };

  try {
    const { uri, width, height } = picked.assets[0];
    // Centre square crop as well, in case the platform didn't crop (e.g. web)
    const side = Math.min(width, height);
    const context = ImageManipulator.manipulate(uri);
    if (width && height && width !== height) {
      context.crop({
        originX: Math.floor((width - side) / 2),
        originY: Math.floor((height - side) / 2),
        width: side,
        height: side,
      });
    }
    context.resize({ width: PHOTO_SIZE, height: PHOTO_SIZE });
    const image = await context.renderAsync();
    const result = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: PHOTO_QUALITY,
      base64: true,
    });
    if (!result.base64) throw new Error("No image data");

    const photo = `data:image/jpeg;base64,${result.base64}`;
    if (base64Bytes(result.base64) > PHOTO_MAX_BYTES || photo.length >= PHOTO_MAX_CHARS) {
      return {
        kind: "error",
        message: "That photo is still over 150 KB after resizing. Try a simpler or smaller photo.",
      };
    }
    return { kind: "picked", photo };
  } catch (e) {
    console.warn("Preparing counsellor photo failed", e);
    return { kind: "error", message: "That photo couldn't be used. Try a different one." };
  }
}
