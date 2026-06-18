import { ReminderDirection, ReminderUnit } from "@/generated/prisma/enums";

/** Milliseconds in each supported reminder unit. */
const UNIT_MS: Record<ReminderUnit, number> = {
  [ReminderUnit.MINUTES]: 60_000,
  [ReminderUnit.HOURS]: 3_600_000,
  [ReminderUnit.DAYS]: 86_400_000,
};

/** Convert an offset (value + unit) to milliseconds. */
export function offsetToMs(offsetValue: number, offsetUnit: ReminderUnit): number {
  return offsetValue * UNIT_MS[offsetUnit];
}

/**
 * Compute the absolute instant a reminder should fire, relative to an event's
 * start time. `BEFORE` subtracts the offset, `AFTER` adds it.
 *
 * @example computeFireAt(new Date("2027-03-25T09:00:00Z"), 15, "DAYS", "BEFORE")
 *   // -> 2027-03-10T09:00:00Z
 */
export function computeFireAt(
  startAt: Date,
  offsetValue: number,
  offsetUnit: ReminderUnit,
  direction: ReminderDirection,
): Date {
  const deltaMs = offsetToMs(offsetValue, offsetUnit);
  const base = startAt.getTime();
  return new Date(
    direction === ReminderDirection.BEFORE ? base - deltaMs : base + deltaMs,
  );
}
