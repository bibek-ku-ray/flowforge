import { NodeExecutor } from "@/features/execution/types";
import { publishNodeStatus } from "@/features/execution/lib/publish-execution-event";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  nodeId,
  nodeType,
  workflowId,
  context,
  step,
  publish,
}) => {
  await publishNodeStatus(publish, workflowId, nodeId, nodeType, "loading");

  try {
    const result = await step.run("manual-trigger", async () => context);

    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "success");

    return result;
  } catch (error) {
    await publishNodeStatus(publish, workflowId, nodeId, nodeType, "error");
    throw error;
  }
};
