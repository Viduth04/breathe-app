// Lecturer insights - Viduth (Member 1).

import { getRecentWeekStats, WeekEntry } from "@/services/statsService";
import { getAuthErrorMessage } from "@/services/authService";
import { useCallback, useEffect, useState } from "react";

// Loads the last `count` weeks of anonymous stats with loading, refresh and error state
export function useWeekStats(count = 8) {
  const [weeks, setWeeks] = useState<WeekEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setError(undefined);
    try {
      setWeeks(await getRecentWeekStats(count));
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  }, [count]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hasDemoData = weeks.some((w) => w.stats?.demo);
  return { weeks, loading, refreshing, error, refresh, hasDemoData };
}
