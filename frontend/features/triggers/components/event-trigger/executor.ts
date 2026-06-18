import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";

/**
 * Config persisted on an EVENT_TRIGGER node's `data` JSON column. The trigger
 * itself does no work at execution time — the reminder dispatcher
 * ({@link runReminderScan}) fires the workflow and injects the resolved
 * `event` into the workflow context as `initialData`. This executor only
 * publishes node status so the trigger participates in realtime UI updates.
 */
export type EventTriggerData = {
  eventId?: string;
  offsetValue?: number;
  offsetUnit?: "MINUTES" | "HOURS" | "DAYS";
  direction?: "BEFORE" | "AFTER";
};

export const eventTriggerExecutor: NodeExecutor<EventTriggerData> = async ({
  nodeId,
  nodeType,
  workflowId,
  context,
  step,
  publish,
}) => {
  await publishNodeStatus(publish, workflowId, nodeId, nodeType, "loading");

  try {
    const result = await step.run("event-trigger", async () => context);

    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "success");

    return result;
  } catch (error) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw error;
  }
};
