// Counsellor Realtime Database (RTDB) Service - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Manages zero-latency ephemeral state:
// 1. /status/{userId} - Counselor and student online/in-session presence with onDisconnect heartbeat.
// 2. /typing/{conversationId}/{userId} - Instant typing indicators with auto-cleanup.
// 3. /calls/{callId} - Waiting room lobby presence, media mute state, and tele-health signaling.

import { rtdb } from "@/services/counsellorFirebaseConfig";
import {
  ref,
  set,
  update,
  onValue,
  onDisconnect,
  serverTimestamp,
  remove,
} from "firebase/database";

export type PresenceState = "online" | "away" | "in-session" | "offline";

export interface UserPresenceData {
  state: PresenceState;
  lastChanged: number | object;
  role: "counselor" | "student";
}

export interface CallSignalingState {
  status: "waiting" | "active" | "ended";
  studentJoined: boolean;
  counselorJoined: boolean;
  studentMedia?: {
    micOn: boolean;
    camOn: boolean;
  };
  counselorMedia?: {
    micOn: boolean;
    camOn: boolean;
  };
  startedAt?: number | object;
  endedAt?: number | object;
}

function isRtdbIgnorableError(err: any): boolean {
  if (!err) return false;
  const msg = (typeof err === "string" ? err : err?.message || String(err)).toLowerCase();
  return (
    msg.includes("permission_denied") ||
    msg.includes("permission denied") ||
    msg.includes("disabled by a database owner") ||
    msg.includes("database disabled") ||
    msg.includes("database is disabled")
  );
}

// ─── 1. PRESENCE & HEARTBEAT ───

/**
 * Initializes automatic online/offline heartbeat presence for the authenticated counselor.
 * When network disconnects or app terminates, Firebase RTDB automatically marks status: 'offline'.
 */
export function initCounselorPresence(counselorId: string): () => void {
  if (!rtdb || !counselorId) {
    return () => {};
  }

  try {
    const connectedRef = ref(rtdb, ".info/connected");
    const statusRef = ref(rtdb, `status/${counselorId}`);

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Set up onDisconnect hook first
        onDisconnect(statusRef)
          .set({
            state: "offline",
            lastChanged: serverTimestamp(),
            role: "counselor",
          })
          .catch((err: any) => {
            if (!isRtdbIgnorableError(err)) {
              console.warn("[counsellorRtdbService] onDisconnect setup error:", err?.message || err);
            }
          });

        // Mark online
        set(statusRef, {
          state: "online",
          lastChanged: serverTimestamp(),
          role: "counselor",
        }).catch((err: any) => {
          if (!isRtdbIgnorableError(err)) {
            console.warn("[counsellorRtdbService] set online presence error:", err?.message || err);
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] initCounselorPresence error:", err);
    }
    return () => {};
  }
}

/**
 * Manually update counselor availability state (e.g. "in-session", "away", "online").
 */
export async function updateCounselorStatus(
  counselorId: string,
  state: PresenceState
): Promise<void> {
  if (!rtdb || !counselorId) return;

  try {
    const statusRef = ref(rtdb, `status/${counselorId}`);
    await update(statusRef, {
      state,
      lastChanged: serverTimestamp(),
      role: "counselor",
    });
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] updateCounselorStatus error:", err);
    }
  }
}

/**
 * Subscribes to live presence for any student or user.
 */
export function subscribeToUserPresence(
  userId: string,
  onUpdate: (presence: UserPresenceData) => void
): () => void {
  if (!rtdb || !userId) return () => {};

  try {
    const statusRef = ref(rtdb, `status/${userId}`);
    return onValue(
      statusRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          onUpdate({
            state: val.state || "offline",
            lastChanged: val.lastChanged,
            role: val.role || "student",
          });
        } else {
          onUpdate({
            state: "offline",
            lastChanged: Date.now(),
            role: "student",
          });
        }
      },
      (err) => {
        if (!isRtdbIgnorableError(err)) {
          console.warn("[counsellorRtdbService] subscribeToUserPresence error:", err);
        }
      }
    );
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] subscribeToUserPresence error:", err);
    }
    return () => {};
  }
}

// ─── 2. LIVE TYPING INDICATORS ───

/**
 * Sets or clears typing indicator for a conversation thread.
 * Auto-clears on socket disconnect.
 */
