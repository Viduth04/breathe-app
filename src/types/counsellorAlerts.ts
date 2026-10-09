// Counsellor Alerts types - Muaath (Member 4). Supports FR05, NFR01.
// Unified notification model (notifications/{id}) with privacy-safe payloads and deep links.

export type NotificationType =
  | "new_request"
  | "request_accepted"
  | "request_declined"
  | "session_cancelled"
  | "session_rescheduled"
  | "session_reminder"
  | "checkin_reminder"
  | "intake_submitted"
  | "message_received";

export type NotificationRefType =
  | "request"
  | "session"
  | "conversation"
  | "booking"
  | "checkin";

export type NotificationPriority = "urgent" | "normal" | "low" | "high";

export type AlertCategory = "request" | "intake" | "session" | "message" | "reschedule";
export type AlertPriority = "urgent" | "normal";

/**
 * Canonical notification model stored in Firestore `notifications/{id}`
 * Strict privacy: bodyPreview contains NO PHI, names, or diagnosis details.
 */
export type AppNotification = {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  bodyPreview: string;
  refType: NotificationRefType;
  refId: string;
  priority: NotificationPriority;
  read: boolean;
  readAt: any | null;
  createdAt: any;
  dedupeKey: string;
  expiresAt?: any | null;
  studentAnonId?: string;
  metadata?: Record<string, any>;
};

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
  /** Reference type for deep navigation */
  refType?: NotificationRefType;
  /** Reference ID for deep navigation */
  refId?: string;
  /** Associated anonymous student identifier */
  studentAnonId?: string;
  /** Underlying notification type */
  type?: NotificationType;
  /** Original creation timestamp */
  createdAt?: any;
};

export type AlertFilter = "all" | "unread" | "intake" | "schedule";

export type AlertSection = {
  title: string;
  data: AlertItem[];
};

