// Alerts mock data - Muaath (Member 4). Supports FR05, NFR01.
// Local notifications only (no expo-notifications). Shaped for future Firestore swap.

import { AlertItem, AlertSection } from "@/types/counsellorAlerts";

export const MOCK_ALERTS_TODAY: AlertItem[] = [
  {
    id: "alert-1",
    title: "New Session Request",
    description:
      "Student #5104 requested a 45-min Anxiety Consultation for...",
    timestamp: "10m ago",
    isUnread: true,
    category: "request",
    priority: "urgent",
    iconName: "send-outline",
    actionLabel: "Review Request",
    badgeLabel: "Urgent / Triage",
  },
  {
    id: "alert-2",
    title: "Intake Questionnaire Su...",
    description:
      "Sarah Jenkins completed her pre-session PHQ-9 assessment",
    timestamp: "45m ago",
    isUnread: true,
    category: "intake",
    priority: "normal",
    iconName: "checkmark-circle-outline",
    actionLabel: "View Assessment",
    badgeLabel: "PHQ-9 • Moderate",
  },
  {
    id: "alert-3",
    title: "Session in 15 Minutes",
    description:
      "Upcoming Video Consultation with Alex Rivera at 10:00 AM....",
    timestamp: "Just now",
    isUnread: true,
    category: "session",
    priority: "urgent",
    iconName: "videocam-outline",
    actionLabel: "Enter Room",
  },
];

export const MOCK_ALERTS_EARLIER: AlertItem[] = [
  {
    id: "alert-4",
    title: "Message from Student",
    description:
      "Student #4021 sent a message in secure chat regarding breathing",
    timestamp: "Yesterday",
    isUnread: false,
    category: "message",
    priority: "normal",
    iconName: "chatbubble-outline",
    actionLabel: "Secure Chat",
  },
  {
    id: "alert-5",
    title: "Session Cancelled / Resch",
    description:
      "Student #8821 requested to reschedule Thursday's slot to...",
    timestamp: "Tuesday",
    isUnread: false,
    category: "reschedule",
    priority: "normal",
    iconName: "calendar-outline",
  },
];

export const MOCK_ALERT_SECTIONS: AlertSection[] = [
  { title: "Today", data: MOCK_ALERTS_TODAY },
  { title: "Earlier this week", data: MOCK_ALERTS_EARLIER },
];
