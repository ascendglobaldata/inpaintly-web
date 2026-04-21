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
  week_of: string; // YYYY-MM-DD — the date this drop goes live (PT)
  slug: string;
  display_name: string;
  description: string;
  cover?: string;
  prompts: ThemePrompt[];
}

interface ThemesFile {
  active_week?: string; // optional manual override
  previous_week?: string; // optional manual override for the "last drop" slot
  weeks: ThemeWeek[];
}

const themes = themesData as unknown as ThemesFile;

/**
 * Returns the currently-live drop.
 *
 * Selection is date-driven: we pick the theme whose `week_of` is the most
 * recent date ≤ today in America/Los_Angeles. This handles the real drop
 * cadence, which is roughly every 3–4 days (not weekly). When today is
 * before the earliest `week_of`, the earliest drop is shown anyway so the
 * picker always has content.
 *
 * When the schedule is fully exhausted (today > the last week_of) we loop
 * back to the beginning, using the number of elapsed drops modulo the
 * schedule length so returning users don't get stuck on the last drop.
 *
 * `active_week` in themes.json is an override for testing.
 */
export function getActiveWeek(now: Date = new Date()): ThemeWeek {
  const sorted = sortedWeeks();
  if (themes.active_week) {
    const override = sorted.find((w) => w.week_of === themes.active_week);
    if (override) return override;
  }
  const idx = activeIndex(now, sorted);
  return sorted[idx];
}

/**
 * Returns the drop shown in the "previous" slot below the current one.
 * Normally that's one step back in the sorted schedule, with wrap-around.
 *
 * `previous_week` in themes.json is an override — useful at launch when
 * there is no real "previous" yet. Pick a later week as a teaser.
 */
export function getPreviousWeek(now: Date = new Date()): ThemeWeek {
  const sorted = sortedWeeks();
  if (themes.previous_week) {
    const override = sorted.find((w) => w.week_of === themes.previous_week);
    if (override) return override;
  }
  const currentIdx = activeIndex(now, sorted);
  const prevIdx = ((currentIdx - 1) % sorted.length + sorted.length) % sorted.length;
  return sorted[prevIdx];
}

export function getAllWeeks(): ThemeWeek[] {
  return themes.weeks;
}

function sortedWeeks(): ThemeWeek[] {
  const ws = [...themes.weeks].sort((a, b) =>
    a.week_of < b.week_of ? -1 : 1,
  );
  if (ws.length === 0) throw new Error("No themes defined in themes.json");
  return ws;
}

/**
 * Today's YYYY-MM-DD in America/Los_Angeles. 08:00 PT is the "go live"
 * cutoff: before that on any given day, the previous day's drop is still
 * the latest. This lets us use simple string comparison against `week_of`.
 */
function ptDateKey(now: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour);

  // Before 08:00 PT on the go-live day, treat as the previous day so a new
  // drop doesn't appear in the middle of the night for early users.
  if (hour < 8) {
    const prev = new Date(Date.UTC(year, month - 1, day - 1));
    return `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}-${pad(
      prev.getUTCDate(),
    )}`;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

function activeIndex(now: Date, sorted: ThemeWeek[]): number {
  const today = ptDateKey(now);
  // Find the last week_of that is <= today
  let lastPast = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].week_of <= today) lastPast = i;
    else break;
  }
  if (lastPast < 0) return 0; // before the first drop
  if (lastPast < sorted.length - 1) return lastPast; // inside the schedule
  // Past the end: loop by counting days since the last drop
  const lastDate = parseDate(sorted[sorted.length - 1].week_of);
  const today_ms = parseDate(today);
  const daysPast = Math.max(
    0,
    Math.floor((today_ms - lastDate) / (24 * 60 * 60 * 1000)),
  );
  // Assume ~3.5 days per drop when looping
  const dropsPast = Math.floor(daysPast / 3.5);
  return (dropsPast % sorted.length);
}

function parseDate(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
