// Counsellor Shared Store - Muaath (Member 4). Supports FR01, FR03, FR05, FR08.
// Central reactive state store syncing requests, confirmed sessions, calendar slots,
// alerts, badges, and settings across both tab screens and detail stack screens without external dependencies.

import { useEffect, useState } from "react";
import {
  BookingRequestItem,
  CounsellorProfileInfo,
  SessionItem,
} from "@/types/counsellorDashboard";
import { AlertItem } from "@/types/counsellorAlerts";
import {
  MOCK_COUNSELLOR_PROFILE,
  MOCK_PENDING_REQUESTS,
  MOCK_SESSIONS_TODAY,
} from "@/services/mockCounsellorData";
import {
  MOCK_ALERTS_TODAY,
  MOCK_ALERTS_EARLIER,
} from "@/services/mockAlertsData";
import {
  ClinicalAlertPreferences,
  PatientItem,
  AnonymousSessionDetailData,
  SessionNotesData,
  ClinicalNoteEntry,
  NewSessionFormInput,
} from "@/types/counsellorDetailScreens";
import { ChatThread, ChatBubble } from "@/types/counsellorMessages";
import { TimeSlot } from "@/types/counsellorSchedule";
import {
  DEFAULT_CLINICAL_ALERT_PREFERENCES,
  MOCK_PATIENTS_LIST,
  MOCK_ANONYMOUS_SESSION_8812,
  MOCK_SESSION_NOTES_MAYA,
} from "@/services/mockDetailScreensData";
import { MOCK_CHAT_THREADS } from "@/services/mockMessagesData";
import {
  auth,
  db,
  rtdb,
  FIRESTORE_COLLECTIONS,
  isFirebaseConfigured,
  getCounselorAuthIdentity,
  isRtdbConfigured,
} from "@/services/counsellorFirebaseConfig";
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

export type PublishSlotInput = {
  dateKey: string; // YYYY-MM-DD
  dateDisplay: string;
  startTime: string; // "10:00 AM"
  endTime: string; // "10:45 AM"
  startAt: Date;
  endAt: Date;
  sessionTypes: ("video" | "chat" | "in-person")[];
};
import { onAuthStateChanged } from "firebase/auth";
import {
  initCounselorPresence,
  setTypingIndicator,
  subscribeToTypingIndicators,
  joinCallSignaling,
  updateCallMedia,
  subscribeToCallSignaling,
  endCallSignaling,
} from "@/services/counsellorRtdbService";

function isFirestorePermissionError(e: any): boolean {
  if (!e) return false;
  const code = (e?.code || "").toLowerCase();
  const msg = (typeof e === "string" ? e : e?.message || String(e)).toLowerCase();
  return (
    code.includes("permission") ||
    msg.includes("permission") ||
    msg.includes("missing or insufficient permissions")
  );
}



export type CalendarBooking = {
  id: string;
  timeSlot: string; // e.g. "09:00 AM"
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: "anonymous" | "standard";
  subInfo: string; // e.g. "Anonymous Profile", "Intake Complete"
  timeRange: string; // e.g. "10:00 - 10:45"
  modality: "video" | "chat" | "in-person";
  modalityLabel: string; // e.g. "Consultation (45m)"
  securityTag?: string; // e.g. "E2E Encrypted", "Encrypted"
  roomOrDetail?: string; // e.g. "Room ID: mnd-5104-sec", "Room 304"
  roomId?: string; // e.g. "mnd-5104-sec"
  isJustAdded?: boolean;
  statusText?: string; // e.g. "Case Note Ready", "Secure Thread"
  isOpenSlot?: boolean;
  isBlocked?: boolean;
};

export const INITIAL_CALENDAR_BOOKINGS: CalendarBooking[] = [
  {
    id: "cal-1",
    timeSlot: "09:00 AM",
    studentId: "std-4820",
    studentAnonId: "Student #4820",
    displayName: "Student #4820",
    idMode: "anonymous",
    subInfo: "Anonymous Profile",
    timeRange: "09:00 - 09:30",
    modality: "chat",
    modalityLabel: "Secure Thread",
    securityTag: "Encrypted",
    statusText: "Secure Thread",
  },
  {
    id: "cal-5104",
    timeSlot: "10:00 AM",
    studentId: "std-5104",
    studentAnonId: "Student #5104",
    displayName: "Student #5104",
    idMode: "anonymous",
    subInfo: "Anonymous • Intake Complete",
    timeRange: "10:00 - 10:45",
    modality: "video",
    modalityLabel: "Consultation (45m)",
    securityTag: "E2E Encrypted",
    roomOrDetail: "mnd-5104-sec",
    roomId: "mnd-5104-sec",
    isJustAdded: true,
    statusText: "Intake Complete",
  },
  {
    id: "cal-3",
    timeSlot: "11:30 AM",
    studentId: "std-3991",
    studentAnonId: "Student #3991",
    displayName: "Student #3991",
    idMode: "anonymous",
    subInfo: "Counseling Wing • Room 304",
    timeRange: "11:30 - 12:15",
    modality: "in-person",
    modalityLabel: "Consultation",
    roomOrDetail: "Room 304",
    statusText: "Case Note Ready",
  },
  {
    id: "cal-4",
    timeSlot: "01:30 PM",
    studentId: "",
    studentAnonId: "",
    displayName: "Open Consultation Slot",
    idMode: "standard",
    subInfo: "",
    timeRange: "01:30 - 02:15",
    modality: "video",
    modalityLabel: "Open Slot",
    isOpenSlot: true,
  },
];

export type ScheduleDaySlot = {
  id: string;
  timeRange: string;
  isBooked: boolean;
  isHeld?: boolean;
  studentName?: string;
  subtitle?: string;
  modalityText: string;
  modalityType: "video" | "voice" | "in-person" | "open";
  statusBadge: "Confirmed" | "Open";
  isAnonymous?: boolean;
  intakeNote?: string;
  room?: string;
};

export const INITIAL_SCHEDULE_DAY_SLOTS: ScheduleDaySlot[] = [
  {
    id: "sch-slot-1",
    timeRange: "09:00 AM – 09:45 AM",
    isBooked: true,
    studentName: "Sarah Jenkins",
    subtitle: "Weekly Check-in",
    modalityText: "Video Consultation (Encrypted)",
    modalityType: "video",
    statusBadge: "Confirmed",
  },
  {
    id: "sch-slot-2",
    timeRange: "10:30 AM – 11:15 AM",
    isBooked: false,
    studentName: "Open for booking",
    subtitle: "Available for student triage or direct booking",
    modalityText: "Open Slot",
    modalityType: "open",
    statusBadge: "Open",
  },
  {
    id: "sch-slot-3",
    timeRange: "01:00 PM – 01:45 PM",
    isBooked: true,
    studentName: "Student #5104",
    subtitle: "PHQ-9",
    modalityText: "Audio / Voice Consultation",
    modalityType: "voice",
    statusBadge: "Confirmed",
    isAnonymous: true,
    intakeNote: "Intake form submitted (PHQ-9 recorded)",
  },
  {
    id: "sch-slot-4",
    timeRange: "02:30 PM – 03:15 PM",
    isBooked: true,
    studentName: "Alex Rivera",
    subtitle: "Bi-weekly Ongoing",
    modalityText: "In-Person Clinic • Room 302",
    modalityType: "in-person",
    statusBadge: "Confirmed",
    room: "Room 302",
  },
  {
    id: "sch-slot-5",
    timeRange: "04:00 PM – 04:45 PM",
    isBooked: false,
    studentName: "Open for booking",
    subtitle: "Standard 45-min individual block",
    modalityText: "Open Slot",
    modalityType: "open",
    statusBadge: "Open",
  },
];

