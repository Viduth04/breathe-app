// Lecturer insights - Viduth (Member 1).
//
// ISO weeks (Monday start) in the phone's local time. Week ids look like
// "2026-W40" and match the stats/{weekId} docs; the security rules check that
// the id and weekStart agree.

const pad = (n: number) => String(n).padStart(2, "0");

// Monday 00:00 (local) of the week containing `date`
export function weekStartDate(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

// "YYYY-MM-DD" of a local date
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// ISO 8601 week id, e.g. "2026-W40"
export function isoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday decides the ISO year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

export type WeekRef = { id: string; weekStart: string; start: Date };

// The last `count` weeks including this one, oldest first
export function recentWeeks(count: number, now = new Date()): WeekRef[] {
  const thisMonday = weekStartDate(now);
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - (count - 1 - i) * 7);
    return { id: isoWeekId(start), weekStart: dateKey(start), start };
  });
}

// "29 Sep"
export const shortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
