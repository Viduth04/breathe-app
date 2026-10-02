// Messages mock data - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Mirrors Firestore chats/{id} and chats/{id}/messages/{id}.

import { ChatBubble, ChatThread } from "@/types/counsellorMessages";

export const MOCK_CHAT_THREADS: ChatThread[] = [
  {
    id: "chat-1",
    studentId: "std-6291",
    studentAnonId: "Student #6291",
    displayName: "Maya Lin",
    idMode: "standard",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    isOnline: true,
    lastMessage:
      '"Thank you Dr. Perera, the breathing exercise really helped before my exam today..."',
    lastMessageTime: "10:42 AM",
    unreadCount: 2,
    deliveryStatus: "delivered",
    sessionTag: "Weekly Check-in · In-Person",
    triageLevel: "normal",
    status: "active",
  },
  {
    id: "chat-2",
    studentId: "std-5104",
    studentAnonId: "Student #5104",
    displayName: "Student #5104",
    idMode: "anonymous",
    isOnline: true,
    lastMessage:
      '"I submitted my intake questionnaire ahead of our scheduled video session..."',
    lastMessageTime: "09:15 AM",
    unreadCount: 1,
    deliveryStatus: "delivered",
    sessionTag: "URGENT TRIAGE · PHQ-9: 14",
    triageLevel: "urgent",
    triageDetail: "PHQ-9: 14",
    status: "active",
  },
  {
    id: "chat-3",
    studentId: "std-4810",
    studentAnonId: "Student #4810",
    displayName: "Sarah Jenkins",
    idMode: "standard",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80",
    isOnline: false,
    lastMessage:
      '"Could we review the cognitive reframing worksheet we discussed during yesterday\'s appointment?"',
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    deliveryStatus: "read",
    sessionTag: "Weekly Consultation",
    triageLevel: "normal",
    status: "active",
  },
  {
    id: "chat-4",
    studentId: "std-8821",
    studentAnonId: "Student #8821",
    displayName: "Student #8821",
    idMode: "anonymous",
    isOnline: true,
    lastMessage:
      '"The sleep hygiene routine felt manageable last night. Less panic waking up."',
    lastMessageTime: "Oct 14",
    unreadCount: 0,
    deliveryStatus: "read",
    sessionTag: "Crisis Follow-up",
    triageLevel: "normal",
    status: "active",
  },
  {
    id: "chat-5",
    studentId: "std-3902",
    studentAnonId: "Student #3902",
    displayName: "Alex Rivera",
    idMode: "standard",
    avatarUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80",
    isOnline: false,
    lastMessage:
      '"Confirmed for Wednesday at 10:00 AM in Room 302."',
    lastMessageTime: "Oct 11",
    unreadCount: 0,
    deliveryStatus: "sent",
    sessionTag: "Bi-weekly Ongoing",
    triageLevel: "normal",
    status: "active",
  },
];

export const MOCK_CHAT_BUBBLES: ChatBubble[] = [
  {
    id: "msg-1",
    senderId: "counsellor-1",
    senderRole: "counsellor",
    text: "Good morning, Maya! I reviewed your midterm reflection log. You mentioned feeling rapid heartbeat before chemistry presentations. Take a slow breath — the 4-7-8 exercise we discussed can soothe that acute spike.",
    timestamp: "10:38 AM",
    deliveryStatus: "read",
  },
  {
    id: "msg-2",
    senderId: "std-6291",
    senderRole: "student",
    text: "Thank you Dr. Perera, the breathing exercise really helped before my exam today. I felt my hands stop shaking after the second cycle.",
    timestamp: "10:42 AM",
    deliveryStatus: "delivered",
  },
  {
    id: "msg-3",
    senderId: "counsellor-1",
    senderRole: "counsellor",
    text: "",
    timestamp: "10:44 AM",
    deliveryStatus: "delivered",
    isSystemCard: true,
    systemCardTitle: "Guided Box Breathing (4-4-4-4) · 3 Min",
    systemCardSubtitle:
      "Attached to student's Breathe sanctuary dashboard for exam week.",
  },
];
