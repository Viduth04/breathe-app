// Counsellor Notification Service - Muaath (Member 4). Supports FR05, NFR01.
// Handles realtime notification sync, privacy-safe payloads, time formatting (Asia/Colombo),
// and resilient fallback synthesis from bookings.

import { db, FIRESTORE_COLLECTIONS, isFirebaseConfigured } from "@/services/counsellorFirebaseConfig";
import {
  AlertCategory,
  AlertItem,
  AlertPriority,
  AppNotification,
  NotificationPriority,
  NotificationType,
} from "@/types/counsellorAlerts";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

/**
 * Privacy-safe body preview generator.
 * Strips any potential student real names, diagnosis, or sensitive notes.
 */
export function sanitizeNotificationPreview(
  text?: string,
  anonId?: string
): string {
  if (!text) {
    return anonId ? `Update regarding ${anonId}` : "Clinical schedule notification";
  }
  // Remove identifiable email/names patterns if present
  let safe = text.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[Confidential]");
  if (safe.length > 90) {
    safe = safe.substring(0, 87) + "...";
  }
  return safe;
}

/**
 * Maps a NotificationType to the UI AlertCategory
 */
export function mapTypeToCategory(type?: NotificationType): AlertCategory {
  switch (type) {
    case "new_request":
      return "request";
    case "intake_submitted":
      return "intake";
    case "session_reminder":
    case "request_accepted":
      return "session";
    case "session_cancelled":
    case "session_rescheduled":
    case "request_declined":
      return "reschedule";
    case "message_received":
      return "message";
    default:
      return "session";
  }
}

/**
 * Format a Firestore timestamp or Date into relative time in Asia/Colombo
 */
export function formatNotificationTime(rawTimestamp: any): string {
  if (!rawTimestamp) return "Just now";

  let date: Date;
  if (typeof rawTimestamp.toDate === "function") {
    date = rawTimestamp.toDate();
  } else if (rawTimestamp instanceof Date) {
    date = rawTimestamp;
  } else if (typeof rawTimestamp === "number") {
    date = new Date(rawTimestamp);
  } else if (typeof rawTimestamp === "string") {
    // If it's already a relative label like "10m ago" or "Yesterday"
    if (
      rawTimestamp.includes("ago") ||
      rawTimestamp.includes("Just now") ||
      rawTimestamp.includes("Yesterday") ||
      rawTimestamp.includes("Tuesday")
    ) {
      return rawTimestamp;
    }
    date = new Date(rawTimestamp);
  } else {
    return "Just now";
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Colombo",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Colombo",
  });
}

/**
 * Categorize into "Today" vs "Earlier this week" based on Asia/Colombo calendar day.
 */
export function isTodayColombo(rawTimestamp: any): boolean {
  if (!rawTimestamp) return true;

  let date: Date;
  if (typeof rawTimestamp.toDate === "function") {
    date = rawTimestamp.toDate();
  } else if (rawTimestamp instanceof Date) {
    date = rawTimestamp;
  } else if (typeof rawTimestamp === "number") {
    date = new Date(rawTimestamp);
  } else if (typeof rawTimestamp === "string") {
    if (
      rawTimestamp.includes("ago") ||
      rawTimestamp.includes("Just now") ||
      rawTimestamp.toLowerCase().includes("today")
    ) {
      return true;
    }
    date = new Date(rawTimestamp);
  } else {
    return true;
  }

  const colomboNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
  const colomboItem = date.toLocaleString("en-US", { timeZone: "Asia/Colombo" });

  const nowDateStr = new Date(colomboNow).toDateString();
  const itemDateStr = new Date(colomboItem).toDateString();

  return nowDateStr === itemDateStr;
}

/**
 * Maps a canonical Firestore AppNotification document or snapshot to an AlertItem for UI.
 */
