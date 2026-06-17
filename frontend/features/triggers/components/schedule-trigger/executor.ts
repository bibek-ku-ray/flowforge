import type { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";

type ScheduleTriggerData = Record<string, unknown>;

export const scheduleTriggerExecutor: NodeExecutor<
  ScheduleTriggerData
> = async ({ nodeId, nodeType, workflowId, context, step, publish }) => {
  await publishNodeStatus(publish, workflowId, nodeId, nodeType, "loading");

  try {
    const result = await step.run("schedule-trigger", async () => context);

    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "success");

    return result;
  } catch (error) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw error;
  }
};
