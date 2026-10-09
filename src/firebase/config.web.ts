// Web version of config.ts (Metro picks this file for web builds).
// getReactNativePersistence only exists in Firebase's React Native build,
// so on web we keep the session in the browser's localStorage instead.
import { initializeApp } from "firebase/app";
import { browserLocalPersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ...(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
    ? { databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL }
    : {}),
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});
export const db = getFirestore(app);
export const rtdb = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ? getDatabase(app) : (null as any);


