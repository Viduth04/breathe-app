import { auth, db } from "@/firebase/config";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    sendPasswordResetEmail,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

export type Role = "student" | "counsellor" | "lecturer";

export type UserProfile = {
  uid: string;
  role: Role;
  fullName: string;
  email: string | null;
  anonId: string; // What counsellors see, e.g. "Student #4021" (NFR01)
  anonymousMode: boolean;
  shareMoodWithCounsellor: boolean;
  isGuest: boolean;
};

// Random public ID so counsellors never need the student's real name
const makeAnonId = () => `Student #${Math.floor(1000 + Math.random() * 9000)}`;

// ---------- CREATE ----------

// Register screen: creates the login account + the user's profile document
export async function registerStudent(
  fullName: string,
  email: string,
  password: string,
  anonymousMode: boolean,
) {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  const profile: UserProfile = {
    uid: cred.user.uid,
    role: "student",
    fullName: fullName.trim(),
    email: email.trim(),
    anonId: makeAnonId(),
    anonymousMode,
    shareMoodWithCounsellor: false,
    isGuest: false,
  };
  await setDoc(doc(db, "users", cred.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });
  return profile;
}

// Login screen: "Continue Anonymously" creates a guest profile on first use
export async function continueAnonymously() {
  const cred = await signInAnonymously(auth);
  const ref = doc(db, "users", cred.user.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      uid: cred.user.uid,
      role: "student",
      fullName: "",
      email: null,
      anonId: makeAnonId(),
      anonymousMode: true,
      shareMoodWithCounsellor: false,
      isGuest: true,
      createdAt: serverTimestamp(),
    });
  }
}

// ---------- READ ----------

// Login screen: signs in, then the profile is read to find the user's role
export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ---------- UPDATE ----------

// Forgot Password screen: Firebase emails a secure reset link
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

// Privacy & Data screen: save Anonymous Mode and mood-sharing toggles
export async function updatePrivacySettings(
  uid: string,
  settings: { anonymousMode: boolean; shareMoodWithCounsellor: boolean },
) {
  await updateDoc(doc(db, "users", uid), settings);
}

// ---------- DELETE ----------

// Privacy & Data screen: removes the student's check-ins, bookings, profile and account
export async function deleteMyData() {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is signed in.");

  const batch = writeBatch(db);
  const checkins = await getDocs(
    query(collection(db, "checkins"), where("userId", "==", user.uid)),
  );
  checkins.forEach((d) => batch.delete(d.ref));
  const bookings = await getDocs(
    query(collection(db, "bookings"), where("studentId", "==", user.uid)),
  );
  bookings.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "users", user.uid));
  await batch.commit();

  await deleteUser(user);
}

export async function logout() {
  await signOut(auth);
}

// Turns Firebase error codes into plain-language messages for the UI
export function getAuthErrorMessage(error: any): string {
  switch (error?.code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in.";
    case "auth/weak-password":
      return "Use a password with at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "No internet connection. Check your network and try again.";
    case "auth/requires-recent-login":
      return "For your security, log out and log in again before deleting your data.";
    default:
      return "Something went wrong. Please try again.";
  }
}
