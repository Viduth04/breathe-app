// useAlerts hook - Muaath (Member 4). Supports FR05, NFR01.
// Reactive custom hook for counsellor alerts, providing scoped onSnapshot listener,
// unread count selector, categorization (Today vs Earlier), and mark-as-read handlers.

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCounsellorStore } from "@/services/counsellorStore";
import {
  isTodayColombo,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/counsellorNotificationService";
import { AlertFilter, AlertItem } from "@/types/counsellorAlerts";

export function useAlerts() {
  const { user } = useAuth();
  const store = useCounsellorStore();
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counselorUid = user?.uid;

  // Filter alerts by active category filter
  const isAlertVisible = (alert: AlertItem): boolean => {
    if (activeFilter === "unread") return alert.isUnread;
    if (activeFilter === "intake")
      return alert.category === "intake" || alert.category === "request";
    if (activeFilter === "schedule")
      return alert.category === "session" || alert.category === "reschedule";
    return true;
  };

  const allAlerts: AlertItem[] = useMemo(() => {
    return store.alerts || [];
  }, [store.alerts]);

  const visibleTodayAlerts = useMemo(() => {
    return allAlerts.filter((a) => isTodayColombo(a.createdAt || a.timestamp) && isAlertVisible(a));
  }, [allAlerts, activeFilter]);

  const visibleEarlierAlerts = useMemo(() => {
    return allAlerts.filter((a) => !isTodayColombo(a.createdAt || a.timestamp) && isAlertVisible(a));
  }, [allAlerts, activeFilter]);

  const unreadCount = useMemo(() => {
    return allAlerts.filter((a) => a.isUnread).length;
  }, [allAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    // 1. Optimistic update in store
    store.markAlertAsRead(alertId);
    // 2. Persist to Firestore
    if (alertId && !alertId.startsWith("mock-") && !alertId.startsWith("alert-")) {
      await markNotificationAsRead(alertId);
    }
  };

  const handleMarkAllRead = async () => {
    // 1. Optimistic update in store
    store.markAlertsAsRead();
    // 2. Persist to Firestore
    if (counselorUid) {
      await markAllNotificationsAsRead(
        counselorUid,
        allAlerts.map((a) => a.id)
      );
    }
  };

  return {
    alerts: allAlerts,
    visibleTodayAlerts,
    visibleEarlierAlerts,
    totalVisible: visibleTodayAlerts.length + visibleEarlierAlerts.length,
    unreadCount: store.alertsUnread ?? unreadCount,
    activeFilter,
    setActiveFilter,
    isLoading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllRead,
    alertPreferences: store.alertPreferences,
  };
}
