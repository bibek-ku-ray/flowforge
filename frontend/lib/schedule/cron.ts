export const SIMPLE_INTERVALS = {
  "5m": "*/5 * * * *",
  "15m": "*/15 * * * *",
  "30m": "*/30 * * * *",
  "1h": "0 * * * *",
  "1d": "0 0 * * *",
} as const;

export type SimpleInterval = keyof typeof SIMPLE_INTERVALS;

type CronField = {
  min: number;
  max: number;
};

// minute hour day-of-month month day-of-week
const CRON_FIELDS: CronField[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 }, // day of week (0 = Sunday)
];

/**
 * Parse a single cron field into the set of allowed values.
 * Supports `*`, `*\/n`, `a-b` ranges, and comma-separated lists of those.
 * Returns null if the field is invalid.
 */
function parseField(raw: string, field: CronField): Set<number> | null {
  const values = new Set<number>();
  const parts = raw.split(",");

  if (parts.length === 0) {
    return null;
  }

  for (const part of parts) {
    if (part.length === 0) {
      return null;
    }

    // Step syntax: <range>/<step> or *\/<step>
    let stepValue = 1;
    let rangePart = part;
    const slashIndex = part.indexOf("/");

    if (slashIndex !== -1) {
      rangePart = part.slice(0, slashIndex);
      const stepRaw = part.slice(slashIndex + 1);

      if (!/^\d+$/.test(stepRaw)) {
        return null;
      }

      stepValue = Number(stepRaw);
      if (stepValue <= 0) {
        return null;
      }
    }

    let start: number;
    let end: number;

    if (rangePart === "*") {
      start = field.min;
      end = field.max;
    } else if (rangePart.includes("-")) {
      const [aRaw, bRaw] = rangePart.split("-");
      if (
        aRaw === undefined ||
        bRaw === undefined ||
        !/^\d+$/.test(aRaw) ||
        !/^\d+$/.test(bRaw)
      ) {
        return null;
      }
      start = Number(aRaw);
      end = Number(bRaw);
    } else {
      if (!/^\d+$/.test(rangePart)) {
        return null;
      }
      start = Number(rangePart);
      end = start;
    }

    if (start > end) {
      return null;
    }

    if (start < field.min || end > field.max) {
      return null;
    }

    for (let value = start; value <= end; value += stepValue) {
      values.add(value);
    }
  }

  return values;
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

function parseCron(expr: string): ParsedCron | null {
  const trimmed = expr.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    return null;
  }

  const sets: Set<number>[] = [];
  for (let i = 0; i < 5; i++) {
    const field = CRON_FIELDS[i]!;
    const parsed = parseField(fields[i]!, field);
    if (parsed === null) {
      return null;
    }
    sets.push(parsed);
  }

  return {
    minute: sets[0]!,
    hour: sets[1]!,
    dayOfMonth: sets[2]!,
    month: sets[3]!,
    dayOfWeek: sets[4]!,
    dayOfMonthRestricted: fields[2] !== "*",
    dayOfWeekRestricted: fields[4] !== "*",
  };
}

export function isValidCron(expr: string): boolean {
  return parseCron(expr) !== null;
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const WEEKDAY_TO_NUMBER: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type WallClock = {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
};

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

  // Intl can render hour "24" at midnight in some environments; normalize to 0.
  let hour = Number(lookup.hour);
  if (hour === 24) {
    hour = 0;
  }

  return {
    minute: Number(lookup.minute),
    hour,
    dayOfMonth: Number(lookup.day),
    month: Number(lookup.month),
    dayOfWeek: WEEKDAY_TO_NUMBER[lookup.weekday ?? ""] ?? 0,
  };
}

function matches(parsed: ParsedCron, wall: WallClock): boolean {
  if (!parsed.minute.has(wall.minute)) return false;
  if (!parsed.hour.has(wall.hour)) return false;
  if (!parsed.month.has(wall.month)) return false;

  // Standard cron semantics: when both day-of-month and day-of-week are
  // restricted, a match on either is sufficient (OR). When only one is
  // restricted, that one must match. When neither is restricted, both pass.
  const domMatch = parsed.dayOfMonth.has(wall.dayOfMonth);
  const dowMatch = parsed.dayOfWeek.has(wall.dayOfWeek);

  if (parsed.dayOfMonthRestricted && parsed.dayOfWeekRestricted) {
    return domMatch || dowMatch;
  }
  if (parsed.dayOfMonthRestricted) {
    return domMatch;
  }
  if (parsed.dayOfWeekRestricted) {
    return dowMatch;
  }
  return true;
}

