import { describe, expect, it } from "vitest";
import { ReminderDirection, ReminderUnit } from "@/generated/prisma/enums";
import { computeFireAt, offsetToMs } from "./offset";

describe("offsetToMs", () => {
  it("converts each unit to milliseconds", () => {
    expect(offsetToMs(1, ReminderUnit.MINUTES)).toBe(60_000);
    expect(offsetToMs(1, ReminderUnit.HOURS)).toBe(3_600_000);
    expect(offsetToMs(1, ReminderUnit.DAYS)).toBe(86_400_000);
    expect(offsetToMs(15, ReminderUnit.DAYS)).toBe(15 * 86_400_000);
  });
});

describe("computeFireAt", () => {
  const start = new Date("2027-03-25T09:00:00.000Z");

  it("15 days before", () => {
    expect(
      computeFireAt(start, 15, ReminderUnit.DAYS, ReminderDirection.BEFORE).toISOString(),
    ).toBe("2027-03-10T09:00:00.000Z");
  });

  it("1 day before", () => {
    expect(
      computeFireAt(start, 1, ReminderUnit.DAYS, ReminderDirection.BEFORE).toISOString(),
    ).toBe("2027-03-24T09:00:00.000Z");
  });

  it("1 hour before", () => {
    expect(
      computeFireAt(start, 1, ReminderUnit.HOURS, ReminderDirection.BEFORE).toISOString(),
    ).toBe("2027-03-25T08:00:00.000Z");
  });

  it("30 minutes before", () => {
    expect(
      computeFireAt(start, 30, ReminderUnit.MINUTES, ReminderDirection.BEFORE).toISOString(),
    ).toBe("2027-03-25T08:30:00.000Z");
  });

  it("adds the offset for AFTER", () => {
    expect(
      computeFireAt(start, 2, ReminderUnit.HOURS, ReminderDirection.AFTER).toISOString(),
    ).toBe("2027-03-25T11:00:00.000Z");
    expect(
      computeFireAt(start, 7, ReminderUnit.DAYS, ReminderDirection.AFTER).toISOString(),
    ).toBe("2027-04-01T09:00:00.000Z");
  });

  it("returns the start time for a zero offset", () => {
    expect(
      computeFireAt(start, 0, ReminderUnit.DAYS, ReminderDirection.BEFORE).toISOString(),
    ).toBe(start.toISOString());
  });
});
