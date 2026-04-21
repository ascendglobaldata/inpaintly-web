import themesData from "./themes.json";

export interface ThemePrompt {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  sample?: string;
}

export interface ThemeWeek {
  week_of: string; // YYYY-MM-DD (Monday)
  slug: string;
  display_name: string;
  description: string;
  cover?: string;
  prompts: ThemePrompt[];
}

interface ThemesFile {
  active_week?: string; // optional manual override for testing
  weeks: ThemeWeek[];
}

const themes = themesData as unknown as ThemesFile;

/**
 * Returns the currently-active week based on America/Los_Angeles time.
 * New weeks roll over at Monday 8:00 AM PT. Before that boundary on Monday
 * the previous week is still active.
 *
 * If `active_week` is set in themes.json it overrides the computation —
 * useful for testing an upcoming week early.
 *
 * Falls back to the earliest week if no `week_of` matches (e.g. app is
 * live before the first drop).
 */
export function getActiveWeek(now: Date = new Date()): ThemeWeek {
  if (themes.active_week) {
    const override = themes.weeks.find((w) => w.week_of === themes.active_week);
    if (override) return override;
  }

  const targetMonday = mostRecentMonday8amPT(now);

  // Pick the latest week whose week_of is ≤ targetMonday
  const sorted = [...themes.weeks].sort((a, b) =>
    a.week_of < b.week_of ? -1 : 1,
  );
  let chosen: ThemeWeek | null = null;
  for (const w of sorted) {
    if (w.week_of <= targetMonday) chosen = w;
    else break;
  }
  return chosen ?? sorted[0];
}

export function getAllWeeks(): ThemeWeek[] {
  return themes.weeks;
}

/**
 * Returns a YYYY-MM-DD string representing the most recent Monday at 08:00
 * in America/Los_Angeles that has already passed.
 *
 * We do this arithmetic in PT because the rollover clock is specified in PT.
 * Intl.DateTimeFormat is the reliable way to extract PT-wall-clock fields
 * without depending on the server's timezone config.
 */
function mostRecentMonday8amPT(now: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month); // 1-12
  const day = Number(parts.day);
  const hour = Number(parts.hour); // 0-23
  const weekday = parts.weekday; // "Mon" | "Tue" | ... | "Sun"

  const weekdayIndex: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  let daysBack = weekdayIndex[weekday] ?? 0;
  if (daysBack === 0 && hour < 8) {
    // It's Monday in PT but before 8am — still last week's drop
    daysBack = 7;
  }

  // Build a UTC-anchored Date for the PT wall-clock midnight, then subtract
  // `daysBack` days. We only need the date portion, so drift by a couple
  // hours across DST is fine — we never cross a day boundary.
  const baseUtc = Date.UTC(year, month - 1, day);
  const mondayUtc = baseUtc - daysBack * 24 * 60 * 60 * 1000;
  const d = new Date(mondayUtc);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
