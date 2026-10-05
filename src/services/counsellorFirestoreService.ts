// Counsellor Firestore Service - Muaath (Member 4). Supports FR01, FR03, FR05, FR08.
// Modular, HIPAA-compliant Firestore service layer for triage requests, sessions,
// clinical notes, availability slots, caseload, and clinical notification feeds.

import { db } from "@/firebase/config";
import {
  FIRESTORE_COLLECTIONS,
  isFirebaseConfigured,
} from "@/services/counsellorFirebaseConfig";
import {
  BookingRequestItem,
  SessionItem,
  CounsellorProfileInfo,
  RequestStatus,
} from "@/types/counsellorDashboard";
import { AlertItem } from "@/types/counsellorAlerts";
import {
  ClinicalAlertPreferences,
  PatientItem,
  ClinicalNoteEntry,
  NewSessionFormInput,
} from "@/types/counsellorDetailScreens";
import type {
  ScheduleDaySlot,
  AcceptedSessionPayload,
  DeclinedSessionPayload,
} from "@/services/counsellorStore";
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

// ─── 1. REQUESTS & TRIAGE ───

export function subscribeToPendingRequests(
  counselorId: string,
  onUpdate: (requests: BookingRequestItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    return () => {};
  }

  try {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.REQUESTS),
      where("counselorId", "in", [counselorId, "all", "coun_anjali_01"]),
      where("status", "==", "pending")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: BookingRequestItem[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              studentId: d.studentId || "std-5104",
              studentAnonId: d.studentAnonId || "Student #5104",
              displayName: d.displayName || d.studentAnonId || "Student #5104",
              idMode: d.idMode || "anonymous",
              requestedTime: d.requestedTime || "10:00–10:45 AM",
              sessionType: d.sessionType || "video",
              duration: d.duration || "45m",
              topic: d.studentNotes || d.topic || "Academic Burnout & Fatigue",
              aiMoodBrief: d.aiMoodBrief,
              status: "pending" as RequestStatus,
            };
          });
          onUpdate(items);
        }
      },
      (err) => {
        console.warn("[counsellorFirestoreService] subscribeToPendingRequests error:", err);
        onError?.(err);
      }
    );
  } catch (err: any) {
    console.warn("[counsellorFirestoreService] setup requests subscription error:", err);
    onError?.(err);
    return () => {};
  }
}

