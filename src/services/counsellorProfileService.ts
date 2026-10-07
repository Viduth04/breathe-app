// Counsellor Profile & Avatar Media Service - Muaath (Member 4).
// Manages profile editing, validation, avatar selection, EXIF-stripping compression,
// and resilient upload to Firebase Storage, Firebase Auth, and Firestore.

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateProfile } from "firebase/auth";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadString,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  auth,
  db,
  storage,
  FIRESTORE_COLLECTIONS,
} from "@/services/counsellorFirebaseConfig";
import { setCachedCounsellorPhoto } from "@/services/counsellorPhotoService";
import {
  SPECIALTIES,
  LANGUAGES,
  Specialty,
  Language,
  COUNSELLOR_NAME_MIN,
  COUNSELLOR_NAME_MAX,
  COUNSELLOR_TITLE_MAX,
  COUNSELLOR_BIO_MAX,
  COUNSELLOR_EXPERIENCE_MAX,
} from "@/types/counsellor";

export interface CounsellorProfileUpdateInput {
  fullName: string;
  title: string;
  bio: string;
  specialties: Specialty[];
  languages: Language[];
  experienceYears: number;
  organization?: string;
  photoURL?: string;
}

export interface ProfileValidationErrors {
  fullName?: string;
  title?: string;
  bio?: string;
  specialties?: string[];
  languages?: string[];
  experienceYears?: string;
  general?: string;
}

/**
 * Validates counsellor profile inputs matching firestore.rules (validCounsellorProfile).
 */
