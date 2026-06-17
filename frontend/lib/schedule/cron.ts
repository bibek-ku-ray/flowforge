/**
 * Self-contained cron utilities for Schedule triggers.
 *
 * Supports standard 5-field cron expressions:
 *   minute hour day-of-month month day-of-week
 *
 * No external dependencies.
 */

export const SIMPLE_INTERVALS = {
  "5m": "*/5 * * * *",
  "15m": "*/15 * * * *",
  "30m": "*/30 * * * *",
  "1h": "0 * * * *",
  "1d": "0 0 * * *",
} as const;

export type SimpleInterval = keyof typeof SIMPLE_INTERVALS;

/** Maximum number of minutes to scan forward when computing the next run (one year). */
const MAX_LOOKAHEAD_MINUTES = 525600;

type CronField = {
  min: number;
  max: number;
};

const FIELD_BOUNDS: CronField[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 }, // day of week (0 = Sunday)
];

function parseField(field: string, bounds: CronField): Set<number> | null {
  const values = new Set<number>();

  for (const part of field.split(",")) {
    if (part.length === 0) return null;

    let range = part;
    let step = 1;

    const stepSplit = part.split("/");
    if (stepSplit.length === 2) {
      range = stepSplit[0];
      const parsedStep = Number(stepSplit[1]);
      if (!Number.isInteger(parsedStep) || parsedStep <= 0) return null;
      step = parsedStep;
    } else if (stepSplit.length > 2) {
      return null;
    }

    let start: number;
    let end: number;

    if (range === "*") {
      start = bounds.min;
      end = bounds.max;
    } else {
      const rangeSplit = range.split("-");
      if (rangeSplit.length === 1) {
        const value = Number(rangeSplit[0]);
        if (!Number.isInteger(value)) return null;
        start = value;
        // For a bare number with a step (e.g. "5/10"), step from the value to the max.
        end = stepSplit.length === 2 ? bounds.max : value;
      } else if (rangeSplit.length === 2) {
        start = Number(rangeSplit[0]);
        end = Number(rangeSplit[1]);
        if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
      } else {
        return null;
      }
    }

    if (start < bounds.min || end > bounds.max || start > end) return null;

    for (let value = start; value <= end; value += step) {
      values.add(value);
    }
  }

  return values.size > 0 ? values : null;
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

function parseCron(expression: string): ParsedCron | null {
  if (typeof expression !== "string") return null;

  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;

  const parsed = fields.map((field, index) =>
    parseField(field, FIELD_BOUNDS[index]),
  );

  if (parsed.some((set) => set === null)) return null;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parsed as Set<number>[];

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

export function isValidCron(expression: string): boolean {
  return parseCron(expression) !== null;
}

export function isValidTimezone(timezone: string): boolean {
  if (typeof timezone !== "string" || timezone.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

type ZonedParts = {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getZonedParts(date: Date, timezone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  let hour = Number(lookup.hour);
  // Intl can emit "24" for midnight in hour12:false mode.
  if (hour === 24) hour = 0;

  return {
    minute: Number(lookup.minute),
    hour,
    dayOfMonth: Number(lookup.day),
    month: Number(lookup.month),
    dayOfWeek: WEEKDAY_INDEX[lookup.weekday] ?? 0,
  };
}

function matches(parsed: ParsedCron, parts: ZonedParts): boolean {
  if (!parsed.minute.has(parts.minute)) return false;
  if (!parsed.hour.has(parts.hour)) return false;
  if (!parsed.month.has(parts.month)) return false;

  // When both day-of-month and day-of-week are restricted, cron treats them
  // as a union (match either). Otherwise, the restricted one must match.
  if (parsed.dayOfMonthRestricted && parsed.dayOfWeekRestricted) {
    return (
      parsed.dayOfMonth.has(parts.dayOfMonth) ||
      parsed.dayOfWeek.has(parts.dayOfWeek)
    );
  }

  if (parsed.dayOfMonthRestricted && !parsed.dayOfMonth.has(parts.dayOfMonth)) {
    return false;
  }

  if (parsed.dayOfWeekRestricted && !parsed.dayOfWeek.has(parts.dayOfWeek)) {
    return false;
  }

  return true;
}

/**
 * Compute the next run time at or after `from` (exclusive) for the given cron
 * expression in the given timezone. Scans minute-by-minute up to one year.
 *
 * @throws if the cron expression or timezone is invalid, or no run is found
 *   within the lookahead window.
 */
export function computeNextRun(
  expression: string,
  timezone: string = "UTC",
  from: Date = new Date(),
): Date {
  const parsed = parseCron(expression);
  if (!parsed) {
    throw new Error(`Invalid cron expression: ${expression}`);
  }

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  // Start from the next minute boundary, zeroing seconds/milliseconds.
  const candidate = new Date(from.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  for (let i = 0; i < MAX_LOOKAHEAD_MINUTES; i++) {
    const parts = getZonedParts(candidate, timezone);
    if (matches(parsed, parts)) {
      return candidate;
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error(
    `No matching run found within ${MAX_LOOKAHEAD_MINUTES} minutes for cron: ${expression}`,
  );
}

/** Human-readable description of a cron expression. */
export function describeCron(expression: string): string {
  const parsed = parseCron(expression);
  if (!parsed) return "Invalid schedule";

  for (const [label, cron] of Object.entries(SIMPLE_INTERVALS)) {
    if (cron === expression.trim().replace(/\s+/g, " ")) {
      switch (label) {
        case "5m":
          return "Every 5 minutes";
        case "15m":
          return "Every 15 minutes";
        case "30m":
          return "Every 30 minutes";
        case "1h":
          return "Every hour";
        case "1d":
          return "Every day at midnight";
      }
    }
  }

  return `Cron: ${expression.trim()}`;
}
