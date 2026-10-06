// Counsellor Dashboard types - Muaath (Member 4). Supports FR08.
// Shaped to mirror Firestore schema (bookings, users, slots) for future integration.

export type IdMode = "anonymous" | "standard";
export type SessionType = "video" | "chat" | "in-person";
export type SessionStatus = "confirmed" | "completed" | "cancelled";
export type RequestStatus = "pending" | "confirmed" | "declined";

export type SessionItem = {
  id: string;
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: IdMode;
  timeRange: string;
  timeRelative: string;
  date?: string;
  isNext: boolean;
  sessionType: SessionType;
  sessionTypeLabel: string;
  roomOrDetail?: string;
  noteType: "Focus" | "Follow-up";
  noteText: string;
  status: SessionStatus;
  slotId?: string;
  startAt?: any;
  endAt?: any;
};

export type BookingRequestItem = {
  id: string;
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: IdMode;
  requestedTime: string;
  sessionType: SessionType;
  duration: string;
  topic: string;
  aiMoodBrief?: string;
  status: RequestStatus;
  slotId?: string;
  date?: string;
  startAt?: any;
  endAt?: any;
  notes?: string;
};

export type DashboardStats = {
  sessionsToday: number;
  requestsPending: number;
  clinicalHours: number;
};

export type CounsellorProfileInfo = {
  fullName: string;
  title: string;
  organization: string;
  avatarUrl: string;
  isVerified: boolean;
  isAvailable: boolean;
  unreadAlertsCount: number;
  bio?: string;
  specialties?: string[];
  languages?: string[];
  experienceYears?: number;
};
