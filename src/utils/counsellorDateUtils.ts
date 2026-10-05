// Counsellor Date & Time Utilities - Muaath (Member 4). Supports FR01, FR08, NFR01, NFR02.
// Single source of truth for all calendar calculations, time arithmetic, and formatting
// strictly anchored to Asia/Colombo (Sri Lanka Standard Time, UTC+05:30).
// Pure native Intl implementation with zero external dependencies, DST-safe and timezone-isolated.

export const COLOMBO_TIMEZONE = "Asia/Colombo";

/**
 * Returns the current instant as a Date object.
 */
export function getColomboNow(): Date {
  return new Date();
}

/**
 * Formats a Date object or timestamp into an ISO date key 'YYYY-MM-DD' in Asia/Colombo.
 */
export function toColomboDateKey(date: Date | number | string): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // Returns 'YYYY-MM-DD'
}

/**
 * Returns today's date key 'YYYY-MM-DD' in Asia/Colombo.
 */
export function getColomboTodayKey(): string {
  return toColomboDateKey(getColomboNow());
}

/**
 * Parses a 'YYYY-MM-DD' key into a Date object representing 00:00:00 in Asia/Colombo.
 */
export function parseColomboDateKey(dateKey: string): Date {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(Date.UTC(year, month, day, 0, 0, 0) - 5.5 * 3600 * 1000);
}

/**
 * Checks if two date representations point to the exact same calendar day in Asia/Colombo.
 */
export function isSameColomboDay(
  a: Date | string | number,
  b: Date | string | number
): boolean {
  return toColomboDateKey(a) === toColomboDateKey(b);
}

/**
 * Formats a date for the Dashboard header (e.g. "Mon, 18 Aug" or "Monday, Aug 18, 2026").
 */
