// Counsellor Badge Context - Muaath (Member 4). Supports FR05, FR08.
// Synchronizes unread counts between tab bar badges, header bells, and screen actions in real time.

import React, { createContext, useContext, useState, ReactNode } from "react";

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
  const [alertsUnread, setAlertsUnread] = useState(3);
  const [messagesUnread, setMessagesUnread] = useState(3);

  const markAlertsAsRead = () => setAlertsUnread(0);
  const decrementAlerts = () => setAlertsUnread((c) => Math.max(0, c - 1));
  const decrementMessages = () => setMessagesUnread((c) => Math.max(0, c - 1));

  return (
    <CounsellorBadgeContext.Provider
      value={{
        alertsUnread,
        messagesUnread,
        markAlertsAsRead,
        decrementAlerts,
        decrementMessages,
      }}
    >
      {children}
    </CounsellorBadgeContext.Provider>
  );
}

export const useCounsellorBadges = () => useContext(CounsellorBadgeContext);
