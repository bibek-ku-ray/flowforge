import { describe, expect, it, vi, beforeEach } from "vitest";
import type { EventReminder } from "@/generated/prisma/client";
import { ReminderDirection, ReminderUnit } from "@/generated/prisma/enums";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventReminder: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    calendarEvent: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/inngest/utils", () => ({
  sendWorkflowExecution: vi.fn(),
}));

vi.mock("@/lib/triggers/enforcement", () => ({
  isTriggerEnabled: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}));

import { prisma } from "@/lib/prisma";
import { sendWorkflowExecution } from "@/inngest/utils";
import { isTriggerEnabled } from "@/lib/triggers/enforcement";
import {
  claimAndFire,
  findDueReminders,
  runReminderScan,
} from "./reminder.service";

const NOW = new Date("2027-03-10T09:00:00.000Z");

function makeReminder(overrides: Partial<EventReminder> = {}): EventReminder {
  return {
    id: "reminder_1",
    eventId: "event_1",
    workflowId: "workflow_1",
    nodeId: "node_1",
    offsetValue: 15,
    offsetUnit: ReminderUnit.DAYS,
    direction: ReminderDirection.BEFORE,
    fireAt: new Date("2027-03-10T08:55:00.000Z"),
    triggeredAt: null,
    enabled: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "event_1",
    userId: "user_1",
    title: "Semester Examination",
    description: "Final exams",
    startAt: new Date("2027-03-25T09:00:00.000Z"),
    endAt: null,
    allDay: false,
    timezone: "UTC",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("reminder service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isTriggerEnabled).mockResolvedValue(true);
    vi.mocked(prisma.eventReminder.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(
      makeEvent() as never,
    );
  });

  describe("findDueReminders", () => {
    it("queries only enabled, un-fired, past-due rows", async () => {
      vi.mocked(prisma.eventReminder.findMany).mockResolvedValue([]);
      await findDueReminders(NOW);
      expect(prisma.eventReminder.findMany).toHaveBeenCalledWith({
        where: { enabled: true, triggeredAt: null, fireAt: { lte: NOW } },
      });
    });
  });

  describe("claimAndFire", () => {
    it("fires the workflow with injected event context when the claim succeeds", async () => {
      await claimAndFire(makeReminder(), NOW);

      expect(prisma.eventReminder.updateMany).toHaveBeenCalledTimes(1);
      expect(sendWorkflowExecution).toHaveBeenCalledTimes(1);

      const [payload, options] = vi.mocked(sendWorkflowExecution).mock.calls[0];
      expect(options).toEqual({ triggerKind: "EVENT" });
      expect(payload.workflowId).toBe("workflow_1");
      expect(payload.initialData?.event).toMatchObject({
        id: "event_1",
        title: "Semester Examination",
        startAt: "2027-03-25T09:00:00.000Z",
        timezone: "UTC",
      });
    });

    it("does NOT fire when the compare-and-swap claims nothing (duplicate prevention)", async () => {
      vi.mocked(prisma.eventReminder.updateMany).mockResolvedValue({ count: 0 });

      await claimAndFire(makeReminder(), NOW);

      expect(sendWorkflowExecution).not.toHaveBeenCalled();
      expect(prisma.calendarEvent.findUnique).not.toHaveBeenCalled();
    });

    it("does not fire when the event no longer exists", async () => {
      vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(null as never);

      await claimAndFire(makeReminder(), NOW);

      expect(sendWorkflowExecution).not.toHaveBeenCalled();
    });
  });

  describe("runReminderScan", () => {
    it("does nothing when the EVENT trigger kill switch is off", async () => {
      vi.mocked(isTriggerEnabled).mockResolvedValue(false);

      await runReminderScan(NOW);

      expect(prisma.eventReminder.findMany).not.toHaveBeenCalled();
      expect(sendWorkflowExecution).not.toHaveBeenCalled();
    });

    it("fires every due reminder", async () => {
      vi.mocked(prisma.eventReminder.findMany).mockResolvedValue([
        makeReminder({ id: "r1", workflowId: "w1" }),
        makeReminder({ id: "r2", workflowId: "w2" }),
      ]);

      await runReminderScan(NOW);

      expect(sendWorkflowExecution).toHaveBeenCalledTimes(2);
    });

    it("isolates per-reminder errors so one failure does not abort the scan", async () => {
      vi.mocked(prisma.eventReminder.findMany).mockResolvedValue([
        makeReminder({ id: "r1", workflowId: "w1" }),
        makeReminder({ id: "r2", workflowId: "w2" }),
      ]);
      // First claim throws, second succeeds.
      vi.mocked(prisma.eventReminder.updateMany)
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce({ count: 1 });

      await runReminderScan(NOW);

      expect(sendWorkflowExecution).toHaveBeenCalledTimes(1);
    });
  });
});
