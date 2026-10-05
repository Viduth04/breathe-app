// Counsellor Live Time Provider & useNow Hook - Muaath (Member 4). Supports FR01, FR08.
// Central reactive ticker aligned to the minute boundary in Asia/Colombo (SLST).
// Synchronizes Foreground/Background state via AppState, detects midnight rollovers,
// and ensures consistent "now", "today", and relative countdown chips across all screens.

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  COLOMBO_TIMEZONE,
  getColomboNow,
  getColomboTodayKey,
  formatColomboDashboardDate,
  formatColomboFullDate,
  toColomboDateKey,
} from "@/utils/counsellorDateUtils";

export interface CounsellorTimeContextValue {
  now: Date;
  todayDateKey: string;
  formattedTodayHeader: string;
  formattedFullDate: string;
  timezone: string;
  isForeground: boolean;
  minuteTick: number;
}

const CounsellorTimeContext = createContext<CounsellorTimeContextValue | null>(null);

export function CounsellorTimeProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState<Date>(() => getColomboNow());
  const [minuteTick, setMinuteTick] = useState<number>(0);
  const [isForeground, setIsForeground] = useState<boolean>(true);
  const prevDateKeyRef = useRef<string>(getColomboTodayKey());

  // Function to re-sync clock and check for midnight rollover
  const syncClock = () => {
    const freshNow = getColomboNow();
    const freshKey = toColomboDateKey(freshNow);
    setNow(freshNow);
    setMinuteTick((prev) => prev + 1);

    if (freshKey !== prevDateKeyRef.current) {
      prevDateKeyRef.current = freshKey;
      console.log(`[CounsellorTimeContext] Midnight rollover detected: ${freshKey}`);
    }
  };

  // 1. Minute-aligned clock ticker that pauses in background
  useEffect(() => {
    let intervalId: any = null;
    let timeoutId: any = null;

    if (isForeground) {
      // Align to the next exact 00 seconds
      const currentSeconds = new Date().getSeconds();
      const currentMillis = new Date().getMilliseconds();
      const msUntilNextMinute = (60 - currentSeconds) * 1000 - currentMillis;

      timeoutId = setTimeout(() => {
        syncClock();
        intervalId = setInterval(() => {
          syncClock();
        }, 60000);
      }, Math.max(500, msUntilNextMinute));
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isForeground]);

  // 2. AppState listener: Instant refresh on app foreground resume
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const active = nextState === "active";
      setIsForeground(active);
      if (active) {
        syncClock();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const value = useMemo<CounsellorTimeContextValue>(() => {
    const todayDateKey = toColomboDateKey(now);
    return {
      now,
      todayDateKey,
      formattedTodayHeader: formatColomboDashboardDate(now),
      formattedFullDate: formatColomboFullDate(now),
      timezone: COLOMBO_TIMEZONE,
      isForeground,
      minuteTick,
    };
  }, [now, minuteTick, isForeground]);

  return (
    <CounsellorTimeContext.Provider value={value}>
      {children}
    </CounsellorTimeContext.Provider>
  );
}

/**
 * Hook to access the live single source of truth for time, today, and timezone.
 */
export function useNow(): CounsellorTimeContextValue {
  const context = useContext(CounsellorTimeContext);
  if (!context) {
    // Graceful fallback if used outside provider
    const fallbackNow = getColomboNow();
    return {
      now: fallbackNow,
      todayDateKey: getColomboTodayKey(),
      formattedTodayHeader: formatColomboDashboardDate(fallbackNow),
      formattedFullDate: formatColomboFullDate(fallbackNow),
      timezone: COLOMBO_TIMEZONE,
      isForeground: true,
      minuteTick: 0,
    };
  }
  return context;
}
