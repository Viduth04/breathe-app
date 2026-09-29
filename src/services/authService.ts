import { auth, db } from "@/firebase/config";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    collection,
    doc,
    DocumentReference,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

// "admin" is only ever set in the Firebase console, never at sign-up
export type Role = "student" | "counsellor" | "lecturer" | "admin";

export type UserProfile = {
  uid: string;
  role: Role;
  fullName: string;
  email: string | null;
  anonId: string; // What counsellors see, e.g. "Student #4021" (NFR01)
  anonymousMode: boolean;
  shareMoodWithCounsellor: boolean;
  isGuest: boolean;
  createdAt?: Timestamp | null; // Set by the server at sign-up
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

// SLIIT student IDs are two letters + 8 digits, e.g. IT23845800
const STUDENT_ID_PATTERN = /^[a-z]{2}\d{8}$/i;

// Login screen accepts an email or a student ID; IDs map to the student's SLIIT email
function toLoginEmail(emailOrStudentId: string) {
  const value = emailOrStudentId.trim();
  return STUDENT_ID_PATTERN.test(value)
    ? `${value.toLowerCase()}@my.sliit.lk`
    : value;
}

// Login screen: signs in, then the profile is read to find the user's role
export async function login(emailOrStudentId: string, password: string) {
  await signInWithEmailAndPassword(
    auth,
    toLoginEmail(emailOrStudentId),
    password,
  );
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

// Firestore allows at most 500 writes per batch
const BATCH_LIMIT = 500;

// Privacy & Data screen: removes the student's check-ins, bookings, care links,
// chats (with every message in them), profile and account.
// Email accounts must confirm their password first. Re-authenticating up front means
// deleteUser can't fail with auth/requires-recent-login after the data is already gone.
// Guest (anonymous) accounts have no password, so they skip that step.
export async function deleteMyData(password?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is signed in.");

  if (!user.isAnonymous) {
    if (!user.email || !password) throw new Error("Password is required.");
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password),
    );
  }

  // Deleted in this order. The security rules look up the chat and the profile,
  // so each chat's messages go before the chat, and the profile goes last.
  const refs: DocumentReference[] = [];
  const mine = (name: string, field: string) =>
    getDocs(query(collection(db, name), where(field, "==", user.uid)));

  const [checkins, bookings, careLinks, chats] = await Promise.all([
    mine("checkins", "userId"),
    mine("bookings", "studentId"),
    mine("careLinks", "studentId"),
    getDocs(
      query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid),
      ),
    ),
  ]);
  checkins.forEach((d) => refs.push(d.ref));
  bookings.forEach((d) => refs.push(d.ref));
  careLinks.forEach((d) => refs.push(d.ref));
  for (const chat of chats.docs) {
    const messages = await getDocs(collection(chat.ref, "messages"));
    messages.forEach((d) => refs.push(d.ref));
    refs.push(chat.ref);
  }
  refs.push(doc(db, "users", user.uid));

  // Commit in order, in chunks that fit Firestore's batch limit
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

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
    case "permission-denied": // Firestore security rules blocked the request
      return "You don't have permission to do that.";
    case "unavailable": // Firestore can't reach the server
      return "No internet connection. Check your network and try again.";
    case "auth/requires-recent-login":
      return "For your security, log out and log in again before deleting your data.";
    default:
      return "Something went wrong. Please try again.";
  }
}
