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
} from "@/types/counsellorDetailScreens";
import { ChatThread } from "@/types/counsellorMessages";
import {
  DEFAULT_CLINICAL_ALERT_PREFERENCES,
  MOCK_PATIENTS_LIST,
} from "@/services/mockDetailScreensData";
import { MOCK_CHAT_THREADS } from "@/services/mockMessagesData";

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
};

let state: State = {
  requests: [...MOCK_PENDING_REQUESTS],
  sessions: [...MOCK_SESSIONS_TODAY],
  calendarBookings: [...INITIAL_CALENDAR_BOOKINGS],
  alerts: [...MOCK_ALERTS_TODAY, ...MOCK_ALERTS_EARLIER],
  alertsUnread: 3,
  messagesUnread: 3,
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
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

// ─── Exported Actions ───

export const counsellorStore = {
  getState() {
    return state;
  },

  // Confirm request acceptance (e.g. Student #5104)
  confirmAcceptance(requestId: string, counselorNote?: string): AcceptedSessionPayload {
    const targetReq = state.requests.find((r) => r.id === requestId) || state.requests[0];
    const studentAnonId = targetReq?.studentAnonId || "Student #5104";

    // 1. Remove from pending requests
    const updatedRequests = state.requests.filter((r) => r.id !== targetReq.id);

    // 2. Add to Today's sessions
    const newSession: SessionItem = {
      id: `session-${Date.now()}`,
      studentId: targetReq.studentId,
      studentAnonId: studentAnonId,
      displayName: targetReq.displayName,
      idMode: targetReq.idMode,
      timeRange: targetReq.requestedTime || "10:00 AM – 10:45 AM",
      timeRelative: "Tomorrow",
      isNext: false,
      sessionType: targetReq.sessionType || "video",
      sessionTypeLabel:
        targetReq.sessionType === "video"
          ? "Encrypted Video Consultation"
          : targetReq.sessionType === "chat"
          ? "Secured Chat Session"
          : "In-Person Consultation",
      noteType: "Focus",
      noteText: counselorNote || targetReq.topic,
      status: "confirmed",
    };

    // 3. Add to Calendar bookings with JUST ADDED status
    const newCalendarBooking: CalendarBooking = {
      id: `cal-booking-${Date.now()}`,
      timeSlot: "10:00 AM",
      studentId: targetReq.studentId,
      studentAnonId: studentAnonId,
      displayName: targetReq.displayName,
      idMode: targetReq.idMode,
      subInfo: "Anonymous • Intake Complete",
      timeRange: "10:00 - 10:45",
      modality: targetReq.sessionType || "video",
      modalityLabel: "Consultation (45m)",
      securityTag: "E2E Encrypted",
      roomOrDetail: "Room ID: mnd-5104-sec",
      roomId: "mnd-5104-sec",
      isJustAdded: true,
      statusText: "Intake Complete",
    };

    // Insert 10:00 AM slot between 09:00 AM and 11:30 AM
    const existingWithout5104 = state.calendarBookings.filter(
      (b) => b.studentAnonId !== studentAnonId
    );
    const updatedCalendar = [
      existingWithout5104[0], // 09:00 AM
      newCalendarBooking, // 10:00 AM JUST ADDED
      ...existingWithout5104.slice(1), // 11:30 AM & 01:30 PM
    ].filter(Boolean);

    // 4. Add confirmation alert to Notifications
    const newAlert: AlertItem = {
      id: `alert-confirmed-${Date.now()}`,
      title: "Session Confirmed",
      description: `Consultation with ${studentAnonId} confirmed for Tomorrow 10:00 AM.`,
      timestamp: "Just now",
      isUnread: true,
      category: "session",
      priority: "urgent",
      iconName: "checkmark-circle-outline",
      actionLabel: "Enter Room",
      badgeLabel: "Confirmed",
    };

    const acceptedPayload: AcceptedSessionPayload = {
      requestId: targetReq.id,
      studentAnonId,
      date: "Tomorrow, Tue 19 Aug",
      timeRange: "10:00–10:45 AM",
      modality: "Encrypted Video Call (45m)",
      counselorNote,
      roomId: "brth-5104-sec",
    };

    state = {
      ...state,
      requests: updatedRequests,
      sessions: [newSession, ...state.sessions],
      calendarBookings: updatedCalendar,
      alerts: [newAlert, ...state.alerts],
      alertsUnread: state.alertsUnread + 1,
      lastAcceptedSession: acceptedPayload,
    };

    notifyListeners();
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

  // Mark all alerts as read
  markAlertsAsRead() {
    state = {
      ...state,
      alerts: state.alerts.map((a) => ({ ...a, isUnread: false })),
      alertsUnread: 0,
    };
    notifyListeners();
  },

  // Decline booking request (e.g. Student #5104)
  declineRequest(
    requestId: string,
    reason: string = "Schedule conflict",
    note?: string
  ): DeclinedSessionPayload {
    const targetReq = state.requests.find((r) => r.id === requestId) || state.requests[0];
    const studentAnonId = targetReq?.studentAnonId || "Student #5104";

    // 1. Remove from pending requests
    const updatedRequests = state.requests.filter((r) => r.id !== targetReq.id);

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
      requestId: targetReq.id,
      studentAnonId,
      date: "Tomorrow, Tue 19 Aug",
      timeRange: targetReq.requestedTime || "10:00–10:45 AM",
      modality:
        targetReq.sessionType === "video"
          ? "Video Consultation (45 min)"
          : targetReq.sessionType === "chat"
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
    return declinedPayload;
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
};

// ─── React Hook for Functional Components ───
export function useCounsellorStore() {
  const [storeState, setStoreState] = useState(counsellorStore.getState());

  useEffect(() => {
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
    confirmAcceptance: counsellorStore.confirmAcceptance,
    declineRequest: counsellorStore.declineRequest,
    toggleMic: counsellorStore.toggleMic,
    toggleCam: counsellorStore.toggleCam,
    setCallMediaState: counsellorStore.setCallMediaState,
    completeSession: counsellorStore.completeSession,
    toggleAvailability: counsellorStore.toggleAvailability,
    toggleTwoFactor: counsellorStore.toggleTwoFactor,
    toggleQuietHours: counsellorStore.toggleQuietHours,
    updateSettings: counsellorStore.updateSettings,
    blockSlot: counsellorStore.blockSlot,
    markAlertsAsRead: counsellorStore.markAlertsAsRead,
    decrementMessages: counsellorStore.decrementMessages,
    updateAlertPreferences: counsellorStore.updateAlertPreferences,
    sendOpeningMessage: counsellorStore.sendOpeningMessage,
    clearAllConversations: counsellorStore.clearAllConversations,
    resetConversations: counsellorStore.resetConversations,
  };
}