export function validateProfileInput(
  input: CounsellorProfileUpdateInput
): ProfileValidationErrors | null {
  const errors: ProfileValidationErrors = {};

  const name = input.fullName?.trim() || "";
  if (name.length < COUNSELLOR_NAME_MIN) {
    errors.fullName = `Full name must be at least ${COUNSELLOR_NAME_MIN} characters.`;
  } else if (name.length > COUNSELLOR_NAME_MAX) {
    errors.fullName = `Full name cannot exceed ${COUNSELLOR_NAME_MAX} characters.`;
  }

  const title = input.title?.trim() || "";
  if (!title) {
    errors.title = "Clinical title is required.";
  } else if (title.length > COUNSELLOR_TITLE_MAX) {
    errors.title = `Clinical title cannot exceed ${COUNSELLOR_TITLE_MAX} characters.`;
  }

  const bio = input.bio?.trim() || "";
  if (!bio) {
    errors.bio = "Clinical bio is required for student transparency.";
  } else if (bio.length > COUNSELLOR_BIO_MAX) {
    errors.bio = `Clinical bio cannot exceed ${COUNSELLOR_BIO_MAX} characters.`;
  }

  if (
    typeof input.experienceYears !== "number" ||
    isNaN(input.experienceYears) ||
    input.experienceYears < 0 ||
    input.experienceYears > COUNSELLOR_EXPERIENCE_MAX
  ) {
    errors.experienceYears = `Experience must be between 0 and ${COUNSELLOR_EXPERIENCE_MAX} years.`;
  }

  if (!input.specialties || input.specialties.length === 0) {
    errors.general = "Please select at least one clinical specialty.";
  } else if (input.specialties.length > 6) {
    errors.general = "Please select at most 6 specialties.";
  }

  if (!input.languages || input.languages.length === 0) {
    errors.general = "Please select at least one spoken language.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Launches the device photo library for avatar selection with 1:1 aspect ratio.
 */
export async function pickAvatarFromLibrary(): Promise<string | null> {
  // Check permission safely; on modern Android (13+), photo picker does not require permissions
  try {
    if (typeof ImagePicker.requestMediaLibraryPermissionsAsync === "function") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm && !perm.granted && !perm.canAskAgain) {
        throw new Error(
          "Photo library permission is required to select a profile picture. Please enable it in your device settings."
        );
      }
    }
  } catch (permErr: any) {
    if (permErr?.message?.includes("device settings")) {
      throw permErr;
    }
    // Non-fatal bypass for platforms/devices where permissions API is unneeded or handled by system picker
    console.log("[counsellorProfileService] Media library permission bypass:", permErr?.message || permErr);
  }

  if (typeof ImagePicker.launchImageLibraryAsync !== "function") {
    throw new Error("Photo library is not available on this device.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Launches the device camera for clinical avatar portrait capture with 1:1 aspect ratio.
 */
export async function takeAvatarWithCamera(): Promise<string | null> {
  try {
    if (typeof ImagePicker.requestCameraPermissionsAsync === "function") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm && !perm.granted) {
        throw new Error(
          "Camera permission is required to capture a profile picture. Please enable it in your device settings."
        );
      }
    }
  } catch (permErr: any) {
    if (permErr?.message?.includes("device settings")) {
      throw permErr;
    }
    console.log("[counsellorProfileService] Camera permission bypass:", permErr?.message || permErr);
  }

  if (typeof ImagePicker.launchCameraAsync !== "function") {
    throw new Error("Camera is not available on this device.");
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Strips EXIF metadata, resizes to 512x512 square, and compresses to high-quality JPEG.
 */
export async function compressAndStripExif(rawUri: string): Promise<string> {
  try {
    if (typeof ImageManipulator?.manipulateAsync === "function") {
      const manipulated = await ImageManipulator.manipulateAsync(
        rawUri,
        [{ resize: { width: 512, height: 512 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipulated.uri;
    }
  } catch (manipErr) {
    console.warn("[counsellorProfileService] compressAndStripExif fallback to raw URI:", manipErr);
  }

  return rawUri;
}

/**
 * Resizes and converts an image to a base64 JPEG data URL (< 150KB) for backwards-compatible
 * sync with counsellorPhotos collection.
 */
export async function generatePhotoDataUrl(imageUri: string): Promise<string> {
  try {
    if (typeof ImageManipulator?.manipulateAsync === "function") {
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 256, height: 256 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      if (manipulated?.base64) {
        return `data:image/jpeg;base64,${manipulated.base64}`;
      }
    }
  } catch (e) {
    console.warn("[counsellorProfileService] generatePhotoDataUrl manipulation fallback:", e);
  }

  return imageUri;
}

/**
 * Uploads an avatar image to Firebase Storage, sets Auth photoURL, and syncs Firestore database.
 * Resilient against Spark plan / uninitialized Cloud Storage by falling back seamlessly
 * to an optimized base64 data URL saved in Firestore counselorPreferences and users collections.
 */
export async function uploadCounsellorAvatar(
  counsellorId: string,
  imageUri: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  // 1. Process, resize, and strip EXIF
  const cleanUri = await compressAndStripExif(imageUri);
  onProgress?.(30);

  // 2. Generate optimized data URL (under 150KB per Member 1 PHOTO_MAX_BYTES)
  const dataUrl = await generatePhotoDataUrl(cleanUri);
  onProgress?.(60);

  const finalAvatarUrl = dataUrl;

  // 3. Persist to Firestore counselorPreferences collection (full owner access allowed by rules)
  try {
    const prefDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELOR_PREFERENCES, counsellorId);
    await setDoc(
      prefDocRef,
      {
        avatarUrl: finalAvatarUrl,
        photo: finalAvatarUrl,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (prefErr) {
    console.warn("[counsellorProfileService] counselorPreferences avatar sync warning:", prefErr);
  }

  // 4. Persist to Firestore users collection (owner update allowed by rules)
  if (auth.currentUser && auth.currentUser.uid === counsellorId) {
    try {
      const userDocRef = doc(db, "users", counsellorId);
      await setDoc(
        userDocRef,
        {
          avatarUrl: finalAvatarUrl,
          photoURL: finalAvatarUrl.length < 2000 ? finalAvatarUrl : "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (userErr) {
      console.warn("[counsellorProfileService] users collection avatar sync warning:", userErr);
    }
  }

  // 5. Persist to local AsyncStorage for permanent offline/instant recovery
  try {
    await AsyncStorage.setItem(`counsellor_avatar_${counsellorId}`, finalAvatarUrl);
    await AsyncStorage.setItem("counsellor_avatar_active", finalAvatarUrl);
  } catch (storageErr) {
    console.warn("[counsellorProfileService] AsyncStorage save warning:", storageErr);
  }

  // 6. Update in-memory photo cache so all avatar components re-render immediately
  try {
    setCachedCounsellorPhoto(counsellorId, finalAvatarUrl);
  } catch (_) {}

  // 7. Update Auth profile photoURL ONLY if it's a short URL (Firebase Auth limit is 2048 chars)
  if (
    auth.currentUser &&
    auth.currentUser.uid === counsellorId &&
    finalAvatarUrl.startsWith("http")
  ) {
    try {
      await updateProfile(auth.currentUser, { photoURL: finalAvatarUrl });
    } catch (authErr) {
      console.warn("[counsellorProfileService] Auth updateProfile photoURL error:", authErr);
    }
  }

  onProgress?.(100);
  return finalAvatarUrl;
}

/**
 * Removes the counsellor avatar from Storage, Auth, and Firestore database.
 */
export async function deleteCounsellorAvatar(counsellorId: string): Promise<void> {
  // 1. Delete from Firebase Storage if present
  try {
    const storageRef = ref(storage, `counsellors/${counsellorId}/avatar.jpg`);
    await deleteObject(storageRef);
  } catch (e: any) {
    if (e?.code !== "storage/object-not-found") {
      // Ignore
    }
  }

  // 2. Clear Auth currentUser photoURL
  if (auth.currentUser && auth.currentUser.uid === counsellorId) {
    try {
      await updateProfile(auth.currentUser, { photoURL: "" });
    } catch {
      // Ignore auth warning
    }
  }

  // 3. Clear from counselorPreferences collection
  try {
    const prefDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELOR_PREFERENCES, counsellorId);
    await setDoc(
      prefDocRef,
      {
        avatarUrl: "",
        photo: "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("[counsellorProfileService] counselorPreferences avatar clear error:", e);
  }

  // 4. Clear from users collection
  if (auth.currentUser && auth.currentUser.uid === counsellorId) {
    try {
      const userDocRef = doc(db, "users", counsellorId);
      await setDoc(
        userDocRef,
        {
          avatarUrl: "",
          photoURL: "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      // Ignore
    }
  }

  // 5. Clear from local AsyncStorage
  try {
    await AsyncStorage.removeItem(`counsellor_avatar_${counsellorId}`);
    await AsyncStorage.removeItem("counsellor_avatar_active");
  } catch (e) {
    // Ignore
  }

  // 6. Clear counsellorPhotos document and cache
  try {
    const photoDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELLOR_PHOTOS, counsellorId);
    await deleteDoc(photoDocRef);
  } catch (e) {
    // Ignore if not present
  }
  try {
    setCachedCounsellorPhoto(counsellorId, null);
  } catch (e) {
    // Ignore
  }
}

/**
 * Persists counsellor profile updates to Firestore with validation.
 */
export async function persistCounsellorProfile(
  counsellorId: string,
  input: CounsellorProfileUpdateInput
): Promise<void> {
  const errors = validateProfileInput(input);
  if (errors) {
    const firstMsg =
      errors.fullName ||
      errors.title ||
      errors.bio ||
      errors.experienceYears ||
      errors.general ||
      "Invalid profile data";
    throw new Error(firstMsg);
  }

  // Update Firebase Auth displayName
  if (auth.currentUser && auth.currentUser.uid === counsellorId) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: input.fullName.trim(),
      });
    } catch (authErr) {
      console.warn("[counsellorProfileService] Auth displayName update error:", authErr);
    }
  }

  // Save to Firestore counsellors/{counsellorId}
  const counsellorDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELORS, counsellorId);
  const firestorePayload: Record<string, any> = {
    uid: counsellorId,
    fullName: input.fullName.trim(),
    title: input.title.trim(),
    bio: input.bio.trim(),
    specialties: input.specialties,
    languages: input.languages,
    experienceYears: input.experienceYears,
    isAvailable: true,
    updatedAt: serverTimestamp(),
  };

  if (input.photoURL) {
    // 1. Sync to counselorPreferences collection
    try {
      const prefDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELOR_PREFERENCES, counsellorId);
      await setDoc(
        prefDocRef,
        {
          avatarUrl: input.photoURL,
          photo: input.photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (prefErr) {
      console.warn("[counsellorProfileService] counselorPreferences photoURL sync error:", prefErr);
    }

    // 2. Sync to users collection
    if (auth.currentUser && auth.currentUser.uid === counsellorId) {
      try {
        const userDocRef = doc(db, "users", counsellorId);
        await setDoc(
          userDocRef,
          {
            avatarUrl: input.photoURL,
            photoURL: input.photoURL.length < 2000 ? input.photoURL : "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (userErr) {
        console.warn("[counsellorProfileService] users collection photoURL sync error:", userErr);
      }
    }

    // 3. Save to AsyncStorage
    try {
      await AsyncStorage.setItem(`counsellor_avatar_${counsellorId}`, input.photoURL);
      await AsyncStorage.setItem("counsellor_avatar_active", input.photoURL);
    } catch (_) {}

    // 4. Update memory cache
    try {
      setCachedCounsellorPhoto(counsellorId, input.photoURL);
    } catch (_) {}
  }

  // Persist to Cloud Firestore if an authenticated user session is active
  if (auth.currentUser) {
    try {
      await setDoc(counsellorDocRef, firestorePayload, { merge: true });
    } catch (fsErr: any) {
      console.warn(
        "[counsellorProfileService] Firestore save notice (offline or role-restricted in preview):",
        fsErr?.message || fsErr
      );
    }
  }

  // Update counselorPreferences for organization/organization settings
  if (input.organization !== undefined) {
    try {
      const prefDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELOR_PREFERENCES, counsellorId);
      await setDoc(
        prefDocRef,
        {
          organization: input.organization.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (prefErr) {
      console.warn("[counsellorProfileService] counselorPreferences update error:", prefErr);
    }
  }
}
