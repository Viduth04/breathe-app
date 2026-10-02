// Counsellor Detail Screen types - Muaath (Member 4). Supports FR01, FR05.
// Types for Request Detail, Confirmed Session, Past Sessions, and Notification Detail.

import { IdMode, SessionType } from "./counsellorDashboard";

// ─── Mood Trend Data (for Request Detail mood chart) ───
export type MoodDataPoint = {
  day: string; // e.g. "Thu", "Fri"
  score: number; // 0–5
};

// ─── Request Detail Screen ───
export type RequestDetailData = {
  id: string;
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: IdMode;
  faculty: string;
  level: string; // e.g. "Undergraduate"
  department: string; // e.g. "School of Applied Sciences"
  sessionType: SessionType;
  sessionTypeLabel: string;
  isEncrypted: boolean;
  concern: string;
  consultationNumber: string; // e.g. "1st consultation with you"
  duration: string;
  proposedDate: string;
  proposedTime: string;
  status: "pending" | "accepted" | "declined" | "rescheduled";
  moodTrend: MoodDataPoint[];
  moodBriefLabel: string; // e.g. "Mild Stress Dip"
  aiBrief: string;
  personalNote: string;
  urgencyLevel: string; // e.g. "Standard (Nor..."
  format: string; // e.g. "Camera On • A..."
  awaitingReplyHours: number;
};

// ─── Confirmed Session Screen ───
export type ConfirmedSessionData = {
  id: string;
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: IdMode;
  faculty: string;
  yearLevel: string; // e.g. "Year 2"
  sessionType: SessionType;
  sessionTypeLabel: string;
  isEncrypted: boolean;
  sessionRef: string; // e.g. "#ME-8402"
  date: string;
  time: string;
  roomStatus: "ready" | "preparing" | "unavailable";
  startsIn: string; // e.g. "25 mins"
  // Pre-Session Intake
  checkInMood: number; // e.g. 2.5
  maxMood: number; // e.g. 5.0
  moodLabel: string; // e.g. "Mild strain"
  intakeNote: string;
  tags: string[]; // e.g. ["Academic Stress", "Presentation Anxiety"]
  // Protocol
  protocolTitle: string;
  protocolDescription: string;
};

// ─── Past Session Item (for Past Sessions History list) ───
export type PastSessionStatus = "completed" | "rescheduled" | "pending-wrapup";

export type PastSessionItem = {
  id: string;
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: IdMode;
  sessionType: SessionType;
  sessionTypeLabel: string;
  duration: string;
  room?: string; // e.g. "Room 302"
  date: string; // e.g. "Fri, 15 Aug"
  time: string; // e.g. "02:00 PM"
  concern: string;
  status: PastSessionStatus;
  privateNotes?: string; // only for pending-wrapup
  monthGroup: string; // e.g. "August 2026", "July 2026"
};

export type PastSessionsStats = {
  completedSessions: number;
  completionRate: number; // e.g. 92.3
  clinicalHours: number;
  verifiedHours: boolean;
};

export type PastSessionFilter = "all" | "completed" | "rescheduled" | "no-show";

// ─── Notification Detail Screen ───
export type NotificationDetailData = {
  id: string;
  alertType:
    | "clinical-triage"
    | "intake"
    | "session"
    | "message"
    | "reschedule";
  title: string;
  studentId: string;
  studentAnonId: string;
  receivedAt: string; // e.g. "Today at 09:15 AM"
  triagePriority: "high" | "moderate" | "low";
  // Student Profile section
  studentMode: string; // e.g. "Anonymous Mode"
  studentLevel: string; // e.g. "2nd Year Undergraduate"
  isVerified: boolean;
  // Request Type & Modality
  requestType: string; // e.g. "45-Minute Intake Consultation"
  modality: string; // e.g. "Video Consultation (End-to-End Encrypted)"
  // Proposed Slot
  proposedDate: string;
  proposedTime: string;
  // Primary Concern & Screener
  primaryConcern: string;
  phqScore?: number;
  phqRange?: string; // e.g. "MODERATE RANGE"
  // Actions
  actions: {
    primary: string; // e.g. "Review & Accept"
    secondary: string; // e.g. "Suggest Alternative"
    tertiary: string; // e.g. "Decline"
  };
};

// ─── Pre-Chat / Student Waiting Room ───
export type ClinicalPromptItem = {
  id: string;
  iconName: string;
  promptText: string;
};

export type PreChatWaitingRoomData = {
  studentId: string;
  studentAnonId: string;
  scheduledTime: string;
  intakeRoomStatus: string;
  phqScore: number;
  primaryConcern: string;
  duration: string;
  sharedContext: string;
  openingPrompts: ClinicalPromptItem[];
};

// ─── Clinical Alerts & Preferences ───
export type ClinicalAlertPreferences = {
  crisisRiskTriggers: boolean;
  newAppointmentRequests: boolean;
  upcomingSessionReminders: boolean;
  intakeFormSubmissions: boolean;
  secureChatMessages: boolean;
  quietHoursDutyOff: boolean;
  advanceReminderMinutes: number;
  advanceReminderType: "gentle" | "standard";
  scheduledWindow: string;
  previewStudentIdentityHidden: boolean;
  priorityOverrideAlwaysOn: boolean;
};

// ─── Patients Directory Item ───
export type PatientBadgeType = "WEEKLY" | "BI-WEEKLY" | "MONTHLY" | "ANONYMOUS";
export type PatientItem = {
  id: string;
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: "anonymous" | "standard";
  initials?: string;
  avatarIcon?: "shield" | "key" | "lock";
  badgeText: string;
  badgeStyle?: "mint" | "slate" | "amber" | "teal" | "indigo";
  sessionTimingText: string;
  isActive: boolean;
  hasUnread?: boolean;
  status: "active" | "inactive" | "pending";
  totalLogs?: number;
  lastSessionDate?: string;
};
