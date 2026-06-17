import { describe, expect, it } from "vitest";

import {
  SIMPLE_INTERVALS,
  computeNextRun,
  describeCron,
  isValidCron,
  isValidTimezone,
} from "@/lib/schedule/cron";

describe("isValidCron", () => {
  it("accepts standard 5-field expressions", () => {
    expect(isValidCron("* * * * *")).toBe(true);
    expect(isValidCron("0 9 * * *")).toBe(true);
    expect(isValidCron("*/15 * * * *")).toBe(true);
    expect(isValidCron("0 0 1 1 *")).toBe(true);
    expect(isValidCron("0 9-17 * * 1-5")).toBe(true);
    expect(isValidCron("0 0,12 * * *")).toBe(true);
    expect(isValidCron("  0   9   *   *   *  ")).toBe(true);
  });

  it("rejects invalid expressions", () => {
    expect(isValidCron("")).toBe(false);
    expect(isValidCron("* * * *")).toBe(false); // too few fields
    expect(isValidCron("* * * * * *")).toBe(false); // too many fields
    expect(isValidCron("60 * * * *")).toBe(false); // minute out of range
    expect(isValidCron("* 24 * * *")).toBe(false); // hour out of range
    expect(isValidCron("* * 0 * *")).toBe(false); // day-of-month below min
    expect(isValidCron("* * * 13 *")).toBe(false); // month out of range
    expect(isValidCron("* * * * 7")).toBe(false); // day-of-week out of range
    expect(isValidCron("*/0 * * * *")).toBe(false); // zero step
    expect(isValidCron("5-2 * * * *")).toBe(false); // inverted range
    expect(isValidCron("abc * * * *")).toBe(false);
  });
});

describe("isValidTimezone", () => {
  it("accepts valid IANA timezones", () => {
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Asia/Kathmandu")).toBe(true);
    expect(isValidTimezone("America/New_York")).toBe(true);
  });

  it("rejects invalid timezones", () => {
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone("Foo/Bar")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});

describe("SIMPLE_INTERVALS presets", () => {
  it("are all valid cron expressions", () => {
    for (const expr of Object.values(SIMPLE_INTERVALS)) {
      expect(isValidCron(expr)).toBe(true);
    }
  });

  it("map to expected cron strings", () => {
    expect(SIMPLE_INTERVALS["5m"]).toBe("*/5 * * * *");
    expect(SIMPLE_INTERVALS["15m"]).toBe("*/15 * * * *");
    expect(SIMPLE_INTERVALS["30m"]).toBe("*/30 * * * *");
    expect(SIMPLE_INTERVALS["1h"]).toBe("0 * * * *");
    expect(SIMPLE_INTERVALS["1d"]).toBe("0 0 * * *");
  });
});

describe("computeNextRun", () => {
  it("throws on invalid cron", () => {
    expect(() => computeNextRun("nope", new Date(), "UTC")).toThrow();
  });

  it("throws on invalid timezone", () => {
    expect(() => computeNextRun("0 9 * * *", new Date(), "Not/AZone")).toThrow();
  });

  it("computes the next interval minute (every 15 minutes)", () => {
    const from = new Date("2026-06-17T10:07:30.000Z");
    const next = computeNextRun(SIMPLE_INTERVALS["15m"], from, "UTC");
    expect(next.toISOString()).toBe("2026-06-17T10:15:00.000Z");
  });

  it("computes the next hourly run", () => {
    const from = new Date("2026-06-17T10:30:00.000Z");
    const next = computeNextRun(SIMPLE_INTERVALS["1h"], from, "UTC");
    expect(next.toISOString()).toBe("2026-06-17T11:00:00.000Z");
  });

  it("computes the next daily run at midnight UTC", () => {
    const from = new Date("2026-06-17T10:30:00.000Z");
    const next = computeNextRun(SIMPLE_INTERVALS["1d"], from, "UTC");
    expect(next.toISOString()).toBe("2026-06-18T00:00:00.000Z");
  });

  it("computes a daily 09:00 run in UTC", () => {
    const from = new Date("2026-06-17T05:00:00.000Z");
    const next = computeNextRun("0 9 * * *", from, "UTC");
    expect(next.toISOString()).toBe("2026-06-17T09:00:00.000Z");
  });

  it("respects the given timezone (09:00 Asia/Kathmandu = 03:15 UTC)", () => {
    // Kathmandu is UTC+5:45, so 09:00 local == 03:15 UTC.
    const from = new Date("2026-06-17T00:00:00.000Z");
    const next = computeNextRun("0 9 * * *", from, "Asia/Kathmandu");
    expect(next.toISOString()).toBe("2026-06-17T03:15:00.000Z");
  });

  it("rolls to the next day when the time has already passed (Asia/Kathmandu)", () => {
    // 04:00 UTC is 09:45 Kathmandu, already past 09:00 local today.
    const from = new Date("2026-06-17T04:00:00.000Z");
    const next = computeNextRun("0 9 * * *", from, "Asia/Kathmandu");
    expect(next.toISOString()).toBe("2026-06-18T03:15:00.000Z");
  });
});

describe("describeCron", () => {
  it("describes interval presets", () => {
    expect(describeCron(SIMPLE_INTERVALS["15m"])).toBe("Every 15 minutes");
    expect(describeCron(SIMPLE_INTERVALS["5m"])).toBe("Every 5 minutes");
  });

  it("describes daily and hourly crons", () => {
    expect(describeCron("0 9 * * *")).toBe("Every day at 09:00");
    expect(describeCron(SIMPLE_INTERVALS["1h"])).toBe("Every hour");
    expect(describeCron(SIMPLE_INTERVALS["1d"])).toBe("Every day at 00:00");
  });
});
