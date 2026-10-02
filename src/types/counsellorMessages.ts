// Counsellor Messages types - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Shaped to mirror Firestore chats/{id} and chats/{id}/messages/{id}.

import { IdMode } from "./counsellorDashboard";

export type ChatThreadStatus = "active" | "archived";
export type MessageDelivery = "sent" | "delivered" | "read";
export type TriageLevel = "urgent" | "normal";

export type ChatThread = {
  id: string;
  studentId: string;
  studentAnonId: string;
  displayName: string;
  idMode: IdMode;
  avatarUrl?: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  deliveryStatus: MessageDelivery;
  sessionTag: string;
  triageLevel: TriageLevel;
  triageDetail?: string; // e.g. "PHQ-9: 14"
  status: ChatThreadStatus;
};

export type ChatBubble = {
  id: string;
  senderId: string;
  senderRole: "counsellor" | "student";
  text: string;
  timestamp: string;
  deliveryStatus: MessageDelivery;
  isSystemCard?: boolean;
  systemCardTitle?: string;
  systemCardSubtitle?: string;
};

export type MessageFilter = "all" | "unread" | "urgent" | "anonymous" | "archived";