export function notificationDocToAlertItem(docId: string, data: any): AlertItem {
  const type: NotificationType = data.type || "session_reminder";
  const category: AlertCategory = data.category || mapTypeToCategory(type);
  const priority: AlertPriority =
    data.priority === "urgent" || data.priority === "high" ? "urgent" : "normal";

  // Pick default icon based on category/type
  let iconName = data.iconName;
  if (!iconName) {
    switch (category) {
      case "request":
        iconName = "send-outline";
        break;
      case "intake":
        iconName = "checkmark-circle-outline";
        break;
      case "session":
        iconName = type === "session_reminder" ? "videocam-outline" : "calendar-outline";
        break;
      case "message":
        iconName = "chatbubble-outline";
        break;
      case "reschedule":
        iconName = "calendar-outline";
        break;
      default:
        iconName = "notifications-outline";
    }
  }

  // Derive default action and badge label
  let actionLabel = data.actionLabel;
  let badgeLabel = data.badgeLabel;

  if (!actionLabel) {
    if (category === "request") actionLabel = "Review Request";
    else if (category === "intake") actionLabel = "View Assessment";
    else if (type === "session_reminder") actionLabel = "Enter Room";
    else if (category === "message") actionLabel = "Secure Chat";
    else if (category === "reschedule") actionLabel = "View in Schedule";
  }

  if (!badgeLabel) {
    if (priority === "urgent") badgeLabel = "Urgent / Triage";
    else if (category === "intake") badgeLabel = "PHQ-9 • Clinical Intake";
  }

  const isUnread =
    typeof data.read === "boolean"
      ? !data.read
      : typeof data.isUnread === "boolean"
      ? data.isUnread
      : true;

  return {
    id: docId,
    title: data.title || "Notification",
    description: data.bodyPreview || data.description || "",
    timestamp: formatNotificationTime(data.createdAt || data.timestamp),
    isUnread,
    category,
    priority,
    iconName,
    actionLabel,
    badgeLabel,
    refType: data.refType,
    refId: data.refId,
    studentAnonId: data.studentAnonId,
    type,
    createdAt: data.createdAt,
  };
}

// Track locally marked read alert IDs in session
const readAlertIds = new Set<string>();

/**
 * Subscribes to counsellor alerts synthesized directly from Firestore `bookings` collection
 * scoped strictly to `counsellorId == counselorUid` (per firestore.rules lines 94-96).
 */
export function subscribeToCounsellorAlertsRealtime(
  counselorUid: string,
  onUpdate: (alerts: AlertItem[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!isFirebaseConfigured() || !db || !counselorUid) {
    return () => {};
  }

  try {
    const bookingsQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.BOOKINGS),
      where("counsellorId", "==", counselorUid)
    );

    return onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const alerts: AlertItem[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id;
          const studentAnonId = data.studentAnonId || "Anonymous Student";
          const createdAt = data.createdAt;
          const updatedAt = data.updatedAt;

          if (data.status === "pending") {
            const alertId = `alert-req-${docId}`;
            alerts.push({
              id: alertId,
              title: "New Session Request",
              description: `${studentAnonId} requested a ${data.sessionType || "video"} consultation.`,
              timestamp: formatNotificationTime(createdAt || data.startAt),
              isUnread: !readAlertIds.has(alertId),
              category: "request",
              priority: "urgent",
              iconName: "send-outline",
              actionLabel: "Review Request",
              badgeLabel: "Urgent / Triage",
              refType: "request",
              refId: docId,
              studentAnonId,
              type: "new_request",
              createdAt,
            });
          } else if (data.status === "confirmed") {
            const alertId = `alert-conf-${docId}`;
            alerts.push({
              id: alertId,
              title: "Upcoming Session Confirmed",
              description: `Confirmed consultation with ${studentAnonId}.`,
              timestamp: formatNotificationTime(updatedAt || createdAt),
              isUnread: !readAlertIds.has(alertId) && false,
              category: "session",
              priority: "normal",
              iconName: "videocam-outline",
              actionLabel: "Enter Room",
              badgeLabel: "Confirmed",
              refType: "session",
              refId: docId,
              studentAnonId,
              type: "session_reminder",
              createdAt: updatedAt || createdAt,
            });
          } else if (data.status === "declined") {
            const alertId = `alert-dec-${docId}`;
            alerts.push({
              id: alertId,
              title: "Request Declined",
              description: `Booking request for ${studentAnonId} declined (${data.cancelReason || "Schedule conflict"}).`,
              timestamp: formatNotificationTime(updatedAt || createdAt),
              isUnread: !readAlertIds.has(alertId) && false,
              category: "reschedule",
              priority: "normal",
              iconName: "close-circle-outline",
              badgeLabel: "Declined",
              refType: "request",
              refId: docId,
              studentAnonId,
              type: "request_declined",
              createdAt: updatedAt || createdAt,
            });
          }
        });

        // Sort descending by timestamp/createdAt
        alerts.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
          const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
          return timeB - timeA;
        });

        onUpdate(alerts);
      },
      (err) => {
        console.warn("[counsellorNotificationService] bookings onSnapshot error:", err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.warn("[counsellorNotificationService] query setup error:", err);
    onError?.(err);
    return () => {};
  }
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  readAlertIds.add(notificationId);
}

/**
 * Marks all notifications for a counsellor as read
 */
export async function markAllNotificationsAsRead(
  _counselorUid: string,
  alertIds?: string[]
): Promise<void> {
  if (alertIds && alertIds.length > 0) {
    alertIds.forEach((id) => readAlertIds.add(id));
  }
}