export function setTypingIndicator(
  conversationId: string,
  userId: string,
  isTyping: boolean
): void {
  if (!rtdb || !conversationId || !userId) return;

  try {
    const typingRef = ref(rtdb, `typing/${conversationId}/${userId}`);
    if (isTyping) {
      set(typingRef, {
        isTyping: true,
        timestamp: serverTimestamp(),
      }).catch((err: any) => {
        if (!isRtdbIgnorableError(err)) {
          console.warn("[counsellorRtdbService] setTypingIndicator error:", err);
        }
      });
      onDisconnect(typingRef)
        .remove()
        .catch((err: any) => {
          if (!isRtdbIgnorableError(err)) {
            console.warn("[counsellorRtdbService] onDisconnect typing error:", err);
          }
        });
    } else {
      remove(typingRef).catch((err: any) => {
        if (!isRtdbIgnorableError(err)) {
          console.warn("[counsellorRtdbService] removeTypingIndicator error:", err);
        }
      });
    }
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] setTypingIndicator error:", err);
    }
  }
}

/**
 * Listens to active typing participants in a conversation.
 */
export function subscribeToTypingIndicators(
  conversationId: string,
  currentUserId: string,
  onUpdate: (isOtherUserTyping: boolean) => void
): () => void {
  if (!rtdb || !conversationId) return () => {};

  try {
    const threadTypingRef = ref(rtdb, `typing/${conversationId}`);
    return onValue(
      threadTypingRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          onUpdate(false);
          return;
        }

        // Check if any other user in this conversation is currently typing
        const otherKeys = Object.keys(val).filter((k) => k !== currentUserId);
        const isTyping = otherKeys.some((k) => val[k]?.isTyping === true);
        onUpdate(isTyping);
      },
      (err) => {
        if (!isRtdbIgnorableError(err)) {
          console.warn("[counsellorRtdbService] subscribeToTypingIndicators error:", err);
        }
      }
    );
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] subscribeToTypingIndicators error:", err);
    }
    return () => {};
  }
}

// ─── 3. VIDEO CALL LOBBY & SIGNALING ───

/**
 * Counselor joins waiting lobby or call room.
 */
export async function joinCallSignaling(
  callId: string,
  role: "counselor" | "student",
  mediaState: { micOn: boolean; camOn: boolean }
): Promise<void> {
  if (!rtdb || !callId) return;

  try {
    const callRef = ref(rtdb, `calls/${callId}`);
    const updates: Record<string, any> = {};

    if (role === "counselor") {
      updates.status = "active";
      updates.startedAt = serverTimestamp();
      updates.counselorJoined = true;
      updates.counselorMedia = mediaState;
    } else {
      updates.studentJoined = true;
      updates.studentMedia = mediaState;
    }

    await update(callRef, updates);

    // Auto-leave on socket drop
    const joinedFieldRef = ref(rtdb, `calls/${callId}/${role}Joined`);
    onDisconnect(joinedFieldRef)
      .set(false)
      .catch((err: any) => {
        if (!isRtdbIgnorableError(err)) {
          console.warn("[counsellorRtdbService] onDisconnect joinCall error:", err);
        }
      });
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] joinCallSignaling error:", err);
    }
  }
}

/**
 * Updates mute/camera toggles during waiting lobby or active call.
 */
export async function updateCallMedia(
  callId: string,
  role: "counselor" | "student",
  mediaState: { micOn: boolean; camOn: boolean }
): Promise<void> {
  if (!rtdb || !callId) return;

  try {
    const mediaRef = ref(rtdb, `calls/${callId}/${role}Media`);
    await set(mediaRef, mediaState);
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] updateCallMedia error:", err);
    }
  }
}

/**
 * Subscribes to live call room events (student joined lobby, student mic/cam state, call ended).
 */
export function subscribeToCallSignaling(
  callId: string,
  onUpdate: (state: CallSignalingState) => void
): () => void {
  if (!rtdb || !callId) return () => {};

  try {
    const callRef = ref(rtdb, `calls/${callId}`);
    return onValue(
      callRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          onUpdate({
            status: "waiting",
            studentJoined: false,
            counselorJoined: false,
          });
          return;
        }

        onUpdate({
          status: val.status || "waiting",
          studentJoined: Boolean(val.studentJoined),
          counselorJoined: Boolean(val.counselorJoined),
          studentMedia: val.studentMedia,
          counselorMedia: val.counselorMedia,
          startedAt: val.startedAt,
          endedAt: val.endedAt,
        });
      },
      (err) => {
        if (!isRtdbIgnorableError(err)) {
          console.warn("[counsellorRtdbService] subscribeToCallSignaling error:", err);
        }
      }
    );
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] subscribeToCallSignaling error:", err);
    }
    return () => {};
  }
}

/**
 * Ends live call signaling session.
 */
export async function endCallSignaling(callId: string): Promise<void> {
  if (!rtdb || !callId) return;

  try {
    const callRef = ref(rtdb, `calls/${callId}`);
    await update(callRef, {
      status: "ended",
      endedAt: serverTimestamp(),
      counselorJoined: false,
      studentJoined: false,
    });
  } catch (err) {
    if (!isRtdbIgnorableError(err)) {
      console.warn("[counsellorRtdbService] endCallSignaling error:", err);
    }
  }
}
