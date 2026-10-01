// Counsellor mock data - Muaath (Member 4). Supports FR08.
// Structured to mirror Firestore collections (users, bookings, careLinks).

import {
  BookingRequestItem,
  CounsellorProfileInfo,
  DashboardStats,
  SessionItem,
} from "@/types/counsellorDashboard";

export const MOCK_COUNSELLOR_PROFILE: CounsellorProfileInfo = {
  fullName: "Dr. Anjali Perera",
  title: "Lead Clinical Counselor",
  organization: "MindEase",
  avatarUrl:
    "https://images.unsplash.com/photo-1594824813645-316b2cfd2906?auto=format&fit=crop&w=256&q=80",
  isVerified: true,
  isAvailable: true,
  unreadAlertsCount: 3,
};

export const MOCK_SESSIONS_TODAY: SessionItem[] = [
  {
    id: "session-1",
    studentId: "std-4021",
    studentAnonId: "Student #4021",
    displayName: "Student #4021",
    idMode: "anonymous",
    timeRange: "09:30 AM – 10:15 AM",
    timeRelative: "Starts in 20m",
    isNext: true,
    sessionType: "video",
    sessionTypeLabel: "Encrypted Video Consultation",
    noteType: "Focus",
    noteText: "Coping with upcoming mid-term exam panic & somatic tremors.",
    status: "confirmed",
  },
  {
    id: "session-2",
    studentId: "std-maya",
    studentAnonId: "Student #3189",
    displayName: "Maya Senanayake",
    idMode: "standard",
    timeRange: "11:30 AM – 12:15 PM",
    timeRelative: "In 2h 15m",
    isNext: false,
    sessionType: "chat",
    sessionTypeLabel: "Secured Chat Session",
    noteType: "Follow-up",
    noteText: "Sleep hygiene & journaling routine review.",
    status: "confirmed",
  },
  {
    id: "session-3",
    studentId: "std-8812",
    studentAnonId: "Student #8812",
    displayName: "Student #8812",
    idMode: "anonymous",
    timeRange: "02:30 PM – 03:15 PM",
    timeRelative: "In 5h 15m",
    isNext: false,
    sessionType: "in-person",
    sessionTypeLabel: "In-Person • Room 302",
    noteType: "Focus",
    noteText: "Assignment overload navigation and routine stabilizing.",
    status: "confirmed",
  },
];

export const MOCK_PENDING_REQUESTS: BookingRequestItem[] = [
  {
    id: "req-1",
    studentId: "std-5104",
    studentAnonId: "Student #5104",
    displayName: "Student #5104",
    idMode: "anonymous",
    requestedTime: "Thu, 2:00 PM",
    sessionType: "video",
    duration: "45m",
    topic: "Academic Pressure & Burnout",
    aiMoodBrief: "Declining mood trend over 5 days",
    status: "pending",
  },
  {
    id: "req-2",
    studentId: "std-kevin",
    studentAnonId: "Student #7220",
    displayName: "Kevin Thilakarathne",
    idMode: "standard",
    requestedTime: "Tomorrow, 10:00 AM",
    sessionType: "chat",
    duration: "45m",
    topic: "Social Anxiety & Presentations",
    status: "pending",
  },
  {
    id: "req-3",
    studentId: "std-9022",
    studentAnonId: "Student #9022",
    displayName: "Student #9022",
    idMode: "anonymous",
    requestedTime: "Fri, 11:30 AM",
    sessionType: "video",
    duration: "45m",
    topic: "Grief & Adjustment",
    status: "pending",
  },
  {
    id: "req-4",
    studentId: "std-3398",
    studentAnonId: "Student #3398",
    displayName: "Student #3398",
    idMode: "anonymous",
    requestedTime: "Next Mon, 03:00 PM",
    sessionType: "in-person",
    duration: "45m",
    topic: "Sleep Distress & Night Terrors",
    status: "pending",
  },
];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  sessionsToday: 3,
  requestsPending: 4,
  clinicalHours: 2.5,
};
