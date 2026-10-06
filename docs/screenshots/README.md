# Screenshots

The main [README](../../README.md) shows these images in a 3-column table. Add one PNG per screen using **exactly** these file names (lower case, hyphenated):

| # | File name | Screen | Route / how to reach it |
|---|---|---|---|
| 1 | `onboarding.png` | Welcome / onboarding | `src/app/(auth)/welcome.tsx` (first launch, logged out) |
| 2 | `login.png` | Login | `src/app/(auth)/login.tsx` |
| 3 | `home.png` | Student home | `src/app/(student)/home.tsx` |
| 4 | `check-in.png` | Mood check-in | `src/app/(student)/check-in.tsx` |
| 5 | `mood-history.png` | Mood history | `src/app/(student)/mood-history.tsx` |
| 6 | `reminders.png` | Check-in reminders | `src/app/(student)/reminders.tsx` |
| 7 | `booking.png` | Counsellor booking | `src/app/(student)/session/book.tsx` |
| 8 | `counsellor-dashboard.png` | Counsellor dashboard | `src/app/(counsellor)/dashboard.tsx` |
| 9 | `admin.png` | Admin panel | `src/app/(admin)/dashboard.tsx` |
| 10 | `lecturer-trends.png` | Lecturer trends | `src/app/(lecturer)/trends.tsx` |
| 11 | `crisis-support.png` | Crisis support | `src/app/crisis.tsx` |
| 12 | `ai-companion.png` | AI companion | `src/app/(student)/companion.tsx` |

## Tips

- Take them on the same phone, in **portrait**, so they line up (around 1080 × 2340 is ideal).
- Use test data only: no real names, emails or student IDs.
- For `lecturer-trends.png`, generate demo stats from the admin panel first so the charts aren't empty.
- For `crisis-support.png`, scroll so the "Numbers checked on 5 October 2026" line is visible.
- Keep each file under about 500 KB (compress with [TinyPNG](https://tinypng.com/) if needed).
