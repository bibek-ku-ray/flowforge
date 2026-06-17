import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ScheduleTrigger } from "@/generated/prisma/client";
import { TriggerKind } from "@/generated/prisma/enums";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scheduleTrigger: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/inngest/utils", () => ({
  sendWorkflowExecution: vi.fn(),
}));

vi.mock("@/lib/triggers/enforcement", () => ({
  isTriggerEnabled: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { sendWorkflowExecution } from "@/inngest/utils";
import { isTriggerEnabled } from "@/lib/triggers/enforcement";
import {
  claimAndFire,
  findDueSchedules,
  runScan,
} from "@/features/triggers/components/schedule-trigger/scheduler.service";

function makeTrigger(overrides: Partial<ScheduleTrigger> = {}): ScheduleTrigger {
  const now = new Date("2026-06-17T12:00:00.000Z");
  return {
    id: "trigger_1",
    workflowId: "workflow_1",
    nodeId: "node_1",
    mode: "SIMPLE",
    cronExpression: "*/5 * * * *",
    timezone: "UTC",
    enabled: true,
    lastRunAt: null,
    nextRunAt: new Date("2026-06-17T11:55:00.000Z"),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("scheduler service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isTriggerEnabled).mockResolvedValue(true);
    vi.mocked(prisma.scheduleTrigger.updateMany).mockResolvedValue({ count: 1 });
  });

  describe("findDueSchedules", () => {
    it("queries only enabled and past-due rows", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      vi.mocked(prisma.scheduleTrigger.findMany).mockResolvedValue([]);

      await findDueSchedules(now);

      expect(prisma.scheduleTrigger.findMany).toHaveBeenCalledWith({
        where: {
          enabled: true,
          nextRunAt: { lte: now },
        },
      });
    });
  });

  describe("due detection", () => {
    it("fires each due schedule returned by the query", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      const trigger = makeTrigger();
      vi.mocked(prisma.scheduleTrigger.findMany).mockResolvedValue([trigger]);

      await runScan(now);

      expect(sendWorkflowExecution).toHaveBeenCalledTimes(1);
      expect(sendWorkflowExecution).toHaveBeenCalledWith(
        {
          workflowId: "workflow_1",
          initialData: {
            schedule: {
              executedAt: now.toISOString(),
              timezone: "UTC",
              cronExpression: "*/5 * * * *",
            },
          },
        },
        { triggerKind: TriggerKind.SCHEDULE },
      );
    });

    it("does not fire when no schedules are due", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      vi.mocked(prisma.scheduleTrigger.findMany).mockResolvedValue([]);

      await runScan(now);

      expect(sendWorkflowExecution).not.toHaveBeenCalled();
    });
  });

  describe("duplicate prevention (compare-and-swap)", () => {
    it("does NOT fire when the claim updateMany returns count 0", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      const trigger = makeTrigger();
      vi.mocked(prisma.scheduleTrigger.updateMany).mockResolvedValue({ count: 0 });

      await claimAndFire(trigger, now);

      expect(prisma.scheduleTrigger.updateMany).toHaveBeenCalledTimes(1);
      expect(sendWorkflowExecution).not.toHaveBeenCalled();
    });

    it("DOES fire when the claim updateMany returns count 1", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      const trigger = makeTrigger();
      vi.mocked(prisma.scheduleTrigger.updateMany).mockResolvedValue({ count: 1 });

      await claimAndFire(trigger, now);

      expect(sendWorkflowExecution).toHaveBeenCalledTimes(1);
    });

    it("performs the claim with an atomic compare-and-swap predicate", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      const trigger = makeTrigger();

      await claimAndFire(trigger, now);

      const call = vi.mocked(prisma.scheduleTrigger.updateMany).mock.calls[0][0];
      expect(call.where).toMatchObject({
        id: trigger.id,
        enabled: true,
        nextRunAt: { lte: now },
      });
      // The claim advances nextRunAt in the same statement.
      expect(call.data?.lastRunAt).toEqual(now);
      expect(call.data?.nextRunAt).toBeInstanceOf(Date);
      expect((call.data?.nextRunAt as Date).getTime()).toBeGreaterThan(
        now.getTime(),
      );
    });
  });

  describe("missed-execution recovery", () => {
    it("fires a row whose nextRunAt is hours in the past", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      const trigger = makeTrigger({
        nextRunAt: new Date("2026-06-17T06:00:00.000Z"),
      });
      vi.mocked(prisma.scheduleTrigger.findMany).mockResolvedValue([trigger]);

      await runScan(now);

      expect(sendWorkflowExecution).toHaveBeenCalledTimes(1);
    });
  });

  describe("kill switch", () => {
    it("does not query or fire when the SCHEDULE trigger is disabled", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      vi.mocked(isTriggerEnabled).mockResolvedValue(false);

      await runScan(now);

      expect(isTriggerEnabled).toHaveBeenCalledWith(TriggerKind.SCHEDULE);
      expect(prisma.scheduleTrigger.findMany).not.toHaveBeenCalled();
      expect(sendWorkflowExecution).not.toHaveBeenCalled();
    });
  });

  describe("per-trigger error isolation", () => {
    it("continues firing remaining schedules when one fails", async () => {
      const now = new Date("2026-06-17T12:00:00.000Z");
      const triggerA = makeTrigger({ id: "a", workflowId: "wa" });
      const triggerB = makeTrigger({ id: "b", workflowId: "wb" });
      vi.mocked(prisma.scheduleTrigger.findMany).mockResolvedValue([
        triggerA,
        triggerB,
      ]);
      vi.mocked(sendWorkflowExecution)
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce(undefined as never);

      await expect(runScan(now)).resolves.toBeUndefined();

      expect(sendWorkflowExecution).toHaveBeenCalledTimes(2);
    });
  });
});