export function formatColomboDashboardDate(date: Date = getColomboNow()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: COLOMBO_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Formats a date with full weekday and year (e.g. "Monday, Aug 18, 2026").
 */
export function formatColomboFullDate(date: Date = getColomboNow()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: COLOMBO_TIMEZONE,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Formats Month and Year (e.g. "August 2026").
 */
export function formatColomboMonthYear(date: Date = getColomboNow()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: COLOMBO_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Parses time strings like "09:00 AM", "10:30", "01:45 PM" into hours and minutes.
 */
export function parseTimeParts(timeStr: string): { hours: number; minutes: number } {
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes("PM");
  const isAM = clean.includes("AM");
  const raw = clean.replace(/[APM\s]/g, "");
  const [hStr, mStr] = raw.split(":");
  let hours = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return { hours, minutes };
}

/**
 * Formats hours (0-23) and minutes (0-59) into "hh:mm AM/PM".
 */
export function formatTimeString(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours.toString().padStart(2, "0")}:${paddedMinutes} ${period}`;
}

/**
 * Computes an end time string given start time and duration in minutes.
 * e.g. ("09:00 AM", 45) -> "09:45 AM"
 */
export function computeEndTime(startTimeStr: string, durationMinutes: number): string {
  const { hours, minutes } = parseTimeParts(startTimeStr);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return formatTimeString(endHours, endMinutes);
}

/**
 * Builds an exact Date object for a given dateKey and time string in Asia/Colombo.
 */
export function buildColomboDateTime(dateKey: string, timeStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const { hours, minutes } = parseTimeParts(timeStr);

  // UTC equivalent for Colombo time (+05:30)
  const utcMillis = Date.UTC(year, month, day, hours, minutes, 0) - 5.5 * 3600 * 1000;
  return new Date(utcMillis);
}

export type RelativeSessionTiming = {
  label: string; // e.g. "Starts in 20m", "In-progress (25m left)", "Today • 10:00 AM"
  status: "upcoming" | "in-progress" | "completed";
  isJoinable: boolean; // True within 15 minutes before start until session end
  minutesUntilStart: number;
};

/**
 * Computes live, real-time relative timing for a session against 'now'.
 */
export function computeSessionRelativeTiming(
  sessionDateKey: string,
  startTimeStr: string,
  endTimeStr: string,
  now: Date = getColomboNow()
): RelativeSessionTiming {
  const startDateTime = buildColomboDateTime(sessionDateKey, startTimeStr);
  const endDateTime = buildColomboDateTime(sessionDateKey, endTimeStr);

  const diffMs = startDateTime.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

  // Completed
  if (now.getTime() >= endDateTime.getTime()) {
    return {
      label: "Concluded",
      status: "completed",
      isJoinable: false,
      minutesUntilStart: diffMinutes,
    };
  }

  // In Progress
  if (now.getTime() >= startDateTime.getTime() && now.getTime() < endDateTime.getTime()) {
    const remainingMinutes = Math.max(1, Math.round((endDateTime.getTime() - now.getTime()) / 60000));
    return {
      label: `In-progress (${remainingMinutes}m left)`,
      status: "in-progress",
      isJoinable: true,
      minutesUntilStart: diffMinutes,
    };
  }

  // Upcoming: Join window (15 mins prior)
  if (diffMinutes <= 15 && diffMinutes >= 0) {
    return {
      label: diffMinutes === 0 ? "Starts now" : `Starts in ${diffMinutes}m`,
      status: "upcoming",
      isJoinable: true,
      minutesUntilStart: diffMinutes,
    };
  }

  // Upcoming: Later today
  if (isSameColomboDay(startDateTime, now)) {
    if (diffMinutes < 60) {
      return {
        label: `Starts in ${diffMinutes}m`,
        status: "upcoming",
        isJoinable: false,
        minutesUntilStart: diffMinutes,
      };
    }
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return {
      label: mins > 0 ? `In ${hours}h ${mins}m` : `In ${hours}h`,
      status: "upcoming",
      isJoinable: false,
      minutesUntilStart: diffMinutes,
    };
  }

  // Tomorrow or Future
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  if (isSameColomboDay(startDateTime, tomorrow)) {
    return {
      label: `Tomorrow • ${startTimeStr}`,
      status: "upcoming",
      isJoinable: false,
      minutesUntilStart: diffMinutes,
    };
  }

  return {
    label: `${formatColomboDashboardDate(startDateTime)} • ${startTimeStr}`,
    status: "upcoming",
    isJoinable: false,
    minutesUntilStart: diffMinutes,
  };
}

/**
 * Checks for time overlap between two intervals [startA, endA] and [startB, endB].
 */
export function hasTimeConflict(
  startAStr: string,
  endAStr: string,
  startBStr: string,
  endBStr: string
): boolean {
  const aStart = parseTimeParts(startAStr);
  const aEnd = parseTimeParts(endAStr);
  const bStart = parseTimeParts(startBStr);
  const bEnd = parseTimeParts(endBStr);

  const aStartMin = aStart.hours * 60 + aStart.minutes;
  const aEndMin = aEnd.hours * 60 + aEnd.minutes;
  const bStartMin = bStart.hours * 60 + bStart.minutes;
  const bEndMin = bEnd.hours * 60 + bEnd.minutes;

  return Math.max(aStartMin, bStartMin) < Math.min(aEndMin, bEndMin);
}

/**
 * Calendar Grid Day cell representation for Month view.
 */
export type MonthGridDay = {
  dayNumber: number;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

/**
 * Generates a standard 35 or 42 cell calendar month grid for Asia/Colombo.
 */
export function generateMonthGrid(
  year: number,
  monthZeroIndexed: number,
  selectedDateKey: string,
  now: Date = getColomboNow()
): MonthGridDay[] {
  const todayKey = toColomboDateKey(now);
  const firstDayOfMonth = new Date(Date.UTC(year, monthZeroIndexed, 1, 0, 0, 0));
  const startingDayOfWeek = firstDayOfMonth.getUTCDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(Date.UTC(year, monthZeroIndexed + 1, 0, 0, 0, 0)).getUTCDate();

  // Days in previous month
  const prevMonthDays = new Date(Date.UTC(year, monthZeroIndexed, 0, 0, 0, 0)).getUTCDate();

  const grid: MonthGridDay[] = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonthDate = new Date(Date.UTC(year, monthZeroIndexed - 1, day, 0, 0, 0));
    const key = toColomboDateKey(prevMonthDate);
    grid.push({
      dayNumber: day,
      dateKey: key,
      isCurrentMonth: false,
      isToday: key === todayKey,
      isSelected: key === selectedDateKey,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, monthZeroIndexed, day, 0, 0, 0));
    const key = toColomboDateKey(date);
    grid.push({
      dayNumber: day,
      dateKey: key,
      isCurrentMonth: true,
      isToday: key === todayKey,
      isSelected: key === selectedDateKey,
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remainingCells = 7 - (grid.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(Date.UTC(year, monthZeroIndexed + 1, day, 0, 0, 0));
      const key = toColomboDateKey(nextMonthDate);
      grid.push({
        dayNumber: day,
        dateKey: key,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
      });
    }
  }

  return grid;
}

/**
 * Generates an array of 7 days for the Week strip navigation.
 */
export function generateWeekStrip(referenceDate: Date = getColomboNow()): Array<{
  dayName: string; // e.g. "Mon"
  dayNumber: number; // e.g. 18
  dateKey: string;
  isToday: boolean;
}> {
  const todayKey = toColomboDateKey(getColomboNow());
  const dayOfWeek = referenceDate.getDay(); // 0 = Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + mondayOffset);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = toColomboDateKey(d);
    days.push({
      dayName: new Intl.DateTimeFormat("en-US", { timeZone: COLOMBO_TIMEZONE, weekday: "short" }).format(d),
      dayNumber: parseInt(key.split("-")[2], 10),
      dateKey: key,
      isToday: key === todayKey,
    });
  }
  return days;
}
