import { describe, expect, it } from "vitest";
import {
  computeNextRun,
  describeCron,
  isValidCron,
  isValidTimezone,
  SIMPLE_INTERVALS,
} from "@/lib/schedule/cron";

describe("schedule trigger validation", () => {
  describe("isValidCron", () => {
    it("accepts valid 5-field cron expressions", () => {
      expect(isValidCron("0 9 * * *")).toBe(true);
      expect(isValidCron("*/15 * * * *")).toBe(true);
    });

    it("accepts every simple interval cron", () => {
      for (const cron of Object.values(SIMPLE_INTERVALS)) {
        expect(isValidCron(cron)).toBe(true);
      }
    });

    it("rejects invalid cron expressions", () => {
      expect(isValidCron("abc")).toBe(false);
      expect(isValidCron("99 * * * *")).toBe(false);
    });

    it("rejects expressions with the wrong number of fields", () => {
      expect(isValidCron("* * * *")).toBe(false);
      expect(isValidCron("* * * * * *")).toBe(false);
    });
  });

  describe("isValidTimezone", () => {
    it("accepts valid IANA timezones", () => {
      expect(isValidTimezone("Asia/Kathmandu")).toBe(true);
      expect(isValidTimezone("UTC")).toBe(true);
    });

    it("rejects invalid timezones", () => {
      expect(isValidTimezone("Not/AReal_Zone")).toBe(false);
      expect(isValidTimezone("")).toBe(false);
    });
  });

  describe("computeNextRun", () => {
    it("computes the next run strictly after the given time", () => {
      const from = new Date("2026-01-01T08:30:00.000Z");
      const next = computeNextRun("0 9 * * *", from, "UTC");
      expect(next.toISOString()).toBe("2026-01-01T09:00:00.000Z");
    });

    it("rolls over to the next day when the time has passed", () => {
      const from = new Date("2026-01-01T09:30:00.000Z");
      const next = computeNextRun("0 9 * * *", from, "UTC");
      expect(next.toISOString()).toBe("2026-01-02T09:00:00.000Z");
    });

    it("respects the timezone offset", () => {
      // 09:00 in Asia/Kathmandu (UTC+5:45) == 03:15 UTC
      const from = new Date("2026-01-01T00:00:00.000Z");
      const next = computeNextRun("0 9 * * *", from, "Asia/Kathmandu");
      expect(next.toISOString()).toBe("2026-01-01T03:15:00.000Z");
    });

    it("throws on an invalid cron expression", () => {
      expect(() => computeNextRun("nope", new Date(), "UTC")).toThrow();
    });
  });

  describe("describeCron", () => {
    it("describes simple intervals", () => {
      expect(describeCron("*/15 * * * *")).toBe("Every 15 minutes");
      expect(describeCron("0 * * * *")).toBe("Every hour");
    });

    it("flags invalid schedules", () => {
      expect(describeCron("abc")).toBe("Invalid schedule");
    });
  });
});
