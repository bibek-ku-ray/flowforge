/**
 * Self-contained 5-field cron utilities (no external dependency).
 *
 * Supported field syntax: `*`, `*&#47;n`, `a-b`, and comma-separated lists of
 * those (e.g. `1,15,30` or `0-5,10`). Fields are, in order:
 *   minute (0-59) hour (0-23) day-of-month (1-31) month (1-12) day-of-week (0-6, 0=Sun)
 *
 * `computeNextRun` evaluates the wall-clock fields in a given IANA timezone via
 * `Intl.DateTimeFormat.formatToParts`, stepping minute-by-minute.
 */

export const SIMPLE_INTERVALS = {
  "5m": "*/5 * * * *",
  "15m": "*/15 * * * *",
  "30m": "*/30 * * * *",
  "1h": "0 * * * *",
  "1d": "0 0 * * *",
} as const;

export type SimpleInterval = keyof typeof SIMPLE_INTERVALS;

type FieldRange = { min: number; max: number };

const FIELD_RANGES: FieldRange[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 }, // day of week
];

const MAX_ITERATIONS = 525600; // minutes in a (non-leap) year

/**
 * Parse a single cron field into the set of allowed integer values.
 * Throws if the field is malformed or out of range.
 */
function parseField(field: string, range: FieldRange): Set<number> {
  const allowed = new Set<number>();

  for (const part of field.split(",")) {
    if (part.length === 0) {
      throw new Error(`Invalid cron field: empty segment in "${field}"`);
    }

    let stepStr: string | undefined;
    let rangeStr = part;

    if (part.includes("/")) {
      const [base, step] = part.split("/");
      rangeStr = base;
      stepStr = step;
    }

    let step = 1;
    if (stepStr !== undefined) {
      step = Number(stepStr);
      if (!Number.isInteger(step) || step <= 0) {
        throw new Error(`Invalid cron step: "${part}"`);
      }
    }

    let start: number;
    let end: number;

    if (rangeStr === "*") {
      start = range.min;
      end = range.max;
    } else if (rangeStr.includes("-")) {
      const [a, b] = rangeStr.split("-");
      start = Number(a);
      end = Number(b);
      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw new Error(`Invalid cron range: "${part}"`);
      }
    } else {
      const value = Number(rangeStr);
      if (!Number.isInteger(value)) {
        throw new Error(`Invalid cron value: "${part}"`);
      }
      start = value;
      // A step on a single value (e.g. `5/10`) means "from 5 to max, step 10".
      end = stepStr !== undefined ? range.max : value;
    }

    if (
      start < range.min ||
      end > range.max ||
      start > end
    ) {
      throw new Error(
        `Cron value out of range: "${part}" (allowed ${range.min}-${range.max})`,
      );
    }

    for (let value = start; value <= end; value += step) {
      allowed.add(value);
    }
  }

  return allowed;
}

type ParsedCron = {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
  dayOfMonthRestricted: boolean;
  dayOfWeekRestricted: boolean;
};

function parseCron(expr: string): ParsedCron {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(
      `Invalid cron expression: expected 5 fields, got ${fields.length}`,
    );
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields.map(
    (field, index) => parseField(field, FIELD_RANGES[index]),
  );

  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
    dayOfMonthRestricted: fields[2] !== "*",
    dayOfWeekRestricted: fields[4] !== "*",
  };
}

export function isValidCron(expr: string): boolean {
  try {
    parseCron(expr);
    return true;
  } catch {
    return false;
  }
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type WallClock = {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
};

const WEEKDAY_TO_NUMBER: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Extract the wall-clock fields for a given instant in the target timezone.
 */
function getWallClock(date: Date, timezone: string): WallClock {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  // `Intl` may render midnight as "24" in some environments; normalize to 0.
  let hour = Number(lookup.hour);
  if (hour === 24) {
    hour = 0;
  }

  return {
    minute: Number(lookup.minute),
    hour,
    dayOfMonth: Number(lookup.day),
    month: Number(lookup.month),
    dayOfWeek: WEEKDAY_TO_NUMBER[lookup.weekday] ?? 0,
  };
}

function matches(parsed: ParsedCron, wall: WallClock): boolean {
  if (!parsed.minute.has(wall.minute)) return false;
  if (!parsed.hour.has(wall.hour)) return false;
  if (!parsed.month.has(wall.month)) return false;

  const domMatch = parsed.dayOfMonth.has(wall.dayOfMonth);
  const dowMatch = parsed.dayOfWeek.has(wall.dayOfWeek);

  // Standard cron semantics: when both day-of-month and day-of-week are
  // restricted, a match on either is sufficient. Otherwise both must match
  // (an unrestricted field always matches).
  if (parsed.dayOfMonthRestricted && parsed.dayOfWeekRestricted) {
    return domMatch || dowMatch;
  }

  return domMatch && dowMatch;
}

/**
 * Compute the next time (strictly after `from`) at which `expr` fires, as a
 * Date (UTC instant). Wall-clock fields are evaluated in `timezone`.
 * Throws on an invalid expression. Returns the first match within one year.
 */
export function computeNextRun(
  expr: string,
  from: Date,
  timezone = "UTC",
): Date {
  const parsed = parseCron(expr);

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: "${timezone}"`);
  }

  // Start from the next whole minute strictly after `from`.
  const candidate = new Date(from.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const wall = getWallClock(candidate, timezone);
    if (matches(parsed, wall)) {
      return candidate;
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error(
    `Could not compute next run for "${expr}" within ${MAX_ITERATIONS} iterations`,
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Produce a human-readable description of a cron expression. Falls back to the
 * raw expression for patterns it cannot summarize.
 */
export function describeCron(expr: string): string {
  let fields: string[];
  try {
    fields = expr.trim().split(/\s+/);
    parseCron(expr);
  } catch {
    return expr;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  // Match the simple interval presets first.
  for (const [label, value] of Object.entries(SIMPLE_INTERVALS)) {
    if (value === expr.trim()) {
      const map: Record<string, string> = {
        "5m": "Every 5 minutes",
        "15m": "Every 15 minutes",
        "30m": "Every 30 minutes",
        "1h": "Every hour",
        "1d": "Every day at midnight",
      };
      return map[label] ?? expr;
    }
  }

  const stepMinute = minute.match(/^\*\/(\d+)$/);
  if (
    stepMinute &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return `Every ${stepMinute[1]} minutes`;
  }

  if (
    /^\d+$/.test(minute) &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return `Every hour at minute ${minute}`;
  }

  if (
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return `Every day at ${pad(hour)}:${pad(minute)}`;
  }

  if (
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    dayOfMonth === "*" &&
    month === "*" &&
    /^\d+$/.test(dayOfWeek)
  ) {
    return `Every ${DAY_NAMES[Number(dayOfWeek)] ?? dayOfWeek} at ${pad(hour)}:${pad(minute)}`;
  }

  if (
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    /^\d+$/.test(dayOfMonth) &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return `Day ${dayOfMonth} of every month at ${pad(hour)}:${pad(minute)}`;
  }

  if (
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    /^\d+$/.test(dayOfMonth) &&
    /^\d+$/.test(month) &&
    dayOfWeek === "*"
  ) {
    return `${MONTH_NAMES[Number(month) - 1] ?? month} ${dayOfMonth} at ${pad(hour)}:${pad(minute)}`;
  }

  return expr;
}

function pad(value: string): string {
  return value.padStart(2, "0");
}