const ONE_MINUTE_MS = 60_000;
const MAX_ITERATIONS = 525_600; // one year of minutes

export function computeNextRun(
  expr: string,
  from: Date,
  timezone: string,
): Date {
  const parsed = parseCron(expr);
  if (parsed === null) {
    throw new Error(`Invalid cron expression: ${expr}`);
  }

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  // Round up to the next whole minute (strictly after `from`).
  let candidateMs =
    Math.floor(from.getTime() / ONE_MINUTE_MS) * ONE_MINUTE_MS + ONE_MINUTE_MS;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const candidate = new Date(candidateMs);
    const wall = getWallClock(candidate, timezone);
    if (matches(parsed, wall)) {
      return candidate;
    }
    candidateMs += ONE_MINUTE_MS;
  }

  throw new Error(
    `Unable to compute next run within one year for cron: ${expr}`,
  );
}

function describeField(values: Set<number>, field: CronField): "all" | number[] {
  const total = field.max - field.min + 1;
  if (values.size >= total) {
    return "all";
  }
  return Array.from(values).sort((a, b) => a - b);
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Best-effort human-readable label for a cron expression.
 * Falls back to the raw expression for shapes it does not recognize.
 */
export function describeCron(expr: string): string {
  const parsed = parseCron(expr);
  if (parsed === null) {
    return "Invalid schedule";
  }

  const minuteField = CRON_FIELDS[0]!;
  const hourField = CRON_FIELDS[1]!;

  const minute = describeField(parsed.minute, minuteField);
  const hour = describeField(parsed.hour, hourField);

  // Detect "*\/n" style minute interval (evenly spaced starting at 0).
  const sortedMinutes = Array.from(parsed.minute).sort((a, b) => a - b);
  if (
    hour === "all" &&
    !parsed.dayOfMonthRestricted &&
    !parsed.dayOfWeekRestricted &&
    minute !== "all" &&
    sortedMinutes.length > 1 &&
    sortedMinutes[0] === 0
  ) {
    const step = sortedMinutes[1]! - sortedMinutes[0]!;
    const expected: number[] = [];
    for (let v = 0; v <= minuteField.max; v += step) {
      expected.push(v);
    }
    if (
      expected.length === sortedMinutes.length &&
      expected.every((v, idx) => v === sortedMinutes[idx])
    ) {
      return `Every ${step} minutes`;
    }
  }

  // Every minute.
  if (minute === "all" && hour === "all") {
    return "Every minute";
  }

  // Hourly at a fixed minute (e.g. "0 * * * *").
  if (
    hour === "all" &&
    minute !== "all" &&
    minute.length === 1 &&
    !parsed.dayOfMonthRestricted &&
    !parsed.dayOfWeekRestricted
  ) {
    const m = minute[0]!;
    return m === 0 ? "Every hour" : `Every hour at minute ${m}`;
  }

  // Single fixed time-of-day.
  if (
    minute !== "all" &&
    minute.length === 1 &&
    hour !== "all" &&
    hour.length === 1
  ) {
    const time = `${pad2(hour[0]!)}:${pad2(minute[0]!)}`;

    if (!parsed.dayOfMonthRestricted && !parsed.dayOfWeekRestricted) {
      return `Every day at ${time}`;
    }

    if (parsed.dayOfWeekRestricted && !parsed.dayOfMonthRestricted) {
      const days = Array.from(parsed.dayOfWeek)
        .sort((a, b) => a - b)
        .map((d) => WEEKDAY_NAMES[d] ?? String(d));
      if (days.length === 1) {
        return `Every ${days[0]} at ${time}`;
      }
      return `On ${days.join(", ")} at ${time}`;
    }

    if (parsed.dayOfMonthRestricted && !parsed.dayOfWeekRestricted) {
      const dom = Array.from(parsed.dayOfMonth).sort((a, b) => a - b);
      if (dom.length === 1) {
        return `On day ${dom[0]} of the month at ${time}`;
      }
    }

    return `At ${time}`;
  }

  return expr;
}
