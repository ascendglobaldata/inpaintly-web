import themesData from "./themes.json";

export interface ThemePrompt {
  id: string;
  label: string;
  prompt: string;
  sample_prompt?: string;
  negative_prompt: string;
  sample?: string;
}

export interface ThemeWeek {
  week_of: string; // YYYY-MM-DD (Monday) — debut date / ordering anchor
  slug: string;
  display_name: string;
  description: string;
  cover?: string;
  prompts: ThemePrompt[];
}

interface ThemesFile {
  active_week?: string; // optional manual override for testing
  previous_week?: string; // optional manual override for the "last week" slot
  weeks: ThemeWeek[];
}

const themes = themesData as unknown as ThemesFile;

/**
 * Cycle anchor. The first Monday the schedule goes live. All rolling
 * week math is measured from here.
 */
const REFERENCE_MONDAY = "2026-04-20";

/**
 * Returns the currently-active week based on America/Los_Angeles time.
 *
 * The schedule rolls forward every Monday at 08:00 PT AND loops
 * automatically once we reach the end of the array. If weeks.length = 16,
 * week 17 after launch shows the same theme as week 1, week 18 = week 2,
 * etc. Appending new themes to the array extends the cycle before it loops.
 *
 * Ordering is by the `week_of` field (the debut date). If you want to
 * change the order, re-order `week_of` dates — that's the source of truth.
 *
 * `active_week` in themes.json overrides the computation when set — useful
 * for previewing an upcoming week early.
 */
export function getActiveWeek(now: Date = new Date()): ThemeWeek {
  const sorted = [...themes.weeks].sort((a, b) =>
    a.week_of < b.week_of ? -1 : 1,
  );
  if (sorted.length === 0) {
    throw new Error("No themes defined in themes.json");
  }

  if (themes.active_week) {
    const override = sorted.find((w) => w.week_of === themes.active_week);
    if (override) return override;
  }

  const offset = weeksSinceReferenceMonday(now);
  // Handle negative (before reference) and large positive uniformly
  const index = ((offset % sorted.length) + sorted.length) % sorted.length;
  return sorted[index];
}

/**
 * Returns the week shown in the "last week" slot below the current drop.
 * Normally that's one cycle index back. When `previous_week` is set in
 * themes.json it overrides the computation — useful until we have enough
 * rendered samples to let the rolling index pick naturally.
 */
export function getPreviousWeek(now: Date = new Date()): ThemeWeek {
  const sorted = [...themes.weeks].sort((a, b) =>
    a.week_of < b.week_of ? -1 : 1,
  );
  if (sorted.length === 0) {
    throw new Error("No themes defined in themes.json");
  }

  if (themes.previous_week) {
    const override = sorted.find((w) => w.week_of === themes.previous_week);
    if (override) return override;
  }

  const offset = weeksSinceReferenceMonday(now);
  // One step back; wrap around with positive modulo
  const index =
    (((offset - 1) % sorted.length) + sorted.length) % sorted.length;
  return sorted[index];
}

export function getAllWeeks(): ThemeWeek[] {
  return themes.weeks;
}

/**
 * How many full 7-day cycles have elapsed since REFERENCE_MONDAY, based on
 * the most recent Monday 08:00 PT boundary that `now` has passed.
 */
function weeksSinceReferenceMonday(now: Date): number {
  const currentMondayYmd = mostRecentMonday8amPT(now);
  const cur = ymdToUtcMs(currentMondayYmd);
  const ref = ymdToUtcMs(REFERENCE_MONDAY);
  const deltaDays = Math.floor((cur - ref) / (24 * 60 * 60 * 1000));
  return Math.floor(deltaDays / 7);
}

function ymdToUtcMs(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Returns YYYY-MM-DD for the most recent Monday 08:00 America/Los_Angeles
 * boundary that has passed. Uses Intl.DateTimeFormat so the server's local
 * timezone doesn't affect the math.
 */
function mostRecentMonday8amPT(now: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour);
  const weekday = parts.weekday;

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
  if (daysBack === 0 && hour < 8) daysBack = 7;

  const baseUtc = Date.UTC(year, month - 1, day);
  const mondayUtc = baseUtc - daysBack * 24 * 60 * 60 * 1000;
  const d = new Date(mondayUtc);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