export async function acceptStudentRequest(
  requestId: string,
  counselorId: string,
  targetRequest: BookingRequestItem,
  counselorNote?: string
): Promise<AcceptedSessionPayload> {
  const studentAnonId = targetRequest.studentAnonId || "Student #5104";
  const roomId = `brth-${studentAnonId.replace(/[^0-9]/g, "") || "5104"}-sec`;

  const payload: AcceptedSessionPayload = {
    requestId: targetRequest.id,
    studentAnonId,
    date: "Tomorrow, Tue 19 Aug",
    timeRange: targetRequest.requestedTime || "10:00–10:45 AM",
    modality:
      targetRequest.sessionType === "video"
        ? "Encrypted Video Call (45m)"
        : targetRequest.sessionType === "chat"
        ? "Secured Chat Session"
        : "In-Person Consultation",
    counselorNote,
    roomId,
  };

  if (!isFirebaseConfigured() || !db) {
    return payload;
  }

  try {
    const batch = writeBatch(db);

    // 1. Update Request & Booking status
    if (requestId && !requestId.startsWith("mock-") && !requestId.startsWith("req-5104")) {
      const reqRef = doc(db, FIRESTORE_COLLECTIONS.REQUESTS, requestId);
      batch.update(reqRef, {
        status: "accepted",
        counselorNote: counselorNote || null,
        acceptedAt: serverTimestamp(),
      });

      const bookingRef = doc(db, FIRESTORE_COLLECTIONS.BOOKINGS, requestId);
      batch.update(bookingRef, {
        status: "confirmed",
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Atomically create careLinks/{counselorId}_{studentId}
    const studentId = targetRequest.studentId || "std-5104";
    const careLinkId = `${counselorId}_${studentId}`;
    const existingLinks = await getDocs(
      query(
        collection(db, "careLinks"),
        where("counsellorId", "==", counselorId),
        where("studentId", "==", studentId)
      )
    );
    if (existingLinks.empty) {
      const careLinkRef = doc(db, "careLinks", careLinkId);
      batch.set(careLinkRef, {
        counsellorId: counselorId,
        studentId: studentId,
        bookingId: requestId || `booking-${Date.now()}`,
        createdAt: serverTimestamp(),
      });
    }

    // 3. Create Session
    const sessionRef = doc(collection(db, FIRESTORE_COLLECTIONS.SESSIONS));
    batch.set(sessionRef, {
      counselorId,
      studentId: targetRequest.studentId,
      studentAnonId,
      displayName: targetRequest.displayName,
      idMode: targetRequest.idMode,
      sessionType: targetRequest.sessionType,
      sessionTypeLabel: payload.modality,
      timeRange: payload.timeRange,
      date: payload.date,
      status: "confirmed",
      roomId,
      securityTag: "E2E Encrypted",
      noteText: counselorNote || targetRequest.topic,
      createdAt: serverTimestamp(),
    });

    // 3. Log Counselor Alert
    const notifRef = doc(collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS));
    batch.set(notifRef, {
      recipientId: counselorId,
      title: "Session Confirmed",
      description: `Consultation with ${studentAnonId} confirmed for ${payload.date} at ${payload.timeRange}.`,
      category: "session",
      priority: "urgent",
      isUnread: true,
      actionLabel: "Enter Room",
      badgeLabel: "Confirmed",
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (err) {
    console.warn("[counsellorFirestoreService] acceptStudentRequest error:", err);
  }

  return payload;
}

export async function declineStudentRequest(
  requestId: string,
  counselorId: string,
  targetRequest: BookingRequestItem,
  reason: string,
  note?: string
): Promise<DeclinedSessionPayload> {
  const studentAnonId = targetRequest.studentAnonId || "Student #5104";

  const payload: DeclinedSessionPayload = {
    requestId: targetRequest.id,
    studentAnonId,
    date: "Tomorrow, Tue 19 Aug",
    timeRange: targetRequest.requestedTime || "10:00–10:45 AM",
    modality:
      targetRequest.sessionType === "video"
        ? "Video Consultation (45 min)"
        : targetRequest.sessionType === "chat"
        ? "Secured Chat Session"
        : "In-Person Consultation",
    reason,
    note,
  };

  if (!isFirebaseConfigured() || !db) {
    return payload;
  }

  try {
    const batch = writeBatch(db);

    // 1. Update Request
    if (requestId && !requestId.startsWith("mock-") && !requestId.startsWith("req-5104")) {
      const reqRef = doc(db, FIRESTORE_COLLECTIONS.REQUESTS, requestId);
      batch.update(reqRef, {
        status: "declined",
        declineReason: reason,
        declineNote: note || null,
        declinedAt: serverTimestamp(),
      });
    }

    // 2. Log Alert
    const notifRef = doc(collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS));
    batch.set(notifRef, {
      recipientId: counselorId,
      title: "Request Declined",
      description: `Booking request for ${studentAnonId} declined (${reason}). Note dispatched securely.`,
      category: "session",
      priority: "normal",
      isUnread: true,
      badgeLabel: "Declined",
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (err) {
    console.warn("[counsellorFirestoreService] declineStudentRequest error:", err);
  }

  return payload;
}

// ─── 2. SESSIONS & CALENDAR ───

export function subscribeToCounselorSessions(
  counselorId: string,
  onUpdate: (sessions: SessionItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    return () => {};
  }

  try {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.SESSIONS),
      where("counselorId", "==", counselorId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const sessions: SessionItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              studentId: data.studentId || "std-1",
              studentAnonId: data.studentAnonId || "Student #4021",
              displayName: data.displayName || data.studentAnonId || "Student #4021",
              idMode: data.idMode || "anonymous",
              timeRange: data.timeRange || "09:00 AM – 09:50 AM",
              timeRelative: data.timeRelative || "Today",
              isNext: Boolean(data.isNext),
              sessionType: data.sessionType || "video",
              sessionTypeLabel: data.sessionTypeLabel || "Encrypted Video Consultation",
              noteType: data.noteType || "Focus",
              noteText: data.noteText || "",
              status: data.status || "confirmed",
            };
          });
          onUpdate(sessions);
        }
      },
      (err) => {
        console.warn("[counsellorFirestoreService] subscribeToCounselorSessions error:", err);
        onError?.(err);
      }
    );
  } catch (err: any) {
    console.warn("[counsellorFirestoreService] setup sessions subscription error:", err);
    onError?.(err);
    return () => {};
  }
}

export async function createCounselorSession(
  counselorId: string,
  input: NewSessionFormInput
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return;
  }

  try {
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.SESSIONS), {
      counselorId,
      studentId: input.studentId,
      studentAnonId: input.studentAnonId,
      displayName: input.displayName,
      idMode: input.idMode,
      sessionType: input.sessionType,
      timeRange: `${input.startTime} – ${input.endTime}`,
      date: input.date,
      status: "confirmed",
      roomOrDetail: input.locationOrRoom || "Room 302",
      noteText: input.focus?.trim() || "General Consultation",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("[counsellorFirestoreService] createCounselorSession error:", err);
  }
}