export type CounsellorSettings = {
  email: string;
  phoneNumber: string;
  passwordUpdatedAgo: string;
  credentials: string;
  specialties: string[];
  bio: string;
  defaultDuration: string;
  workingHours: string;
  twoFactorEnabled: boolean;
  quietHoursEnabled: boolean;
  notificationsEnabled: boolean;
  licenseNumber: string;
};

export type AcceptedSessionPayload = {
  requestId: string;
  studentAnonId: string;
  date: string;
  timeRange: string;
  modality: string;
  counselorNote?: string;
  roomId?: string;
};

export type DeclinedSessionPayload = {
  requestId: string;
  studentAnonId: string;
  date: string;
  timeRange: string;
  modality: string;
  reason: string;
  note?: string;
};

export type CallMediaState = {
  micOn: boolean;
  camOn: boolean;
};

// ─── Module Singleton State ───
type State = {
  requests: BookingRequestItem[];
  sessions: SessionItem[];
  calendarBookings: CalendarBooking[];
  alerts: AlertItem[];
  alertsUnread: number;
  messagesUnread: number;
  isAvailable: boolean;
  profile: CounsellorProfileInfo;
  settings: CounsellorSettings;
  lastAcceptedSession: AcceptedSessionPayload | null;
  lastDeclinedSession: DeclinedSessionPayload | null;
  callMediaState: CallMediaState;
  alertPreferences: ClinicalAlertPreferences;
  patients: PatientItem[];
  threads: ChatThread[];
  anonymousSession8812: AnonymousSessionDetailData;
  sessionNotes: Record<string, SessionNotesData>;
  prepNotes: Record<string, string>;
  checkedInSessions: Record<string, boolean>;
  selectedCalendarDay: number;
  selectedCalendarMonth: string;
  scheduleDaySlots: ScheduleDaySlot[];
  heldScheduleSlots: Record<string, boolean>;
};

