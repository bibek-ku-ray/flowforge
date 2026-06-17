import "server-only";

import type { ScheduleTrigger } from "@/generated/prisma/client";
import { TriggerKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { computeNextRun } from "@/lib/schedule/cron";
import { isTriggerEnabled } from "@/lib/triggers/enforcement";
import { sendWorkflowExecution } from "@/inngest/utils";

/**
 * Return every enabled schedule whose next run time is at or before `now`.
 * Past-due rows (missed windows) are naturally included, which is what lets
 * the scheduler self-heal after downtime.
 */
export async function findDueSchedules(now: Date): Promise<ScheduleTrigger[]> {
  return prisma.scheduleTrigger.findMany({
    where: {
      enabled: true,
      nextRunAt: { lte: now },
    },
  });
}

/**
 * Atomically claim a due schedule and, if the claim succeeds, fire its
 * workflow execution.
 *
 * The claim is a compare-and-swap via `updateMany`: it only updates rows that
 * are still enabled and still past-due, advancing `nextRunAt` to the next slot
 * in the same statement. If a concurrent scan already advanced the row,
 * `count` is 0 and we return without firing — this is how duplicate executions
 * are prevented across overlapping scans.
 */
export async function claimAndFire(
  trigger: ScheduleTrigger,
  now: Date,
): Promise<void> {
  const { count } = await prisma.scheduleTrigger.updateMany({
    where: {
      id: trigger.id,
      enabled: true,
      nextRunAt: { lte: now },
    },
    data: {
      lastRunAt: now,
      nextRunAt: computeNextRun(trigger.cronExpression, now, trigger.timezone),
    },
  });

  if (count === 0) {
    // Another scan already claimed this slot — do not fire again.
    return;
  }

  await sendWorkflowExecution(
    {
      workflowId: trigger.workflowId,
      initialData: {
        schedule: {
          executedAt: now.toISOString(),
          timezone: trigger.timezone,
          cronExpression: trigger.cronExpression,
        },
      },
    },
    { triggerKind: TriggerKind.SCHEDULE },
  );
}

/**
 * Run a single scheduler scan: honor the global kill switch, then claim and
 * fire each due schedule. Per-trigger errors are logged and swallowed so one
 * bad schedule cannot abort the rest of the scan.
 */
export async function runScan(now: Date = new Date()): Promise<void> {
  const enabled = await isTriggerEnabled(TriggerKind.SCHEDULE);
  if (!enabled) {
    return;
  }

  const due = await findDueSchedules(now);

  for (const trigger of due) {
    try {
      await claimAndFire(trigger, now);
    } catch (error) {
      logger.error("schedule.scan.trigger_failed", {
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