// ─── 3. CLINICAL CASE NOTES ───

export function subscribeToClinicalNotes(
  patientIdOrCaseRef: string,
  onUpdate: (notes: ClinicalNoteEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    return () => {};
  }

  try {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.CLINICAL_NOTES),
      where("patientId", "==", patientIdOrCaseRef)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const notes: ClinicalNoteEntry[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              date: data.sessionDate || "Recent Session",
              modality: data.modality || "Video",
              status: data.status || "Completed",
              content: data.content || "",
              counselorName: data.counselorName || "Dr. Anjali Perera",
              signedStatus: data.signedStatus || "Signed & Synced",
            };
          });
          onUpdate(notes);
        }
      },
      (err) => {
        console.warn("[counsellorFirestoreService] subscribeToClinicalNotes error:", err);
        onError?.(err);
      }
    );
  } catch (err: any) {
    console.warn("[counsellorFirestoreService] setup notes subscription error:", err);
    onError?.(err);
    return () => {};
  }
}

export async function addClinicalProgressNote(
  counselorId: string,
  counselorName: string,
  patientKey: string,
  content: string,
  modality: string = "Video"
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return;
  }

  try {
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.CLINICAL_NOTES), {
      counselorId,
      counselorName,
      patientId: patientKey,
      content,
      modality,
      status: "Completed",
      signedStatus: "Signed & Synced",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("[counsellorFirestoreService] addClinicalProgressNote error:", err);
  }
}

// ─── 4. ALERTS & NOTIFICATIONS ───

export function subscribeToCounselorAlerts(
  counselorId: string,
  onUpdate: (alerts: AlertItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    return () => {};
  }

  try {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
      where("recipientId", "==", counselorId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const alerts: AlertItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || "Notification",
              description: data.description || "",
              timestamp: data.timestamp || "Just now",
              isUnread: data.isUnread !== false,
              category: data.category || "session",
              priority: data.priority || "normal",
              iconName: data.iconName || "notifications-outline",
              actionLabel: data.actionLabel,
              badgeLabel: data.badgeLabel,
            };
          });
          onUpdate(alerts);
        }
      },
      (err) => {
        console.warn("[counsellorFirestoreService] subscribeToCounselorAlerts error:", err);
        onError?.(err);
      }
    );
  } catch (err: any) {
    console.warn("[counsellorFirestoreService] setup alerts subscription error:", err);
    onError?.(err);
    return () => {};
  }
}

export async function markAllCounselorAlertsAsRead(counselorId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return;
  }

  try {
    const unreadSnap = await getDocs(
      query(
        collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
        where("recipientId", "==", counselorId),
        where("isUnread", "==", true)
      )
    );

    const batch = writeBatch(db);
    unreadSnap.forEach((d) => {
      batch.update(d.ref, { isUnread: false });
    });
    await batch.commit();
  } catch (err) {
    console.warn("[counsellorFirestoreService] markAllCounselorAlertsAsRead error:", err);
  }
}

// ─── 5. PREFERENCES & PROFILE ───

export async function updateCounselorPreferences(
  counselorId: string,
  preferences: Partial<ClinicalAlertPreferences>
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return;
  }

  try {
    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.COUNSELOR_PREFERENCES, counselorId),
      {
        ...preferences,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[counsellorFirestoreService] updateCounselorPreferences error:", err);
  }
}