let state: State = {
  requests: [],
  sessions: [],
  calendarBookings: [],
  alerts: [],
  alertsUnread: 0,
  messagesUnread: 0,
  isAvailable: true,
  profile: { ...MOCK_COUNSELLOR_PROFILE },
  settings: {
    email: "anjali.p@mindease.edu",
    phoneNumber: "+94 77 123 4567",
    passwordUpdatedAgo: "Updated 30d ago",
    credentials: "PhD, MSc Clinical Psych",
    specialties: ["Anxiety & Stress", "Academic Burnout", "CBT", "Crisis Triage"],
    bio: "10+ yrs student clinic...",
    defaultDuration: "45m",
    workingHours: "Mon–Fri (09:00 – 17:00)",
    twoFactorEnabled: true,
    quietHoursEnabled: false,
    notificationsEnabled: true,
    licenseNumber: "License #SL-PSY-4820",
  },
  lastAcceptedSession: null,
  lastDeclinedSession: null,
  callMediaState: {
    micOn: true,
    camOn: true,
  },
  alertPreferences: { ...DEFAULT_CLINICAL_ALERT_PREFERENCES },
  patients: [...MOCK_PATIENTS_LIST],
  threads: [...MOCK_CHAT_THREADS],
  anonymousSession8812: { ...MOCK_ANONYMOUS_SESSION_8812 },
  sessionNotes: {
    "std-maya": { ...MOCK_SESSION_NOTES_MAYA },
    "Student #3189": { ...MOCK_SESSION_NOTES_MAYA },
    "Maya Senanayake": { ...MOCK_SESSION_NOTES_MAYA },
    "session-2": { ...MOCK_SESSION_NOTES_MAYA },
    "Student #8812": {
      studentId: "std-8812",
      studentAnonId: "Student #8812",
      displayName: "Student #8812",
      idMode: "anonymous",
      sessionType: "in-person",
      sessionTypeLabel: "In-Person Consultation",
      timeRelative: "In 5h 15m",
      timeRange: "02:30 PM – 03:15 PM",
      duration: "45 min",
      caseRef: "#ME-8812",
      sessionOrdinal: "Single Intake",
      followUpPriority: "Somatic Grounding & Exam Prep",
      followUpAction:
        "Evaluate routine balance from previous intake note. Practice somatic 4-7-8 breathing exercises.",
      topics: [
        { icon: "🎓", name: "Academic Pressure" },
        { icon: "👥", name: "Social Connection" },
        { icon: "🧘", name: "Grounding Routine" },
      ],
      notes: [
        {
          id: "note-8812-1",
          date: "Aug 15, 2026 • Intake",
          modality: "In-Person",
          status: "Completed",
          content:
            "Initial intake completed. Elevated tension regarding presentation schedules. High receptivity to breathing practices.",
          counselorName: "Dr. Anjali Perera",
          signedStatus: "Signed & Synced",
        },
      ],
    },
    "session-3": {
      studentId: "std-8812",
      studentAnonId: "Student #8812",
      displayName: "Student #8812",
      idMode: "anonymous",
      sessionType: "in-person",
      sessionTypeLabel: "In-Person Consultation",
      timeRelative: "In 5h 15m",
      timeRange: "02:30 PM – 03:15 PM",
      duration: "45 min",
      caseRef: "#ME-8812",
      sessionOrdinal: "Single Intake",
      followUpPriority: "Somatic Grounding & Exam Prep",
      followUpAction:
        "Evaluate routine balance from previous intake note. Practice somatic 4-7-8 breathing exercises.",
      topics: [
        { icon: "🎓", name: "Academic Pressure" },
        { icon: "👥", name: "Social Connection" },
        { icon: "🧘", name: "Grounding Routine" },
      ],
      notes: [
        {
          id: "note-8812-1",
          date: "Aug 15, 2026 • Intake",
          modality: "In-Person",
          status: "Completed",
          content:
            "Initial intake completed. Elevated tension regarding presentation schedules. High receptivity to breathing practices.",
          counselorName: "Dr. Anjali Perera",
          signedStatus: "Signed & Synced",
        },
      ],
    },
  },
  prepNotes: {
    "session-3": MOCK_ANONYMOUS_SESSION_8812.prepNotes,
    "Student #8812": MOCK_ANONYMOUS_SESSION_8812.prepNotes,
  },
  checkedInSessions: {
    "session-3": false,
    "Student #8812": false,
  },
  selectedCalendarDay: 19,
  selectedCalendarMonth: "August 2026",
  scheduleDaySlots: [],
  heldScheduleSlots: {},
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

let unsubscribers: Array<() => void> = [];
let isSyncInitialized = false;

export function cleanupFirebaseSync() {
  unsubscribers.forEach((unsub) => {
    try {
      unsub();
    } catch (_) {}
  });
  unsubscribers = [];
  isSyncInitialized = false;
}

export function initFirebaseSync() {
  if (isSyncInitialized || !isFirebaseConfigured() || !auth || !db) return;
  isSyncInitialized = true;

  onAuthStateChanged(auth, async (user) => {
    cleanupFirebaseSync();
    isSyncInitialized = true;
    if (!user) return;

    // Verify user is an active counsellor or admin before querying protected collections
    const identity = await getCounselorAuthIdentity(user);
    if (!identity?.isCounselor) {
      // Non-counsellor (e.g. student or guest) - preserve rich mock state and skip restricted queries
      return;
    }

    const counselorUid = user.uid;

    // 0. RTDB Heartbeat Presence (if configured)
    if (isRtdbConfigured()) {
      try {
        const unsubPresence = initCounselorPresence(counselorUid);
        unsubscribers.push(unsubPresence);
      } catch (_) {}
    }

    // 1. Sync Bookings (Requests, Sessions, Calendar, and Live Alerts)
    try {
      const bookingsQuery = query(
        collection(db, FIRESTORE_COLLECTIONS.BOOKINGS),
        where("counsellorId", "==", counselorUid)
      );
      const unsubBookings = onSnapshot(
        bookingsQuery,
        (snapshot) => {
          const firestoreRequests: BookingRequestItem[] = [];
          const firestoreSessions: SessionItem[] = [];
          const firestoreCalendar: CalendarBooking[] = [];
          const firestoreAlerts: AlertItem[] = [];

          snapshot.docs.forEach((docSnap) => {
            const d = docSnap.data();
            const id = docSnap.id;
            const studentAnonId = d.studentAnonId || "Anonymous Student";
            const studentId = d.studentId || "";

            // Format timestamps into Asia/Colombo
            const startDate = d.startAt?.toDate ? d.startAt.toDate() : (d.startAt ? new Date(d.startAt) : new Date());
            const endDate = d.endAt?.toDate ? d.endAt.toDate() : (d.endAt ? new Date(d.endAt) : new Date(startDate.getTime() + 45 * 60000));
            const startStr = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Colombo" });
            const endStr = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Colombo" });
            const dateStr = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Colombo" });
            const colomboNow = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Colombo" });
            const colomboStart = startDate.toLocaleDateString("en-US", { timeZone: "Asia/Colombo" });
            const isToday = colomboNow === colomboStart;

            if (d.status === "pending") {
              firestoreRequests.push({
                id,
                studentId,
                studentAnonId,
                displayName: studentAnonId,
                idMode: "anonymous",
                requestedTime: `${startStr}–${endStr}`,
                sessionType: d.sessionType || "video",
                duration: "45m",
                topic: d.notes ? d.notes.replace(/^ANONYMOUS:\s*/, "") : "General Consultation",
                status: "pending",
                slotId: d.slotId,
                date: dateStr,
                startAt: d.startAt,
                endAt: d.endAt,
                notes: d.notes,
              });

              firestoreAlerts.push({
                id: `alert-req-${id}`,
                title: "New Session Request",
                description: `${studentAnonId} requested a ${d.sessionType || "video"} consultation.`,
                timestamp: isToday ? "Today" : dateStr,
                isUnread: true,
                category: "request",
                priority: "urgent",
                iconName: "send-outline",
                actionLabel: "Review Request",
                badgeLabel: "Urgent / Triage",
                refType: "request",
                refId: id,
                studentAnonId,
                createdAt: d.createdAt,
              });
            } else if (d.status === "confirmed") {
              firestoreSessions.push({
                id,
                studentId,
                studentAnonId,
                displayName: studentAnonId,
                idMode: "anonymous",
                timeRange: `${startStr} – ${endStr}`,
                timeRelative: isToday ? "Today" : dateStr,
                date: dateStr,
                isNext: false,
                sessionType: d.sessionType || "video",
                sessionTypeLabel: d.sessionType === "chat" ? "Secured Chat Session" : d.sessionType === "in-person" ? "In-Person Consultation" : "Encrypted Video Consultation",
                noteType: "Focus",
                noteText: d.notes ? d.notes.replace(/^ANONYMOUS:\s*/, "") : "General Consultation",
                status: "confirmed",
                slotId: d.slotId,
                startAt: d.startAt,
                endAt: d.endAt,
              });

              firestoreCalendar.push({
                id: `cal-${id}`,
                timeSlot: startStr,
                studentId,
                studentAnonId,
                displayName: studentAnonId,
                idMode: "anonymous",
                subInfo: `${dateStr} • Intake Complete`,
                timeRange: `${startStr} – ${endStr}`,
                modality: d.sessionType || "video",
                modalityLabel: d.sessionType === "chat" ? "Secure Thread" : "Consultation (45m)",
                securityTag: "E2E Encrypted",
                roomId: `brth-${id.slice(0, 8)}`,
                roomOrDetail: `Room ID: brth-${id.slice(0, 8)}`,
                statusText: "Intake Complete",
              });

              firestoreAlerts.push({
                id: `alert-conf-${id}`,
                title: "Upcoming Session Confirmed",
                description: `Consultation with ${studentAnonId} on ${dateStr} at ${startStr}.`,
                timestamp: isToday ? "Today" : dateStr,
                isUnread: false,
                category: "session",
                priority: "normal",
                iconName: "videocam-outline",
                actionLabel: "Enter Room",
                badgeLabel: "Confirmed",
                refType: "session",
                refId: id,
                studentAnonId,
                createdAt: d.updatedAt || d.createdAt,
              });
            }
          });

          // Sort requests by startAt ascending
          firestoreRequests.sort((a, b) => {
            const timeA = a.startAt?.toMillis?.() || 0;
            const timeB = b.startAt?.toMillis?.() || 0;
            return timeA - timeB;
          });

          // Sort sessions by startAt ascending
          firestoreSessions.sort((a, b) => {
            const timeA = a.startAt?.toMillis?.() || 0;
            const timeB = b.startAt?.toMillis?.() || 0;
            return timeA - timeB;
          });
          if (firestoreSessions.length > 0) {
            firestoreSessions[0].isNext = true;
          }

          // Sort alerts by createdAt descending
          firestoreAlerts.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });

          state = {
            ...state,
            requests: firestoreRequests,
            sessions: firestoreSessions,
            calendarBookings: firestoreCalendar,
            alerts: firestoreAlerts,
            alertsUnread: firestoreAlerts.filter((a) => a.isUnread).length,
          };
          notifyListeners();
        },
        (err: any) => {
          if (!isFirestorePermissionError(err)) {
            console.warn("[counsellorStore] Bookings onSnapshot error:", err?.message || err);
          }
        }
      );
      unsubscribers.push(unsubBookings);
    } catch (err) {
      console.warn("[counsellorStore] Bookings listener setup error:", err);
    }

    // 2. Sync Availability Slots
    try {
      const slotsQuery = query(
        collection(db, "slots"),
        where("counsellorId", "==", counselorUid)
      );
      const unsubSlots = onSnapshot(
        slotsQuery,
        (snapshot) => {
          const firestoreSlots: ScheduleDaySlot[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              timeRange: `${d.startTime || "10:00 AM"} – ${d.endTime || "10:45 AM"}`,
              isBooked: Boolean(d.isBooked),
              studentName: d.isBooked ? (d.bookedStudentAnonId || "Booked Student") : "Open for booking",
              subtitle: d.isBooked ? "Confirmed student booking" : "Available for booking",
              modalityText: d.isBooked ? "Consultation" : "Open Slot",
              modalityType: d.isBooked ? "video" : "open",
              statusBadge: d.isBooked ? "Confirmed" : "Open",
              isAnonymous: true,
            };
          });

          state = {
            ...state,
            scheduleDaySlots: firestoreSlots,
          };
          notifyListeners();
        },
        (err: any) => {
          if (!isFirestorePermissionError(err)) {
            console.warn("[counsellorStore] Slots onSnapshot error:", err?.message || err);
          }
        }
      );
      unsubscribers.push(unsubSlots);
    } catch (err) {
      console.warn("[counsellorStore] Slots listener setup error:", err);
    }

    // 4. Sync Counselor Preferences
    try {
      const prefDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELOR_PREFERENCES, counselorUid);
      const unsubPrefs = onSnapshot(
        prefDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const prefData = docSnap.data() as Partial<ClinicalAlertPreferences>;
            state = {
              ...state,
              alertPreferences: {
                ...state.alertPreferences,
                ...prefData,
              },
            };
            notifyListeners();
          }
        },
        (err: any) => {
          if (err?.code !== "permission-denied") {
            console.warn("[counsellorStore] Prefs onSnapshot error:", err?.message || err);
          }
        }
      );
      unsubscribers.push(unsubPrefs);
    } catch (err) {
      // Graceful fallback to mock data
    }

    // 5. Sync Counselor Profile & Availability
    try {
      const counselorDocRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELORS, counselorUid);
      const unsubCounselor = onSnapshot(
        counselorDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            state = {
              ...state,
              isAvailable: typeof data.isAvailable === "boolean" ? data.isAvailable : state.isAvailable,
              profile: {
                ...state.profile,
                fullName: data.fullName || state.profile.fullName,
                title: data.title || state.profile.title,
                isAvailable: typeof data.isAvailable === "boolean" ? data.isAvailable : state.profile.isAvailable,
              },
            };
            notifyListeners();
          }
        },
        (err: any) => {
          if (err?.code !== "permission-denied") {
            console.warn("[counsellorStore] Profile onSnapshot error:", err?.message || err);
          }
        }
      );
      unsubscribers.push(unsubCounselor);
    } catch (err) {
      // Graceful fallback to mock data
    }

    // 6. Sync Clinical Notes for this counselor
    try {
      const notesQuery = query(
        collection(db, FIRESTORE_COLLECTIONS.CLINICAL_NOTES),
        where("counselorId", "==", counselorUid)
      );
      const unsubNotes = onSnapshot(
        notesQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const updatedNotesMap: Record<string, SessionNotesData> = { ...state.sessionNotes };
            snapshot.docs.forEach((docSnap) => {
              const d = docSnap.data();
              const patientKey = d.patientId || "std-maya";
              const noteEntry: ClinicalNoteEntry = {
                id: docSnap.id,
                date: d.date || "Today",
                content: d.content || "",
                status: d.status || "Completed",
                signedStatus: d.signedStatus || "Signed & Synced",
                counselorName: d.counselorName || state.profile.fullName,
                modality: d.modality || "Consultation",
              };
              if (updatedNotesMap[patientKey]) {
                const existing = updatedNotesMap[patientKey].notes || [];
                if (!existing.some((n) => n.id === noteEntry.id)) {
                  updatedNotesMap[patientKey] = {
                    ...updatedNotesMap[patientKey],
                    notes: [noteEntry, ...existing],
                  };
                }
              }
            });
            state = {
              ...state,
              sessionNotes: updatedNotesMap,
            };
            notifyListeners();
          }
        },
        (err: any) => {
          if (!isFirestorePermissionError(err)) {
            console.warn("[counsellorStore] Clinical notes onSnapshot error:", err?.message || err);
          }
        }
      );
      unsubscribers.push(unsubNotes);
    } catch (err) {
      // Graceful fallback
    }
  });
}

