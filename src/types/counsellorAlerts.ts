// Counsellor Alerts types - Muaath (Member 4). Supports FR05, NFR01.
// Local notifications only (no expo-notifications). Shaped for future Firestore swap.

export type AlertCategory = "request" | "intake" | "session" | "message" | "reschedule";
export type AlertPriority = "urgent" | "normal";

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
  category: AlertCategory;
  priority: AlertPriority;
  /** Icon name from Ionicons */
  iconName: string;
  /** Primary action button label (e.g. "Review Request", "Enter Room") */
  actionLabel?: string;
  /** Secondary badge label (e.g. "Urgent / Triage", "PHQ-9 • Moderate") */
  badgeLabel?: string;
};

export type AlertFilter = "all" | "unread" | "intake" | "schedule";

export type AlertSection = {
  title: string;
  data: AlertItem[];
};
