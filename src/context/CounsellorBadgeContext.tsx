// Counsellor Badge Context - Muaath (Member 4). Supports FR05, FR08.
// Synchronizes unread counts between tab bar badges, header bells, and screen actions in real time via shared store.

import React, { createContext, useContext, ReactNode } from "react";
import { useCounsellorStore } from "@/services/counsellorStore";

type BadgeContextType = {
  alertsUnread: number;
  messagesUnread: number;
  markAlertsAsRead: () => void;
  decrementAlerts: () => void;
  decrementMessages: () => void;
};

const CounsellorBadgeContext = createContext<BadgeContextType>({
  alertsUnread: 3,
  messagesUnread: 3,
  markAlertsAsRead: () => {},
  decrementAlerts: () => {},
  decrementMessages: () => {},
});

export function CounsellorBadgeProvider({ children }: { children: ReactNode }) {
  const store = useCounsellorStore();

  return (
    <CounsellorBadgeContext.Provider
      value={{
        alertsUnread: store.alertsUnread,
        messagesUnread: store.messagesUnread,
        markAlertsAsRead: store.markAlertsAsRead,
        decrementAlerts: store.markAlertsAsRead,
        decrementMessages: store.decrementMessages,
      }}
    >
      {children}
    </CounsellorBadgeContext.Provider>
  );
}

export const useCounsellorBadges = () => useContext(CounsellorBadgeContext);