// ─── Exported Actions ───

export const counsellorStore = {
  getState() {
    return state;
  },

  // Confirm request acceptance using real Firestore atomic batch
  confirmAcceptance(requestId: string, counselorNote?: string): AcceptedSessionPayload {
    const targetReq = state.requests.find((r) => r.id === requestId) || state.requests[0];
    const studentAnonId = targetReq?.studentAnonId || "Anonymous Student";

    // 1. Remove from pending requests
    const updatedRequests = state.requests.filter((r) => r.id !== targetReq?.id);

    // 2. Add to Today's sessions
    const newSession: SessionItem = {
      id: targetReq?.id || `session-${Date.now()}`,
      studentId: targetReq?.studentId || "",
      studentAnonId,
      displayName: studentAnonId,
      idMode: "anonymous",
      timeRange: targetReq?.requestedTime || "10:00 AM – 10:45 AM",
      timeRelative: targetReq?.date || "Today",
      date: targetReq?.date || "Today",
      isNext: false,
      sessionType: targetReq?.sessionType || "video",
      sessionTypeLabel:
        targetReq?.sessionType === "video"
          ? "Encrypted Video Consultation"
          : targetReq?.sessionType === "chat"
          ? "Secured Chat Session"
          : "In-Person Consultation",
      noteType: "Focus",
      noteText: counselorNote || targetReq?.topic || "General Consultation",
      status: "confirmed",
      slotId: targetReq?.slotId,
    };

    // 3. Add to Calendar bookings
    const newCalendarBooking: CalendarBooking = {
      id: `cal-booking-${Date.now()}`,
      timeSlot: targetReq?.requestedTime?.split("–")[0]?.trim() || "10:00 AM",
      studentId: targetReq?.studentId || "",
      studentAnonId,
      displayName: studentAnonId,
      idMode: "anonymous",
      subInfo: `${targetReq?.date || "Today"} • Confirmed`,
      timeRange: targetReq?.requestedTime || "10:00 AM – 10:45 AM",
      modality: targetReq?.sessionType || "video",
      modalityLabel: targetReq?.sessionType === "chat" ? "Secure Thread" : "Consultation (45m)",
      securityTag: "E2E Encrypted",
      roomOrDetail: `Room ID: brth-${targetReq?.id ? targetReq.id.slice(0, 8) : "sec"}`,
      roomId: `brth-${targetReq?.id ? targetReq.id.slice(0, 8) : "sec"}`,
      isJustAdded: true,
      statusText: "Intake Complete",
    };

    const acceptedPayload: AcceptedSessionPayload = {
      requestId: targetReq?.id || requestId,
      studentAnonId,
      date: targetReq?.date || "Today",
      timeRange: targetReq?.requestedTime || "10:00–10:45 AM",
      modality:
        targetReq?.sessionType === "video"
          ? "Encrypted Video Call (45m)"
          : targetReq?.sessionType === "chat"
          ? "Secured Chat Session"
          : "In-Person Consultation",
      counselorNote,
      roomId: `brth-${targetReq?.id ? targetReq.id.slice(0, 8) : "sec"}`,
    };

    state = {
      ...state,
      requests: updatedRequests,
      sessions: [newSession, ...state.sessions],
      calendarBookings: [newCalendarBooking, ...state.calendarBookings],
      lastAcceptedSession: acceptedPayload,
    };

    notifyListeners();

    // Background Firebase atomic batch write (bookings, slots, careLinks)
    if (isFirebaseConfigured() && auth.currentUser && targetReq?.id) {
      const uid = auth.currentUser.uid;
      (async () => {
        try {
          const studentId = targetReq.studentId;
          const batch = writeBatch(db);

          // 1. Update Booking status to confirmed
          const bookingRef = doc(db, FIRESTORE_COLLECTIONS.BOOKINGS, targetReq.id);
          batch.update(bookingRef, {
            status: "confirmed",
            updatedAt: serverTimestamp(),
          });

          // 2. Mark slot booked if slotId exists
          if (targetReq.slotId) {
            const slotRef = doc(db, "slots", targetReq.slotId);
            batch.update(slotRef, {
              isBooked: true,
              bookingId: targetReq.id,
              updatedAt: serverTimestamp(),
            });
          }

          // 3. Atomically create careLinks/{counsellorId}_{studentId}
          if (studentId) {
            const careLinkId = `${uid}_${studentId}`;
            const existingLinks = await getDocs(
              query(
                collection(db, "careLinks"),
                where("counsellorId", "==", uid),
                where("studentId", "==", studentId)
              )
            );
            if (existingLinks.empty) {
              const careLinkRef = doc(db, "careLinks", careLinkId);
              batch.set(careLinkRef, {
                counsellorId: uid,
                studentId: studentId,
                bookingId: targetReq.id,
                createdAt: serverTimestamp(),
              });
            }
          }

          // Commit all operations atomically
          await batch.commit();
        } catch (e: any) {
          if (!isFirestorePermissionError(e)) {
            console.warn("[counsellorStore] Firestore confirmAcceptance atomic batch sync error:", e?.message || e);
          }
        }
      })();
    }

    return acceptedPayload;
  },

  // Toggle availability (shared with Dashboard & Settings)
  toggleAvailability(val?: boolean) {
    const nextVal = typeof val === "boolean" ? val : !state.isAvailable;
    state = {
      ...state,
      isAvailable: nextVal,
      profile: {
        ...state.profile,
        isAvailable: nextVal,
      },
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      setDoc(
        doc(db, FIRESTORE_COLLECTIONS.COUNSELORS, uid),
        { isAvailable: nextVal, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch((e) => {
        if (!isFirestorePermissionError(e)) {
          console.warn("[counsellorStore] toggleAvailability sync error:", e);
        }
      });
    }
  },

  // Update profile avatar in store
  setProfileAvatar(avatarUrl: string) {
    state = {
      ...state,
      profile: {
        ...state.profile,
        avatarUrl,
      },
    };
    notifyListeners();
  },

  // Update profile details in store
  updateProfile(updated: Partial<CounsellorProfileInfo>) {
    state = {
      ...state,
      profile: {
        ...state.profile,
        ...updated,
      },
    };
    notifyListeners();
  },

  // Toggle 2FA switch
  toggleTwoFactor() {
    state = {
      ...state,
      settings: {
        ...state.settings,
        twoFactorEnabled: !state.settings.twoFactorEnabled,
      },
    };
    notifyListeners();
  },

  // Toggle quiet hours
  toggleQuietHours() {
    state = {
      ...state,
      settings: {
        ...state.settings,
        quietHoursEnabled: !state.settings.quietHoursEnabled,
      },
    };
    notifyListeners();
  },

  // Update generic settings
  updateSettings(partial: Partial<CounsellorSettings>) {
    state = {
      ...state,
      settings: {
        ...state.settings,
        ...partial,
      },
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      setDoc(
        doc(db, FIRESTORE_COLLECTIONS.COUNSELORS, uid),
        { ...partial, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch((e) => {
        if (!isFirestorePermissionError(e)) {
          console.warn("[counsellorStore] updateSettings sync error:", e);
        }
      });
    }
  },

  // Block an open calendar slot
  blockSlot(slotId: string) {
    state = {
      ...state,
      calendarBookings: state.calendarBookings.map((b) =>
        b.id === slotId ? { ...b, isBlocked: true, displayName: "Blocked Slot (Paperwork)" } : b
      ),
    };
    notifyListeners();
  },

  // Mark a single alert as read
  markAlertAsRead(alertId: string) {
    let wasUnread = false;
    state = {
      ...state,
      alerts: state.alerts.map((a) => {
        if (a.id === alertId) {
          if (a.isUnread) wasUnread = true;
          return { ...a, isUnread: false };
        }
        return a;
      }),
      alertsUnread: wasUnread ? Math.max(0, state.alertsUnread - 1) : state.alertsUnread,
    };
    notifyListeners();
  },

  // Mark all alerts as read
  markAlertsAsRead() {
    state = {
      ...state,
      alerts: state.alerts.map((a) => ({ ...a, isUnread: false })),
      alertsUnread: 0,
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      (async () => {
        try {
          const unreadSnap = await getDocs(
            query(
              collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
              where("recipientId", "==", uid),
              where("isUnread", "==", true)
            )
          );
          unreadSnap.forEach((d) => {
            updateDoc(d.ref, { isUnread: false }).catch(() => {});
          });
        } catch (_) {}
      })();
    }
  },

  // Decline booking request using real Firestore updates
  declineRequest(
    requestId: string,
    reason: string = "Schedule conflict",
    note?: string
  ): DeclinedSessionPayload {
    const targetReq = state.requests.find((r) => r.id === requestId) || state.requests[0];
    const studentAnonId = targetReq?.studentAnonId || "Anonymous Student";

    // 1. Remove from pending requests
    const updatedRequests = state.requests.filter((r) => r.id !== targetReq?.id);

    // 2. Add declined audit alert
    const newAlert: AlertItem = {
      id: `alert-declined-${Date.now()}`,
      title: "Request Declined",
      description: `Booking request for ${studentAnonId} declined (${reason}). Note dispatched securely.`,
      timestamp: "Just now",
      isUnread: true,
      category: "session",
      priority: "normal",
      iconName: "close-circle-outline",
      badgeLabel: "Declined",
    };

    const declinedPayload: DeclinedSessionPayload = {
      requestId: targetReq?.id || requestId,
      studentAnonId,
      date: targetReq?.date || "Upcoming",
      timeRange: targetReq?.requestedTime || "10:00–10:45 AM",
      modality:
        targetReq?.sessionType === "video"
          ? "Video Consultation (45 min)"
          : targetReq?.sessionType === "chat"
          ? "Secured Chat Session"
          : "In-Person Consultation",
      reason,
      note,
    };

    state = {
      ...state,
      requests: updatedRequests,
      alerts: [newAlert, ...state.alerts],
      alertsUnread: state.alertsUnread + 1,
      lastDeclinedSession: declinedPayload,
    };

    notifyListeners();

    // Background Firebase write (updates bookings/{id} and frees slots/{id} if linked)
    if (isFirebaseConfigured() && auth.currentUser && targetReq?.id) {
      (async () => {
        try {
          const batch = writeBatch(db);
          const bookingRef = doc(db, FIRESTORE_COLLECTIONS.BOOKINGS, targetReq.id);
          batch.update(bookingRef, {
            status: "declined",
            cancelReason: reason,
            updatedAt: serverTimestamp(),
          });

          if (targetReq.slotId) {
            const slotRef = doc(db, "slots", targetReq.slotId);
            batch.update(slotRef, {
              isBooked: false,
              bookingId: null,
              updatedAt: serverTimestamp(),
            });
          }

          await batch.commit();
        } catch (e: any) {
          if (!isFirestorePermissionError(e)) {
            console.warn("[counsellorStore] Firestore declineRequest sync error:", e?.message || e);
          }
        }
      })();
    }

    return declinedPayload;
  },

  // Publish availability slots in bulk to Firestore slots collection
  async publishAvailabilityBatch(slots: PublishSlotInput[]): Promise<number> {
    if (!slots || slots.length === 0) return 0;

    const newDaySlots: ScheduleDaySlot[] = slots.map((s) => ({
      id: `slot_${s.dateKey}_${s.startTime.replace(/[^a-zA-Z0-9]/g, "")}`,
      timeRange: `${s.startTime} – ${s.endTime}`,
      isBooked: false,
      studentName: "Open for booking",
      subtitle: `${s.dateDisplay} • Available`,
      modalityText: s.sessionTypes.join(", "),
      modalityType: "open",
      statusBadge: "Open",
      isAnonymous: true,
    }));

    state = {
      ...state,
      scheduleDaySlots: [...state.scheduleDaySlots, ...newDaySlots],
      isAvailable: true,
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        const batch = writeBatch(db);
        const timeStrings: string[] = [];

        slots.forEach((s) => {
          const dateSlug = s.dateKey.replace(/-/g, "");
          const timeSlug = s.startTime.replace(/[^a-zA-Z0-9]/g, "");
          const slotId = `slot_${uid}_${dateSlug}_${timeSlug}`;
          const slotDocRef = doc(db, "slots", slotId);

          batch.set(
            slotDocRef,
            {
              id: slotId,
              counsellorId: uid,
              dateKey: s.dateKey,
              dateDisplay: s.dateDisplay,
              startTime: s.startTime,
              endTime: s.endTime,
              startAt: Timestamp.fromDate(s.startAt),
              endAt: Timestamp.fromDate(s.endAt),
              sessionTypes: s.sessionTypes,
              isBooked: false,
              bookingId: null,
              bookedStudentAnonId: null,
              status: "open",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          timeStrings.push(s.startTime);
        });

        const counsellorRef = doc(db, FIRESTORE_COLLECTIONS.COUNSELORS, uid);
        const dayNumStr = slots[0]?.startAt ? String(slots[0].startAt.getDate()) : String(new Date().getDate());
        batch.set(
          counsellorRef,
          {
            isAvailable: true,
            availableDate: dayNumStr,
            availableSlots: timeStrings,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await batch.commit();
      } catch (e) {
        if (!isFirestorePermissionError(e)) {
          console.warn("[counsellorStore] publishAvailabilityBatch error:", e);
        }
      }
    }

    return slots.length;
  },

  // Toggle mic
  toggleMic() {
    state = {
      ...state,
      callMediaState: {
        ...state.callMediaState,
        micOn: !state.callMediaState.micOn,
      },
    };
    notifyListeners();
  },

  // Toggle cam
  toggleCam() {
    state = {
      ...state,
      callMediaState: {
        ...state.callMediaState,
        camOn: !state.callMediaState.camOn,
      },
    };
    notifyListeners();
  },

  // Set media state
  setCallMediaState(partial: Partial<CallMediaState>) {
    state = {
      ...state,
      callMediaState: {
        ...state.callMediaState,
        ...partial,
      },
    };
    notifyListeners();
  },

  // Complete an active video session
  completeSession(sessionId: string) {
    state = {
      ...state,
      sessions: state.sessions.map((s) =>
        s.id === sessionId || s.studentAnonId === "Student #4021"
          ? { ...s, status: "completed" as const, isNext: false }
          : s
      ),
    };
    notifyListeners();
  },

  // Decrement unread messages
  decrementMessages() {
    state = {
      ...state,
      messagesUnread: Math.max(0, state.messagesUnread - 1),
    };
    notifyListeners();
  },

  // Update clinical alert preferences
  updateAlertPreferences(partial: Partial<ClinicalAlertPreferences>) {
    state = {
      ...state,
      alertPreferences: {
        ...state.alertPreferences,
        ...partial,
      },
      // Keep quiet hours synced across general settings and alert preferences
      settings: {
        ...state.settings,
        ...(typeof partial.quietHoursDutyOff === "boolean"
          ? { quietHoursEnabled: partial.quietHoursDutyOff }
          : {}),
      },
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      setDoc(
        doc(db, FIRESTORE_COLLECTIONS.COUNSELOR_PREFERENCES, uid),
        { ...partial, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch((e) => {
        if (!isFirestorePermissionError(e)) {
          console.warn("[counsellorStore] updateAlertPreferences sync error:", e);
        }
      });
    }
  },

  // Send opening message to student from waiting room
  sendOpeningMessage(studentAnonId: string, text: string): ChatThread {
    let existingThread = state.threads.find(
      (t) => t.studentAnonId.toLowerCase() === studentAnonId.toLowerCase()
    );

    if (existingThread) {
      existingThread = {
        ...existingThread,
        lastMessage: `"${text}"`,
        lastMessageTime: "Just now",
        deliveryStatus: "delivered",
      };
      state = {
        ...state,
        threads: state.threads.map((t) =>
          t.id === existingThread!.id ? existingThread! : t
        ),
      };
    } else {
      const newThread: ChatThread = {
        id: `chat-${Date.now()}`,
        studentId: `std-${studentAnonId.replace(/[^0-9]/g, "") || "4021"}`,
        studentAnonId,
        displayName: studentAnonId,
        idMode: "anonymous",
        isOnline: true,
        lastMessage: `"${text}"`,
        lastMessageTime: "Just now",
        unreadCount: 0,
        deliveryStatus: "delivered",
        sessionTag: "Active Consultation",
        triageLevel: "normal",
        status: "active",
      };
      existingThread = newThread;
      state = {
        ...state,
        threads: [newThread, ...state.threads],
      };
    }

    notifyListeners();
    return existingThread;
  },

  // Clear all conversations (demonstrates and switches Messages tab to empty state)
  clearAllConversations() {
    state = {
      ...state,
      threads: [],
      messagesUnread: 0,
    };
    notifyListeners();
  },

  // Reset conversations back to default mock list
  resetConversations() {
    state = {
      ...state,
      threads: [...MOCK_CHAT_THREADS],
      messagesUnread: 3,
    };
    notifyListeners();
  },

  // Add a newly scheduled session (from Add Session screen)
  addSession(input: NewSessionFormInput): SessionItem {
    const newId = `session-${Date.now()}`;
    const isToday =
      input.date.toLowerCase().includes("today") ||
      input.date.toLowerCase().includes("aug 18") ||
      input.date.toLowerCase().includes("monday");

    const newSession: SessionItem = {
      id: newId,
      studentId: input.studentId,
      studentAnonId: input.studentAnonId,
      displayName: input.displayName,
      idMode: input.idMode,
      timeRange: `${input.startTime} – ${input.endTime}`,
      timeRelative: isToday ? "Today" : input.date.includes("Tomorrow") ? "Tomorrow" : "Upcoming",
      date: input.date,
      isNext: false,
      sessionType: input.sessionType,
      sessionTypeLabel:
        input.sessionType === "video"
          ? "Encrypted Video Consultation"
          : input.sessionType === "chat"
          ? "Secured Chat Session"
          : `In-Person • ${input.locationOrRoom || "Room 302"}`,
      noteType: "Focus",
      noteText:
        input.focus?.trim() ||
        (input.selectedTags.length > 0
          ? input.selectedTags.join(", ")
          : "General Consultation"),
      status: "confirmed",
    };

    // Also add to calendarBookings
    const newCalendarBooking: CalendarBooking = {
      id: `cal-${Date.now()}`,
      timeSlot: input.startTime,
      studentId: input.studentId,
      studentAnonId: input.studentAnonId,
      displayName: input.displayName,
      idMode: input.idMode,
      subInfo: input.isAnonymous ? "Anonymous Profile" : "Intake Scheduled",
      timeRange: `${input.startTime} - ${input.endTime}`,
      modality: input.sessionType,
      modalityLabel: `Consultation (${input.duration})`,
      securityTag: "Encrypted",
      roomOrDetail:
        input.sessionType === "in-person"
          ? input.locationOrRoom || "Room 302"
          : undefined,
      isJustAdded: true,
      statusText: "Scheduled",
    };

    // Add notification alert
    const newAlert: AlertItem = {
      id: `alert-add-${Date.now()}`,
      title: "New Session Scheduled",
      description: `Appointment with ${input.displayName} confirmed for ${input.date} at ${input.startTime}.`,
      timestamp: "Just now",
      isUnread: true,
      category: "session",
      priority: "normal",
      iconName: "calendar-outline",
      actionLabel: "View Schedule",
      badgeLabel: "Scheduled",
    };

    state = {
      ...state,
      sessions: [newSession, ...state.sessions],
      calendarBookings: [...state.calendarBookings, newCalendarBooking],
      alerts: [newAlert, ...state.alerts],
      alertsUnread: state.alertsUnread + 1,
    };

    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      (async () => {
        try {
          // 1. Write to counsellor sessions collection
          await addDoc(collection(db, FIRESTORE_COLLECTIONS.SESSIONS), {
            counselorId: uid,
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

          // 2. Also write to root bookings collection (aligned with Member 1 rules)
          try {
            await addDoc(collection(db, FIRESTORE_COLLECTIONS.BOOKINGS), {
              counsellorId: uid,
              studentId: input.studentId,
              studentAnonId: input.studentAnonId,
              sessionType: input.sessionType,
              status: "confirmed",
              notes: input.focus?.trim() || "General Consultation",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (_) {}

          // 3. Write in-app notification
          await addDoc(collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS), {
            recipientId: uid,
            title: "New Session Scheduled",
            description: `Appointment with ${input.displayName} confirmed for ${input.date} at ${input.startTime}.`,
            category: "session",
            priority: "normal",
            isUnread: true,
            createdAt: serverTimestamp(),
          });
        } catch (e: any) {
          if (!isFirestorePermissionError(e)) {
            console.warn("[counsellorStore] Firestore addSession sync error:", e?.message || e);
          }
        }
      })();
    } else {
      console.log("[counsellorStore] Local mode: Session added to reactive store without cloud auth session.");
    }

    return newSession;
  },

  // Add / update clinical prep notes
  addPrepNote(sessionIdOrAnonId: string, noteText: string) {
    const updatedPrepNotes = {
      ...state.prepNotes,
      [sessionIdOrAnonId]: noteText,
      "session-3": noteText,
      "Student #8812": noteText,
    };

    const updatedSessions = state.sessions.map((s) =>
      s.id === sessionIdOrAnonId || s.studentAnonId === sessionIdOrAnonId
        ? { ...s, noteText }
        : s
    );

    state = {
      ...state,
      prepNotes: updatedPrepNotes,
      anonymousSession8812: {
        ...state.anonymousSession8812,
        prepNotes: noteText,
        prepNoteUpdatedAt: "Just now",
      },
      sessions: updatedSessions,
    };
    notifyListeners();
  },

  // Toggle student check-in status
  toggleCheckIn(sessionIdOrAnonId: string): boolean {
    const current = !!state.checkedInSessions[sessionIdOrAnonId];
    const next = !current;
    state = {
      ...state,
      checkedInSessions: {
        ...state.checkedInSessions,
        [sessionIdOrAnonId]: next,
        "session-3": next,
        "Student #8812": next,
      },
      anonymousSession8812: {
        ...state.anonymousSession8812,
        isCheckedIn: next,
      },
    };
    notifyListeners();
    return next;
  },

  // Add clinical note entry
  addClinicalNote(key: string, content: string, modality: string = "Chat") {
    const existingNotes =
      state.sessionNotes[key] ||
      state.sessionNotes["std-maya"] ||
      MOCK_SESSION_NOTES_MAYA;

    const newNoteEntry: ClinicalNoteEntry = {
      id: `note-${Date.now()}`,
      date: "Today, Aug 18, 2026 • Follow-up",
      modality,
      status: "Completed",
      content,
      counselorName: "Dr. Anjali Perera",
      signedStatus: "Signed & Synced",
    };

    const updatedNoteData: SessionNotesData = {
      ...existingNotes,
      notes: [newNoteEntry, ...existingNotes.notes],
    };

    // Update noteText preview on session card in Dashboard
    const updatedSessions = state.sessions.map((s) =>
      s.studentId === key ||
      s.studentAnonId === key ||
      s.displayName === existingNotes.displayName
        ? {
            ...s,
            noteText:
              content.slice(0, 80) + (content.length > 80 ? "..." : ""),
          }
        : s
    );

    state = {
      ...state,
      sessionNotes: {
        ...state.sessionNotes,
        [key]: updatedNoteData,
        [existingNotes.studentId]: updatedNoteData,
        [existingNotes.studentAnonId]: updatedNoteData,
      },
      sessions: updatedSessions,
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      addDoc(collection(db, FIRESTORE_COLLECTIONS.CLINICAL_NOTES), {
        patientId: key,
        counselorId: uid,
        counselorName: state.profile.fullName || "Dr. Anjali Perera",
        content,
        modality,
        status: "Completed",
        signedStatus: "Signed & Synced",
        createdAt: serverTimestamp(),
      }).catch((e) => {
        if (!isFirestorePermissionError(e)) {
          console.warn("[counsellorStore] addClinicalNote sync error:", e);
        }
      });
    }
  },

  // Cancel scheduled session
  cancelSession(sessionIdOrAnonId: string, reason: string = "Canceled by counselor") {
    const target = state.sessions.find(
      (s) => s.id === sessionIdOrAnonId || s.studentAnonId === sessionIdOrAnonId
    );
    const studentLabel = target?.displayName || target?.studentAnonId || sessionIdOrAnonId;

    const updatedSessions = state.sessions.filter(
      (s) => s.id !== sessionIdOrAnonId && s.studentAnonId !== sessionIdOrAnonId
    );

    const cancelAlert: AlertItem = {
      id: `alert-cancel-${Date.now()}`,
      title: "Session Canceled",
      description: `Session with ${studentLabel} canceled (${reason}). Notification logged.`,
      timestamp: "Just now",
      isUnread: true,
      category: "session",
      priority: "normal",
      iconName: "close-circle-outline",
      badgeLabel: "Canceled",
    };

    state = {
      ...state,
      sessions: updatedSessions,
      alerts: [cancelAlert, ...state.alerts],
      alertsUnread: state.alertsUnread + 1,
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      (async () => {
        try {
          if (sessionIdOrAnonId && !sessionIdOrAnonId.startsWith("session-")) {
            await updateDoc(doc(db, FIRESTORE_COLLECTIONS.SESSIONS, sessionIdOrAnonId), {
              status: "cancelled",
              cancelReason: reason,
              cancelledAt: serverTimestamp(),
            });
          }
          await addDoc(collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS), {
            recipientId: uid,
            title: "Session Canceled",
            description: `Session with ${studentLabel} canceled (${reason}). Notification logged.`,
            category: "session",
            priority: "normal",
            isUnread: true,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          if (!isFirestorePermissionError(e)) {
            console.warn("[counsellorStore] Firestore cancelSession sync error:", e);
          }
        }
      })();
    }
  },

  // Reschedule session
  rescheduleSession(sessionIdOrAnonId: string, newTimeRange: string) {
    const updatedSessions = state.sessions.map((s) =>
      s.id === sessionIdOrAnonId || s.studentAnonId === sessionIdOrAnonId
        ? { ...s, timeRange: newTimeRange }
        : s
    );
    state = {
      ...state,
      sessions: updatedSessions,
    };
    notifyListeners();
  },

  // Set selected calendar day (shared across Day & Month views)
  setSelectedCalendarDay(day: number) {
    state = {
      ...state,
      selectedCalendarDay: day,
    };
    notifyListeners();
  },

  // Set selected calendar month
  setSelectedCalendarMonth(month: string) {
    state = {
      ...state,
      selectedCalendarMonth: month,
    };
    notifyListeners();
  },

  // Toggle hold/block for an open slot in Schedule
  toggleHoldScheduleSlot(slotId: string): boolean {
    const currentHeld = !!state.heldScheduleSlots[slotId];
    const nextHeld = !currentHeld;
    const updatedHeld = {
      ...state.heldScheduleSlots,
      [slotId]: nextHeld,
    };
    const updatedSlots = state.scheduleDaySlots.map((s) =>
      s.id === slotId ? { ...s, isHeld: nextHeld } : s
    );
    state = {
      ...state,
      heldScheduleSlots: updatedHeld,
      scheduleDaySlots: updatedSlots,
    };
    notifyListeners();
    return nextHeld;
  },

  // Send a confidential chat message (syncs with chats/{chatId}/messages)
  async sendChatMessage(chatId: string, text: string): Promise<ChatBubble> {
    const counselorUid = auth?.currentUser?.uid || "coun_anjali_01";
    const newBubble: ChatBubble = {
      id: `msg-${Date.now()}`,
      senderId: counselorUid,
      senderRole: "counsellor",
      text,
      timestamp: "Just now",
      deliveryStatus: "delivered",
    };

    if (isFirebaseConfigured() && auth.currentUser) {
      try {
        const messagesCol = collection(db, "chats", chatId, "messages");
        await addDoc(messagesCol, {
          senderId: counselorUid,
          senderRole: "counsellor",
          text,
          createdAt: serverTimestamp(),
          deliveryStatus: "delivered",
        });
      } catch (e) {
        if (!isFirestorePermissionError(e)) {
          console.warn("[counsellorStore] sendChatMessage error:", e);
        }
      }
    }

    return newBubble;
  },

  // Save availability slots to root slots collection (aligned with firestore.rules)
  async saveScheduleSlots(slots: TimeSlot[]) {
    state = {
      ...state,
      scheduleDaySlots: state.scheduleDaySlots.map((ds) => {
        const matching = slots.find((s) => s.timeRange === ds.timeRange);
        return matching ? { ...ds, isHeld: matching.status === "closed" } : ds;
      }),
    };
    notifyListeners();

    if (isFirebaseConfigured() && auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        const batch = writeBatch(db);
        slots.forEach((slot) => {
          const timeSlug = slot.timeRange.replace(/[^a-zA-Z0-9]/g, "");
          const slotDocRef = doc(db, "slots", `slot_${uid}_${timeSlug}`);
          batch.set(
            slotDocRef,
            {
              counsellorId: uid,
              timeRange: slot.timeRange,
              status: slot.status,
              isBooked: slot.status === "booked",
              bookedStudentAnonId: slot.bookedStudentAnonId || null,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        });
        await batch.commit();
      } catch (e) {
        if (!isFirestorePermissionError(e)) {
          console.warn("[counsellorStore] saveScheduleSlots error:", e);
        }
      }
    }
  },

  initFirebaseSync,
  cleanupFirebaseSync,
};

// ─── React Hook for Functional Components ───
export function useCounsellorStore() {
  const [storeState, setStoreState] = useState(counsellorStore.getState());

  useEffect(() => {
    initFirebaseSync();
    const handleUpdate = () => {
      setStoreState(counsellorStore.getState());
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    ...storeState,
    initFirebaseSync,
    cleanupFirebaseSync,

    confirmAcceptance: counsellorStore.confirmAcceptance,
    declineRequest: counsellorStore.declineRequest,
    publishAvailabilityBatch: counsellorStore.publishAvailabilityBatch,
    toggleMic: counsellorStore.toggleMic,
    toggleCam: counsellorStore.toggleCam,
    setCallMediaState: counsellorStore.setCallMediaState,
    completeSession: counsellorStore.completeSession,
    toggleAvailability: counsellorStore.toggleAvailability,
    toggleTwoFactor: counsellorStore.toggleTwoFactor,
    toggleQuietHours: counsellorStore.toggleQuietHours,
    updateSettings: counsellorStore.updateSettings,
    updateProfile: counsellorStore.updateProfile,
    setProfileAvatar: counsellorStore.setProfileAvatar,
    blockSlot: counsellorStore.blockSlot,
    markAlertAsRead: counsellorStore.markAlertAsRead,
    markAlertsAsRead: counsellorStore.markAlertsAsRead,
    decrementMessages: counsellorStore.decrementMessages,
    updateAlertPreferences: counsellorStore.updateAlertPreferences,
    sendOpeningMessage: counsellorStore.sendOpeningMessage,
    clearAllConversations: counsellorStore.clearAllConversations,
    resetConversations: counsellorStore.resetConversations,
    addSession: counsellorStore.addSession,
    addPrepNote: counsellorStore.addPrepNote,
    toggleCheckIn: counsellorStore.toggleCheckIn,
    addClinicalNote: counsellorStore.addClinicalNote,
    cancelSession: counsellorStore.cancelSession,
    rescheduleSession: counsellorStore.rescheduleSession,
    setSelectedCalendarDay: counsellorStore.setSelectedCalendarDay,
    setSelectedCalendarMonth: counsellorStore.setSelectedCalendarMonth,
    toggleHoldScheduleSlot: counsellorStore.toggleHoldScheduleSlot,
    sendChatMessage: counsellorStore.sendChatMessage,
    saveScheduleSlots: counsellorStore.saveScheduleSlots,

    // RTDB Real-time signaling
    setTypingIndicator,
    subscribeToTypingIndicators,
    joinCallSignaling,
    updateCallMedia,
    subscribeToCallSignaling,
    endCallSignaling,
  };
}
