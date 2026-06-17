import "server-only";

import type { EventReminder } from "@/generated/prisma/client";
import { TriggerKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { isTriggerEnabled } from "@/lib/triggers/enforcement";
import { sendWorkflowExecution } from "@/inngest/utils";

/**
 * Return every enabled, not-yet-fired reminder whose fire time is at or before
 * `now`. Past-due rows (missed windows) are naturally included, which is what
 * lets the dispatcher self-heal after downtime.
 */
export async function findDueReminders(now: Date): Promise<EventReminder[]> {
  return prisma.eventReminder.findMany({
    where: {
      enabled: true,
      triggeredAt: null,
      fireAt: { lte: now },
    },
  });
}

/**
 * Atomically claim a due reminder and, if the claim succeeds, fire its
 * workflow execution with the resolved event injected into the context.
 *
 * The claim is a compare-and-swap via `updateMany`: it only updates rows that
 * are still enabled and still un-fired, stamping `triggeredAt` in the same
 * statement. If a concurrent scan already claimed the row, `count` is 0 and we
 * return without firing — this is how duplicate executions are prevented across
 * overlapping scans.
 */
export async function claimAndFire(
  reminder: EventReminder,
  now: Date,
): Promise<void> {
  const { count } = await prisma.eventReminder.updateMany({
    where: {
      id: reminder.id,
      enabled: true,
      triggeredAt: null,
      fireAt: { lte: now },
    },
    data: {
      triggeredAt: now,
    },
  });

  if (count === 0) {
    // Another scan already claimed this reminder — do not fire again.
    return;
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id: reminder.eventId },
  });

  if (!event) {
    logger.warn("reminder.scan.event_missing", {
      reminderId: reminder.id,
      eventId: reminder.eventId,
    });
    return;
  }

  await sendWorkflowExecution(
    {
      workflowId: reminder.workflowId,
      initialData: {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt ? event.endAt.toISOString() : null,
          allDay: event.allDay,
          timezone: event.timezone,
        },
      },
    },
    { triggerKind: TriggerKind.EVENT },
  );
}

/**
 * Run a single reminder scan: honor the global kill switch, then claim and fire
 * each due reminder. Per-reminder errors are logged and swallowed so one bad
 * reminder cannot abort the rest of the scan.
 */
export async function runReminderScan(now: Date = new Date()): Promise<void> {
  const enabled = await isTriggerEnabled(TriggerKind.EVENT);
  if (!enabled) {
    return;
  }

  const due = await findDueReminders(now);

  for (const reminder of due) {
    try {
      await claimAndFire(reminder, now);
    } catch (error) {
      logger.error("reminder.scan.trigger_failed", {
        reminderId: reminder.id,
        workflowId: reminder.workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
